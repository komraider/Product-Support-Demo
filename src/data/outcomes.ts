import { WEEKS } from './calendar';
import { DRIVERS, TRENDS } from './drivers';
import type { Dependency, OutcomeClass } from './types';

export type Lane = 'proposed' | 'in_development' | 'production';

export interface InterventionCard {
  id: string;
  title: string;
  driverId: string;
  lane: Lane;
  problem: string;
  evidence: string;
  productOwner: string | null;
  engineeringOwner: string | null;
  hypothesis: string;
  baseline: string;
  target: string;
  actual: string | null;
  dependencies: Pick<Dependency, 'name' | 'status'>[];
  deliveryStatus: string;
  release: string | null;
  measurementWindow: string;
  guardrails: string[];
  classification: OutcomeClass | 'awaiting_review' | 'in_development';
  risk?: 'green' | 'amber' | 'red';
  confidence?: string;
  metrics?: { label: string; value: string }[];
  detailRoute?: string;
}

export const RATE_LIMIT_CARD: InterventionCard = {
  id: 'OPP-0188', title: 'API Rate-Limit Visibility', driverId: 'api_rate_limits', lane: 'proposed',
  problem: 'Developers cannot see remaining quota or reset timing, so 429 responses become support contacts.',
  evidence: '68 contacts per 10k active developers, up 22% over four weeks. No existing roadmap coverage.',
  productOwner: 'Developer Experience (proposed)', engineeringOwner: null,
  hypothesis: 'We believe that exposing remaining quota, reset timing, and actionable remediation in the Developer Console will reduce rate-limit-related contact rate from 68 to fewer than 40 contacts per 10,000 active developers within 30 days.',
  baseline: '68 / 10k', target: '< 40 / 10k', actual: null,
  dependencies: [], deliveryStatus: 'Awaiting review', release: null, measurementWindow: '30 days after release',
  guardrails: ['No increase in 429 error rate', 'No increase in quota-abuse incidents'],
  classification: 'awaiting_review', confidence: 'Moderate',
  metrics: [
    { label: 'Verified AI resolution', value: '72%' },
    { label: 'Human escalation', value: '17%' },
    { label: '7-day recontact', value: '13%' },
  ],
};

export const SDK_DIAGNOSTICS_CARD: InterventionCard = {
  id: 'OPP-0179', title: 'SDK Configuration Diagnostics', driverId: 'sdk_configuration', lane: 'in_development',
  problem: 'Proxy and environment misconfiguration produce opaque SDK errors.',
  evidence: '11 contacts per 10k; 40% escalate to humans; proxy/TLS is 28% of volume.',
  productOwner: 'SDK & Tooling', engineeringOwner: 'SDK Engineering',
  hypothesis: 'We believe that a `doctor` command that diagnoses proxy, TLS and environment issues will reduce SDK-configuration escalation rate from 40% to below 25%.',
  baseline: '40% escalation', target: '< 25%', actual: null,
  dependencies: [{ name: 'SDK release train', status: 'active' }, { name: 'Docs update', status: 'not_started' }],
  deliveryStatus: 'In progress (55%)', release: 'SDK 4.4.0 (Dec 2)', measurementWindow: '30 days after release',
  guardrails: ['No increase in SDK install failures'], classification: 'in_development', risk: 'green',
};

export const API_KEY_PROPOSED_CARD: InterventionCard = {
  id: 'OPP-0192', title: 'API Key Rotation Experience', driverId: 'api_key_management', lane: 'proposed',
  problem: 'Developers cannot determine key-rotation state or regional propagation status from the Developer Console.',
  evidence: '27 → 37 contacts per 10k after release 2026.10.2; 81% verified AI resolution; 14% recontact.',
  productOwner: null, engineeringOwner: null,
  hypothesis: '',
  baseline: '37 / 10k', target: '< 24 / 10k', actual: null,
  dependencies: [], deliveryStatus: 'AI-drafted. Awaiting human review', release: null, measurementWindow: '30 days before and after release',
  guardrails: [], classification: 'awaiting_review', confidence: 'Moderate',
  detailRoute: '#/support/driver/api_key_management',
};

