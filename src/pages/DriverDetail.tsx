import {
  Activity, ArrowLeft, BellRing, BookOpen, Bot, ChevronRight, EyeOff, FileSearch, Link2, MessageSquareQuote, Server, ShieldAlert, UserPlus, Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DriverTrendCharts, HBar, SERIES, SERIES_META, type SeriesKey, type TrendRow } from '../components/Charts';
import { INTERVENTION_LABEL } from '../components/DriverTable';
import { OpportunityDrawer } from '../components/OpportunityDrawer';
import {
  AIGenerated, Badge, Button, Card, CardHeader, ConfidenceIndicator, HumanApprovalNote, KindTag, MetricCard, Modal, OwnershipBadge, Section,
} from '../components/ui';
import {
  API_KEY_MARKERS, APP_HEALTH, CONTRADICTORY_EVIDENCE, CUSTOMER_STATEMENTS, EMERGING_RULE, EVIDENCE, EXISTING_WORK, FUTURE_WEEK_LABELS, HELP_CONTENT,
  INFRA, INTERVENTION_RECOMMENDATIONS, INVESTIGATION_SUMMARY, MISSING_EVIDENCE, SEGMENT_BREAKDOWNS, SUBDRIVER_BREAKDOWN, TELEMETRY,
} from '../data/apiKey';
import { CONVERSATIONS, REPRESENTATIVE_CASES } from '../data/cases';
import { BLAST_RADIUS, BUG_REPORT } from '../data/loop';
import { AGGREGATES, DRIVER_BY_ID, TRENDS } from '../data/drivers';
import { ENGINEERING_TEAMS, PRODUCT_OWNERS, SEGMENT_LABEL, CHANNEL_LABEL, REGION_LABEL, RESOLUTION_LABEL } from '../data/org';
import { cx, fmtInt, fmtMoney, fmtSigned } from '../lib/format';
import { go } from '../lib/router';
import { resolveDriver, useStore, type DriverFlag } from '../store';

type ActionKey = 'assign' | 'link' | 'engineering' | 'agent' | 'help' | 'monitor' | 'dismiss';

export function DriverDetail({ id }: { id: string }) {
  if (!DRIVER_BY_ID[id]) {
    return (
      <div className="text-sm">
        Unknown driver. <a className="text-brand-600 underline" href="#/support">Back to explorer</a>
      </div>
    );
  }
  return <DriverDetailBody id={id} />;
}

