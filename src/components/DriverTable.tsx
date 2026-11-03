import { ArrowDownUp, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { AGGREGATES, TRENDS } from '../data/drivers';
import type { SupportDriver } from '../data/types';
import { cx, fmtInt, fmtMoney, fmtRate, fmtSigned } from '../lib/format';
import { go } from '../lib/router';
import type { DriverFlag } from '../store';
import { Sparkline, SERIES } from './Charts';
import { Badge, OwnershipBadge } from './ui';

export const INTERVENTION_LABEL: Record<string, { label: string; tone: 'neutral' | 'blue' | 'green' | 'amber' | 'violet' }> = {
  none: { label: 'None', tone: 'neutral' },
  emerging_opportunity: { label: 'Emerging product opportunity', tone: 'amber' },
  awaiting_review: { label: 'Awaiting review', tone: 'blue' },
  in_development: { label: 'In development', tone: 'blue' },
  measuring: { label: 'Measuring', tone: 'violet' },
  validated: { label: 'Validated', tone: 'green' },
  monitoring: { label: 'Monitoring', tone: 'neutral' },
  agent_guidance: { label: 'Agent guidance', tone: 'neutral' },
};

export const INTERVENTION_TYPE_LABEL: Record<string, string> = {
  support_response: 'Support',
  help_center_response: 'Help center',
  product_response: 'Product',
  engineering_response: 'Engineering',
  operations_response: 'Operations',
  product_candidate: 'Product candidate',
  none: 'None',
};

export interface DriverRow {
  driver: SupportDriver & { flags: DriverFlag[] };
  cases: number;
  contactRate: number;
  fourWeek: number;
  wow: number;
  mom: number;
  ai: number;
  esc: number;
  recon: number;
  accounts: number;
  cost: number;
  filtered?: boolean;
}

export function rowFromAggregate(d: SupportDriver & { flags: DriverFlag[] }): DriverRow {
  const a = AGGREGATES[d.id];
  return {
    driver: d, cases: a.cases12w, contactRate: a.contactRate, fourWeek: a.fourWeekChange, wow: a.wowChange, mom: a.momChange,
    ai: a.verifiedAiResolution, esc: a.humanEscalation, recon: a.recontact7d, accounts: a.affectedAccounts, cost: a.cost28d,
  };
}

type ColKey =
  | 'driver' | 'area' | 'cases' | 'rate' | 'trend' | 'wow' | 'mom' | 'accounts' | 'cost' | 'ai' | 'esc' | 'recon'
  | 'coverage' | 'owner' | 'eng' | 'ownership' | 'intervention';

const COLS: Record<ColKey, { label: string; numeric?: boolean; sort?: (r: DriverRow) => number | string; title?: string }> = {
  driver: { label: 'Driver', sort: (r) => r.driver.label },
  area: { label: 'Product area', sort: (r) => r.driver.productArea },
  cases: { label: 'Case volume', numeric: true, sort: (r) => r.cases, title: '12-week case volume' },
  rate: { label: 'Rate / 10k', numeric: true, sort: (r) => r.contactRate, title: 'Contacts ÷ active developers × 10,000 (28-day). Usage Billing uses paid accounts instead.' },
  trend: { label: '4-wk trend', numeric: true, sort: (r) => r.fourWeek, title: 'Last 4 weeks vs prior 4 weeks (average contact rate)' },
  wow: { label: 'WoW', numeric: true, sort: (r) => r.wow, title: 'Week-over-week change in contact rate' },
  mom: { label: 'MoM', numeric: true, sort: (r) => r.mom, title: 'Change vs 4 weeks ago' },
  accounts: { label: 'Accounts', numeric: true, sort: (r) => r.accounts, title: 'Affected accounts (28 days)' },
  cost: { label: 'Est. cost (28d)', numeric: true, sort: (r) => r.cost, title: 'Illustrative: $1.80 AI-verified, $22 human, $7 other' },
  ai: { label: 'Verified AI', numeric: true, sort: (r) => r.ai },
  esc: { label: 'Human esc.', numeric: true, sort: (r) => r.esc },
  recon: { label: '7-day recon.', numeric: true, sort: (r) => r.recon },
  coverage: { label: 'Roadmap coverage', sort: (r) => r.driver.roadmapCoverage ?? '' },
  owner: { label: 'Product owner', sort: (r) => r.driver.productOwner ?? '' },
  eng: { label: 'Engineering owner', sort: (r) => r.driver.engineeringOwner ?? '' },
  ownership: { label: 'Ownership', sort: (r) => r.driver.ownershipStatus },
  intervention: { label: 'Intervention', sort: (r) => r.driver.interventionStatus },
};

export const OVERVIEW_COLS: ColKey[] = ['driver', 'area', 'cases', 'rate', 'trend', 'ai', 'esc', 'recon', 'owner', 'ownership', 'intervention'];
export const EXPLORER_COLS: ColKey[] = ['driver', 'cases', 'rate', 'trend', 'wow', 'mom', 'accounts', 'cost', 'ai', 'esc', 'recon', 'coverage', 'owner', 'eng', 'ownership', 'intervention'];

export function DriverTable({ rows, cols, highlightId, caption }: { rows: DriverRow[]; cols: ColKey[]; highlightId?: string; caption: string }) {
  const [sort, setSort] = useState<{ key: ColKey; dir: 1 | -1 } | null>(null);
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const f = COLS[sort.key].sort!;
        const va = f(a);
        const vb = f(b);
        return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
      })
    : rows;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-[12.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-slate-50/70 text-left text-[11px] uppercase tracking-wide text-ink-3">
            {cols.map((c) => (
              <th key={c} scope="col" title={COLS[c].title} className={cx('px-2.5 py-2 align-bottom font-semibold leading-tight', COLS[c].numeric && 'text-right')}>
                <button
                  className={cx('inline-flex items-end gap-1 uppercase hover:text-ink', COLS[c].numeric && 'flex-row-reverse text-right')}
                  onClick={() => setSort((s) => ({ key: c, dir: s?.key === c && s.dir === -1 ? 1 : -1 }))}
                  aria-label={`Sort by ${COLS[c].label}`}
                >
                  {COLS[c].label}
                  <ArrowDownUp size={10} className={cx(sort?.key === c ? 'text-brand-600' : 'opacity-40')} aria-hidden />
                </button>
              </th>
            ))}
            <th className="w-8" aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const d = r.driver;
            const hl = d.id === highlightId;
            const pts = TRENDS[d.id].points.slice(-8).map((p) => p.contactRate);
            return (
              <tr
                key={d.id}
                onClick={() => go(`#/support/driver/${d.id}`)}
                className={cx('cursor-pointer border-b border-line transition-colors last:border-0', hl ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-slate-50')}
              >
                {cols.map((c) => (
                  <td key={c} className={cx('whitespace-nowrap px-2.5 py-2.5', COLS[c].numeric && 'text-right tabular-nums')}>
                    <Cell col={c} r={r} spark={pts} highlight={hl} />
                  </td>
                ))}
                <td className="pr-2 text-ink-3">
                  <a href={`#/support/driver/${d.id}`} onClick={(e) => e.stopPropagation()} aria-label={`Open ${d.label} details`} className="hover:text-brand-600">
                    <ChevronRight size={16} />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ col, r, spark, highlight }: { col: ColKey; r: DriverRow; spark: number[]; highlight: boolean }) {
  const d = r.driver;
  switch (col) {
    case 'driver':
      return (
        <div className="flex items-center gap-2">
          <span className={cx('font-semibold', highlight ? 'text-ink' : 'text-ink')}>{d.label}</span>
          {d.flags.includes('dismissed') && <Badge>Dismissed</Badge>}
          {d.flags.includes('monitoring') && <Badge>Monitoring</Badge>}
        </div>
      );
    case 'area':
      return <span className="text-ink-2">{d.productArea}</span>;
    case 'cases':
      return <>{fmtInt(r.cases)}</>;
    case 'rate':
      return (
        <span className="font-semibold text-ink" title={`per 10k ${d.populationLabel}`}>
          {fmtRate(r.contactRate)}
          {d.populationLabel !== 'active developers' && <span className="ml-1 text-[10px] font-normal text-ink-3">paid accts</span>}
        </span>
      );
    case 'trend':
      return (
        <span className="inline-flex items-center gap-2">
          <Sparkline values={spark} color={r.fourWeek > 5 ? SERIES.orange : SERIES.blue} width={48} height={18} />
          <span className={cx('w-10 font-medium', r.fourWeek > 5 ? 'text-warn-700' : r.fourWeek < -5 ? 'text-good-700' : 'text-ink-3')}>{fmtSigned(r.fourWeek)}</span>
        </span>
      );
    case 'wow':
      return <span className={r.wow > 3 ? 'text-warn-700' : r.wow < -3 ? 'text-good-700' : 'text-ink-2'}>{fmtSigned(r.wow, 1)}</span>;
    case 'mom':
      return <span className={r.mom > 5 ? 'text-warn-700' : r.mom < -5 ? 'text-good-700' : 'text-ink-2'}>{fmtSigned(r.mom)}</span>;
    case 'accounts':
      return <>{fmtInt(r.accounts)}</>;
    case 'cost':
      return <>{fmtMoney(r.cost)}</>;
    case 'ai':
      return <>{r.ai.toFixed(0)}%</>;
    case 'esc':
      return <>{r.esc.toFixed(0)}%</>;
    case 'recon':
      return <span className={r.recon >= 12 ? 'font-semibold text-warn-700' : ''}>{r.recon.toFixed(0)}%</span>;
    case 'coverage':
      return d.roadmapCoverage ? <span className="text-ink-2">{d.roadmapCoverage}</span> : <span className="text-warn-700">None</span>;
    case 'owner':
      return d.productOwner ? <span className="text-ink-2">{d.productOwner}</span> : <span className="text-ink-3">Unassigned</span>;
    case 'eng':
      return d.engineeringOwner ? <span className="text-ink-2">{d.engineeringOwner}</span> : <span className="text-ink-3">Unassigned</span>;
    case 'ownership':
      return <OwnershipBadge status={d.ownershipStatus} />;
    case 'intervention': {
      const i = INTERVENTION_LABEL[d.interventionStatus];
      return <Badge tone={i.tone}>{i.label}</Badge>;
    }
  }
}
