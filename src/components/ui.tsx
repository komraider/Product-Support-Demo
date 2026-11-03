import { AlertTriangle, CheckCircle2, CircleDashed, Info, Sparkles, X, XCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cx } from '../lib/format';

export function Card({ children, className, as: As = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <As className={cx('rounded-lg border border-line bg-white shadow-card', className)}>{children}</As>;
}

export function CardHeader({ title, subtitle, right, id }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h2 id={id} className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, right }: { eyebrow?: string; title: string; description?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</div>}
        <h1 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-2">{description}</p>}
      </div>
      {right}
    </div>
  );
}

type Tone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'violet';
const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-ink-2 ring-slate-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-100',
  green: 'bg-good-50 text-good-700 ring-green-200',
  amber: 'bg-warn-50 text-warn-700 ring-amber-200',
  red: 'bg-bad-50 text-bad-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function Badge({ tone = 'neutral', children, icon, className, title }: { tone?: Tone; children: ReactNode; icon?: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: 'low' | 'moderate' | 'high' | 'critical' | 'green' | 'amber' | 'red' }) {
  const map = {
    low: ['green', 'Low risk'], green: ['green', 'Green'],
    moderate: ['amber', 'Moderate risk'], amber: ['amber', 'Amber'],
    high: ['red', 'High risk'], red: ['red', 'Red'], critical: ['red', 'Critical'],
  } as const;
  const [tone, label] = map[level];
  const Icon = tone === 'green' ? CheckCircle2 : AlertTriangle;
  return <Badge tone={tone} icon={<Icon size={12} aria-hidden />}>{label}</Badge>;
}

export function OwnershipBadge({ status, owner }: { status: 'owned' | 'unowned' | 'proposed'; owner?: string | null }) {
  if (status === 'owned') return <Badge tone="green" icon={<CheckCircle2 size={12} aria-hidden />}>Owned</Badge>;
  if (status === 'proposed') return <Badge tone="blue" icon={<CircleDashed size={12} aria-hidden />} title={owner ?? undefined}>Proposed</Badge>;
  return <Badge tone="amber" icon={<AlertTriangle size={12} aria-hidden />}>Unowned</Badge>;
}

export function ConfidenceIndicator({ level, label = 'Evidence confidence' }: { level: 'low' | 'moderate' | 'high'; label?: string }) {
  const n = level === 'low' ? 1 : level === 'moderate' ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2" aria-label={`${label}: ${level}`}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx('h-2.5 w-1.5 rounded-sm', i <= n ? (n === 1 ? 'bg-warn-600' : n === 2 ? 'bg-brand-500' : 'bg-good-600') : 'bg-slate-200')} />
        ))}
      </span>
      <span className="capitalize">{level}</span>
    </span>
  );
}

export function AIGenerated({ className, label = 'AI-generated' }: { className?: string; label?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200', className)}>
      <Sparkles size={11} aria-hidden />
      {label}
    </span>
  );
}

export const KIND_STYLE: Record<string, { tone: Tone; label: string }> = {
  observation: { tone: 'neutral', label: 'Observation' },
  evidence: { tone: 'blue', label: 'Evidence' },
  correlation: { tone: 'amber', label: 'Correlation' },
  inference: { tone: 'violet', label: 'Inference' },
  uncertainty: { tone: 'amber', label: 'Uncertainty' },
  recommendation: { tone: 'green', label: 'Recommendation' },
  verified_outcome: { tone: 'green', label: 'Verified outcome' },
};

export function KindTag({ kind }: { kind: string }) {
  const k = KIND_STYLE[kind] ?? KIND_STYLE.observation;
  return <Badge tone={k.tone} className="w-[104px] justify-center">{k.label}</Badge>;
}

