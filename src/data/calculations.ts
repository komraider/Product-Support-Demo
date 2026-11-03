// How every headline number is calculated, with the actual inputs. Used by the (i) bubbles,
// the insight-card dropdown and the glossary, so the explanation can never drift from the data.
import { EMERGING_ALERTS } from './alerts';
import { ACTIVE_DEVELOPERS, WEEKS } from './calendar';
import { SAMPLE_CASES } from './cases';
import { AGGREGATES, AVOIDABLE_SHARE, COST_AI, COST_HUMAN, COST_OTHER, DRIVERS, PLATFORM, TRENDS, WEEKLY_TOTALS } from './drivers';
import { CASES_AI, CASES_AVOIDED, CASES_HUMAN, PRODUCTION_CARDS } from './outcomes';

const n = (v: number) => Math.round(v).toLocaleString('en-US');
const pct = (v: number) => `${v.toFixed(1)}%`;
const money = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

/** ServiceNow case origin. Monitoring tools auto-open incidents that are linked to support drivers. */
const originCount = (ch: string) => Math.round(SAMPLE_CASES.filter((c) => c.channel === ch).reduce((s, c) => s + c.weight, 0));
export const CASE_ORIGIN = {
  dynatrace: originCount('dynatrace_alert'),
  solarwinds: originCount('solarwinds_alert'),
  get customer() {
    return PLATFORM.totalCases - this.dynatrace - this.solarwinds;
  },
};

export interface Calc {
  id: string;
  label: string;
  value: string;
  formula: string;
  inputs: string[];
  note?: string;
}

const lastWeek = WEEKLY_TOTALS[WEEKS - 1];
const recontacts = DRIVERS.reduce((s, d) => s + TRENDS[d.id].points.reduce((t, p) => t + (p.cases * p.recontact7d) / 100, 0), 0);
const unowned = DRIVERS.filter((d) => d.ownershipStatus === 'unowned');
const topCost = DRIVERS.map((d) => ({ d, v: AGGREGATES[d.id].annualAvoidableCost })).sort((a, b) => b.v - a.v).slice(0, 3);

export const OVERVIEW_CALCS: Calc[] = [
  {
    id: 'cases', label: 'ServiceNow cases', value: n(PLATFORM.totalCases),
    formula: 'Count of ServiceNow cases opened Aug 3 – Oct 25, 2026 (12 weeks), all channels',
    inputs: [
      `Customer-reported (AI agent, email, web form, community): ${n(CASE_ORIGIN.customer)}`,
      `Opened from Dynatrace alerts: ${n(CASE_ORIGIN.dynatrace)}`,
      `Opened from SolarWinds alerts: ${n(CASE_ORIGIN.solarwinds)}`,
    ],
    note: 'Alert-opened cases are mostly Model Availability and Authentication Failures. Filter Channel in Support Intelligence to see them.',
  },
  {
    id: 'rate', label: 'Contacts per 10k developers', value: n(PLATFORM.weeklyContactRate),
    formula: 'Cases in the latest week ÷ active developers that week × 10,000',
    inputs: [`${n(lastWeek.cases)} cases (Oct 19–25) ÷ ${n(lastWeek.developers)} active developers × 10,000 = ${lastWeek.rate.toFixed(1)}`],
    note: 'Active developer = one person who made at least one authenticated API call or Console sign-in that week (product telemetry). Not the same as a customer account, which can have many developers.',
  },
  {
    id: 'ai', label: 'Verified AI resolution', value: `${Math.round(PLATFORM.verifiedAiResolution)}%`,
    formula: 'Cases the AI agent resolved with system confirmation ÷ all cases (12 weeks)',
    inputs: [`${n(CASES_AI)} ÷ ${n(PLATFORM.totalCases)} = ${pct((CASES_AI / PLATFORM.totalCases) * 100)}`],
    note: 'Confirmation comes from system state (e.g., key propagated, payment succeeded), not from the conversation alone.',
  },
  {
    id: 'esc', label: 'Human escalation', value: `${Math.round(PLATFORM.humanEscalation)}%`,
    formula: 'Cases handed to a human agent ÷ all cases (12 weeks)',
    inputs: [`${n(CASES_HUMAN)} ÷ ${n(PLATFORM.totalCases)} = ${pct((CASES_HUMAN / PLATFORM.totalCases) * 100)}`],
  },
  {
    id: 'recon', label: '7-day recontact', value: `${Math.round(PLATFORM.recontact7d)}%`,
    formula: 'Cases where the same developer or account contacted again for the same driver within 7 days ÷ all cases',
    inputs: [`${n(recontacts)} ÷ ${n(PLATFORM.totalCases)} = ${pct((recontacts / PLATFORM.totalCases) * 100)}`],
  },
  {
    id: 'emerging', label: 'Emerging drivers', value: String(EMERGING_ALERTS.length),
    formula: 'Subdrivers flagged by the emerging-driver rule in the last 28 days',
    inputs: [
      `${EMERGING_ALERTS.filter((a) => a.status === 'alert').length} met all five thresholds (≥100 cases, ≥50 accounts, >15% week over week, >0.80 classification confidence, ≥14 days)`,
      `${EMERGING_ALERTS.filter((a) => a.status === 'watch').length} on watch (just below one threshold)`,
    ],
  },
  {
    id: 'unowned', label: 'Unowned drivers', value: String(unowned.length),
    formula: 'Material drivers with no accountable Product owner and no Engineering owner',
    inputs: [unowned.map((d) => d.label).join(', ')],
    note: 'Ownership comes from Jira Align (product) and ServiceNow assignment groups (engineering).',
  },
  {
    id: 'interventions', label: 'Interventions measuring', value: String(PRODUCTION_CARDS.length),
    formula: 'Product or support changes released and inside (or just past) their measurement window',
    inputs: [PRODUCTION_CARDS.map((c) => c.title).join(', ')],
  },
  {
    id: 'cost', label: 'Annual avoidable support cost', value: money(PLATFORM.annualAvoidableCost),
    formula: 'For each driver: 28-day support cost × 13 × avoidable share, then summed',
    inputs: [
      `Cost per case: AI-verified $${COST_AI.toFixed(2)}, human $${COST_HUMAN}, other $${COST_OTHER} (illustrative)`,
      ...topCost.map(({ d, v }) => `${d.label}: ${money(AGGREGATES[d.id].annualCost)} × ${Math.round(AVOIDABLE_SHARE[d.id] * 100)}% avoidable = ${money(v)}`),
    ],
    note: 'Avoidable share is a reviewer estimate of demand caused by fixable product friction.',
  },
  {
    id: 'avoided', label: 'Cases avoided by product', value: n(CASES_AVOIDED),
    formula: 'For each validated intervention, each week after release: (baseline rate − actual rate) × population ÷ 10,000 ÷ 4',
    inputs: [
      'Usage Billing Transparency: baseline 74 per 10k paid accounts, weeks from Sep 21',
      'Quickstart Refresh: baseline 13.5 per 10k developers, weeks from Aug 31',
    ],
    note: 'Partially validated and still-measuring interventions are excluded, to stay conservative.',
  },
];

