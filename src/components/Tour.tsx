import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { useEffect } from 'react';
import { go } from '../lib/router';
import { useStore } from '../store';
import { Button } from './ui';

interface Step {
  route: string;
  title: string;
  body: string;
  action?: { label: string; run: () => void };
  needsApproval?: boolean;
}

export function Tour() {
  const step = useStore((s) => s.tourStep);
  const setStep = useStore((s) => s.setTourStep);
  const openAsk = useStore((s) => s.openAsk);
  const approved = useStore((s) => s.opportunityStatus === 'approved');

  const STEPS: Step[] = [
    { route: '#/overview', title: 'Start with the overview', body: '127,842 ServiceNow cases over 12 weeks, including 1,450 opened automatically from Dynatrace and SolarWinds alerts. Hover any ⓘ to see how a number is calculated. In the Top Support Drivers table, API Key Management is highlighted: it is unowned and has a rising contact rate.' },
    { route: '#/overview', title: 'Notice the contradiction', body: 'The AI agent verifies resolution for 81% of API-key contacts, yet the contact rate is rising: from 27 to 37 per 10k developers (+31%). Open “How these numbers are calculated” on the card to see the math. Support is succeeding; the product is still generating demand.' },
    { route: '#/support/driver/api_key_management', title: 'Open the driver investigation', body: 'Review the trend with release and signal markers, the subdriver split (rotation is 46%), segments, telemetry and representative cases. Toggle series and time ranges on the chart.' },
    { route: '#/support/driver/api_key_management', title: 'Correlation is not causation', body: 'The investigation summary labels each statement. Timing is consistent with release 2026.10.2 as a possible contributor, but contradictory and missing evidence are shown. Causality is not established.' },
    { route: '#/trust-lab/propagation', title: 'Inspect one conversation', body: 'Press "Run scenario". The agent checks authentication, calls getApiKeyMetadata and getKeyPropagationStatus, separates evidence from inference, avoids claiming a root cause and tags product friction.' },
    { route: '#/trust-lab/propagation', title: 'Escalation is not failure', body: 'Switch conditions to "48 minutes elapsed" and run again. Propagation is outside the documented window, so the agent escalates with a complete structured package. The evaluation scores that as correct.' },
    {
      route: '#/support/driver/api_key_management', title: 'Approve the product opportunity',
      body: 'Click "Investigate Product Opportunity". Review the evidence package, edit the hypothesis if you like, then Approve. Owners are assigned and a Jira Align epic and Azure DevOps feature are created.',
      needsApproval: true,
    },
    { route: '#/outcomes', title: 'See it on the lifecycle board', body: 'API Key Rotation Experience moved from Proposed to In Development, carrying its baseline (37), target (<24), hypothesis and guardrails.' },
    { route: '#/outcomes/roadmap', title: 'Roadmap & dependencies', body: 'Trace objective → epic → feature → stories → release → measurement. Security review is active, telemetry is at risk, and the propagation service needs cross-org coordination.' },
    { route: '#/outcomes/billing', title: 'A completed intervention', body: 'Usage Billing Transparency: 74 → 39 contacts per 10k paid accounts, recontact 16% → 8%, payment completion 72% → 87%, guardrails healthy. Classified validated.' },
    {
      route: '#/outcomes/billing', title: 'Analyze Evidence', body: '"Did we solve the problem or merely move it?" AI-resolved billing volume fell because fewer customers needed support. That is demand elimination, not a drop in agent performance.',
      action: { label: 'Analyze this question', run: () => openAsk('solve_or_move') },
    },
    { route: '#/outcomes/billing', title: 'The point', body: 'The best support interaction is safely resolved. The best support problem is eliminated.' },
  ];

  const current = step !== null ? STEPS[step] : null;
  useEffect(() => {
    if (current && window.location.hash !== current.route) go(current.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === null || !current) return null;
  const last = step === STEPS.length - 1;
  return (
    <aside
      aria-label="Guided demo"
      className="fixed bottom-3 left-3 right-3 z-40 rounded-lg border border-brand-500/40 bg-white shadow-pop sm:right-auto sm:w-[380px] lg:left-[256px]"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          <Compass size={13} /> Guided demo · {step + 1} / {STEPS.length}
        </span>
        <button onClick={() => setStep(null)} className="rounded p-0.5 text-ink-3 hover:bg-slate-100" aria-label="End tour"><X size={15} /></button>
      </div>
      <div className="px-4 py-3">
        <div className="text-sm font-semibold text-ink">{current.title}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink-2">{current.body}</p>
        {current.needsApproval && (
          <p className="mt-2 text-[11px] font-medium text-ink-3">{approved ? '✓ Approved. Continue.' : 'Waiting for your approval. You can also continue without it.'}</p>
        )}
        <div className="mt-1 h-1 overflow-hidden rounded bg-slate-100" aria-hidden>
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2">
        <Button size="sm" variant="ghost" icon={<ArrowLeft size={13} />} onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
        <div className="flex gap-2">
          {current.action && <Button size="sm" onClick={current.action.run}>{current.action.label}</Button>}
          <Button size="sm" variant="primary" onClick={() => setStep(last ? null : step + 1)}>
            {last ? 'Finish' : 'Next'} {!last && <ArrowRight size={13} />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
