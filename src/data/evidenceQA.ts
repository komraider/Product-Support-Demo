// "Analyze Evidence": predefined questions answered from the synthetic data displayed in the app.
// Answers are deterministic and some depend on decisions made in this session.

export interface Citation {
  label: string;
  route: string;
}

export interface EvidenceAnswer {
  direct: string;
  evidence: string[];
  inference: string[];
  uncertainty: string;
  confidence: 'low' | 'moderate' | 'high';
  nextAction?: string;
  citations: Citation[];
}

export interface QAContext {
  approved: boolean;
  unownedDrivers: string[];
}

export interface Method {
  /** Normalized tables / source systems queried. */
  sources: string[];
  /** Deterministic steps that produce the numbers in the answer. */
  steps: string[];
}

export interface Question {
  id: string;
  text: string;
  method: Method;
  answer: (ctx: QAContext) => EvidenceAnswer;
}

const C = {
  overview: { label: 'Overview › Top drivers', route: '#/overview' },
  apiKey: { label: 'API Key Management investigation', route: '#/support/driver/api_key_management' },
  billing: { label: 'Usage Billing Transparency outcome', route: '#/outcomes/billing' },
  board: { label: 'Product Outcomes board', route: '#/outcomes' },
  roadmap: { label: 'Roadmap & dependencies', route: '#/outcomes/roadmap' },
  explorer: { label: 'Support Intelligence explorer', route: '#/support' },
  trust: { label: 'Agent Trust Lab', route: '#/trust-lab' },
};

