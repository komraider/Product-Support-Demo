import type {
  ApplicationHealthSignal,
  Dependency,
  DeliveryStory,
  Evidence,
  HelpContentInteraction,
  InfrastructureSignal,
  ProductTelemetrySignal,
} from './types';

export const API_KEY_DRIVER_ID = 'api_key_management';

/** Pre-release baseline used across the story. */
export const API_KEY_BASELINE_RATE = 27;
export const API_KEY_CURRENT_RATE = 37;
export const API_KEY_TARGET_RATE = 24;

export interface TimelineMarker {
  id: string;
  week: number;
  date: string;
  label: string;
  short: string;
  source: string;
  kind: 'release' | 'signal' | 'record' | 'decision' | 'planned';
  detail: string;
}

/** Week index >= 12 is in the future (beyond the observed window). */
export const API_KEY_MARKERS: TimelineMarker[] = [
  {
    id: 'm_release', week: 8, date: 'Sep 29', short: 'R 2026.10.2', label: 'Developer Console release 2026.10.2',
    source: 'Azure DevOps', kind: 'release',
    detail: 'Redesigned API key list and rotation dialog. Release notes do not mention propagation or caching changes.',
  },
  {
    id: 'm_increase', week: 8, date: 'Oct 1', short: 'Increase', label: 'Increase in API-key-rotation contacts begins',
    source: 'ServiceNow', kind: 'signal',
    detail: 'Rotation subdriver volume exceeded its 8-week band two days after the release.',
  },
  {
    id: 'm_dynatrace', week: 9, date: 'Oct 6', short: 'Dynatrace', label: 'Dynatrace authentication-latency signal',
    source: 'Dynatrace', kind: 'signal',
    detail: 'auth-gateway p95 latency rose in ap-southeast and eu-west. North America within normal range.',
  },
  {
    id: 'm_solarwinds', week: 9, date: 'Oct 8', short: 'SolarWinds', label: 'SolarWinds regional infrastructure alert',
    source: 'SolarWinds', kind: 'signal',
    detail: 'Packet loss on the ap-southeast-2 key-replication link. Alert cleared Oct 11.',
  },
  {
    id: 'm_problem', week: 10, date: 'Oct 14', short: 'PRB0041877', label: 'ServiceNow problem record PRB0041877 opened',
    source: 'ServiceNow', kind: 'record',
    detail: 'Emerging problem: "New API key rejected after rotation while old key remains valid." No owner assigned.',
  },
  {
    id: 'm_ado', week: 10, date: 'Oct 16', short: 'ADO #48213', label: 'Azure DevOps investigation item #48213',
    source: 'Azure DevOps', kind: 'record',
    detail: 'Small spike: "Investigate rotation propagation reports." Not a funded feature; no team committed.',
  },
  {
    id: 'm_opportunity', week: 11, date: 'Oct 22', short: 'Opportunity', label: 'Product opportunity drafted (awaiting human review)',
    source: 'Support Intelligence Loop', kind: 'decision',
    detail: 'Emerging-driver rule met. AI drafted an opportunity package; a human must approve before roadmap entry.',
  },
  {
    id: 'm_target', week: 15, date: 'Nov 17', short: 'Target 2026.11.3', label: 'Planned target release 2026.11.3',
    source: 'Jira Align', kind: 'planned',
    detail: 'Proposed release for rotation state, expiration state, propagation status and remediation in the Console.',
  },
];

export const FUTURE_WEEK_LABELS = ['Oct 26', 'Nov 2', 'Nov 9', 'Nov 16'];

export const SUBDRIVER_BREAKDOWN = [
  { id: 'rotating_keys', label: 'Rotating API keys', share: 46, change: 58 },
  { id: 'finding_keys', label: 'Finding existing keys', share: 18, change: 21 },
  { id: 'revoking_compromised', label: 'Revoking compromised keys', share: 14, change: 4 },
  { id: 'creating_first_key', label: 'Creating first API key', share: 12, change: 6 },
  { id: 'key_other', label: 'Other', share: 10, change: 2 },
];

export interface SegmentRow {
  label: string;
  share: number;
  rate: number;
  change: number;
}