/** Production interventions currently being measured (6). */
export const PRODUCTION_CARDS: InterventionCard[] = [
  {
    id: 'OPP-0161', title: 'Usage Billing Transparency', driverId: 'usage_billing', lane: 'production',
    problem: 'Customers could not see how usage turned into charges until the invoice arrived.',
    evidence: '74 billing contacts per 10k paid accounts; 16% recontact; 72% payment completion.',
    productOwner: 'Billing & Monetization', engineeringOwner: 'Billing Engineering',
    hypothesis: 'We believe that showing real-time usage-to-charge breakdowns and spend alerts in the Console will reduce billing contact rate from 74 to fewer than 45 per 10,000 paid accounts within four weeks of release.',
    baseline: '74 / 10k paid', target: '< 45', actual: '39',
    dependencies: [{ name: 'Usage metering API', status: 'completed' }, { name: 'Invoice service', status: 'completed' }],
    deliveryStatus: 'Released', release: 'Billing 2026.9.4 (Sep 21)', measurementWindow: '4 weeks before vs. 4 weeks after',
    guardrails: ['Billing-error rate < 1.5%', 'No increase in disputed-charge complaints'],
    classification: 'validated', detailRoute: '#/outcomes/billing',
  },
  {
    id: 'OPP-0149', title: 'Quickstart Refresh', driverId: 'onboarding_docs', lane: 'production',
    problem: 'First API request failed for many new developers following the quickstart.',
    evidence: '~14 onboarding contacts per 10k; first-request failure 31%.',
    productOwner: 'Developer Experience', engineeringOwner: 'Developer Console',
    hypothesis: 'We believe an interactive quickstart with a pre-filled first request will reduce onboarding contact rate below 3 per 10k.',
    baseline: '13.5 / 10k', target: '< 3', actual: '1.2',
    dependencies: [], deliveryStatus: 'Released', release: 'Console 2026.9.1 (Aug 31)', measurementWindow: '8 weeks after',
    guardrails: ['Activation rate stable or better'], classification: 'validated',
  },
  {
    id: 'OPP-0155', title: 'Auth Error Message Clarity', driverId: 'authentication_failures', lane: 'production',
    problem: 'Generic 401 messages did not tell developers which credential was wrong.',
    evidence: '44 auth-failure contacts per 10k.',
    productOwner: 'Identity & Access', engineeringOwner: 'Identity Platform',
    hypothesis: 'We believe specific, actionable 401 error messages will reduce authentication-failure contact rate from 44 to below 30 per 10k.',
    baseline: '44 / 10k', target: '< 30', actual: '34',
    dependencies: [], deliveryStatus: 'Released', release: 'API 2026.9.2 (Sep 2)', measurementWindow: '8 weeks after',
    guardrails: ['No disclosure of credential validity to unauthenticated callers'], classification: 'partially_validated',
  },
  {
    id: 'OPP-0158', title: 'Console Model Status Banner', driverId: 'model_availability', lane: 'production',
    problem: 'During degradations, developers could not tell whether errors were on their side.',
    evidence: 'Incident weeks reach 25 contacts per 10k.',
    productOwner: 'Model Serving', engineeringOwner: 'Inference Infrastructure',
    hypothesis: 'We believe an in-Console status banner will reduce model-availability contact rate below 10 per 10k.',
    baseline: '12.5 / 10k', target: '< 10', actual: '13',
    dependencies: [], deliveryStatus: 'Released', release: 'Console 2026.9.3 (Sep 14)', measurementWindow: '6 weeks after',
    guardrails: ['Banner accuracy > 99%'], classification: 'not_validated',
  },
  {
    id: 'OPP-0170', title: 'Self-serve Account Recovery', driverId: 'account_access', lane: 'production',
    problem: 'MFA resets required a human agent.',
    evidence: '12 account-access contacts per 10k; 62% escalate.',
    productOwner: 'Identity & Access', engineeringOwner: 'Identity Platform',
    hypothesis: 'We believe verified self-serve MFA reset will reduce account-access contact rate below 7 per 10k.',
    baseline: '12 / 10k', target: '< 7', actual: '9 (interim)',
    dependencies: [], deliveryStatus: 'Released', release: 'Identity 2026.10.1 (Sep 21)', measurementWindow: 'Week 5 of 8',
    guardrails: ['No increase in account-takeover reports'], classification: 'measuring',
  },
  {
    id: 'OPP-0174', title: 'Billing Dispute Routing (agent)', driverId: 'usage_billing', lane: 'production',
    problem: 'Dispute requests were handled by the agent and then re-routed, adding effort.',
    evidence: 'Dispute conversations: 2.3 transfers on average.',
    productOwner: 'Billing & Monetization', engineeringOwner: null,
    hypothesis: 'We believe routing disputes directly to Billing Support will reduce time to verified resolution by 40%.',
    baseline: '19.2 h', target: '< 11.5 h', actual: '13.8 h (interim)',
    dependencies: [], deliveryStatus: 'Released (support response)', release: 'Agent policy v41 (Oct 6)', measurementWindow: 'Week 3 of 6',
    guardrails: ['Correct dispute escalation > 99%'], classification: 'measuring',
  },
];

