import { ArrowRight, ChevronDown, Lightbulb } from 'lucide-react';
import { DemandChart } from '../components/Charts';
import { DriverTable, OVERVIEW_COLS, rowFromAggregate } from '../components/DriverTable';
import { AIGenerated, Badge, Button, CalcBody, Card, CardHeader, MetricCard, PageHeader } from '../components/ui';
import { API_KEY_CALCS, CALC_BY_ID, CASE_ORIGIN } from '../data/calculations';
import { EMERGING_ALERTS } from '../data/alerts';
import { AGGREGATES, PLATFORM, TOP_DRIVER_IDS } from '../data/drivers';
import { LADDER } from '../data/glossary';
import { LOOP_HEALTH } from '../data/loop';
import { CASES_AI, CASES_AVOIDED, CASES_HUMAN, DEMAND_COMPOSITION, PRODUCTION_CARDS } from '../data/outcomes';
import { fmtInt, fmtMoney } from '../lib/format';
import { go } from '../lib/router';
import { useDrivers, useStore } from '../store';

export function Overview() {
  const drivers = useDrivers();
  const approved = useStore((s) => s.opportunityStatus === 'approved');
  const unowned = drivers.filter((d) => d.ownershipStatus === 'unowned');
  const top = drivers.filter((d) => TOP_DRIVER_IDS.includes(d.id)).map(rowFromAggregate);
  const key = AGGREGATES.api_key_management;
  const classCount = (c: string) => PRODUCTION_CARDS.filter((p) => p.classification === c).length;

  return (
    <>
      <PageHeader
        eyebrow="Workspace 1 · Overview"
        title="Support demand, resolution quality and product outcomes"
        description={
          <>
            Twelve weeks of support for Lattice API Platform, through Oct 25, 2026. Contact rates are normalized per 10,000 active developers, so
            hypergrowth (+29% developers) does not hide or inflate trends.
          </>
        }
      />

      <ol className="mb-5 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3" aria-label="What this application does">
        {[
          ['Resolve', 'The AI agent safely resolves genuine support needs, and escalates when it should.'],
          ['Eliminate', 'Problems the product causes are routed to an owner and fixed, so customers stop needing support for them.'],
          ['Measure', 'Contact rates normalized for growth show which one actually happened.'],
        ].map(([t, d]) => (
          <li key={t} className="bg-white px-4 py-3">
            <div className="text-sm font-semibold text-ink">{t}</div>
            <p className="mt-0.5 text-xs text-ink-2">{d}</p>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="ServiceNow cases"
          value={fmtInt(PLATFORM.totalCases)}
          sub={`12 weeks · ${fmtInt(CASE_ORIGIN.dynatrace + CASE_ORIGIN.solarwinds)} opened from alerts`}
          tip={<CalcBody calc={CALC_BY_ID.cases} />}
        />
        <MetricCard label="Contacts / 10k developers" value={Math.round(PLATFORM.weeklyContactRate)} sub="Weekly, latest week" tip={<CalcBody calc={CALC_BY_ID.rate} />} />
        <MetricCard label="Verified AI resolution" value={`${Math.round(PLATFORM.verifiedAiResolution)}%`} sub="System-confirmed, 12 weeks" tip={<CalcBody calc={CALC_BY_ID.ai} />} />
        <MetricCard label="Human escalation" value={`${Math.round(PLATFORM.humanEscalation)}%`} sub="12 weeks" tip={<CalcBody calc={CALC_BY_ID.esc} />} />
        <MetricCard label="7-day recontact" value={`${Math.round(PLATFORM.recontact7d)}%`} sub="Same driver, 12 weeks" tip={<CalcBody calc={CALC_BY_ID.recon} />} />
        <MetricCard label="Emerging drivers" value={EMERGING_ALERTS.length} sub="Subdriver alerts" tone="warn" onClick={() => go('#/support')} tip={<CalcBody calc={CALC_BY_ID.emerging} />} />
        <MetricCard
          label="Unowned drivers"
          value={unowned.length}
          sub={approved ? 'API Key Management now owned' : 'Includes API Key Management'}
          tone="warn"
          onClick={() => go('#/support')}
          highlight={!approved}
          tip={<CalcBody calc={{ ...CALC_BY_ID.unowned, inputs: [unowned.map((d) => d.label).join(', ')] }} />}
        />
        <MetricCard label="Interventions measuring" value={PRODUCTION_CARDS.length} sub="In production" onClick={() => go('#/outcomes')} tip={<CalcBody calc={CALC_BY_ID.interventions} />} />
        <MetricCard label="Annual avoidable support cost" value={fmtMoney(PLATFORM.annualAvoidableCost)} sub="Estimate" tip={<CalcBody calc={CALC_BY_ID.cost} />} />
        <MetricCard label="Cases avoided by product" value={fmtInt(CASES_AVOIDED)} sub="Validated interventions only" tone="good" onClick={() => go('#/outcomes/billing')} tip={<CalcBody calc={CALC_BY_ID.avoided} />} />
      </div>
      <p className="mt-2 text-[11px] text-ink-3">Hover or tab to any <span aria-hidden>ⓘ</span> to see the formula and the actual numbers behind it. All calculations are also listed in the <a href="#/glossary" className="text-brand-600 underline">metric glossary</a>.</p>

      <Card className="mt-5 overflow-hidden border-amber-200">
        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          <div className="flex gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-warn-50 p-2 text-warn-700">
              <Lightbulb size={18} aria-hidden />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">API Key Management: support success, product-quality signal</h2>
                <AIGenerated />
                <Badge tone="amber">Correlation, not causation</Badge>
              </div>
              <p className="mt-1.5 text-sm text-ink-2">
                AI resolution is improving operational efficiency, but increasing normalized contact rate suggests that the underlying product friction
                remains unresolved.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
                <span><strong className="text-ink">{key.contactRate}</strong> / 10k (from 27)</span>
                <span><strong className="text-warn-700">+{key.fourWeekChange.toFixed(0)}%</strong> rising rate (4 weeks)</span>
                <span><strong className="text-ink">{key.verifiedAiResolution.toFixed(0)}%</strong> verified AI resolution</span>
                <span><strong className="text-ink">{key.humanEscalation.toFixed(0)}%</strong> escalation</span>
                <span><strong className="text-warn-700">{key.recontact7d.toFixed(0)}%</strong> recontact</span>
                <span>{approved ? <Badge tone="green">Owned: Developer Platform</Badge> : <Badge tone="amber">Unowned</Badge>}</span>
              </div>
              <details className="group mt-3 rounded-md border border-amber-200 bg-white text-xs">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-medium text-brand-700">
                  <ChevronDown size={14} className="-rotate-90 transition-transform group-open:rotate-0" aria-hidden />
                  How these numbers are calculated
                </summary>
                <dl className="grid gap-x-6 gap-y-3 border-t border-amber-100 px-3 py-3 md:grid-cols-2">
                  {API_KEY_CALCS.map((c) => (
                    <div key={c.id}>
                      <dt className="font-semibold text-ink">{c.label}</dt>
                      <dd className="mt-0.5"><CalcBody calc={c} light /></dd>
                    </div>
                  ))}
                </dl>
                <p className="border-t border-amber-100 px-3 py-2 text-ink-3">Source: ServiceNow cases classified to the API Key Management driver, divided by active developers from product telemetry. Rates are per 10,000 developers over a 28-day window.</p>
              </details>
            </div>
          </div>
          <div className="flex items-center border-t border-amber-100 bg-amber-50/40 p-4 md:border-l md:border-t-0">
            <Button variant="primary" icon={<ArrowRight size={15} />} onClick={() => go('#/support/driver/api_key_management')}>
              Investigate driver
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Loop health" subtitle="Is the support-to-product loop removing demand? North star: fewer cases per user, even as the platform grows." />
        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 xl:grid-cols-6">
          {LOOP_HEALTH.map((m) => (
            <div key={m.id} className="bg-white px-4 py-3" title={m.tip}>
              <div className="text-[11px] font-medium text-ink-3">{m.label}</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{m.value}</div>
              <div className={`text-[11px] ${m.tone === 'good' ? 'text-good-700' : m.tone === 'warn' ? 'text-warn-700' : 'text-ink-3'}`}>{m.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="Top support drivers"
          subtitle="Contact rate is per 10,000 relevant active population over 28 days (billing uses paid accounts). Click a row for detail."
          right={<Button size="sm" variant="ghost" onClick={() => go('#/support')}>Open explorer <ArrowRight size={13} /></Button>}
        />
        <DriverTable rows={top} cols={OVERVIEW_COLS} highlightId="api_key_management" caption="Top support drivers" />
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="How support demand was handled"
            subtitle="Weekly. Eliminated demand is the gap between pre-release baseline and actual for validated interventions (conservative)."
          />
          <div className="p-3">
            <DemandChart data={DEMAND_COMPOSITION} />
            <p className="px-1 pt-1 text-[11px] text-ink-3">
              Self-service sessions are help-center resolutions estimated from article analytics and are not counted in the 127,842 cases.
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Outcome summary" subtitle="12 weeks" />
          <dl className="grid grid-cols-2 gap-px bg-line">
            {[
              ['Cases avoided through product changes', fmtInt(CASES_AVOIDED), 'text-good-700'],
              ['Cases resolved by AI (verified)', fmtInt(CASES_AI), ''],
              ['Cases escalated to humans', fmtInt(CASES_HUMAN), ''],
              ['Drivers without owners', String(unowned.length), 'text-warn-700'],
              ['Hypotheses validated', String(classCount('validated')), 'text-good-700'],
              ['Partially validated', String(classCount('partially_validated')), ''],
              ['Not validated', String(classCount('not_validated')), ''],
              ['Still being measured', String(classCount('measuring')), ''],
            ].map(([k, v, c]) => (
              <div key={k} className="bg-white px-4 py-3">
                <dt className="text-[11px] text-ink-3">{k}</dt>
                <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${c || 'text-ink'}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Four outcomes that are easy to confuse" subtitle="Deflection is not resolution, and resolution is not elimination." />
        <ol className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
          {LADDER.map((l, i) => (
            <li key={l.term} className="bg-white p-4">
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${i === 3 ? 'bg-good-600 text-white' : 'bg-slate-100 text-ink-2'}`}>{i + 1}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-ink">{l.term}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{l.definition}</p>
              <p className="mt-1 text-xs text-ink-3">{l.caution}</p>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