export const SEGMENT_BREAKDOWNS: { id: string; title: string; note: string; rows: SegmentRow[] }[] = [
  {
    id: 'tenure', title: 'Customer tenure', note: 'Newer developers contact at the highest rate.',
    rows: [
      { label: 'First 14 days', share: 22, rate: 58, change: 24 },
      { label: '15 to 90 days', share: 34, rate: 41, change: 33 },
      { label: 'More than 90 days', share: 44, rate: 31, change: 34 },
    ],
  },
  {
    id: 'tier', title: 'Usage tier', note: 'Team and Enterprise rotate more often (policy-driven rotation).',
    rows: [
      { label: 'Free', share: 36, rate: 29, change: 19 },
      { label: 'Individual paid', share: 33, rate: 44, change: 30 },
      { label: 'Team', share: 19, rate: 52, change: 41 },
      { label: 'Enterprise', share: 12, rate: 61, change: 47 },
    ],
  },
  {
    id: 'region', title: 'Region', note: 'Asia Pacific rose most, but North America also rose.',
    rows: [
      { label: 'North America', share: 41, rate: 33, change: 22 },
      { label: 'Europe', share: 29, rate: 39, change: 34 },
      { label: 'Asia Pacific', share: 22, rate: 48, change: 52 },
      { label: 'Other', share: 8, rate: 35, change: 26 },
    ],
  },
  {
    id: 'resolution', title: 'Resolution path', note: '81% verified AI resolution (AI answer + AI with tool).',
    rows: [
      { label: 'AI answer', share: 29, rate: 0, change: 0 },
      { label: 'AI with tool', share: 52, rate: 0, change: 0 },
      { label: 'Human escalation', share: 12, rate: 0, change: 0 },
      { label: 'Documentation', share: 4, rate: 0, change: 0 },
      { label: 'Unresolved', share: 3, rate: 0, change: 0 },
    ],
  },
];

export const CUSTOMER_STATEMENTS = [
  { caseId: 'CASE-10482', segment: 'Individual paid', region: 'Asia Pacific', text: 'I rotated my production key, but I cannot tell when the new key becomes active.' },
  { caseId: 'CASE-10517', segment: 'Team', region: 'Europe', text: 'The old key still works and the new key fails. I do not know which one is safe to use.' },
  { caseId: 'CASE-10544', segment: 'Enterprise', region: 'North America', text: 'I followed the documentation, but the console does not show whether rotation is complete.' },
  { caseId: 'CASE-10601', segment: 'Individual paid', region: 'Asia Pacific', text: 'Support solved this, but I had to ask because the product did not show the status.' },
];

export const HELP_CONTENT: HelpContentInteraction = {
  driverId: API_KEY_DRIVER_ID,
  viewedDocsBeforeContact: 64,
  resolvedByDocs: 9,
  stillContacted: 55,
  topArticle: 'Rotating API keys safely',
  abandonmentRate: 47,
};

export const TELEMETRY: ProductTelemetrySignal[] = [
  { id: 'tel_attempts', metric: 'Authentication attempts per rotation (first 30 min)', baseline: '1.6', current: '4.3', note: 'Repeated attempts cluster in the propagation window.' },
  { id: 'tel_ttfs', metric: 'Median time from rotation to first successful call', baseline: '2 min', current: '14 min', note: 'p90 in Asia Pacific: 38 min.' },
  { id: 'tel_views', metric: 'Key-page views per rotation', baseline: '2.1', current: '5.4', note: 'Users return to the page looking for status.' },
  { id: 'tel_completion', metric: 'Rotation completion rate', baseline: '93%', current: '88%', note: 'Modest decline; most users eventually succeed.' },
];

export const APP_HEALTH: ApplicationHealthSignal[] = [
  { id: 'dt_1', source: 'Dynatrace', service: 'auth-gateway', region: 'ap-southeast', metric: 'p95 key-validation latency', baseline: '210 ms', current: '520 ms', firstObserved: 'Oct 6' },
  { id: 'dt_2', source: 'Dynatrace', service: 'auth-gateway', region: 'eu-west', metric: 'p95 key-validation latency', baseline: '180 ms', current: '310 ms', firstObserved: 'Oct 6' },
  { id: 'dt_3', source: 'Dynatrace', service: 'key-cache', region: 'global', metric: 'Cache miss rate on new keys', baseline: '2%', current: '9%', firstObserved: 'Oct 2' },
];

