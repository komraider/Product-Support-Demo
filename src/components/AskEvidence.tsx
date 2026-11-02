import { ArrowUpRight, FileSearch, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QUESTIONS } from '../data/evidenceQA';
import { cx } from '../lib/format';
import { useDrivers, useStore } from '../store';
import { AIGenerated, Badge, ConfidenceIndicator } from './ui';

export function AskEvidencePanel() {
  const open = useStore((s) => s.askOpen);
  const initial = useStore((s) => s.askQuestion);
  const close = useStore((s) => s.closeAsk);
  const approved = useStore((s) => s.opportunityStatus === 'approved');
  const drivers = useDrivers();
  const [qid, setQid] = useState<string | null>(null);

  useEffect(() => {
    if (open) setQid(initial ?? null);
  }, [open, initial]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [close]);

  if (!open) return null;
  const q = QUESTIONS.find((x) => x.id === qid);
  const ans = q?.answer({ approved, unownedDrivers: drivers.filter((d) => d.ownershipStatus === 'unowned').map((d) => d.label) });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Analyze Evidence">
      <div className="absolute inset-0 bg-ink/25" onClick={close} aria-hidden />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-ink"><FileSearch size={17} /> Analyze Evidence</div>
            <p className="mt-0.5 text-xs text-ink-3">Pick a question. The answer is built from the same data shown in the dashboard, and shows exactly how it was produced.</p>
          </div>
          <button onClick={close} className="rounded p-1 text-ink-3 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="border-b border-line px-5 py-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Questions</div>
          <div className="flex flex-wrap gap-1.5">
            {QUESTIONS.map((x) => (
              <button
                key={x.id}
                onClick={() => setQid(x.id)}
                aria-pressed={qid === x.id}
                className={cx('rounded-full border px-2.5 py-1 text-left text-xs', qid === x.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-2 hover:border-slate-300 hover:bg-slate-50')}
              >
                {x.text}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <HowItWorks defaultOpen={!q} />
          {!q || !ans ? (
            <p className="py-8 text-center text-sm text-ink-3">Select a question above.</p>
          ) : (
            <div className="fade-in space-y-4" key={q.id}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Query</div>
                <div className="text-sm font-semibold text-ink">{q.text}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AIGenerated />
                <ConfidenceIndicator level={ans.confidence} label="Confidence" />
              </div>
              <Block title="Direct response" tone="ink"><p className="text-sm text-ink">{ans.direct}</p></Block>
              <Block title="Evidence (from the dashboard)" tone="blue">
                <ul className="list-disc space-y-1 pl-4 text-xs text-ink">{ans.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
              </Block>
              <Block title="Inference" tone="violet">
                <ul className="list-disc space-y-1 pl-4 text-xs text-ink">{ans.inference.map((e) => <li key={e}>{e}</li>)}</ul>
              </Block>
              <Block title="Uncertainty" tone="amber"><p className="text-xs text-ink">{ans.uncertainty}</p></Block>
              {ans.nextAction && <Block title="Recommended next action" tone="green"><p className="text-xs text-ink">{ans.nextAction}</p></Block>}
              <details open className="rounded-md border border-line">
                <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-2">How this answer was produced</summary>
                <div className="space-y-2 border-t border-line px-3 py-2.5 text-xs">
                  <div>
                    <div className="font-medium text-ink">Data queried</div>
                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-ink-2">{q.method.sources.map((m) => <li key={m}>{m}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-medium text-ink">Calculation steps (deterministic, no AI)</div>
                    <ol className="mt-0.5 list-decimal space-y-0.5 pl-4 text-ink-2">{q.method.steps.map((m) => <li key={m}>{m}</li>)}</ol>
                  </div>
                  <p className="text-ink-3">The AI then writes the response using only these results, labeling evidence, inference and uncertainty separately.</p>
                </div>
              </details>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Sources in this app</div>
                <div className="flex flex-wrap gap-1.5">
                  {ans.citations.map((c) => (
                    <a key={c.route} href={c.route} onClick={close} className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-brand-700 hover:bg-brand-50">
                      {c.label} <ArrowUpRight size={12} />
                    </a>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-ink-3">Recommendations are advisory. Consequential decisions require human approval.</p>
            </div>
          )}
        </div>
        <div className="border-t border-line px-5 py-2.5 text-[11px] text-ink-3">
          <Badge>Pre-authored</Badge> <span className="ml-1">Answers are deterministic for this prototype. No live model is called.</span>
        </div>
      </div>
    </div>
  );
}

function Block({ title, tone, children }: { title: string; tone: 'ink' | 'blue' | 'violet' | 'amber' | 'green'; children: React.ReactNode }) {
  const border = { ink: 'border-l-ink', blue: 'border-l-brand-500', violet: 'border-l-violet-500', amber: 'border-l-amber-500', green: 'border-l-green-600' }[tone];
  return (
    <div className={cx('rounded-r-md border-l-[3px] bg-slate-50 px-3 py-2', border)}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-2">{title}</div>
      {children}
    </div>
  );
}

const STEPS = [
  ['Question → defined query', 'Each question maps to a specific, reviewed query over the normalized data model. No free-form guessing about what to look up.'],
  ['Numbers are computed, not generated', 'Rates, changes and comparisons are calculated with code from ServiceNow cases, agent logs, telemetry, Dynatrace, SolarWinds, Azure DevOps and Jira Align records.'],
  ['Evidence is attached', 'Every result keeps a pointer to where it came from, so each statement can cite a page in this app.'],
  ['AI writes the answer from those results only', 'The model drafts the response, keeping evidence (what the data shows), inference (what it may mean) and uncertainty separate.'],
  ['Checks before display', 'Every number in the text must match a computed value and every claim needs a citation; otherwise the answer is withheld.'],
  ['Humans decide', 'Recommendations are advisory. Owner assignment, roadmap changes and outcome classifications require human approval.'],
];

function HowItWorks({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="mb-4 rounded-md border border-brand-100 bg-brand-50/40">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-brand-700">How Analyze Evidence works</summary>
      <ol className="space-y-2 border-t border-brand-100 px-3 py-3 text-xs">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-brand-700 ring-1 ring-brand-100">{i + 1}</span>
            <span><span className="font-medium text-ink">{t}.</span> <span className="text-ink-2">{d}</span></span>
          </li>
        ))}
      </ol>
      <p className="border-t border-brand-100 px-3 py-2 text-[11px] text-ink-3">
        In this prototype, steps 1–3 run on the synthetic dataset and the written answers (step 4) are pre-authored, so every visitor sees the same result.
      </p>
    </details>
  );
}
