// Verifies that the synthetic dataset reproduces the headline numbers the demo story depends on.
import { AGGREGATES, PLATFORM } from '../src/data/drivers';
import { SAMPLE_CASES } from '../src/data/cases';
import { EMERGING_ALERTS } from '../src/data/alerts';
import { PRODUCTION_CARDS } from '../src/data/outcomes';
import { CASE_ORIGIN } from '../src/data/calculations';

const checks: [string, unknown, unknown][] = [
  ['Total cases (12 weeks)', PLATFORM.totalCases, 127_842],
  ['Weekly contacts per 10k developers', Math.round(PLATFORM.weeklyContactRate), 46],
  ['Verified AI resolution %', Math.round(PLATFORM.verifiedAiResolution), 61],
  ['Human escalation %', Math.round(PLATFORM.humanEscalation), 27],
  ['Seven-day recontact %', Math.round(PLATFORM.recontact7d), 8],
  ['Emerging drivers', EMERGING_ALERTS.length, 12],
  ['Production interventions measuring', PRODUCTION_CARDS.length, 6],
  ['API key contact rate', AGGREGATES.api_key_management.contactRate, 37],
  ['API key previous rate', AGGREGATES.api_key_management.previousRate, 27],
  ['API key 4-week change %', Math.round(AGGREGATES.api_key_management.fourWeekChange), 31],
  ['API key verified AI %', Math.round(AGGREGATES.api_key_management.verifiedAiResolution), 81],
  ['API key escalation %', Math.round(AGGREGATES.api_key_management.humanEscalation), 12],
  ['API key recontact %', Math.round(AGGREGATES.api_key_management.recontact7d), 14],
  ['Rate limits contact rate', AGGREGATES.api_rate_limits.contactRate, 68],
  ['Rate limits 4-week change %', Math.round(AGGREGATES.api_rate_limits.fourWeekChange), 22],
  ['Billing contact rate', AGGREGATES.usage_billing.contactRate, 39],
  ['Case origins sum to total', CASE_ORIGIN.customer + CASE_ORIGIN.dynatrace + CASE_ORIGIN.solarwinds, 127_842],
];

let failed = 0;
for (const [label, actual, expected] of checks) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
}
const sampled = SAMPLE_CASES.reduce((s, c) => s + c.weight, 0);
console.log(`INFO  ${SAMPLE_CASES.length} sample records representing ${Math.round(sampled).toLocaleString()} cases`);
for (const ch of ['dynatrace_alert', 'solarwinds_alert']) {
  const w = SAMPLE_CASES.filter((c) => c.channel === ch).reduce((s, c) => s + c.weight, 0);
  console.log(`INFO  sampled ${ch}: ~${Math.round(w).toLocaleString()} cases`);
}
if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
