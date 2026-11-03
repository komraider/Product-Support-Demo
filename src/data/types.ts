// Normalized data model for the Support Intelligence Loop.
// Every source adapter (ServiceNow, Dynatrace, SolarWinds, Azure DevOps,
// Jira Align, agent logs) maps its records into these shapes.

export type SourceSystem =
  | 'ServiceNow'
  | 'Dynatrace'
  | 'SolarWinds'
  | 'Azure DevOps'
  | 'Jira Align'
  | 'Agent logs'
  | 'Product telemetry'
  | 'Help center';

export type CustomerSegmentId = 'free' | 'individual_paid' | 'team' | 'enterprise';
export type Channel = 'ai_agent' | 'email' | 'web_form' | 'community' | 'dynatrace_alert' | 'solarwinds_alert';
export type ResolutionPath = 'ai_answer' | 'tool_assisted' | 'human_escalation' | 'documentation' | 'unresolved';
export type Region = 'north_america' | 'europe' | 'asia_pacific' | 'other';
export type TenureBand = 'first_14' | 'd15_90' | 'over_90';
export type OwnershipStatus = 'owned' | 'unowned' | 'proposed';
export type InterventionType =
  | 'support_response'
  | 'help_center_response'
  | 'product_response'
  | 'engineering_response'
  | 'operations_response'
  | 'product_candidate'
  | 'none';
export type InterventionStatus =
  | 'none'
  | 'emerging_opportunity'
  | 'awaiting_review'
  | 'in_development'
  | 'measuring'
  | 'validated'
  | 'monitoring'
  | 'agent_guidance';
export type TrendDirection = 'rising' | 'stable' | 'falling';
export type RiskLevel = 'low' | 'moderate' | 'high';
export type Confidence = 'low' | 'moderate' | 'high';

export interface CustomerSegment {
  id: CustomerSegmentId;
  label: string;
  populationShare: number;
}

export interface ProductOwner {
  id: string;
  name: string;
  lead: string;
}

export interface EngineeringTeam {
  id: string;
  name: string;
  lead: string;
}

export interface SupportSubdriver {
  id: string;
  driverId: string;
  label: string;
  share: number;
}

export interface WeeklyPoint {
  week: number;
  weekStart: string;
  label: string;
  cases: number;
  population: number;
  contactRate: number;
  verifiedAiResolution: number;
  humanEscalation: number;
  recontact7d: number;
}

export interface Trend {
  driverId: string;
  points: WeeklyPoint[];
  wowChange: number;
  momChange: number;
  fourWeekChange: number;
  direction: TrendDirection;
}

export interface SupportDriver {
  id: string;
  label: string;
  productArea: string;
  populationLabel: string;
  populationShare: number;
  productOwner: string | null;
  engineeringOwner: string | null;
  ownershipStatus: OwnershipStatus;
  interventionType: InterventionType;
  interventionStatus: InterventionStatus;
  roadmapCoverage: string | null;
  riskLevel: RiskLevel;
  costPerContact: number;
  affectedAccounts: number;
  topDriver: boolean;
  subdrivers: SupportSubdriver[];
}

export interface SupportCase {
  caseId: string;
  createdAt: string;
  week: number;
  customerSegment: CustomerSegmentId;
  customerTenureDays: number;
  region: Region;
  productArea: string;
  driver: string;
  subdriver: string;
  channel: Channel;
  resolutionPath: ResolutionPath;
  resolved: boolean;
  verifiedResolution: boolean;
  escalated: boolean;
  recontactWithin7Days: boolean;
  agentConfidence: number;
  productFrictionSuspected: boolean;
  releaseVersion: string;
  productOwner: string | null;
  engineeringOwner: string | null;
  interventionType: InterventionType;
  /** Number of real cases this sample record stands for. */
  weight: number;
}

export interface AgentConversation {
  conversationId: string;
  caseId: string;
  scenarioId?: string;
  startedAt: string;
  turns: { role: 'customer' | 'agent'; text: string }[];
  toolCalls: string[];
  disposition: string;
}

export type EvidenceKind = 'observation' | 'evidence' | 'correlation' | 'inference' | 'recommendation' | 'verified_outcome';

export interface Evidence {
  id: string;
  driverId: string;
  source: SourceSystem;
  kind: EvidenceKind;
  title: string;
  detail: string;
  observedAt: string;
  supports: 'supports' | 'contradicts' | 'context';
}

export interface ProductTelemetrySignal {
  id: string;
  metric: string;
  baseline: string;
  current: string;
  note: string;
}

export interface ApplicationHealthSignal {
  id: string;
  source: 'Dynatrace';
  service: string;
  region: string;
  metric: string;
  baseline: string;
  current: string;
  firstObserved: string;
}

export interface InfrastructureSignal {
  id: string;
  source: 'SolarWinds';
  component: string;
  region: string;
  alert: string;
  status: string;
  firstObserved: string;
}

export interface HelpContentInteraction {
  driverId: string;
  viewedDocsBeforeContact: number;
  resolvedByDocs: number;
  stillContacted: number;
  topArticle: string;
  abandonmentRate: number;
}

export interface Hypothesis {
  id: string;
  opportunityId: string;
  statement: string;
  primaryMetric: string;
  baseline: number;
  target: number;
  unit: string;
  secondaryMetrics: string[];
  guardrails: string[];
  status: 'draft' | 'approved' | 'measuring' | 'validated' | 'partially_validated' | 'not_validated';
}

export type DependencyStatus = 'completed' | 'active' | 'blocked' | 'at_risk' | 'not_started';

export interface Dependency {
  id: string;
  featureId: string;
  name: string;
  owner: string;
  status: DependencyStatus;
  coordinationRequired?: boolean;
  note: string;
  due: string;
}

export interface DeliveryStory {
  id: string;
  featureId: string;
  title: string;
  kind: 'story' | 'enabler';
  status: 'done' | 'in_progress' | 'not_started' | 'blocked';
  team: string;
}

export interface DeliveryFeature {
  id: string;
  epicId: string;
  title: string;
  source: 'Azure DevOps';
  status: 'investigation' | 'proposed' | 'in_progress' | 'done';
  team: string;
  releaseId: string | null;
}

export interface PortfolioEpic {
  id: string;
  opportunityId: string;
  title: string;
  source: 'Jira Align';
  objective: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'done';
  owner: string;
}

export interface Release {
  id: string;
  version: string;
  product: string;
  date: string;
  status: 'shipped' | 'planned';
  notes: string;
}

export interface Metric {
  id: string;
  label: string;
  unit: string;
  direction: 'lower_is_better' | 'higher_is_better' | 'no_increase';
}

export interface Measurement {
  id: string;
  releaseId: string;
  metricId: string;
  baseline: number;
  target: string;
  actual: number | null;
  window: string;
  status: 'met' | 'not_met' | 'healthy' | 'breached' | 'measuring';
}

export type OutcomeClass = 'validated' | 'partially_validated' | 'not_validated' | 'measuring';

export interface Outcome {
  id: string;
  opportunityId: string;
  classification: OutcomeClass;
  summary: string;
}

export interface ProductOpportunity {
  id: string;
  driverId: string;
  title: string;
  problem: string;
  evidenceIds: string[];
  productOwner: string | null;
  engineeringOwner: string | null;
  interventionType: string;
  confidence: Confidence;
}