export const CALC_BY_ID: Record<string, Calc> = Object.fromEntries(OVERVIEW_CALCS.map((c) => [c.id, c]));

// API Key Management insight-card calculations.
const key = TRENDS.api_key_management.points;
const avg = (ws: number[]) => ws.reduce((s, w) => s + key[w].contactRate, 0) / ws.length;
const keyLast4 = key.slice(8);
const keyCases28 = keyLast4.reduce((s, p) => s + p.cases, 0);
const sumPct = (k: 'verifiedAiResolution' | 'humanEscalation' | 'recontact7d') => keyLast4.reduce((s, p) => s + (p.cases * p[k]) / 100, 0);
const last = key[WEEKS - 1];

export const API_KEY_CALCS: Calc[] = [
  {
    id: 'rate', label: 'Contact rate: 37 per 10k', value: String(last.contactRate),
    formula: 'Driver cases in the latest week × 4 ÷ active developers × 10,000 (28-day rate)',
    inputs: [`${n(last.cases)} × 4 ÷ ${n(ACTIVE_DEVELOPERS[WEEKS - 1])} × 10,000 = ${((last.cases * 4 * 10_000) / ACTIVE_DEVELOPERS[WEEKS - 1]).toFixed(1)}`],
  },
  {
    id: 'baseline', label: 'From 27 (baseline)', value: '27',
    formula: 'Average weekly rate in the 8 weeks before release 2026.10.2 (Aug 3 – Sep 27)',
    inputs: [`Average of ${key.slice(0, 8).map((p) => p.contactRate).join(', ')} = ${avg([0, 1, 2, 3, 4, 5, 6, 7]).toFixed(1)}`],
  },
  {
    id: 'trend', label: '+31% in 4 weeks (rising rate)', value: `+${AGGREGATES.api_key_management.fourWeekChange.toFixed(0)}%`,
    formula: 'Average rate of the last 4 weeks ÷ average rate of the 4 weeks before − 1',
    inputs: [`${avg([8, 9, 10, 11]).toFixed(1)} ÷ ${avg([4, 5, 6, 7]).toFixed(1)} − 1 = ${AGGREGATES.api_key_management.fourWeekChange.toFixed(1)}%`],
  },
  {
    id: 'ai', label: '81% verified AI resolution', value: `${AGGREGATES.api_key_management.verifiedAiResolution.toFixed(0)}%`,
    formula: 'Driver cases resolved by the AI with system confirmation ÷ driver cases (last 28 days)',
    inputs: [`${n(sumPct('verifiedAiResolution'))} ÷ ${n(keyCases28)} = ${pct((sumPct('verifiedAiResolution') / keyCases28) * 100)}`],
  },
  {
    id: 'esc', label: '12% escalation', value: `${AGGREGATES.api_key_management.humanEscalation.toFixed(0)}%`,
    formula: 'Driver cases handed to a human ÷ driver cases (last 28 days)',
    inputs: [`${n(sumPct('humanEscalation'))} ÷ ${n(keyCases28)} = ${pct((sumPct('humanEscalation') / keyCases28) * 100)}`],
  },
  {
    id: 'recon', label: '14% recontact', value: `${AGGREGATES.api_key_management.recontact7d.toFixed(0)}%`,
    formula: 'Driver cases followed by another contact for the same driver within 7 days ÷ driver cases (last 28 days)',
    inputs: [`${n(sumPct('recontact7d'))} ÷ ${n(keyCases28)} = ${pct((sumPct('recontact7d') / keyCases28) * 100)}`],
  },
  {
    id: 'owner', label: 'Unowned', value: 'Unowned',
    formula: 'No Product owner in Jira Align and no Engineering assignment group in ServiceNow',
    inputs: ['Problem record PRB0041877 is unassigned; Azure DevOps #48213 is an unfunded investigation.'],
  },
];
