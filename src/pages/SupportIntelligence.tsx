import { AlertTriangle, Filter, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Prioritization } from '../components/Prioritization';
import { DriverTable, EXPLORER_COLS, INTERVENTION_LABEL, INTERVENTION_TYPE_LABEL, rowFromAggregate, type DriverRow } from '../components/DriverTable';
import { AIGenerated, Badge, Button, Card, CardHeader, PageHeader, Tip } from '../components/ui';
import { EMERGING_ALERTS } from '../data/alerts';
import { EMERGING_RULE } from '../data/apiKey';
import { ACTIVE_DEVELOPERS, PAID_ACCOUNTS, WEEKS } from '../data/calendar';
import { SAMPLE_CASES } from '../data/cases';
import { AGGREGATES, COST_AI, COST_HUMAN, COST_OTHER, DRIVER_BY_ID, TRENDS } from '../data/drivers';
import { CHANNEL_LABEL, RELEASES_SEEN, RESOLUTION_LABEL, SEGMENTS } from '../data/org';
import { cx } from '../lib/format';
import { go } from '../lib/router';
import { useDrivers } from '../store';

type Filters = Record<string, string>;

const CASE_FILTERS = ['subdriver', 'segment', 'channel', 'release', 'path', 'verified'];

const FILTER_DEFS: { key: string; label: string; options: (drivers: ReturnType<typeof useDrivers>) => [string, string][] }[] = [
  { key: 'range', label: 'Date range', options: () => [['12', 'Last 12 weeks'], ['8', 'Last 8 weeks'], ['4', 'Last 4 weeks']] },
  { key: 'driver', label: 'Driver', options: (ds) => ds.map((d) => [d.id, d.label]) },
  { key: 'subdriver', label: 'Subdriver', options: (ds) => ds.flatMap((d) => d.subdrivers.map((s) => [s.id, `${d.label} › ${s.label}`] as [string, string])) },
  { key: 'area', label: 'Product area', options: (ds) => [...new Set(ds.map((d) => d.productArea))].map((a) => [a, a]) },
  { key: 'segment', label: 'Customer segment', options: () => SEGMENTS.map((s) => [s.id, s.label]) },
  { key: 'channel', label: 'Channel', options: () => Object.entries(CHANNEL_LABEL) },
  { key: 'release', label: 'Release version', options: () => RELEASES_SEEN.map((r) => [r, r]) },
  { key: 'path', label: 'Resolution path', options: () => Object.entries(RESOLUTION_LABEL) },
  { key: 'owner', label: 'Product owner', options: (ds) => [['__none', 'Unassigned'], ...[...new Set(ds.map((d) => d.productOwner).filter(Boolean) as string[])].map((o) => [o, o] as [string, string])] },
  { key: 'eng', label: 'Engineering owner', options: (ds) => [['__none', 'Unassigned'], ...[...new Set(ds.map((d) => d.engineeringOwner).filter(Boolean) as string[])].map((o) => [o, o] as [string, string])] },
  { key: 'ownership', label: 'Ownership status', options: () => [['owned', 'Owned'], ['unowned', 'Unowned'], ['proposed', 'Proposed']] },
  { key: 'itype', label: 'Intervention type', options: () => Object.entries(INTERVENTION_TYPE_LABEL) },
  { key: 'direction', label: 'Trend direction', options: () => [['rising', 'Rising'], ['stable', 'Stable'], ['falling', 'Falling']] },
  { key: 'risk', label: 'Risk level', options: () => [['high', 'High'], ['moderate', 'Moderate'], ['low', 'Low']] },
  { key: 'verified', label: 'Verified resolution', options: () => [['yes', 'Verified'], ['no', 'Not verified']] },
];

