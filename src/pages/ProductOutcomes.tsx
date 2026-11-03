import { ArrowRight, CheckCircle2, ChevronRight, Flag, GitBranch, Layers, Milestone, Ruler, Target, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SERIES } from '../components/Charts';
import { DependencyStatusBadge, DependencyView } from '../components/Dependencies';
import { AIGenerated, Badge, Button, Card, CardHeader, EmptyState, PageHeader, RiskBadge, Section } from '../components/ui';
import { API_KEY_DEPENDENCIES, API_KEY_STORIES, GUARDRAILS, OPPORTUNITY, PRIMARY_METRIC, SECONDARY_METRICS } from '../data/apiKey';
import { TRENDS } from '../data/drivers';
import {
  API_KEY_PROPOSED_CARD, BILLING_OUTCOME, CLASSIFICATION_LABEL, PRODUCTION_CARDS, RATE_LIMIT_CARD, SDK_DIAGNOSTICS_CARD, type InterventionCard,
} from '../data/outcomes';
import { cx } from '../lib/format';
import { go } from '../lib/router';
import { useStore } from '../store';

const TABS = [
  { id: 'board', label: 'Lifecycle board', route: '#/outcomes' },
  { id: 'roadmap', label: 'Roadmap & dependencies', route: '#/outcomes/roadmap' },
  { id: 'billing', label: 'Outcome analysis: Billing', route: '#/outcomes/billing' },
];

export function ProductOutcomes({ view }: { view?: string }) {
  const tab = view === 'roadmap' || view === 'billing' ? view : 'board';
  return (
    <>
      <PageHeader
        eyebrow="Workspace 4 · Product Outcomes"
        title="From evidence to owned, measured product change"
        description="Each item is judged against the goal agreed when it was approved: the starting contact rate (baseline), the target, the hypothesis and the safety checks (guardrails). These are locked at approval, so results can’t be reframed after the fact."
      />
      <div role="tablist" aria-label="Product Outcomes views" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <a
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            href={t.route}
            className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', tab === t.id ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-3 hover:text-ink')}
          >
            {t.label}
          </a>
        ))}
      </div>
      {tab === 'board' && <Board />}
      {tab === 'roadmap' && <Roadmap />}
      {tab === 'billing' && <BillingOutcome />}
    </>
  );
}

function useApiKeyCard(): InterventionCard {
  const approved = useStore((s) => s.opportunityStatus === 'approved');
  const status = useStore((s) => s.opportunityStatus);
  const hypothesis = useStore((s) => s.hypothesis);
  if (!approved) {
    return {
      ...API_KEY_PROPOSED_CARD,
      hypothesis,
      deliveryStatus: status === 'unreviewed' ? 'AI-drafted. Awaiting human review' : status === 'draft' ? 'Draft saved' : status === 'more_evidence' ? 'More evidence requested' : status === 'rejected' ? 'Rejected' : 'Under review',
    };
  }
  return {
    ...API_KEY_PROPOSED_CARD,
    lane: 'in_development',
    hypothesis,
    productOwner: 'Developer Platform',
    engineeringOwner: 'Identity Platform',
    dependencies: API_KEY_DEPENDENCIES.map((d) => ({ name: d.name, status: d.status })),
    deliveryStatus: `Epic ${OPPORTUNITY.epicId} approved · Feature ${OPPORTUNITY.featureId} in progress`,
    release: OPPORTUNITY.targetRelease,
    measurementWindow: OPPORTUNITY.measurementWindow,
    guardrails: GUARDRAILS,
    classification: 'in_development',
    risk: 'amber',
    detailRoute: '#/outcomes/roadmap',
  };
}