export const INFRA: InfrastructureSignal[] = [
  { id: 'sw_1', source: 'SolarWinds', component: 'key-replication link', region: 'ap-southeast-2', alert: 'Packet loss 1.8% (threshold 1%)', status: 'Cleared Oct 11', firstObserved: 'Oct 8' },
  { id: 'sw_2', source: 'SolarWinds', component: 'API edge', region: 'all regions', alert: 'Availability 99.96% (SLO 99.9%)', status: 'Healthy', firstObserved: '—' },
];

export const EVIDENCE: Evidence[] = [
  { id: 'ev_rate', driverId: API_KEY_DRIVER_ID, source: 'ServiceNow', kind: 'observation', supports: 'supports', observedAt: 'Oct 25',
    title: 'Contact rate rose from 27 to 37 per 10k', detail: '4-week average up 31% vs the prior 4 weeks while active developers grew 9.7%.' },
  { id: 'ev_conc', driverId: API_KEY_DRIVER_ID, source: 'ServiceNow', kind: 'evidence', supports: 'supports', observedAt: 'Oct 25',
    title: 'Increase concentrated in rotation', detail: 'Rotating API keys is 46% of volume and grew 58%; other subdrivers grew 2–21%.' },
  { id: 'ev_attempts', driverId: API_KEY_DRIVER_ID, source: 'Product telemetry', kind: 'correlation', supports: 'supports', observedAt: 'Oct 24',
    title: 'Repeated auth attempts correlate with unknown propagation', detail: 'Attempts per rotation rose from 1.6 to 4.3 and cluster before propagation completes.' },
  { id: 'ev_ai', driverId: API_KEY_DRIVER_ID, source: 'Agent logs', kind: 'evidence', supports: 'supports', observedAt: 'Oct 25',
    title: 'Agent resolves 81% with verification', detail: 'getKeyPropagationStatus is called in 64% of rotation conversations; status was "in progress" in 71% of those calls.' },
  { id: 'ev_release', driverId: API_KEY_DRIVER_ID, source: 'Azure DevOps', kind: 'correlation', supports: 'supports', observedAt: 'Sep 29',
    title: 'Timing consistent with release 2026.10.2', detail: 'The increase began two days after the release that redesigned the key list and rotation dialog.' },
  { id: 'ev_latency', driverId: API_KEY_DRIVER_ID, source: 'Dynatrace', kind: 'correlation', supports: 'supports', observedAt: 'Oct 6',
    title: 'Regional auth-latency increase', detail: 'p95 key-validation latency up in ap-southeast and eu-west; Asia Pacific contact rate rose most (+52%).' },
  { id: 'ev_infra_cleared', driverId: API_KEY_DRIVER_ID, source: 'SolarWinds', kind: 'evidence', supports: 'contradicts', observedAt: 'Oct 11',
    title: 'Infrastructure alert cleared, contacts kept rising', detail: 'The ap-southeast-2 alert cleared Oct 11, yet contact rate rose for two more weeks. Infrastructure alone does not explain the trend.' },
  { id: 'ev_na', driverId: API_KEY_DRIVER_ID, source: 'ServiceNow', kind: 'evidence', supports: 'contradicts', observedAt: 'Oct 25',
    title: 'North America also rose (+22%)', detail: 'Latency there is normal, which points toward a product-visibility problem rather than only a regional fault.' },
  { id: 'ev_notes', driverId: API_KEY_DRIVER_ID, source: 'Azure DevOps', kind: 'evidence', supports: 'contradicts', observedAt: 'Sep 29',
    title: 'Release notes do not mention propagation', detail: '2026.10.2 changed the UI, not documented caching or propagation logic. Engineering has not confirmed either way.' },
];

export const MISSING_EVIDENCE = [
  'Server-side propagation duration by region, before and after 2026.10.2',
  'Engineering confirmation of whether 2026.10.2 changed key-cache TTL or validation path',
  'Console funnel or session data for the rotation flow',
  'Coded reasons for the 14% seven-day recontacts',
  'Whether Enterprise rotation-policy changes in October increased rotation frequency',
];