function sampleRows(drivers: ReturnType<typeof useDrivers>, f: Filters, weeks: number): DriverRow[] {
  const from = WEEKS - weeks;
  const segShare = f.segment ? SEGMENTS.find((s) => s.id === f.segment)!.populationShare : 1;
  return drivers.map((d) => {
    const cs = SAMPLE_CASES.filter(
      (c) =>
        c.driver === d.id &&
        (!f.subdriver || c.subdriver === f.subdriver) &&
        (!f.segment || c.customerSegment === f.segment) &&
        (!f.channel || c.channel === f.channel) &&
        (!f.release || c.releaseVersion === f.release) &&
        (!f.path || c.resolutionPath === f.path) &&
        (!f.verified || c.verifiedResolution === (f.verified === 'yes')),
    );
    const sum = (arr: typeof cs) => arr.reduce((s, c) => s + c.weight, 0);
    const inRange = cs.filter((c) => c.week >= from);
    const last4 = cs.filter((c) => c.week >= WEEKS - 4);
    const pop = (w: number) => (d.id === 'usage_billing' ? PAID_ACCOUNTS[w] : ACTIVE_DEVELOPERS[w]) * segShare;
    const rateOf = (arr: typeof cs, w: number) => (sum(arr) * 10_000) / pop(w);
    const weekRate = (w: number) => rateOf(cs.filter((c) => c.week === w), w) * 4;
    const n4 = sum(last4) || 1;
    const ai = (sum(last4.filter((c) => c.resolutionPath === 'ai_answer' || c.resolutionPath === 'tool_assisted')) / n4) * 100;
    const esc = (sum(last4.filter((c) => c.escalated)) / n4) * 100;
    const avg = (ws: number[]) => ws.reduce((s, w) => s + weekRate(w), 0) / ws.length;
    const prevAvg = avg([4, 5, 6, 7]);
    return {
      driver: d,
      cases: sum(inRange),
      contactRate: weekRate(WEEKS - 1),
      fourWeek: prevAvg ? ((avg([8, 9, 10, 11]) - prevAvg) / prevAvg) * 100 : 0,
      wow: weekRate(WEEKS - 2) ? ((weekRate(WEEKS - 1) - weekRate(WEEKS - 2)) / weekRate(WEEKS - 2)) * 100 : 0,
      mom: weekRate(WEEKS - 5) ? ((weekRate(WEEKS - 1) - weekRate(WEEKS - 5)) / weekRate(WEEKS - 5)) * 100 : 0,
      ai,
      esc,
      recon: (sum(last4.filter((c) => c.recontactWithin7Days)) / n4) * 100,
      accounts: Math.round(sum(last4) * 0.8),
      cost: sum(last4) * ((ai / 100) * COST_AI + (esc / 100) * COST_HUMAN + ((100 - ai - esc) / 100) * COST_OTHER),
      filtered: true,
    };
  }).filter((r) => r.cases > 0);
}