function DriverDetailBody({ id }: { id: string }) {
  const base = DRIVER_BY_ID[id];
  const overrides = useStore((s) => s.overrides);
  const opportunityStatus = useStore((s) => s.opportunityStatus);
  const decisions = useStore((s) => s.decisions);
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState<ActionKey | null>(null);
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [range, setRange] = useState<4 | 8 | 12 | 16>(16);
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    cases: true, contactRate: true, verifiedAiResolution: true, humanEscalation: true, recontact7d: true,
  });

  const d = resolveDriver(base, overrides);
  const a = AGGREGATES[id];
  const isKey = id === 'api_key_management';
  const markers = isKey ? API_KEY_MARKERS : [];
  const numbered = new Map(markers.map((m, i) => [m.id, i + 1]));

  const rows: TrendRow[] = useMemo(() => {
    const observed: TrendRow[] = TRENDS[id].points.map((p) => ({
      label: p.label, cases: p.cases, contactRate: p.contactRate, verifiedAiResolution: p.verifiedAiResolution, humanEscalation: p.humanEscalation, recontact7d: p.recontact7d,
    }));
    const future: TrendRow[] = isKey
      ? FUTURE_WEEK_LABELS.map((label) => ({ label, cases: null, contactRate: null, verifiedAiResolution: null, humanEscalation: null, recontact7d: null }))
      : [];
    const all = [...observed, ...future];
    if (range === 16) return all;
    return observed.slice(12 - range);
  }, [id, isKey, range]);

  const visibleMarkers = markers.filter((m) => rows.some((r) => r.label === (m.week < 12 ? TRENDS[id].points[m.week].label : FUTURE_WEEK_LABELS[m.week - 12])));
  const chartRows = rows;
  const markerLabels = markers.map((m) => (m.week < 12 ? TRENDS[id].points[m.week].label : FUTURE_WEEK_LABELS[m.week - 12]));
  // Remap marker week index to index within chartRows so reference lines align.
  const remapped = visibleMarkers.map((m) => ({ ...m, week: chartRows.findIndex((r) => r.label === markerLabels[markers.indexOf(m)]) }));

  const flags = d.flags;
  const driverDecisions = decisions.filter((x) => x.action.includes(d.label) || (isKey && (x.detail.includes('OPP-0192') || x.action.includes('OPP-0192') || x.action.includes('Jira') || x.action.includes('Azure') || x.action.includes('owners') || x.action.includes('EA-301'))));

  const actions: { key: ActionKey | 'opportunity'; label: string; icon: JSX.Element; done?: boolean; primary?: boolean }[] = [
    ...(isKey ? [{ key: 'opportunity' as const, label: opportunityStatus === 'approved' ? 'View approved opportunity' : 'Investigate Product Opportunity', icon: <FileSearch size={14} />, primary: true }] : []),
    { key: 'assign', label: 'Assign Owner', icon: <UserPlus size={14} />, done: d.ownershipStatus === 'owned' },
    { key: 'link', label: 'Link Existing Work', icon: <Link2 size={14} />, done: flags.includes('linked_work') },
    { key: 'engineering', label: isKey ? 'Request Engineering Investigation (file bug)' : 'Request Engineering Investigation', icon: <Wrench size={14} />, done: flags.includes('engineering_requested') },
    { key: 'agent', label: 'Improve Agent Guidance', icon: <Bot size={14} />, done: flags.includes('agent_guidance') },
    { key: 'help', label: 'Improve Help Content', icon: <BookOpen size={14} />, done: flags.includes('help_content') },
    { key: 'monitor', label: 'Monitor Trend', icon: <BellRing size={14} />, done: flags.includes('monitoring') },
    { key: 'dismiss', label: 'Dismiss Alert', icon: <EyeOff size={14} />, done: flags.includes('dismissed') },
  ];

  return (
    <>
      <a href="#/support" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-brand-600">
        <ArrowLeft size={13} /> Support Intelligence
      </a>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">Driver investigation · {d.productArea}</div>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold text-ink sm:text-2xl">
            {d.label}
            <OwnershipBadge status={d.ownershipStatus} />
            <Badge tone={INTERVENTION_LABEL[d.interventionStatus].tone}>{INTERVENTION_LABEL[d.interventionStatus].label}</Badge>
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Product owner: <strong className="text-ink">{d.productOwner ?? 'Unassigned'}</strong> · Engineering:{' '}
            <strong className="text-ink">{d.engineeringOwner ?? 'Unassigned'}</strong>
          </p>
        </div>
      </div>

      <Card className="mb-5">
        <div className="flex flex-wrap gap-2 p-3">
          {actions.map((x) => (
            <Button
              key={x.key}
              size="sm"
              variant={x.primary ? 'primary' : 'secondary'}
              icon={x.icon}
              onClick={() => (x.key === 'opportunity' ? setDrawer(true) : setModal(x.key))}
              className={cx(x.done && !x.primary && 'border-green-200 bg-good-50 text-good-700')}
            >
              {x.label}
              {x.done && !x.primary && <span className="sr-only"> (done)</span>}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Current contact rate" value={a.contactRate} sub={`per 10k ${d.populationLabel} · 28-day`} />
        <MetricCard label={isKey ? 'Pre-release baseline' : 'Rate 4 weeks ago'} value={a.previousRate} sub={isKey ? 'Before 2026.10.2' : `per 10k ${d.populationLabel}`} />
        <MetricCard label="Four-week trend" value={fmtSigned(a.fourWeekChange)} sub="4-wk avg vs prior 4" tone={a.fourWeekChange > 5 ? 'warn' : a.fourWeekChange < -5 ? 'good' : undefined} />
        <MetricCard label="Raw volume" value={fmtInt(a.cases28d)} sub="Last 28 days" />
        <MetricCard label="Affected accounts" value={fmtInt(a.affectedAccounts)} sub="Last 28 days" />
        <MetricCard label="Verified AI resolution" value={`${a.verifiedAiResolution.toFixed(0)}%`} sub="System-confirmed" />
        <MetricCard label="Human escalation" value={`${a.humanEscalation.toFixed(0)}%`} />
        <MetricCard label="7-day recontact" value={`${a.recontact7d.toFixed(0)}%`} tone={a.recontact7d >= 12 ? 'warn' : undefined} sub={a.recontact7d >= 12 ? 'Above platform 8%' : undefined} />
        <MetricCard label="Est. support cost" value={fmtMoney(a.annualCost)} sub={`Annualized · ${fmtMoney(a.cost28d)} / 28d`} />
        <MetricCard label="Ownership" value={<span className="text-base">{d.ownershipStatus === 'owned' ? 'Owned' : d.ownershipStatus === 'proposed' ? 'Proposed' : 'Unowned'}</span>} sub={d.productOwner ?? 'No accountable owner'} />
        <MetricCard label="Roadmap coverage" value={<span className="text-base">{d.roadmapCoverage ? 'Covered' : 'None'}</span>} sub={d.roadmapCoverage ?? 'No epic covers this driver'} tone={d.roadmapCoverage ? undefined : 'warn'} />
        <MetricCard label="Evidence confidence" value={<ConfidenceIndicator level={isKey ? 'moderate' : 'high'} />} sub={isKey ? 'Causal confidence: low' : undefined} />
      </div>

      {isKey && (
        <Card className="mt-5">
          <CardHeader
            title="Investigation summary"
            subtitle="Each statement is labelled by type: observation, evidence, correlation, inference, uncertainty or recommendation."
            right={<div className="flex items-center gap-2"><ConfidenceIndicator level="moderate" /><AIGenerated /></div>}
          />
          <div className="grid gap-5 p-4 lg:grid-cols-[1.4fr_1fr]">
            <ul className="space-y-2">
              {INVESTIGATION_SUMMARY.statements.map((s) => (
                <li key={s.text} className="flex items-start gap-2.5 text-sm text-ink">
                  <KindTag kind={s.kind} />
                  <span className="pt-px">{s.text}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-4 text-xs">
              <Section title="Evidence used">
                <p className="text-ink-2">{EVIDENCE.filter((e) => e.supports === 'supports').length} supporting items from ServiceNow, product telemetry, agent logs, Azure DevOps and Dynatrace.</p>
              </Section>
              <Section title={`Contradictory evidence (${CONTRADICTORY_EVIDENCE.length})`}>
                <ul className="list-disc space-y-1 pl-4 text-ink-2">
                  {CONTRADICTORY_EVIDENCE.map((e) => <li key={e.id}>{e.title}</li>)}
                </ul>
              </Section>
              <Section title="Recommended next step">
                <p className="text-ink-2">Request Engineering investigation of propagation timing and the 2026.10.2 diff. In parallel, evaluate the product opportunity.</p>
              </Section>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader
          title="12-week trend"
          subtitle={isKey ? 'Numbered markers show releases, signals and records. Shaded weeks are planned, not observed.' : 'Weekly series'}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Time range" className="inline-flex rounded-md border border-line p-0.5">
                {([4, 8, 12, ...(isKey ? [16] : [])] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r as 4 | 8 | 12 | 16)}
                    aria-pressed={range === r}
                    className={cx('rounded px-2 py-0.5 text-xs font-medium', range === r ? 'bg-brand-500 text-white' : 'text-ink-2 hover:bg-slate-100')}
                  >
                    {r === 16 ? '12w + plan' : `${r}w`}
                  </button>
                ))}
              </div>
            </div>
          }
        />
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-2.5" role="group" aria-label="Toggle series">
          {(Object.keys(SERIES_META) as SeriesKey[]).map((k) => (
            <label key={k} className={cx('inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs', visible[k] ? 'border-slate-300 bg-white text-ink' : 'border-line bg-slate-50 text-ink-3')}>
              <input type="checkbox" className="sr-only" checked={visible[k]} onChange={() => setVisible((v) => ({ ...v, [k]: !v[k] }))} />
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: visible[k] ? SERIES_META[k].color : '#d5dae3' }} aria-hidden />
              {SERIES_META[k].label}
            </label>
          ))}
        </div>
        <div className="p-4">
          {Object.values(visible).some(Boolean) ? (
            <DriverTrendCharts
              rows={chartRows}
              visible={visible}
              markers={remapped.filter((m) => m.week >= 0)}
              numbered={numbered}
              baseline={isKey ? 27 : undefined}
              populationLabel={d.populationLabel}
              target={isKey && range === 16 ? 24 : undefined}
            />
          ) : (
            <p className="py-8 text-center text-sm text-ink-3">Select at least one series.</p>
          )}
          {isKey && (
            <ol className="mt-4 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
              {markers.map((m) => (
                <li key={m.id} className="flex gap-2">
                  <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', m.kind === 'planned' ? 'bg-good-50 text-good-700' : 'bg-slate-100 text-ink-2')}>{numbered.get(m.id)}</span>
                  <span>
                    <span className="font-medium text-ink">{m.date} · {m.label}</span>
                    <span className="text-ink-3"> ({m.source})</span>
                    <span className="block text-ink-3">{m.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Subdriver breakdown" subtitle={isKey ? 'Share of volume (28 days) and change vs. prior 4 weeks' : 'Share of volume'} />
          <div className="p-4">
            {(isKey ? SUBDRIVER_BREAKDOWN : d.subdrivers.map((s) => ({ id: s.id, label: s.label, share: Math.round(s.share * 100), change: 0 }))).map((s, i) => (
              <HBar key={s.id} label={s.label} value={s.share} max={50} display={`${s.share}%`} sub={isKey ? fmtSigned(s.change) : undefined} color={i === 0 && isKey ? SERIES.orange : SERIES.blue} emphasize={i === 0 && isKey} />
            ))}
          </div>
        </Card>
        {isKey ? (
          <Card>
            <CardHeader title="Help-content usage" subtitle="Help center analytics, last 28 days" />
            <div className="grid grid-cols-2 gap-px bg-line">
              {[
                ['Viewed documentation before contacting', `${HELP_CONTENT.viewedDocsBeforeContact}%`],
                ['Resolved by documentation', `${HELP_CONTENT.resolvedByDocs}%`],
                ['Still contacted support', `${HELP_CONTENT.stillContacted}%`],
                ['Documentation abandonment', `${HELP_CONTENT.abandonmentRate}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-white px-4 py-3">
                  <div className="text-[11px] text-ink-3">{k}</div>
                  <div className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{v}</div>
                </div>
              ))}
              <div className="col-span-2 bg-white px-4 py-3 text-xs text-ink-2">
                Most viewed article: <strong className="text-ink">“{HELP_CONTENT.topArticle}”</strong>. It explains the steps but cannot show a customer’s live propagation status.
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Agent quality (28 days)" />
            <div className="p-4">
              <HBar label="Verified AI resolution" value={a.verifiedAiResolution} display={`${a.verifiedAiResolution.toFixed(0)}%`} color={SERIES.aqua} />
              <HBar label="Human escalation" value={a.humanEscalation} display={`${a.humanEscalation.toFixed(0)}%`} color={SERIES.orange} />
              <HBar label="7-day recontact" value={a.recontact7d} display={`${a.recontact7d.toFixed(0)}%`} color={SERIES.violet} />
            </div>
          </Card>
        )}
      </div>

      {isKey && (
        <>
          <Card className="mt-5">
            <CardHeader title="Segment breakdowns" subtitle="Share of driver volume · contact rate per 10k developers in each segment · change vs. pre-release" />
            <div className="grid gap-px bg-line md:grid-cols-2">
              {SEGMENT_BREAKDOWNS.map((g) => (
                <div key={g.id} className="bg-white p-4">
                  <div className="text-xs font-semibold text-ink">{g.title}</div>
                  <div className="mb-2 text-[11px] text-ink-3">{g.note}</div>
                  {g.rows.map((r) => (
                    <HBar
                      key={r.label}
                      label={r.label}
                      value={r.share}
                      max={g.id === 'resolution' ? 60 : 50}
                      display={g.id === 'resolution' ? `${r.share}%` : `${r.rate} / 10k`}
                      sub={g.id === 'resolution' ? undefined : fmtSigned(r.change)}
                      color={g.id === 'resolution' ? (r.label.startsWith('AI') ? SERIES.aqua : r.label === 'Human escalation' ? SERIES.orange : SERIES.gray) : SERIES.blue}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <Card>
              <CardHeader title="Representative customer statements" subtitle="Anonymized. Open a case to trace it to the normalized record and the agent conversation." right={<MessageSquareQuote size={16} className="text-ink-3" />} />
              <ul className="divide-y divide-line">
                {CUSTOMER_STATEMENTS.map((s) => (
                  <li key={s.caseId}>
                    <button className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50" onClick={() => setOpenCase(s.caseId)}>
                      <span className="flex-1">
                        <span className="block text-sm italic text-ink">“{s.text}”</span>
                        <span className="mt-1 block text-[11px] text-ink-3">{s.caseId} · {s.segment} · {s.region}</span>
                      </span>
                      <ChevronRight size={15} className="mt-1 text-ink-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Cross-system signals" subtitle="Product telemetry, Dynatrace, SolarWinds, ServiceNow, Azure DevOps" />
              <div className="space-y-4 p-4 text-xs">
                <SignalGroup icon={<Activity size={13} />} title="Product telemetry" rows={TELEMETRY.map((t) => [t.metric, `${t.baseline} → ${t.current}`, t.note])} />
                <SignalGroup icon={<Server size={13} />} title="Dynatrace (application health)" rows={APP_HEALTH.map((h) => [`${h.service} · ${h.region} · ${h.metric}`, `${h.baseline} → ${h.current}`, `Since ${h.firstObserved}`])} />
                <SignalGroup icon={<ShieldAlert size={13} />} title="SolarWinds (infrastructure)" rows={INFRA.map((i) => [`${i.component} · ${i.region}`, i.alert, i.status])} />
                <SignalGroup icon={<FileSearch size={13} />} title="Records" rows={[['ServiceNow', EXISTING_WORK.problemRecord, ''], ['Azure DevOps', EXISTING_WORK.engineering, ''], ['Jira Align', d.roadmapCoverage ?? EXISTING_WORK.roadmap, '']]} />
              </div>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Why this alert was created" subtitle="Emerging-driver rule EA-301" right={<AIGenerated label="Rule + AI explanation" />} />
              <div className="space-y-4 p-4 text-xs">
                <table className="w-full text-left">
                  <thead className="text-[11px] uppercase tracking-wide text-ink-3"><tr><th className="py-1">Threshold</th><th>Required</th><th>Observed</th><th className="text-right">Met</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {EMERGING_RULE.map((r) => (
                      <tr key={r.id}><td className="py-1.5 text-ink">{r.label}</td><td className="text-ink-2">{r.threshold}</td><td className="text-ink-2">{r.observed}</td><td className="text-right"><Badge tone="green">Yes</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
                <Section title="Relationship type">
                  <p className="text-ink-2"><KindTag kind="correlation" /> <span className="ml-1">Correlation with release timing and regional latency. Not established as causation.</span></p>
                </Section>
                <Section title="Information missing">
                  <ul className="list-disc space-y-0.5 pl-4 text-ink-2">{MISSING_EVIDENCE.map((m) => <li key={m}>{m}</li>)}</ul>
                </Section>
                <Section title="Blast radius at detection">
                  <ul className="space-y-1">
                    {BLAST_RADIUS.map((b, i) => (
                      <li key={b.label} className="grid grid-cols-[52px_1fr_auto] gap-2">
                        <span className="tabular-nums text-ink-3">{b.date}</span>
                        <span className={i === 1 ? 'font-medium text-brand-700' : 'text-ink-2'}>{b.label}<span className="block text-[11px] text-ink-3">{b.note}</span></span>
                        <span className="text-right font-medium tabular-nums text-ink">{b.accounts.toLocaleString()} accts</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-ink-2"><KindTag kind="recommendation" /> <span className="ml-1">Add a release-aware fast lane so new drivers are caught while the affected group is small (~180 vs. 3,237 accounts).</span></p>
                </Section>
                <Section title="Current ownership">
                  <p className="text-ink-2">{d.ownershipStatus === 'owned' ? `Owned by ${d.productOwner} / ${d.engineeringOwner}.` : 'No Product or Engineering owner. A suggestion exists but has not been accepted.'}</p>
                </Section>
              </div>
            </Card>
            <Card>
              <CardHeader title="Intervention recommendations" subtitle="Reviewable. The AI cannot assign ownership to a team." right={<AIGenerated />} />
              <ul className="divide-y divide-line">
                {INTERVENTION_RECOMMENDATIONS.map((r) => (
                  <li key={r.type} className="flex items-start gap-3 px-4 py-3 text-xs">
                    <Badge tone={r.recommended ? 'blue' : 'neutral'} className="w-[132px] justify-center">{r.type}</Badge>
                    <span className="flex-1 text-ink-2">{r.text}</span>
                    <ConfidenceIndicator level={r.confidence as 'low' | 'moderate' | 'high'} label="Confidence" />
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4">
                <HumanApprovalNote>Recommendations remain proposals until you act on them using the actions above.</HumanApprovalNote>
              </div>
            </Card>
          </div>
        </>
      )}

      <Card className="mt-5">
        <CardHeader title="Decision log" subtitle="Human decisions, AI recommendations and system events for this driver" />
        {driverDecisions.length ? (
          <ul className="divide-y divide-line text-xs">
            {driverDecisions.map((x) => (
              <li key={x.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2">
                <span className="w-28 shrink-0 text-ink-3">{x.at}</span>
                <Badge tone={x.actor === 'You' ? 'blue' : x.actor === 'System' ? 'neutral' : 'violet'}>{x.actor}</Badge>
                <span className="font-medium text-ink">{x.action}</span>
                <span className="text-ink-2">{x.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-xs text-ink-3">No decisions recorded yet.</p>
        )}
      </Card>

      {isKey && <OpportunityDrawer open={drawer} onClose={() => setDrawer(false)} />}
      <ActionModal action={modal} onClose={() => setModal(null)} driverId={id} label={d.label} />
      <CaseModal caseId={openCase} onClose={() => setOpenCase(null)} />
    </>
  );
}

function SignalGroup({ icon, title, rows }: { icon: JSX.Element; title: string; rows: [string, string, string][] }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-ink">{icon}{title}</div>
      <ul className="space-y-1">
        {rows.map(([a, b, c]) => (
          <li key={a + b} className="grid grid-cols-[1fr_auto] gap-x-3 text-ink-2">
            <span>{a}</span>
            <span className="text-right font-medium tabular-nums text-ink">{b}</span>
            {c && <span className="col-span-2 text-[11px] text-ink-3">{c}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionModal({ action, onClose, driverId, label }: { action: ActionKey | null; onClose: () => void; driverId: string; label: string }) {
  const assignOwners = useStore((s) => s.assignOwners);
  const flagDriver = useStore((s) => s.flagDriver);
  const log = useStore((s) => s.log);
  const toast = useStore((s) => s.toast);
  const isKey = driverId === 'api_key_management';
  const [po, setPo] = useState(isKey ? 'Developer Platform' : PRODUCT_OWNERS[0].name);
  const [eng, setEng] = useState(isKey ? 'Identity Platform' : ENGINEERING_TEAMS[0].name);
  const [reason, setReason] = useState('');
  const [link, setLink] = useState('ADO #48213');
  if (!action) return null;

  const done = (flag: DriverFlag, title: string, body: string, patch?: Parameters<typeof flagDriver>[2]) => {
    flagDriver(driverId, flag, patch);
    log(`${title}: ${label}`, body);
    toast({ title, body, tone: 'success' });
    onClose();
  };

  const configs: Record<ActionKey, { title: string; body: JSX.Element; confirm: string; run: () => void; disabled?: boolean }> = {
    assign: {
      title: 'Assign accountable owners',
      confirm: 'Approve assignment',
      body: (
        <div className="space-y-3">
          <HumanApprovalNote>Assigning a Product or Engineering owner is a human decision. The AI suggestion is pre-selected.</HumanApprovalNote>
          <label className="block text-xs font-medium text-ink">Product owner
            <select value={po} onChange={(e) => setPo(e.target.value)} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm">
              {PRODUCT_OWNERS.map((p) => <option key={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-ink">Engineering team
            <select value={eng} onChange={(e) => setEng(e.target.value)} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm">
              {ENGINEERING_TEAMS.map((p) => <option key={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
      ),
      run: () => {
        assignOwners(driverId, po, eng);
        toast({ title: 'Owners assigned', body: `${label}: ${po} / ${eng}`, tone: 'success' });
        onClose();
      },
    },
    link: {
      title: 'Link existing work',
      confirm: 'Link',
      body: (
        <div className="space-y-2">
          <p>Existing items related to this driver:</p>
          {['ADO #48213 · Investigate rotation propagation reports (investigation spike)', 'ServiceNow PRB0041877 · Emerging problem record'].map((x) => (
            <label key={x} className="flex items-center gap-2 rounded border border-line px-3 py-2 text-xs">
              <input type="radio" checked={link === x.split(' · ')[0]} onChange={() => setLink(x.split(' · ')[0])} />
              {x}
            </label>
          ))}
          <p className="text-xs text-ink-3">Neither is a funded roadmap item. Linking keeps the evidence trail; it does not create ownership.</p>
        </div>
      ),
      run: () => done('linked_work', 'Linked existing work', `${link} linked to ${label} evidence.`),
    },
    engineering: {
      title: isKey ? `File bug ${BUG_REPORT.id} for ${BUG_REPORT.team}` : 'Request Engineering investigation',
      confirm: isKey ? 'Approve & file bug' : 'Send request',
      body: isKey ? (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center gap-2"><AIGenerated label="AI-drafted from aggregated cases" /><Badge>{BUG_REPORT.severity}</Badge></div>
          <p className="text-sm font-medium text-ink">{BUG_REPORT.title}</p>
          <p><span className="font-medium text-ink">Affected:</span> {BUG_REPORT.affected}</p>
          <div>
            <div className="font-medium text-ink">Repro steps</div>
            <ol className="mt-0.5 list-decimal space-y-0.5 pl-4">{BUG_REPORT.repro.map((r) => <li key={r}>{r}</li>)}</ol>
          </div>
          <p><span className="font-medium text-ink">Expected:</span> {BUG_REPORT.expected}</p>
          <p><span className="font-medium text-ink">Actual:</span> {BUG_REPORT.actual}</p>
          <div>
            <div className="font-medium text-ink">Proposed fix</div>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4">{BUG_REPORT.proposedFix.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <p><span className="font-medium text-ink">Evidence:</span> {BUG_REPORT.evidence.join(' · ')}</p>
          <p><span className="font-medium text-ink">Still unknown:</span> {MISSING_EVIDENCE.slice(0, 2).join('; ')}.</p>
          <p className="text-ink-3">Confidence: {BUG_REPORT.confidence}. Filing routes the bug to {BUG_REPORT.team} and links it to ADO #48213 and every contributing case, so customers can be notified when the fix ships.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p>Sends a structured request with the evidence package and missing-evidence list to the owning team’s triage queue.</p>
        </div>
      ),
      run: () => done('engineering_requested', isKey ? `Bug ${BUG_REPORT.id} filed` : 'Engineering investigation requested', isKey ? `Routed to ${BUG_REPORT.team} with repro steps, proposed fix and ${BUG_REPORT.evidence.length} evidence links (synthetic).` : 'Request sent to team triage (synthetic).'),
    },
    agent: {
      title: 'Improve agent guidance',
      confirm: 'Submit for review',
      body: <p>Proposes an agent-guidance update: “Always call getKeyPropagationStatus before advising which key to use; cite the documented propagation window.” The change goes to the agent policy review queue; it does not deploy automatically.</p>,
      run: () => done('agent_guidance', 'Agent guidance update submitted', 'Queued for agent policy review (v42).'),
    },
    help: {
      title: 'Improve help content',
      confirm: 'Create content task',
      body: <p>Creates a help-center task to add the documented propagation window and a troubleshooting section to “Rotating API keys safely” (47% abandonment).</p>,
      run: () => done('help_content', 'Help-content task created', 'Assigned to Developer Education (synthetic).'),
    },
    monitor: {
      title: 'Monitor trend',
      confirm: 'Start monitoring',
      body: <p>Adds a watch: notify if the contact rate exceeds 40 per 10k developers or recontact exceeds 15% for two consecutive weeks.</p>,
      run: () => done('monitoring', 'Monitoring enabled', 'Thresholds: rate > 40 per 10k developers or recontact > 15% (2 weeks).'),
    },
    dismiss: {
      title: 'Dismiss alert?',
      confirm: 'Dismiss alert',
      disabled: reason.trim().length < 8,
      body: (
        <div className="space-y-3">
          <div className="rounded-md border border-amber-200 bg-warn-50 px-3 py-2 text-xs text-warn-700">
            This is a material trend (+{AGGREGATES[driverId].fourWeekChange.toFixed(0)}% over four weeks). Dismissing requires a recorded human reason.
          </div>
          <label className="block text-xs font-medium text-ink">Reason (required)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm" placeholder="e.g., Duplicate of EA-298; tracked there." />
          </label>
        </div>
      ),
      run: () => done('dismissed', 'Alert dismissed', `Reason: ${reason.trim()}`),
    },
  };
  const c = configs[action];
  return (
    <Modal
      open
      onClose={onClose}
      title={c.title}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={action === 'dismiss' ? 'danger' : 'primary'} onClick={c.run} disabled={c.disabled}>{c.confirm}</Button>
        </>
      }
    >
      {c.body}
    </Modal>
  );
}

function CaseModal({ caseId, onClose }: { caseId: string | null; onClose: () => void }) {
  const c = REPRESENTATIVE_CASES.find((x) => x.caseId === caseId);
  if (!c) return null;
  const conv = CONVERSATIONS.find((x) => x.caseId === c.caseId);
  const fields: [string, string][] = [
    ['Created', new Date(c.createdAt).toUTCString().replace(' GMT', ' UTC')],
    ['Segment', SEGMENT_LABEL[c.customerSegment]],
    ['Tenure', `${c.customerTenureDays} days`],
    ['Region', REGION_LABEL[c.region]],
    ['Channel', CHANNEL_LABEL[c.channel]],
    ['Resolution path', RESOLUTION_LABEL[c.resolutionPath]],
    ['Verified resolution', c.verifiedResolution ? 'Yes' : 'No'],
    ['Escalated', c.escalated ? 'Yes' : 'No'],
    ['Recontact ≤ 7 days', c.recontactWithin7Days ? 'Yes' : 'No'],
    ['Agent confidence', c.agentConfidence.toFixed(2)],
    ['Product friction suspected', c.productFrictionSuspected ? 'Yes' : 'No'],
    ['Release', c.releaseVersion],
    ['Driver › subdriver', `${c.driver} › ${c.subdriver}`],
  ];
  return (
    <Modal
      open
      onClose={onClose}
      title={`${c.caseId} · ServiceNow case (normalized)`}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          {c.scenarioId && (
            <Button variant="primary" onClick={() => { onClose(); go(`#/trust-lab/${c.scenarioId}`); }}>Open conversation in Agent Trust Lab</Button>
          )}
        </>
      }
    >
      <p className="mb-3 text-sm text-ink">{c.summary}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {fields.map(([k, v]) => (
          <div key={k}>
            <dt className="text-ink-3">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {conv && (
        <div className="mt-4 rounded-md border border-line bg-slate-50 p-3 text-xs">
          <div className="mb-1.5 font-semibold text-ink">Agent conversation {conv.conversationId}</div>
          {conv.turns.map((t, i) => (
            <p key={i} className="mb-1"><span className="font-medium text-ink">{t.role === 'customer' ? 'Customer' : 'Agent'}:</span> {t.text}</p>
          ))}
          <p className="mt-1.5 text-ink-3">Tools: {conv.toolCalls.join(', ')} · {conv.disposition}</p>
        </div>
      )}
    </Modal>
  );
}