export const CONTRADICTORY_EVIDENCE = EVIDENCE.filter((e) => e.supports === 'contradicts');

export const INVESTIGATION_SUMMARY = {
  confidence: 'moderate' as const,
  causalityConfidence: 'low' as const,
  statements: [
    { kind: 'observation', text: 'Contact rate increased after release 2026.10.2, from 27 to 37 contacts per 10,000 active developers.' },
    { kind: 'evidence', text: 'The increase is concentrated in API-key rotation (46% of volume, +58%).' },
    { kind: 'correlation', text: 'Repeated authentication attempts correlate with unknown propagation status.' },
    { kind: 'inference', text: 'High AI resolution (81%) indicates that the support operation can explain the issue.' },
    { kind: 'inference', text: 'Increasing normalized demand suggests the product experience still creates avoidable friction.' },
    { kind: 'correlation', text: 'The timing is consistent with release 2026.10.2 being a possible contributor.' },
    { kind: 'uncertainty', text: 'The current evidence does not establish causality.' },
    { kind: 'recommendation', text: 'Additional Engineering and telemetry investigation is required.' },
  ],
};

export const PROBLEM_STATEMENT =
  'Developers successfully receive support for API-key rotation, but increasing normalized contact rate indicates that developers continue to encounter friction in the underlying product experience. Developers cannot reliably determine key-rotation state or regional propagation status from the Developer Console.';

export const DEFAULT_HYPOTHESIS =
  'We believe that showing API-key rotation state, expiration state, propagation status, and actionable remediation in the Developer Console will reduce API-key-management contact rate from 37 to fewer than 24 contacts per 10,000 active developers within 30 days of release.';

export const PRIMARY_METRIC = 'API-key-management contacts per 10,000 active developers';

export const SECONDARY_METRICS = [
  'Seven-day recontact rate',
  'Rotation completion rate',
  'Customer effort',
  'Human escalation rate',
  'Time to verified resolution',
  'Repeated authentication attempts',
];

export const GUARDRAILS = [
  'No increase in failed authentication',
  'No increase in compromised credentials',
  'No disclosure of secret key material',
  'API-key rotation completion rate remains stable or improves',
  'API availability remains within its service-level objective',
  'No increase in security incidents associated with key rotation',
];

export const EXISTING_WORK = {
  roadmap: 'None. No Jira Align portfolio epic directly covers rotation-state visibility.',
  engineering: 'Azure DevOps #48213 "Investigate rotation propagation reports" (investigation spike, unfunded, no committed team).',
  problemRecord: 'ServiceNow PRB0041877 (emerging, unassigned).',
};

export const RELEASE_INFO = {
  version: '2026.10.2',
  product: 'Developer Console',
  date: 'Sep 29, 2026',
  changes: ['Redesigned API key list', 'New rotation dialog', 'Copy-to-clipboard for new keys'],
};

export const OPPORTUNITY = {
  id: 'OPP-0192',
  title: 'API Key Rotation Experience',
  suggestedProductOwner: 'Developer Platform',
  suggestedEngineeringTeam: 'Identity Platform',
  interventionType: 'Product and Engineering',
  affectedPopulation: '7,039 accounts in the last 28 days; Team and Enterprise over-indexed',
  epicId: 'JA-EPIC-3317',
  featureId: 'ADO-FEAT-51904',
  objective: 'Improve developer trust and platform reliability',
  epicTitle: 'API Key Rotation Experience',
  featureTitle: 'Expose API-key lifecycle and propagation status',
  targetRelease: '2026.11.3',
  measurementWindow: '30 days before and after release',
};

