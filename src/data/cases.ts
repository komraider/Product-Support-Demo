import { WEEK_STARTS, WEEKS } from './calendar';
import { DRIVERS, TRENDS } from './drivers';
import { RELEASE_BY_WEEK } from './org';
import { mulberry32, pickWeighted, shuffle } from './rng';
import type { AgentConversation, Channel, CustomerSegmentId, Region, ResolutionPath, SupportCase } from './types';

// Sample case records: one record stands for ~25 real cases (see `weight`).
// Quotas are applied per driver-week so the sample reproduces the driver's weekly rates exactly.
const SAMPLE_RATIO = 25;

const SEGMENT_WEIGHTS: { value: CustomerSegmentId; weight: number }[] = [
  { value: 'free', weight: 0.42 },
  { value: 'individual_paid', weight: 0.31 },
  { value: 'team', weight: 0.17 },
  { value: 'enterprise', weight: 0.1 },
];
const KEY_SEGMENT_WEIGHTS = [
  { value: 'free' as const, weight: 0.36 },
  { value: 'individual_paid' as const, weight: 0.33 },
  { value: 'team' as const, weight: 0.19 },
  { value: 'enterprise' as const, weight: 0.12 },
];
const REGION_WEIGHTS: { value: Region; weight: number }[] = [
  { value: 'north_america', weight: 0.43 },
  { value: 'europe', weight: 0.29 },
  { value: 'asia_pacific', weight: 0.2 },
  { value: 'other', weight: 0.08 },
];
const CHANNEL_WEIGHTS: { value: Channel; weight: number }[] = [
  { value: 'ai_agent', weight: 0.8 },
  { value: 'email', weight: 0.09 },
  { value: 'web_form', weight: 0.08 },
  { value: 'community', weight: 0.03 },
];

// Cases auto-opened in ServiceNow by monitoring alerts (~1,184 Dynatrace, ~312 SolarWinds over 12 weeks).
// Assigned by quota (sample index i of n in a driver-week) so the sampled totals match the headline split.
const ALERT_SHARES: Record<string, [number, number]> = {
  model_availability: [0.09, 0.033],
  authentication_failures: [0.012, 0],
};
function alertChannel(driverId: string, i: number, n: number): Channel | null {
  const shares = ALERT_SHARES[driverId];
  if (!shares) return null;
  const dyn = Math.round(n * shares[0]);
  const sw = Math.round(n * shares[1]);
  return i < dyn ? 'dynatrace_alert' : i < dyn + sw ? 'solarwinds_alert' : null;
}

function quota(n: number, pct: number) {
  return Math.round((n * pct) / 100);
}