export function Button({
  children, onClick, variant = 'secondary', size = 'md', icon, disabled, className, type = 'button', title,
}: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; size?: 'sm' | 'md';
  icon?: ReactNode; disabled?: boolean; className?: string; type?: 'button' | 'submit'; title?: string;
}) {
  const v = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 border-brand-500',
    secondary: 'bg-white text-ink border-line hover:bg-slate-50 hover:border-slate-300',
    ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-slate-100',
    danger: 'bg-white text-bad-700 border-red-200 hover:bg-bad-50',
    success: 'bg-good-600 text-white border-good-600 hover:bg-good-700',
  }[variant];
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        v,
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Tip({ text, children, wide }: { text: ReactNode; children?: ReactNode; wide?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center');
  const [below, setBelow] = useState(false);
  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const half = wide ? 170 : 130;
    setAlign(r.left < half ? 'left' : window.innerWidth - r.right < half ? 'right' : 'center');
    // Open downward when there is not enough room under the sticky header.
    setBelow(r.top < (wide ? 260 : 160));
  };
  const pos = cx(align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2', below ? 'top-full mt-1.5' : 'bottom-full mb-1.5');
  return (
    <span ref={ref} className="group relative inline-flex items-center" onMouseEnter={place} onFocus={place}>
      <button type="button" aria-describedby={id} className="inline-flex items-center rounded text-ink-3 hover:text-ink focus:text-ink">
        {children ?? <Info size={13} aria-label="How this is calculated" />}
      </button>
      <span
        role="tooltip"
        id={id}
        className={cx(
          'pointer-events-none absolute z-40 hidden rounded-md bg-ink px-3 py-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-white shadow-pop group-focus-within:block group-hover:block',
          wide ? 'w-[320px] max-w-[85vw]' : 'w-60',
          pos,
        )}
      >
        {text}
      </span>
    </span>
  );
}

/** Formula + actual inputs for a metric, shown in a tooltip or inline. */
export function CalcBody({ calc, light }: { calc: { formula: string; inputs: string[]; note?: string }; light?: boolean }) {
  return (
    <span className="block space-y-1">
      <span className={cx('block font-semibold', light ? 'text-ink' : 'text-white')}>{calc.formula}</span>
      {calc.inputs.map((i) => (
        <span key={i} className={cx('block tabular-nums', light ? 'text-ink-2' : 'text-slate-200')}>= {i}</span>
      ))}
      {calc.note && <span className={cx('block', light ? 'text-ink-3' : 'text-slate-300')}>{calc.note}</span>}
    </span>
  );
}

export function MetricCard({
  label, value, sub, tone, tip, onClick, highlight,
}: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'good' | 'warn' | 'bad'; tip?: ReactNode; onClick?: () => void; highlight?: boolean }) {
  return (
    <div className={cx('relative rounded-lg border bg-white px-4 py-3 text-left shadow-card', highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-line', onClick && 'transition hover:border-brand-500/50 hover:shadow-pop')}>
      {onClick && <button type="button" onClick={onClick} aria-label={`${label}: open details`} className="absolute inset-0 rounded-lg" />}
      <div className="pointer-events-none relative">
        <div className="flex items-center gap-1 text-xs font-medium text-ink-3">
          {label}
          {tip && <span className="pointer-events-auto"><Tip text={tip} wide={typeof tip !== 'string'} /></span>}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</div>
        {sub && (
          <div className={cx('mt-0.5 text-xs', tone === 'good' ? 'text-good-700' : tone === 'warn' ? 'text-warn-700' : tone === 'bad' ? 'text-bad-700' : 'text-ink-3')}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      <CircleDashed className="text-ink-3" size={22} aria-hidden />
      <div className="mt-2 text-sm font-semibold text-ink">{title}</div>
      {body && <p className="mt-1 max-w-md text-xs text-ink-2">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function EvalStatusBadge({ status }: { status: 'passed' | 'needs_review' | 'failed' | 'not_applicable' }) {
  if (status === 'passed') return <Badge tone="green" icon={<CheckCircle2 size={12} aria-hidden />}>Passed</Badge>;
  if (status === 'needs_review') return <Badge tone="amber" icon={<AlertTriangle size={12} aria-hidden />}>Needs review</Badge>;
  if (status === 'failed') return <Badge tone="red" icon={<XCircle size={12} aria-hidden />}>Failed</Badge>;
  return <Badge tone="neutral">Not applicable</Badge>;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Drawer({ open, onClose, title, subtitle, children, footer, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} className={cx('relative flex h-full w-full flex-col bg-page shadow-pop outline-none', wide ? 'max-w-4xl' : 'max-w-2xl')}>
        <div className="flex items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="text-base font-semibold text-ink">{title}</div>
            {subtitle && <div className="mt-0.5 text-xs text-ink-3">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-ink-3 hover:bg-slate-100 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div className="text-sm font-semibold text-ink">{title}</div>
          <button onClick={onClose} className="rounded p-1 text-ink-3 hover:bg-slate-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 text-sm text-ink-2">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function HumanApprovalNote({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children ?? 'Human approval required. The AI may recommend; you decide.'}</div>
    </div>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</h3>
      {children}
    </div>
  );
}

export function Delta({ value, goodWhen = 'down', digits = 0 }: { value: number; goodWhen?: 'down' | 'up'; digits?: number }) {
  const good = goodWhen === 'down' ? value < -0.5 : value > 0.5;
  const bad = goodWhen === 'down' ? value > 0.5 : value < -0.5;
  return (
    <span className={cx('tabular-nums font-medium', good ? 'text-good-700' : bad ? 'text-warn-700' : 'text-ink-3')}>
      {value > 0 ? '▲' : value < 0 ? '▼' : '•'} {Math.abs(value).toFixed(digits)}%
    </span>
  );
}