export const CLASSIFICATION_LABEL: Record<string, string> = {
  validated: 'Validated',
  partially_validated: 'Partially validated',
  not_validated: 'Not validated',
  measuring: 'Measuring',
  awaiting_review: 'Awaiting review',
  in_development: 'In development',
};

/** Usage Billing Transparency outcome analysis (section 28). */
export const BILLING_OUTCOME = {
  originalProblem: 'Customers could not see how usage translated into charges before the invoice, generating 74 billing contacts per 10,000 paid accounts and 16% seven-day recontact.',
  hypothesis: PRODUCTION_CARDS[0].hypothesis,
  observation: 'Release Sep 21, 2026. Baseline: Aug 24 – Sep 20. Observation: Sep 28 – Oct 25 (four weeks).',
  rows: [
    { metric: 'Billing contact rate per 10,000 paid accounts', baseline: '74', target: 'Below 45', actual: '39', status: 'Met' },
    { metric: 'Seven-day recontact rate', baseline: '16%', target: 'Below 10%', actual: '8%', status: 'Met' },
    { metric: 'Payment completion', baseline: '72%', target: 'At least 85%', actual: '87%', status: 'Met' },
    { metric: 'Billing-error rate', baseline: '1.4%', target: 'Below 1.5%', actual: '1.3%', status: 'Healthy', guardrail: true },
    { metric: 'Disputed-charge complaints', baseline: '2.1%', target: 'No increase', actual: '1.9%', status: 'Healthy', guardrail: true },
  ],
  segments: [
    { segment: 'Individual paid', baseline: 81, actual: 41 },
    { segment: 'Team', baseline: 70, actual: 38 },
    { segment: 'Enterprise', baseline: 58, actual: 36 },
  ],
  aiVolume: { before: 'about 400 per week', after: 'about 240 per week', note: 'AI-resolved billing case volume decreased because fewer customers required support after the product improvement. This is a positive outcome, not a decline in agent performance.' },
  confounders: [
    'Seasonality: September invoices are typically lighter than August (estimated ≤ 5% effect).',
    'Agent policy v41 (Oct 6) changed dispute routing, which may affect recontact but not contact rate.',
    'Paid-account mix shifted slightly toward Team plans (+1.2 pts).',
    'Only one full billing cycle has been observed since release.',
  ],
  classification: 'validated' as const,
  nextAction: 'Keep monitoring for two more billing cycles; retire the 30-day watch if the rate stays below 45. Reuse the spend-alert pattern for API Rate-Limit Visibility.',
  assessment:
    'The intervention exceeded its contact-rate target and improved payment completion without negatively affecting billing-error or dispute guardrails. AI-resolved billing volume decreased because fewer customers encountered the underlying problem. The available evidence supports the hypothesis, although continued monitoring is recommended to confirm that the result persists across billing cycles.',
};

// Demand composition. "Eliminated" uses only validated interventions (conservative):
// counterfactual baseline rate minus actual rate after release, times population.
const ELIMINATION_BASELINES: { driverId: string; baselineRate: number; fromWeek: number }[] = [
  { driverId: 'usage_billing', baselineRate: 74, fromWeek: 7 },
  { driverId: 'onboarding_docs', baselineRate: 13.5, fromWeek: 4 },
];

export const DEMAND_COMPOSITION = Array.from({ length: WEEKS }, (_, w) => {
  let ai = 0;
  let human = 0;
  let other = 0;
  for (const d of DRIVERS) {
    const p = TRENDS[d.id].points[w];
    ai += (p.cases * p.verifiedAiResolution) / 100;
    human += (p.cases * p.humanEscalation) / 100;
    other += (p.cases * (100 - p.verifiedAiResolution - p.humanEscalation)) / 100;
  }
  let eliminated = 0;
  for (const e of ELIMINATION_BASELINES) {
    if (w < e.fromWeek) continue;
    const p = TRENDS[e.driverId].points[w];
    eliminated += Math.max(0, ((e.baselineRate - p.contactRate) * p.population) / 10_000 / 4);
  }
  const selfService = Math.round(ai * 0.42);
  return {
    label: TRENDS.api_key_management.points[w].label,
    ai: Math.round(ai),
    human: Math.round(human),
    selfService,
    unverified: Math.round(other),
    eliminated: Math.round(eliminated),
  };
});

export const CASES_AVOIDED = DEMAND_COMPOSITION.reduce((s, w) => s + w.eliminated, 0);
export const CASES_AI = DEMAND_COMPOSITION.reduce((s, w) => s + w.ai, 0);
export const CASES_HUMAN = DEMAND_COMPOSITION.reduce((s, w) => s + w.human, 0);