export const API_KEY_DEPENDENCIES: Dependency[] = [
  { id: 'dep_sec', featureId: OPPORTUNITY.featureId, name: 'Security Architecture Review', owner: 'Security Architecture', status: 'active', due: 'Nov 4', note: 'Reviewing what key metadata can be shown without exposing secret material.' },
  { id: 'dep_ux', featureId: OPPORTUNITY.featureId, name: 'Developer Console UX', owner: 'Developer Console', status: 'completed', due: 'Oct 30', note: 'Rotation-state and propagation designs approved.' },
  { id: 'dep_meta', featureId: OPPORTUNITY.featureId, name: 'API Metadata Changes', owner: 'Identity Platform', status: 'blocked', due: 'Nov 7', note: 'Waiting on the security review to approve exposed fields.' },
  { id: 'dep_tel', featureId: OPPORTUNITY.featureId, name: 'Authentication Telemetry', owner: 'Identity Platform', status: 'at_risk', due: 'Nov 6', note: 'Per-region propagation events not yet emitted; needed for the outcome baseline.' },
  { id: 'dep_prop', featureId: OPPORTUNITY.featureId, name: 'Regional Propagation Service', owner: 'Platform Infrastructure', status: 'active', coordinationRequired: true, due: 'Nov 10', note: 'Owned by another org. Needs a status API and agreed SLO for propagation time.' },
  { id: 'dep_rel', featureId: OPPORTUNITY.featureId, name: 'Release Validation', owner: 'Release Engineering', status: 'not_started', due: 'Nov 14', note: 'Starts after metadata and telemetry land.' },
];

export const API_KEY_STORIES: DeliveryStory[] = [
  { id: 'US-51911', featureId: OPPORTUNITY.featureId, title: 'Display key-rotation state', kind: 'story', status: 'in_progress', team: 'Developer Console' },
  { id: 'US-51912', featureId: OPPORTUNITY.featureId, title: 'Display regional propagation status', kind: 'story', status: 'not_started', team: 'Developer Console' },
  { id: 'US-51913', featureId: OPPORTUNITY.featureId, title: 'Display expiration state', kind: 'story', status: 'in_progress', team: 'Developer Console' },
  { id: 'US-51914', featureId: OPPORTUNITY.featureId, title: 'Add actionable remediation', kind: 'story', status: 'not_started', team: 'Developer Console' },
  { id: 'EN-51915', featureId: OPPORTUNITY.featureId, title: 'Add authentication telemetry', kind: 'enabler', status: 'blocked', team: 'Identity Platform' },
  { id: 'EN-51916', featureId: OPPORTUNITY.featureId, title: 'Complete security review', kind: 'enabler', status: 'in_progress', team: 'Security Architecture' },
  { id: 'EN-51917', featureId: OPPORTUNITY.featureId, title: 'Validate release', kind: 'enabler', status: 'not_started', team: 'Release Engineering' },
  { id: 'EN-51918', featureId: OPPORTUNITY.featureId, title: 'Build outcome-measurement instrumentation', kind: 'enabler', status: 'not_started', team: 'Product Analytics' },
];

/** Section 21: emerging-driver rule and the alert it produced. */
export const EMERGING_RULE = [
  { id: 'cases', label: 'Minimum cases', threshold: '≥ 100', observed: '3,996 rotation cases (28 days)', met: true },
  { id: 'accounts', label: 'Minimum affected accounts', threshold: '≥ 50', observed: '3,237 accounts', met: true },
  { id: 'wow', label: 'Week-over-week increase', threshold: '> 15%', observed: '+17.0% (rotation subdriver, wk of Oct 5)', met: true },
  { id: 'confidence', label: 'Classification confidence', threshold: '> 0.80', observed: '0.87 mean', met: true },
  { id: 'period', label: 'Minimum observation period', threshold: '≥ 14 days', observed: '24 days', met: true },
];

/** Section 22: reviewable intervention recommendations. */
export const INTERVENTION_RECOMMENDATIONS = [
  { type: 'Product response', recommended: true, confidence: 'moderate', text: 'Show rotation state, expiration state, propagation status and remediation in the Developer Console.' },
  { type: 'Engineering response', recommended: true, confidence: 'low', text: 'Investigate whether 2026.10.2 changed key-cache or validation behavior; expose a propagation-status API.' },
  { type: 'Support response', recommended: true, confidence: 'high', text: 'Keep agent guidance current: check propagation status before advising which key to use.' },
  { type: 'Help-center response', recommended: true, confidence: 'moderate', text: 'Update "Rotating API keys safely" with the documented propagation window. 47% abandon it today.' },
  { type: 'Operations response', recommended: false, confidence: 'low', text: 'Monitor ap-southeast-2 replication. The alert cleared; not sufficient to explain the trend.' },
];
