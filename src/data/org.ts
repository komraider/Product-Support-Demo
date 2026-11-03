import type { CustomerSegment, EngineeringTeam, ProductOwner } from './types';

export const COMPANY = 'Lattice API Platform';

export const PRODUCT_OWNERS: ProductOwner[] = [
  { id: 'developer_platform', name: 'Developer Platform', lead: 'M. Okafor' },
  { id: 'developer_experience', name: 'Developer Experience', lead: 'R. Lindqvist' },
  { id: 'billing_monetization', name: 'Billing & Monetization', lead: 'S. Patel' },
  { id: 'identity_access', name: 'Identity & Access', lead: 'J. Moreau' },
  { id: 'model_serving', name: 'Model Serving', lead: 'A. Tanaka' },
  { id: 'sdk_tooling', name: 'SDK & Tooling', lead: 'D. Alvarez' },
];

export const ENGINEERING_TEAMS: EngineeringTeam[] = [
  { id: 'identity_platform', name: 'Identity Platform', lead: 'K. Brennan' },
  { id: 'api_gateway', name: 'API Gateway', lead: 'T. Haddad' },
  { id: 'billing_eng', name: 'Billing Engineering', lead: 'L. Chen' },
  { id: 'console_eng', name: 'Developer Console', lead: 'P. Novak' },
  { id: 'inference_infra', name: 'Inference Infrastructure', lead: 'E. Mensah' },
  { id: 'sdk_eng', name: 'SDK Engineering', lead: 'H. Kowalski' },
];

export const SEGMENTS: CustomerSegment[] = [
  { id: 'free', label: 'Free', populationShare: 0.52 },
  { id: 'individual_paid', label: 'Individual paid', populationShare: 0.28 },
  { id: 'team', label: 'Team', populationShare: 0.14 },
  { id: 'enterprise', label: 'Enterprise', populationShare: 0.06 },
];

export const SEGMENT_LABEL: Record<string, string> = Object.fromEntries(SEGMENTS.map((s) => [s.id, s.label]));

export const CHANNEL_LABEL: Record<string, string> = {
  ai_agent: 'AI agent',
  email: 'Email',
  web_form: 'Web form',
  community: 'Community',
  dynatrace_alert: 'Dynatrace alert (auto-opened)',
  solarwinds_alert: 'SolarWinds alert (auto-opened)',
};

export const RESOLUTION_LABEL: Record<string, string> = {
  ai_answer: 'AI answer',
  tool_assisted: 'AI with tool',
  human_escalation: 'Human escalation',
  documentation: 'Documentation',
  unresolved: 'Unresolved',
};

export const REGION_LABEL: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  other: 'Other',
};

export const RELEASES_SEEN = ['2026.9.1', '2026.9.3', '2026.10.1', '2026.10.2'];

/** Release that was live during each reporting week. */
export const RELEASE_BY_WEEK = [
  '2026.9.1', '2026.9.1', '2026.9.1', '2026.9.1', '2026.9.3', '2026.9.3',
  '2026.10.1', '2026.10.1', '2026.10.2', '2026.10.2', '2026.10.2', '2026.10.2',
];