function Board() {
  const keyCard = useApiKeyCard();
  const lanes: { id: InterventionCard['lane']; title: string; note: string; cards: InterventionCard[] }[] = [
    { id: 'proposed', title: 'Proposed', note: 'Awaiting human review', cards: [...(keyCard.lane === 'proposed' ? [keyCard] : []), RATE_LIMIT_CARD] },
    { id: 'in_development', title: 'In Development', note: 'Owned and funded', cards: [...(keyCard.lane === 'in_development' ? [keyCard] : []), SDK_DIAGNOSTICS_CARD] },
    { id: 'production', title: 'Production and Measuring', note: '6 interventions', cards: PRODUCTION_CARDS },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {lanes.map((l) => (
        <section key={l.id} aria-label={l.title} className="flex flex-col gap-3 rounded-lg bg-slate-100/70 p-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold text-ink">{l.title} <span className="ml-1 text-xs font-normal text-ink-3">{l.cards.length}</span></h2>
            <span className="text-[11px] text-ink-3">{l.note}</span>
          </div>
          {l.cards.map((c) => <OutcomeCard key={c.id} c={c} />)}
        </section>
      ))}
    </div>
  );
}

function classTone(c: InterventionCard['classification']) {
  return c === 'validated' ? 'green' : c === 'partially_validated' ? 'amber' : c === 'not_validated' ? 'red' : c === 'measuring' ? 'violet' : 'blue';
}

function OutcomeCard({ c }: { c: InterventionCard }) {
  const isNew = c.id === 'OPP-0192' && c.lane === 'in_development';
  return (
    <article className={cx('rounded-lg border bg-white p-3.5 shadow-card', isNew ? 'border-brand-500 ring-2 ring-brand-100' : 'border-line')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] text-ink-3">{c.id}</div>
          <h3 className="text-sm font-semibold text-ink">{c.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={classTone(c.classification)}>{CLASSIFICATION_LABEL[c.classification]}</Badge>
          {c.risk && <RiskBadge level={c.risk} />}
          {isNew && <Badge tone="blue">New from approval</Badge>}
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-2"><span className="font-medium text-ink">Problem:</span> {c.problem}</p>
      <p className="mt-1 text-xs text-ink-2"><span className="font-medium text-ink">Evidence:</span> {c.evidence}</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-md bg-slate-50 px-2.5 py-2 text-center">
        {[['Baseline', c.baseline], ['Target', c.target], ['Actual', c.actual ?? '—']].map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] uppercase tracking-wide text-ink-3">{k}</div>
            <div className={cx('text-sm font-semibold tabular-nums', k === 'Actual' && c.classification === 'validated' ? 'text-good-700' : 'text-ink')}>{v}</div>
          </div>
        ))}
      </div>
      {c.metrics && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {c.metrics.map((m) => <Badge key={m.label}>{m.label} {m.value}</Badge>)}
        </div>
      )}
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
        <dt className="text-ink-3">Product owner</dt><dd className="text-ink">{c.productOwner ?? <span className="text-warn-700">Unassigned</span>}</dd>
        <dt className="text-ink-3">Engineering</dt><dd className="text-ink">{c.engineeringOwner ?? <span className="text-ink-3">—</span>}</dd>
        <dt className="text-ink-3">Delivery</dt><dd className="text-ink">{c.deliveryStatus}</dd>
        <dt className="text-ink-3">Release</dt><dd className="text-ink">{c.release ?? '—'}</dd>
        <dt className="text-ink-3">Window</dt><dd className="text-ink">{c.measurementWindow}</dd>
        {c.confidence && (<><dt className="text-ink-3">Confidence</dt><dd className="text-ink">{c.confidence}</dd></>)}
      </dl>
      {c.hypothesis && (
        <details className="mt-2.5 text-xs">
          <summary className="cursor-pointer font-medium text-brand-600">Hypothesis{c.guardrails.length ? ' & guardrails' : ''}</summary>
          <p className="mt-1.5 text-ink-2">{c.hypothesis}</p>
          {c.guardrails.length > 0 && <ul className="mt-1.5 list-disc pl-4 text-ink-2">{c.guardrails.map((g) => <li key={g}>{g}</li>)}</ul>}
        </details>
      )}
      {c.dependencies.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {c.dependencies.map((d) => (
            <span key={d.name} className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-ink-2" title={d.status}>
              <span className={cx('h-1.5 w-1.5 rounded-full', d.status === 'completed' ? 'bg-good-600' : d.status === 'blocked' ? 'bg-bad-600' : d.status === 'at_risk' ? 'bg-warn-600' : d.status === 'active' ? 'bg-brand-500' : 'bg-slate-300')} aria-hidden />
              {d.name}
            </span>
          ))}
        </div>
      )}
      {c.detailRoute && (
        <button onClick={() => go(c.detailRoute!)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          {c.id === 'OPP-0192' && c.lane === 'proposed' ? 'Review evidence & approve' : c.id === 'OPP-0192' ? 'Roadmap & dependencies' : 'Outcome analysis'} <ChevronRight size={13} />
        </button>
      )}
    </article>
  );
}