function generate(): SupportCase[] {
  const rand = mulberry32(20261021);
  const out: SupportCase[] = [];
  let seq = 110000;
  for (const d of DRIVERS) {
    for (let w = 0; w < WEEKS; w++) {
      const p = TRENDS[d.id].points[w];
      const n = Math.max(4, Math.round(p.cases / SAMPLE_RATIO));
      const weight = p.cases / n;
      const nAi = quota(n, p.verifiedAiResolution);
      const nEsc = quota(n, p.humanEscalation);
      const paths: ResolutionPath[] = [];
      const toolShare = d.id === 'api_key_management' ? 0.64 : d.id === 'usage_billing' ? 0.55 : 0.4;
      for (let i = 0; i < nAi; i++) paths.push(i < Math.round(nAi * toolShare) ? 'tool_assisted' : 'ai_answer');
      for (let i = 0; i < nEsc; i++) paths.push('human_escalation');
      while (paths.length < n) paths.push(paths.length % 2 === 0 ? 'documentation' : 'unresolved');
      const shuffled = shuffle(rand, paths);
      const recontactIdx = new Set(shuffle(rand, [...Array(n).keys()]).slice(0, quota(n, p.recontact7d)));
      for (let i = 0; i < n; i++) {
        const path = shuffled[i];
        const sub = pickWeighted(rand, d.subdrivers.map((s) => ({ value: s.id, weight: s.share })));
        const day = Math.floor(rand() * 7);
        const created = new Date(Date.parse(WEEK_STARTS[w] + 'T00:00:00Z') + day * 86_400_000 + Math.floor(rand() * 86_400_000));
        const escalated = path === 'human_escalation';
        const verified = path === 'ai_answer' || path === 'tool_assisted' || (escalated && rand() < 0.85);
        const friction =
          (d.id === 'api_key_management' && (sub === 'rotating_keys' || sub === 'finding_keys')) ||
          (d.id === 'api_rate_limits' && sub !== 'tier_upgrade') ||
          rand() < 0.15;
        out.push({
          caseId: `CASE-${seq++}`,
          createdAt: created.toISOString(),
          week: w,
          customerSegment: pickWeighted(rand, d.id === 'api_key_management' ? KEY_SEGMENT_WEIGHTS : SEGMENT_WEIGHTS),
          customerTenureDays: Math.floor(rand() < 0.22 ? rand() * 14 : rand() < 0.45 ? 15 + rand() * 75 : 91 + rand() * 900),
          region: pickWeighted(rand, REGION_WEIGHTS),
          productArea: d.productArea,
          driver: d.id,
          subdriver: sub,
          channel: alertChannel(d.id, i, n) ?? (escalated ? (rand() < 0.7 ? 'ai_agent' : 'email') : pickWeighted(rand, CHANNEL_WEIGHTS)),
          resolutionPath: path,
          resolved: path !== 'unresolved',
          verifiedResolution: verified,
          escalated,
          recontactWithin7Days: recontactIdx.has(i),
          agentConfidence: +(0.62 + rand() * 0.35).toFixed(2),
          productFrictionSuspected: friction,
          releaseVersion: RELEASE_BY_WEEK[w],
          productOwner: d.productOwner,
          engineeringOwner: d.engineeringOwner,
          interventionType: d.interventionType,
          weight,
        });
      }
    }
  }
  return out;
}

export const SAMPLE_CASES: SupportCase[] = generate();

/** Hand-written representative cases. They are part of the API Key Management driver evidence. */
export const REPRESENTATIVE_CASES: (SupportCase & { summary: string; scenarioId?: string })[] = [
  {
    caseId: 'CASE-10482', createdAt: '2026-10-21T14:32:00Z', week: 11, customerSegment: 'individual_paid', customerTenureDays: 47,
    region: 'asia_pacific', productArea: 'developer_console', driver: 'api_key_management', subdriver: 'propagation_status_unknown',
    channel: 'ai_agent', resolutionPath: 'tool_assisted', resolved: true, verifiedResolution: true, escalated: false,
    recontactWithin7Days: false, agentConfidence: 0.89, productFrictionSuspected: true, releaseVersion: '2026.10.2',
    productOwner: null, engineeringOwner: null, interventionType: 'product_candidate', weight: 1,
    summary: 'Rotated production key; new key failing, old key still works. Agent verified rotation complete, propagation pending in ap-southeast.',
    scenarioId: 'propagation',
  },
  {
    caseId: 'CASE-10517', createdAt: '2026-10-21T19:05:00Z', week: 11, customerSegment: 'team', customerTenureDays: 212,
    region: 'europe', productArea: 'developer_console', driver: 'api_key_management', subdriver: 'propagation_status_unknown',
    channel: 'ai_agent', resolutionPath: 'tool_assisted', resolved: true, verifiedResolution: true, escalated: false,
    recontactWithin7Days: true, agentConfidence: 0.84, productFrictionSuspected: true, releaseVersion: '2026.10.2',
    productOwner: null, engineeringOwner: null, interventionType: 'product_candidate', weight: 1,
    summary: 'Unsure which key is safe to use during rotation. Resolved; customer recontacted two days later for the next rotation.',
  },
  {
    caseId: 'CASE-10544', createdAt: '2026-10-22T08:41:00Z', week: 11, customerSegment: 'enterprise', customerTenureDays: 540,
    region: 'north_america', productArea: 'developer_console', driver: 'api_key_management', subdriver: 'rotation_state_unknown',
    channel: 'ai_agent', resolutionPath: 'human_escalation', resolved: true, verifiedResolution: true, escalated: true,
    recontactWithin7Days: false, agentConfidence: 0.71, productFrictionSuspected: true, releaseVersion: '2026.10.2',
    productOwner: null, engineeringOwner: null, interventionType: 'product_candidate', weight: 1,
    summary: 'Policy-driven rotation across 40 keys; console did not show completion. Escalated with a structured package; resolved by Tier 2.',
  },
  {
    caseId: 'CASE-10601', createdAt: '2026-10-23T02:17:00Z', week: 11, customerSegment: 'individual_paid', customerTenureDays: 9,
    region: 'asia_pacific', productArea: 'developer_console', driver: 'api_key_management', subdriver: 'propagation_status_unknown',
    channel: 'ai_agent', resolutionPath: 'ai_answer', resolved: true, verifiedResolution: true, escalated: false,
    recontactWithin7Days: false, agentConfidence: 0.9, productFrictionSuspected: true, releaseVersion: '2026.10.2',
    productOwner: null, engineeringOwner: null, interventionType: 'product_candidate', weight: 1,
    summary: 'New developer; resolved by the agent. Customer noted the product should have shown the status.',
  },
];

