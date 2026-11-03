import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { TimelineMarker } from '../data/apiKey';
import { cx, fmtInt } from '../lib/format';

// Categorical palette (validated reference order): blue, orange, aqua, yellow, magenta, green, violet.
export const SERIES = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
  yellow: '#eda100',
  violet: '#6250d6',
  gray: '#aab2bf',
};
const AXIS = { fontSize: 11, fill: '#64708a' };
const GRID = '#eef1f5';

function TooltipBox({ active, payload, label, unit }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-xs shadow-pop">
      <div className="mb-1 font-semibold text-ink">Week of {label}</div>
      {rows.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium tabular-nums text-ink">
            {typeof p.value === 'number' ? (unit === '%' ? `${p.value.toFixed(0)}%` : unit === 'rate' ? p.value.toFixed(1) : fmtInt(p.value)) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ values, color = SERIES.blue, width = 84, height = 24 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (width - 4) + 2},${height - 3 - ((v - min) / span) * (height - 6)}`);
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} stroke="white" strokeWidth={1.5} />
    </svg>
  );
}

export interface DemandRow {
  label: string;
  ai: number;
  human: number;
  selfService: number;
  unverified: number;
  eliminated: number;
}

export function DemandChart({ data }: { data: DemandRow[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="22%">
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#e9e6fb" />
              <line x1="0" y1="0" x2="0" y2="6" stroke={SERIES.violet} strokeWidth="2.5" />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d5dae3' }} interval="preserveStartEnd" />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(15,31,61,0.04)' }} />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} formatter={(v) => <span style={{ color: '#3d4a63' }}>{v}</span>} />
          <Bar isAnimationActive={false} dataKey="ai" name="Resolved by AI (verified)" stackId="a" fill={SERIES.blue} stroke="#fff" strokeWidth={1} />
          <Bar isAnimationActive={false} dataKey="human" name="Resolved by humans" stackId="a" fill={SERIES.orange} stroke="#fff" strokeWidth={1} />
          <Bar isAnimationActive={false} dataKey="unverified" name="Unverified / unresolved" stackId="a" fill={SERIES.gray} stroke="#fff" strokeWidth={1} />
          <Bar isAnimationActive={false} dataKey="selfService" name="Self-service (help center)" stackId="a" fill={SERIES.aqua} stroke="#fff" strokeWidth={1} />
          <Bar isAnimationActive={false} dataKey="eliminated" name="Eliminated by product changes" stackId="a" fill="url(#hatch)" stroke={SERIES.violet} strokeWidth={1} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface TrendRow {
  label: string;
  cases: number | null;
  contactRate: number | null;
  verifiedAiResolution: number | null;
  humanEscalation: number | null;
  recontact7d: number | null;
}

export type SeriesKey = 'cases' | 'contactRate' | 'verifiedAiResolution' | 'humanEscalation' | 'recontact7d';

export const SERIES_META: Record<SeriesKey, { label: string; color: string; unit: string }> = {
  cases: { label: 'Raw case volume', color: SERIES.gray, unit: 'cases' },
  contactRate: { label: 'Contact rate / 10k', color: SERIES.blue, unit: 'rate' },
  verifiedAiResolution: { label: 'Verified AI resolution', color: SERIES.aqua, unit: '%' },
  humanEscalation: { label: 'Human escalation', color: SERIES.orange, unit: '%' },
  recontact7d: { label: '7-day recontact', color: SERIES.violet, unit: '%' },
};

function markerLines(markers: TimelineMarker[], labels: string[], numbered: Map<string, number>) {
  const byWeek = new Map<number, TimelineMarker[]>();
  for (const m of markers) byWeek.set(m.week, [...(byWeek.get(m.week) ?? []), m]);
  return [...byWeek.entries()]
    .filter(([w]) => labels[w] !== undefined)
    .map(([w, ms]) => (
      <ReferenceLine
        key={w}
        x={labels[w]}
        stroke={ms.some((m) => m.kind === 'planned') ? SERIES.aqua : '#8792a8'}
        strokeDasharray="3 3"
        label={{ value: ms.map((m) => numbered.get(m.id)).join('·'), position: 'insideTopLeft', fontSize: 10, fill: '#3d4a63', fontWeight: 600 }}
      />
    ));
}

export function DriverTrendCharts({
  rows, visible, markers, numbered, target, baseline, populationLabel = 'active developers',
}: {
  rows: TrendRow[]; visible: Record<SeriesKey, boolean>; markers: TimelineMarker[]; numbered: Map<string, number>; target?: number; baseline?: number; populationLabel?: string;
}) {
  const labels = rows.map((r) => r.label);
  const pctKeys = (['verifiedAiResolution', 'humanEscalation', 'recontact7d'] as SeriesKey[]).filter((k) => visible[k]);
  const futureStart = rows.findIndex((r) => r.contactRate === null);
  const future = futureStart > -1 ? [labels[futureStart], labels[labels.length - 1]] : null;
  return (
    <div className="grid gap-4">
      {visible.contactRate && (
        <ChartPanel title={`Contact rate per 10,000 ${populationLabel}`} note="28-day rate · one axis">
          <LineChart data={rows} margin={{ top: 16, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            {future && <ReferenceArea x1={future[0]} x2={future[1]} fill="#f4f6f9" fillOpacity={1} label={{ value: 'Planned', position: 'insideTop', fontSize: 10, fill: '#64708a' }} />}
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d5dae3' }} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 45]} />
            <Tooltip content={<TooltipBox unit="rate" />} />
            {markerLines(markers, labels, numbered)}
            {baseline !== undefined && <ReferenceLine y={baseline} stroke="#8792a8" strokeDasharray="2 4" label={{ value: `Baseline ${baseline}`, position: 'insideBottomLeft', fontSize: 10, fill: '#64708a' }} />}
            {target !== undefined && <ReferenceLine y={target} stroke={SERIES.aqua} strokeDasharray="5 4" label={{ value: `Target < ${target}`, position: 'insideBottomRight', fontSize: 10, fill: '#146536' }} />}
            <Line isAnimationActive={false} type="monotone" dataKey="contactRate" name="Contact rate / 10k" stroke={SERIES.blue} strokeWidth={2} dot={{ r: 3, fill: SERIES.blue, stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 5 }} connectNulls={false} />
          </LineChart>
        </ChartPanel>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {visible.cases && (
          <ChartPanel title="Raw support-case volume" note="Weekly cases">
            <BarChart data={rows} margin={{ top: 16, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d5dae3' }} interval="preserveStartEnd" />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(15,31,61,0.04)' }} />
              {markerLines(markers, labels, numbered)}
              <Bar isAnimationActive={false} dataKey="cases" name="Cases" fill={SERIES.gray} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartPanel>
        )}
        {pctKeys.length > 0 && (
          <ChartPanel title="Agent quality rates" note="Percent of driver contacts">
            <LineChart data={rows} margin={{ top: 16, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d5dae3' }} interval="preserveStartEnd" />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<TooltipBox unit="%" />} />
              {markerLines(markers, labels, numbered)}
              {pctKeys.map((k) => (
                <Line isAnimationActive={false} key={k} type="monotone" dataKey={k} name={SERIES_META[k].label} stroke={SERIES_META[k].color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: '#3d4a63' }}>{v}</span>} />
            </LineChart>
          </ChartPanel>
        )}
      </div>
    </div>
  );
}

function ChartPanel({ title, note, children }: { title: string; note?: string; children: React.ReactElement }) {
  return (
    <figure className="rounded-md border border-line bg-white p-3">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-ink">{title}</span>
        {note && <span className="text-[11px] text-ink-3">{note}</span>}
      </figcaption>
      <div className="h-[220px] w-full">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </figure>
  );
}

export function HBar({ label, value, max = 100, display, sub, color = SERIES.blue, emphasize }: { label: string; value: number; max?: number; display?: string; sub?: string; color?: string; emphasize?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-2 py-1 text-xs">
      <span className={cx('truncate', emphasize ? 'font-semibold text-ink' : 'text-ink-2')} title={label}>{label}</span>
      <span className="h-2.5 overflow-hidden rounded-sm bg-slate-100" aria-hidden>
        <span className="block h-full rounded-sm" style={{ width: `${Math.max(2, (value / max) * 100)}%`, background: color }} />
      </span>
      <span className="min-w-[88px] whitespace-nowrap text-right tabular-nums text-ink">
        {display ?? `${value}%`}
        {sub && <span className="ml-1 text-ink-3">{sub}</span>}
      </span>
    </div>
  );
}