export function SupportIntelligence() {
  const drivers = useDrivers();
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filters>({ range: '12' });
  const [showAll, setShowAll] = useState(false);
  const weeks = Number(f.range ?? 12);
  const caseLevel = CASE_FILTERS.some((k) => f[k]);

  const rows = useMemo(() => {
    const base = caseLevel
      ? sampleRows(drivers, f, weeks)
      : drivers.map((d) => {
          const r = rowFromAggregate(d);
          return { ...r, cases: TRENDS[d.id].points.slice(WEEKS - weeks).reduce((s, p) => s + p.cases, 0) };
        });
    const needle = q.trim().toLowerCase();
    return base.filter(({ driver: d }) => {
      const a = AGGREGATES[d.id];
      if (needle && ![d.label, d.productArea, ...d.subdrivers.map((s) => s.label), d.productOwner ?? '', d.engineeringOwner ?? ''].some((t) => t.toLowerCase().includes(needle))) return false;
      if (f.driver && d.id !== f.driver) return false;
      if (f.subdriver && !d.subdrivers.some((s) => s.id === f.subdriver)) return false;
      if (f.area && d.productArea !== f.area) return false;
      if (f.owner && (f.owner === '__none' ? d.productOwner : d.productOwner !== f.owner)) return false;
      if (f.eng && (f.eng === '__none' ? d.engineeringOwner : d.engineeringOwner !== f.eng)) return false;
      if (f.ownership && d.ownershipStatus !== f.ownership) return false;
      if (f.itype && d.interventionType !== f.itype) return false;
      if (f.direction && a.direction !== f.direction) return false;
      if (f.risk && d.riskLevel !== f.risk) return false;
      return true;
    });
  }, [drivers, f, q, weeks, caseLevel]);

  const active = Object.entries(f).filter(([k, v]) => v && !(k === 'range' && v === '12'));
  const visibleDefs = showAll ? FILTER_DEFS : FILTER_DEFS.slice(0, 7);

  return (
    <>
      <PageHeader
        eyebrow="Workspace 2 · Support Intelligence"
        title="Support-driver explorer"
        description="Find out why customers contact support, whether the agent resolves it safely, and whether the problem belongs to Product or Engineering."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">Search drivers</span>
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search drivers, subdrivers, owners…"
                className="w-full rounded-md border border-line bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-ink-3 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <Button size="sm" variant="ghost" icon={<Filter size={13} />} onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Fewer filters' : `All ${FILTER_DEFS.length} filters`}
            </Button>
            {active.length > 0 && (
              <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={() => { setF({ range: '12' }); setQ(''); }}>
                Clear ({active.length})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {visibleDefs.map((def) => (
              <label key={def.key} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium text-ink-3">{def.label}</span>
                <select
                  value={f[def.key] ?? ''}
                  onChange={(e) => setF((s) => ({ ...s, [def.key]: e.target.value }))}
                  className={cx('rounded-md border bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none', f[def.key] && !(def.key === 'range' && f.range === '12') ? 'border-brand-500 text-brand-700' : 'border-line text-ink')}
                >
                  {def.key !== 'range' && <option value="">All</option>}
                  {def.options(drivers).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {caseLevel && (
            <p className="text-[11px] text-ink-3">
              Case-level filters are computed from {SAMPLE_CASES.length.toLocaleString()} sampled case records (1 record ≈ 25 cases) and scaled to totals.
              {f.segment && ' Rates use the selected segment’s population as the denominator.'}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-xs text-ink-3">
          <span>{rows.length} drivers · case volume over the last {weeks} weeks · rates are the latest 28 days</span>
          <span className="hidden sm:inline">Click a column header to sort</span>
        </div>
        {rows.length ? (
          <DriverTable rows={rows} cols={EXPLORER_COLS} highlightId="api_key_management" caption="Support-driver explorer" />
        ) : (
          <div className="p-6 text-center text-sm text-ink-3">No drivers match these filters.</div>
        )}
      </Card>

      <div className="mt-5">
        <Prioritization />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <Card>
          <CardHeader title="Why normalized contact rates matter during hypergrowth" />
          <div className="p-4 text-sm">
            <div className="rounded-md bg-slate-50 px-3 py-2.5 text-center font-medium text-ink">
              Contact rate = contacts for a driver ÷ active developers × 10,000 (billing: ÷ paid accounts)
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['January', '4,000', '500,000', '80'],
                ['June', '8,000', '2,000,000', '40'],
              ].map(([m, c, p, r]) => (
                <div key={m} className="rounded-md border border-line p-3">
                  <div className="text-xs font-semibold text-ink-3">{m}</div>
                  <div className="mt-1 text-xs text-ink-2">{c} authentication contacts</div>
                  <div className="text-xs text-ink-2">{p} active developers</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-ink">{r}<span className="ml-1 text-xs font-normal text-ink-3">/ 10k</span></div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-2">
              <strong className="text-ink">Raw volume doubled, but normalized contact rate improved by 50 percent.</strong> In this dataset, active developers
              grew 29% in 12 weeks. Raw volume alone would make every driver look worse, and would hide API Key Management’s real increase.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Emerging-driver alerts"
            subtitle="A single case never creates a Product epic. Alerts require aggregated, quality-controlled evidence."
            right={<AIGenerated label="System rule + AI summary" />}
          />
          <div className="border-b border-line px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              Rule thresholds <Tip text="All five must be met. Alerts below a threshold are kept on watch." />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EMERGING_RULE.map((r) => (
                <Badge key={r.id} tone="neutral">{r.label}: {r.threshold}</Badge>
              ))}
            </div>
          </div>
          <ul className="max-h-[340px] divide-y divide-line overflow-y-auto">
            {EMERGING_ALERTS.map((a) => {
              const d = drivers.find((x) => x.id === a.driverId)!;
              const owned = d.ownershipStatus === 'owned';
              return (
                <li key={a.id}>
                  <button onClick={() => go(`#/support/driver/${a.driverId}`)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <AlertTriangle size={15} className={cx('mt-0.5 shrink-0', a.status === 'alert' ? 'text-warn-600' : 'text-ink-3')} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-ink">
                        {DRIVER_BY_ID[a.driverId].label} › {a.subdriver}
                        {a.id === 'EA-301' && <Badge tone="amber">Primary scenario</Badge>}
                      </span>
                      <span className="block text-[11px] text-ink-3">
                        {a.id} · WoW +{a.wow}% · {a.cases28d.toLocaleString()} cases · {a.accounts.toLocaleString()} accounts · conf. {a.confidence.toFixed(2)} · {a.days} days · {a.note}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={a.status === 'alert' ? 'amber' : 'neutral'}>{a.status === 'alert' ? 'Alert' : 'Watch'}</Badge>
                      <Badge tone={owned ? 'green' : 'neutral'}>{owned ? 'Owned' : 'No owner'}</Badge>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <p className="mt-4 text-[11px] text-ink-3">
        Intervention status key:{' '}
        {Object.values(INTERVENTION_LABEL).map((i) => i.label).join(' · ')}
      </p>
    </>
  );
}