function Roadmap() {
  const approved = useStore((s) => s.opportunityStatus === 'approved');
  const hypothesis = useStore((s) => s.hypothesis);
  if (!approved) {
    return (
      <EmptyState
        title="API Key Rotation Experience is not on the roadmap yet"
        body="The opportunity is AI-drafted and awaiting human review. Approve it from the API Key Management investigation to create the Jira Align epic and Azure DevOps feature."
        action={<Button variant="primary" icon={<ArrowRight size={14} />} onClick={() => go('#/support/driver/api_key_management')}>Go to investigation</Button>}
      />
    );
  }
  const levels = [
    { icon: <Flag size={15} />, kind: 'Strategic objective', source: 'Jira Align', title: OPPORTUNITY.objective, meta: 'FY27 objective O-2' },
    { icon: <Layers size={15} />, kind: 'Portfolio epic', source: 'Jira Align', title: OPPORTUNITY.epicTitle, meta: `${OPPORTUNITY.epicId} · Approved · Owner: Developer Platform` },
    { icon: <GitBranch size={15} />, kind: 'Feature', source: 'Azure DevOps', title: OPPORTUNITY.featureTitle, meta: `${OPPORTUNITY.featureId} · In progress · Identity Platform` },
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader title="Traceability" subtitle="Strategic objective → portfolio epic → feature → stories & enablers → release → outcome measurement" right={<RiskBadge level="amber" />} />
          <ol className="p-4">
            {levels.map((l, i) => (
              <li key={l.kind} className="relative flex gap-3 pb-4" style={{ paddingLeft: i * 18 }}>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">{l.icon}</span>
                <div>
                  <div className="text-[11px] text-ink-3">{l.kind} · {l.source}</div>
                  <div className="text-sm font-semibold text-ink">{l.title}</div>
                  <div className="text-[11px] text-ink-3">{l.meta}</div>
                </div>
              </li>
            ))}
            <li className="pb-4" style={{ paddingLeft: 54 }}>
              <div className="mb-1.5 text-[11px] text-ink-3">User stories & technical enablers · Azure DevOps</div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {API_KEY_STORIES.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded border border-line px-2.5 py-1.5 text-xs">
                    <span><span className="text-ink-3">{s.id}</span> <span className="text-ink">{s.title}</span></span>
                    <Badge tone={s.status === 'done' ? 'green' : s.status === 'in_progress' ? 'blue' : s.status === 'blocked' ? 'red' : 'neutral'}>
                      {s.status === 'in_progress' ? 'In progress' : s.status === 'not_started' ? 'Not started' : s.status === 'blocked' ? 'Blocked' : 'Done'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </li>
            <li className="flex gap-3 pb-4" style={{ paddingLeft: 54 }}>
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-ink-2"><Milestone size={15} /></span>
              <div>
                <div className="text-[11px] text-ink-3">Release · planned</div>
                <div className="text-sm font-semibold text-ink">Developer Console {OPPORTUNITY.targetRelease} · Nov 17, 2026</div>
              </div>
            </li>
            <li className="flex gap-3" style={{ paddingLeft: 72 }}>
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-good-50 text-good-700"><Ruler size={15} /></span>
              <div>
                <div className="text-[11px] text-ink-3">Outcome measurement · {OPPORTUNITY.measurementWindow}</div>
                <div className="text-sm font-semibold text-ink">{PRIMARY_METRIC}: 37 → &lt; 24</div>
                <div className="text-[11px] text-ink-3">Secondary: {SECONDARY_METRICS.join(', ')}</div>
              </div>
            </li>
          </ol>
        </Card>
        <Card>
          <CardHeader title="Dependencies" subtitle="What threatens release 2026.11.3" />
          <DependencyView deps={API_KEY_DEPENDENCIES} />
        </Card>
      </div>
      <div className="space-y-5">
        <Card>
          <CardHeader title="Why this item exists" />
          <div className="space-y-4 p-4 text-xs text-ink-2">
            <Section title="Evidence">
              <p>Contact rate 27 → 37 per 10k after release 2026.10.2; 81% verified AI resolution; 14% recontact; repeated auth attempts during propagation.</p>
              <a href="#/support/driver/api_key_management" className="mt-1 inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">Open evidence package <ChevronRight size={12} /></a>
            </Section>
            <Section title="Ownership">
              <p className="flex items-center gap-1.5"><Users size={13} /> Product: <strong className="text-ink">Developer Platform</strong> · Engineering: <strong className="text-ink">Identity Platform</strong></p>
              <p className="mt-1">Assigned by human approval (see decision log).</p>
            </Section>
            <Section title="Hypothesis (locked at approval)">
              <p className="rounded-md bg-slate-50 p-2.5 text-ink">{hypothesis}</p>
            </Section>
            <Section title="Guardrails">
              <ul className="list-disc space-y-0.5 pl-4">{GUARDRAILS.map((g) => <li key={g}>{g}</li>)}</ul>
            </Section>
          </div>
        </Card>
        <Card>
          <CardHeader title="Dependency risk" right={<AIGenerated />} />
          <div className="space-y-2 p-4 text-xs text-ink-2">
            {API_KEY_DEPENDENCIES.filter((d) => d.status === 'blocked' || d.status === 'at_risk' || d.coordinationRequired).map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-2.5">
                <div><div className="font-medium text-ink">{d.name}</div><div>{d.note}</div></div>
                <DependencyStatusBadge status={d.status} coordination={d.coordinationRequired} />
              </div>
            ))}
            <p className="pt-1"><span className="font-medium text-ink">Inference:</span> if Authentication Telemetry slips, the release could ship without the instrumentation needed to measure the hypothesis. <span className="font-medium text-ink">Recommendation:</span> treat telemetry as release-blocking.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function BillingOutcome() {
  const openAsk = useStore((s) => s.openAsk);
  const o = BILLING_OUTCOME;
  const rows = TRENDS.usage_billing.points.map((p) => ({ label: p.label, rate: p.contactRate, ai: Math.round((p.cases * p.verifiedAiResolution) / 100) }));
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-[11px] text-ink-3">OPP-0161 · Billing & Monetization / Billing Engineering · Released Sep 21, 2026</div>
            <h2 className="text-lg font-semibold text-ink">Usage Billing Transparency</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-good-50 px-3 py-2 text-good-700 ring-1 ring-green-200">
            <CheckCircle2 size={18} aria-hidden />
            <span className="text-sm font-semibold">Validated</span>
            <span className="text-[11px]">· human-confirmed Oct 24</span>
          </span>
        </div>
        <div className="grid gap-4 border-t border-line p-4 text-xs text-ink-2 md:grid-cols-3">
          <Section title="Original problem"><p>{o.originalProblem}</p></Section>
          <Section title="Original hypothesis"><p>{o.hypothesis}</p></Section>
          <Section title="Observation period"><p>{o.observation}</p></Section>
        </div>
      </Card>

      <Card>
        <CardHeader title="Baseline, target and actual" subtitle="Primary and secondary metrics, then guardrails" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wide text-ink-3">
              <tr><th className="px-4 py-2">Metric</th><th className="px-4 py-2 text-right">Baseline</th><th className="px-4 py-2 text-right">Target</th><th className="px-4 py-2 text-right">Actual</th><th className="px-4 py-2 text-right">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {o.rows.map((r) => (
                <tr key={r.metric}>
                  <td className="px-4 py-2.5 text-ink">{r.metric}{r.guardrail && <Badge className="ml-2">Guardrail</Badge>}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-2">{r.baseline}</td>
                  <td className="px-4 py-2.5 text-right text-ink-2">{r.target}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink">{r.actual}</td>
                  <td className="px-4 py-2.5 text-right"><Badge tone="green" icon={<CheckCircle2 size={12} aria-hidden />}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Billing contact rate per 10k paid accounts" subtitle="Release Sep 21 · target < 45" />
          <div className="h-[220px] p-3">
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef1f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64708a' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64708a' }} tickLine={false} axisLine={false} domain={[0, 80]} />
                <Tooltip formatter={(v: number) => [v.toFixed(1), 'Contact rate / 10k']} />
                <ReferenceLine x={rows[7].label} stroke="#8792a8" strokeDasharray="3 3" label={{ value: 'Release', position: 'insideTopLeft', fontSize: 10, fill: '#3d4a63' }} />
                <ReferenceLine y={45} stroke={SERIES.aqua} strokeDasharray="5 4" label={{ value: 'Target < 45', position: 'insideBottomLeft', fontSize: 10, fill: '#146536' }} />
                <Line isAnimationActive={false} dataKey="rate" stroke={SERIES.blue} strokeWidth={2} dot={{ r: 3, fill: SERIES.blue, stroke: '#fff', strokeWidth: 1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="AI-resolved billing cases per week" subtitle="Lower is good here: fewer customers needed support" />
          <div className="h-[220px] p-3">
            <ResponsiveContainer>
              <BarChart data={rows} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef1f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64708a' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64708a' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [v, 'AI-resolved (verified)']} cursor={{ fill: 'rgba(15,31,61,0.04)' }} />
                <ReferenceLine x={rows[7].label} stroke="#8792a8" strokeDasharray="3 3" />
                <Bar isAnimationActive={false} dataKey="ai" fill={SERIES.blue} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="rounded-lg border border-green-200 bg-good-50/60 p-4 text-sm text-ink">
        <strong>Why AI-resolved volume fell:</strong> {o.aiVolume.note} Weekly AI-resolved billing cases went from {o.aiVolume.before} to {o.aiVolume.after}.
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Segment-level results" subtitle="Contact rate per 10k paid accounts" />
          <div className="space-y-2.5 p-4 text-xs">
            {o.segments.map((s) => (
              <div key={s.segment}>
                <div className="mb-0.5 flex justify-between"><span className="text-ink">{s.segment}</span><span className="tabular-nums text-ink-2">{s.baseline} → <strong className="text-good-700">{s.actual}</strong></span></div>
                <div className="relative h-2.5 rounded-sm bg-slate-100">
                  <div className="absolute h-full rounded-sm bg-slate-300" style={{ width: `${(s.baseline / 90) * 100}%` }} />
                  <div className="absolute h-full rounded-sm" style={{ width: `${(s.actual / 90) * 100}%`, background: SERIES.blue }} />
                </div>
              </div>
            ))}
            <p className="pt-1 text-ink-3">All three paid segments met the target. Individual paid improved most.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Possible confounding factors" />
          <ul className="list-disc space-y-1.5 p-4 pl-8 text-xs text-ink-2">{o.confounders.map((c) => <li key={c}>{c}</li>)}</ul>
        </Card>
        <Card>
          <CardHeader title="Recommended next action" />
          <div className="p-4 text-xs text-ink-2">
            <p>{o.nextAction}</p>
            <p className="mt-2 text-ink-3">Classification was confirmed by a human reviewer. The AI proposed “validated”; it cannot declare a hypothesis validated on its own.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Assessment" right={<AIGenerated />} />
        <div className="p-4">
          <p className="text-sm leading-relaxed text-ink">{o.assessment}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<Target size={14} />} onClick={() => openAsk('solve_or_move')}>Analyze: Did we solve the problem or merely move it?</Button>
          </div>
        </div>
      </Card>

      <ClosingMessage />
    </div>
  );
}

export function ClosingMessage() {
  return (
    <div className="rounded-lg bg-ink px-6 py-8 text-center text-white">
      <p className="text-lg font-semibold sm:text-xl">The best support interaction is safely resolved.</p>
      <p className="mt-1 text-lg font-semibold text-[#86b6ef] sm:text-xl">The best support problem is eliminated.</p>
      <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-300">
        Measure success by verified resolution, lower customer effort, reduced normalized contact rates and elimination of avoidable demand, not by deflection alone.
      </p>
    </div>
  );
}