export const QUESTIONS: Question[] = [
  {
    id: 'solve_or_move',
    text: 'Did we solve the problem or merely move it?',
    method: {
      sources: ["Outcome measurements: Usage Billing Transparency (Billing release 2026.9.4)", "ServiceNow cases, driver = Usage Billing, all channels", "Agent logs: AI-resolved billing cases", "Guardrail metrics: billing-error rate, disputed-charge complaints"],
      steps: ["Compare billing contact rate per 10k paid accounts: 4 weeks before release vs. 4 weeks after (74 → 39).", "Check whether contacts moved to another channel: email, web form and human queues must not rise.", "Check that recontact fell (16% → 8%) and payment completion rose (72% → 87%).", "Check guardrails stayed within limits.", "If contact rate, recontact and AI volume all fell with guardrails healthy, classify as \"demand reduced\", not \"demand moved\"."],
    },
    answer: () => ({
      direct:
        'The Usage Billing Transparency intervention appears to have reduced the underlying support need rather than merely shifting it to another channel.',
      evidence: [
        'Billing contact rate fell from 74 to 39 contacts per 10,000 paid accounts.',
        'Seven-day recontact fell from 16% to 8%.',
        'Payment completion increased from 72% to 87%.',
        'AI-resolved billing volume also declined (about 400 to about 240 per week).',
        'Billing-error rate (1.3%) and disputed-charge complaints (1.9%) stayed within guardrails.',
      ],
      inference: [
        'Falling AI volume alongside falling recontact and higher payment completion is consistent with fewer customers needing support, not with demand moving to email or human queues.',
      ],
      uncertainty: 'One full billing cycle observed. Seasonality and a routing-policy change (v41) are possible confounders.',
      confidence: 'moderate',
      nextAction: 'Keep the hypothesis classified as validated, and monitor across two more billing cycles.',
      citations: [C.billing, C.board],
    }),
  },
  {
    id: 'unowned',
    text: 'Which support drivers remain unowned?',
    method: {
      sources: ["Support drivers with ownership fields (Jira Align product owner, ServiceNow assignment group)"],
      steps: ["List material drivers where both Product owner and Engineering owner are empty.", "Reflects approvals made in this session (e.g., approving OPP-0192 removes API Key Management).", "Add trend direction from the 4-week contact-rate change for context."],
    },
    answer: (ctx) => ({
      direct: `${ctx.unownedDrivers.length} material drivers have no accountable Product or Engineering owner: ${ctx.unownedDrivers.join(', ')}.`,
      evidence: [
        ctx.approved
          ? 'API Key Management was assigned to Developer Platform / Identity Platform in this session after human approval.'
          : 'API Key Management (37 per 10k, +31%) has no owner. An AI-drafted opportunity is awaiting human review.',
        'Webhook Delivery is rising (+11% over four weeks) with no owner.',
        'API Rate Limits has a proposed owner (Developer Experience) that has not yet accepted.',
      ],
      inference: ['Unowned drivers with rising rates are the most likely to keep growing unnoticed.'],
      uncertainty: 'Ownership reflects the synthetic Jira Align and ServiceNow assignments in this demo.',
      confidence: 'high',
      nextAction: ctx.approved ? 'Review the Webhook Delivery alert (EA-307) for ownership.' : 'Review OPP-0192 for API Key Management.',
      citations: [C.explorer, C.apiKey],
    }),
  },
  {
    id: 'largest_reduction',
    text: 'Which product intervention produced the largest contact-rate reduction?',
    method: {
      sources: ["Outcome measurements for all production interventions", "Weekly contact-rate trends per driver"],
      steps: ["For each released intervention: baseline rate (before release) and actual rate (latest).", "Compute relative reduction = (baseline − actual) ÷ baseline.", "Compute contacts avoided = Σ weekly (baseline − actual) × population ÷ 10,000 ÷ 4.", "Rank by both and flag that drivers use different populations."],
    },
    answer: () => ({
      direct:
        'By relative reduction, Quickstart Refresh (13.5 → 1.2 per 10k, −91%). By contacts avoided, Usage Billing Transparency is the largest among interventions with guardrail data (74 → 39 per 10k paid accounts, −47%).',
      evidence: [
        'Quickstart Refresh: onboarding contacts 13.5 → 1.2 per 10k active developers.',
        'Usage Billing Transparency: 74 → 39 per 10k paid accounts in four weeks.',
        'Auth Error Message Clarity: 44 → 34 per 10k (target was < 30).',
      ],
      inference: ['Different denominators (developers vs. paid accounts) make the absolute comparison approximate.'],
      uncertainty: 'Attribution assumes no other change explains the drop; Quickstart has the longest observation window.',
      confidence: 'moderate',
      citations: [C.board, C.billing],
    }),
  },
  {
    id: 'billing_ai_down',
    text: 'Why did AI-resolved billing volume decrease?',
    method: {
      sources: ["Agent logs: AI-resolved billing cases per week", "ServiceNow billing contact rate", "Agent quality: billing verified-resolution rate"],
      steps: ["Compare weekly AI-resolved billing cases before vs. after release.", "Check the agent's verified-resolution rate over the same weeks (unchanged ≈ agent did not get worse).", "Check the contact rate fell by a similar proportion (fewer customers needed help).", "Check human escalations and disputes did not rise (demand did not move)."],
    },
    answer: () => ({
      direct:
        'AI-resolved billing volume decreased because fewer customers required support after the product improvement. It is not a sign that the agent got worse.',
      evidence: [
        'Billing contact rate fell 47% while the agent’s verified resolution rate held at 58–61%.',
        'Recontact fell from 16% to 8%.',
        'No increase in human escalations or disputed-charge complaints.',
      ],
      inference: ['Lower AI case volume after a product fix is the expected signature of demand elimination.'],
      uncertainty: 'Agent performance itself is unchanged, so the drop is unlikely to be agent-driven.',
      confidence: 'high',
      nextAction: 'Do not treat lower AI volume as a negative KPI. Report demand eliminated alongside cases resolved.',
      citations: [C.billing],
    }),
  },
  {
    id: 'not_meeting',
    text: 'Which hypotheses are not meeting their targets?',
    method: {
      sources: ["Hypotheses: baseline, target, actual, measurement window, classification"],
      steps: ["Compare actual vs. target for each hypothesis in production.", "Classification rules: met target with healthy guardrails = validated; improved but missed target = partially validated; no meaningful change = not validated; window still open = measuring.", "Return those not validated or partially validated."],
    },
    answer: () => ({
      direct: 'Two: Console Model Status Banner (not validated) and Auth Error Message Clarity (partially validated).',
      evidence: [
        'Model Status Banner: target < 10 per 10k; actual 13. Incident-week spikes remain.',
        'Auth Error Message Clarity: target < 30; actual 34, still declining.',
        'Two hypotheses are still measuring (Self-serve Account Recovery, Billing Dispute Routing).',
      ],
      inference: ['The banner may inform customers without preventing contacts during incidents.'],
      uncertainty: 'Auth clarity may still reach target; its trend has not flattened.',
      confidence: 'moderate',
      nextAction: 'Re-examine the banner hypothesis; extend the auth measurement window by four weeks.',
      citations: [C.board],
    }),
  },
  {
    id: 'dependencies',
    text: 'What dependencies threaten the next release?',
    method: {
      sources: ["Azure DevOps feature ADO-FEAT-51904 dependencies", "Jira Align epic JA-EPIC-3317", "Release plan 2026.11.3"],
      steps: ["Load dependencies for the next planned release.", "Return those with status Blocked or At risk, or flagged as needing cross-team coordination.", "Compare due dates against the release date."],
    },
    answer: (ctx) => ({
      direct: ctx.approved
        ? 'For API Key Rotation Experience (target 2026.11.3): API Metadata Changes is blocked, Authentication Telemetry is at risk, and Regional Propagation Service requires cross-org coordination.'
        : 'API Key Rotation Experience is not on the roadmap yet. Once approved, its draft plan shows three threatening dependencies: API Metadata Changes, Authentication Telemetry and Regional Propagation Service.',
      evidence: [
        'API Metadata Changes is waiting on the active Security Architecture Review.',
        'Authentication Telemetry: per-region propagation events are not yet emitted. They are needed for the outcome baseline.',
        'Regional Propagation Service is owned by Platform Infrastructure and needs a status API.',
      ],
      inference: ['If telemetry slips, the release could ship without the instrumentation to measure the hypothesis.'],
      uncertainty: 'Dates are planning estimates.',
      confidence: 'moderate',
      nextAction: 'Escalate the telemetry dependency; do not release without outcome instrumentation.',
      citations: [C.roadmap],
    }),
  },
  {
    id: 'high_ai_worsening',
    text: 'Which drivers have high AI resolution but worsening contact rates?',
    method: {
      sources: ["Driver aggregates (28-day): verified AI resolution, 4-week contact-rate change"],
      steps: ["Filter drivers with verified AI resolution ≥ 70%.", "Of those, keep drivers whose 4-week contact-rate change is > +10%.", "Sort by contact-rate change."],
    },
    answer: () => ({
      direct: 'API Key Management (81% verified AI resolution; contact rate +31%) and API Rate Limits (72%; +22%).',
      evidence: [
        'API Key Management: 27 → 37 per 10k; 81% verified AI resolution; 14% recontact.',
        'API Rate Limits: 68 per 10k, +22%; 72% verified AI resolution; 13% recontact.',
      ],
      inference: ['High AI resolution plus rising contact rate can indicate support success but product-quality failure.'],
      uncertainty: 'Rising rates may partly reflect customer-mix changes during hypergrowth; rates are normalized, which reduces but does not remove this.',
      confidence: 'moderate',
      nextAction: 'Treat both as product-quality signals, not support wins.',
      citations: [C.overview, C.apiKey],
    }),
  },
  {
    id: 'more_evidence',
    text: 'What additional evidence is needed for API Key Management?',
    method: {
      sources: ["Investigation package for API Key Management: evidence, contradictory evidence, missing-evidence list"],
      steps: ["Return the missing-evidence items recorded on the investigation.", "Attach the contradictory evidence that keeps causal confidence low.", "Recommend the step that would close the biggest gap."],
    },
    answer: () => ({
      direct: 'Five items would move this from correlation toward a causal explanation.',
      evidence: [
        'Server-side propagation duration by region, before and after 2026.10.2.',
        'Engineering confirmation of whether 2026.10.2 changed key-cache TTL or the validation path.',
        'Console funnel data for the rotation flow.',
        'Coded reasons for the 14% seven-day recontacts.',
        'Whether Enterprise rotation-policy changes increased rotation frequency.',
      ],
      inference: ['The release timing is consistent with a possible contribution; it is not established as a cause.'],
      uncertainty: 'Contradictory evidence exists: the SolarWinds alert cleared Oct 11 while contacts kept rising, and North America rose despite normal latency.',
      confidence: 'moderate',
      nextAction: 'Request Engineering investigation of propagation timing and the 2026.10.2 diff.',
      citations: [C.apiKey],
    }),
  },
  {
    id: 'product_not_support',
    text: 'Which support issues should be solved by Product instead of Support?',
    method: {
      sources: ["Driver aggregates", "Subdriver breakdowns", "Avoidable-share estimates", "Representative customer statements"],
      steps: ["Find drivers with high AI resolution (the answer is known) and high volume.", "Check subdrivers point to missing product information (e.g., status not visible).", "Rank by avoidable contacts = 28-day cases × avoidable share."],
    },
    answer: () => ({
      direct: 'API key rotation status and rate-limit visibility. Both are high-volume issues where the agent already resolves well, and the remaining demand comes from missing product information.',
      evidence: [
        'Rotation: customers ask because the Console does not show propagation status (4 of 4 representative statements).',
        'Rate limits: "remaining quota not visible" is 41% of volume.',
        'Billing proved the pattern: transparency cut contacts 47%.',
      ],
      inference: ['Better agent answers would lower cost per contact; product changes would lower the number of contacts.'],
      uncertainty: 'Avoidable-demand shares are estimates (60% for API keys, 55% for rate limits).',
      confidence: 'moderate',
      nextAction: 'Approve OPP-0192 and review OPP-0188.',
      citations: [C.board, C.apiKey],
    }),
  },
  {
    id: 'highest_recontact',
    text: 'Which drivers have the highest seven-day recontact rate?',
    method: {
      sources: ["Driver aggregates (28-day): 7-day recontact rate"],
      steps: ["Sort drivers by 7-day recontact rate.", "Compare with the platform average (12-week, 8%).", "Show the weekly trend for the top driver."],
    },
    answer: () => ({
      direct: 'API Key Management (14%) and API Rate Limits (13%), against a platform average of 8%.',
      evidence: [
        'API Key Management recontact rose from 9–10% before 2026.10.2 to 15% in the latest two weeks.',
        'Usage Billing fell to 8% after its intervention (from 16%).',
      ],
      inference: ['Recontact after a "resolved" conversation suggests the customer hit the same friction again, often on the next rotation.'],
      uncertainty: 'Recontact reasons are not yet coded for API Key Management.',
      confidence: 'high',
      nextAction: 'Code recontact reasons for API Key Management.',
      citations: [C.explorer],
    }),
  },
];