export const CONVERSATIONS: AgentConversation[] = [
  {
    conversationId: 'CONV-88213', caseId: 'CASE-10482', scenarioId: 'propagation', startedAt: '2026-10-21T14:32:00Z',
    turns: [
      { role: 'customer', text: 'I rotated my production API key twenty minutes ago, but requests using the new key are failing. The old key still works. Which one should I use?' },
      { role: 'agent', text: 'Rotation is complete; propagation to ap-southeast is still in progress. Keep using the old key until propagation completes…' },
    ],
    toolCalls: ['getApiKeyMetadata', 'getKeyPropagationStatus'],
    disposition: 'Resolved (verified) · product friction suspected',
  },
  {
    conversationId: 'CONV-88247', caseId: 'CASE-10517', startedAt: '2026-10-21T19:05:00Z',
    turns: [
      { role: 'customer', text: 'The old key still works and the new key fails. I do not know which one is safe to use.' },
      { role: 'agent', text: 'Both keys are currently valid. Propagation of the new key to eu-west is 80% complete…' },
    ],
    toolCalls: ['getApiKeyMetadata', 'getKeyPropagationStatus'],
    disposition: 'Resolved (verified) · recontact within 7 days',
  },
  {
    conversationId: 'CONV-88302', caseId: 'CASE-10544', startedAt: '2026-10-22T08:41:00Z',
    turns: [
      { role: 'customer', text: 'I followed the documentation, but the console does not show whether rotation is complete.' },
      { role: 'agent', text: 'I checked 40 keys on your organization. 37 show rotation complete; 3 show an unexpected state, so I am escalating with details…' },
    ],
    toolCalls: ['getApiKeyMetadata', 'getKeyPropagationStatus', 'createEscalation'],
    disposition: 'Escalated (correct) · resolved by Tier 2',
  },
  {
    conversationId: 'CONV-88390', caseId: 'CASE-10601', startedAt: '2026-10-23T02:17:00Z',
    turns: [
      { role: 'customer', text: 'Support solved this, but I had to ask because the product did not show the status.' },
      { role: 'agent', text: 'Thanks for the feedback. I have recorded that propagation status was not visible in the console…' },
    ],
    toolCalls: ['getKeyPropagationStatus'],
    disposition: 'Resolved (verified) · product friction suspected',
  },
];
