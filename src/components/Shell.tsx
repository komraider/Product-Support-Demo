import {
  BookOpen, Bot, CheckCircle2, Database, ExternalLink, FlaskConical, Info, LayoutDashboard, Linkedin, Menu, MessageSquareText,
  PlayCircle, RotateCcw, Search, Target, X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cx } from '../lib/format';
import { useStore } from '../store';
import { Button, Modal } from './ui';

export const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, route: '#/overview', step: '1' },
  { id: 'support', label: 'Support Intelligence', icon: Search, route: '#/support', step: '2' },
  { id: 'trust-lab', label: 'Agent Trust Lab', icon: FlaskConical, route: '#/trust-lab', step: '3' },
  { id: 'outcomes', label: 'Product Outcomes', icon: Target, route: '#/outcomes', step: '4' },
];

const SECONDARY = [
  { id: 'glossary', label: 'Metric glossary', icon: BookOpen, route: '#/glossary' },
  { id: 'data', label: 'Data model & sources', icon: Database, route: '#/data' },
];

export const AUTHOR = {
  name: 'Karen DeVore',
  website: 'https://www.karendevore.com',
  linkedin: 'https://www.linkedin.com/in/karen-devore',
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill="#0f1f3d" />
        <path d="M9 16a7 7 0 1 1 7 7" stroke="#2a78d6" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M16 23l-3-2.5M16 23l-2.6 2.8" stroke="#2a78d6" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill="white" />
      </svg>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-ink">Support Intelligence Loop</div>
        <div className="text-[11px] text-ink-3">Lattice API Platform</div>
      </div>
    </div>
  );
}

function NavList({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Workspaces" className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const Icon = n.icon;
        const on = active === n.id;
        return (
          <a
            key={n.id}
            href={n.route}
            onClick={onNavigate}
            aria-current={on ? 'page' : undefined}
            className={cx(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              on ? 'bg-brand-50 text-brand-700' : 'text-ink-2 hover:bg-slate-100 hover:text-ink',
            )}
          >
            <Icon size={17} aria-hidden />
            <span className="flex-1">{n.label}</span>
            <span className={cx('text-[10px] tabular-nums', on ? 'text-brand-600' : 'text-ink-3')}>{n.step}</span>
          </a>
        );
      })}
      <div className="my-2 border-t border-line" />
      {SECONDARY.map((n) => {
        const Icon = n.icon;
        const on = active === n.id;
        return (
          <a
            key={n.id}
            href={n.route}
            onClick={onNavigate}
            aria-current={on ? 'page' : undefined}
            className={cx('flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]', on ? 'bg-brand-50 text-brand-700' : 'text-ink-2 hover:bg-slate-100')}
          >
            <Icon size={15} aria-hidden />
            {n.label}
          </a>
        );
      })}
    </nav>
  );
}

function LoopDiagram() {
  const steps = ['Signals', 'Drivers', 'Agent', 'Evidence', 'Owner', 'Hypothesis', 'Delivery', 'Release', 'Outcome', 'Strategy'];
  return (
    <div className="rounded-md border border-line bg-slate-50 p-2.5">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">The loop</div>
      <ol className="flex flex-wrap gap-x-1 gap-y-0.5 text-[10.5px] text-ink-2">
        {steps.map((s, i) => (
          <li key={s} className="whitespace-nowrap">
            {s}
            {i < steps.length - 1 && <span className="text-ink-3"> →</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SyntheticDataBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-warn-50 px-2.5 py-1 text-[11px] font-semibold text-warn-700"
      title="All companies, people, cases and metrics in this application are fictional."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn-600" aria-hidden />
      Synthetic demonstration data
    </span>
  );
}

export function AppShell({ active, children }: { active: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [about, setAbout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const openAsk = useStore((s) => s.openAsk);
  const reset = useStore((s) => s.reset);
  const setTourStep = useStore((s) => s.setTourStep);

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-4">
      <NavList active={active} onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-3">
        <LoopDiagram />
        <div className="text-[11px] leading-relaxed text-ink-3">
          Built by{' '}
          <a href={AUTHOR.website} target="_blank" rel="noreferrer" className="font-medium text-ink-2 hover:text-brand-600">
            {AUTHOR.name}
          </a>
          <div className="mt-1 flex gap-3">
            <a href={AUTHOR.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-600">
              <ExternalLink size={11} aria-hidden /> Website
            </a>
            <a href={AUTHOR.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-600">
              <Linkedin size={11} aria-hidden /> LinkedIn
            </a>
            <button onClick={() => setAbout(true)} className="inline-flex items-center gap-1 hover:text-brand-600">
              <Info size={11} aria-hidden /> About
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-page">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-white px-3 pb-4 pt-4 lg:flex">
        <div className="mb-5 px-1">
          <Logo />
        </div>
        {sidebar()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-white px-3 pb-4 pt-4 shadow-pop">
            <div className="mb-5 flex items-center justify-between px-1">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            {sidebar(() => setMobileOpen(false))}
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
            <button className="rounded p-1.5 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu size={19} />
            </button>
            <div className="hidden flex-1 md:block" />
            <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
              <SyntheticDataBadge />
              <Button size="sm" variant="secondary" icon={<MessageSquareText size={14} />} onClick={() => openAsk()} className="hidden sm:inline-flex">
                Analyze Evidence
              </Button>
              <Button size="sm" variant="primary" icon={<PlayCircle size={14} />} onClick={() => setTourStep(0)} className="hidden sm:inline-flex">
                Guided demo
              </Button>
              <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setConfirmReset(true)} title="Reset demonstration state">
                <span className="hidden xl:inline">Reset</span>
              </Button>
            </div>
          </div>
          <nav aria-label="Workspaces (compact)" className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 lg:hidden">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={n.route}
                aria-current={active === n.id ? 'page' : undefined}
                className={cx('whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium', active === n.id ? 'bg-brand-50 text-brand-700' : 'text-ink-2')}
              >
                {n.label}
              </a>
            ))}
            <button onClick={() => openAsk()} className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-ink-2 sm:hidden">Analyze</button>
            <button onClick={() => setTourStep(0)} className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-brand-700 sm:hidden">Tour</button>
          </nav>
        </header>
        <main id="main" className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">{children}</main>
        <footer className="mx-auto max-w-[1400px] px-4 pb-8 text-[11px] text-ink-3 sm:px-6">
          Lattice API Platform is fictional. All data is synthetic and does not represent any real company, product or customer. AI outputs in
          this prototype are pre-authored and deterministic. No live model or external service is called.
        </footer>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the demonstration?"
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { reset(); setConfirmReset(false); window.location.hash = '#/overview'; }}>Reset demo</Button>
          </>
        }
      >
        Clears approvals, owner assignments, hypothesis edits and the decision log for this browser session.
      </Modal>

      <Modal open={about} onClose={() => setAbout(false)} title="About this prototype">
        <p>
          <strong className="text-ink">Support Intelligence Loop</strong> is a working product prototype showing how an AI support agent can be both a
          resolution engine and a product-quality sensor, and how support evidence becomes owned, measured product change.
        </p>
        <ul className="mt-3 space-y-1.5">
          {[
            'One synthetic dataset (fictional Lattice API Platform) shared across all four workspaces.',
            'Contact rates are normalized per 10,000 relevant active population, so hypergrowth does not hide or inflate trends.',
            'AI outputs are pre-authored to show the intended behavior: evidence, inference and uncertainty kept separate.',
            'Every consequential action requires explicit human approval and is written to a decision log.',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-good-600" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs">
          Designed and built by <strong className="text-ink">{AUTHOR.name}</strong>.{' '}
          <a className="text-brand-600 underline" href={AUTHOR.website} target="_blank" rel="noreferrer">karendevore.com</a> ·{' '}
          <a className="text-brand-600 underline" href={AUTHOR.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-3">
          <Bot size={13} aria-hidden /> Not affiliated with any real company. Synthetic demonstration data.
        </div>
      </Modal>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite" role="status">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-white px-3.5 py-3 shadow-pop',
            t.tone === 'success' ? 'border-green-200' : t.tone === 'warn' ? 'border-amber-200' : 'border-brand-100',
          )}
        >
          <CheckCircle2 size={17} className={cx('mt-0.5 shrink-0', t.tone === 'success' ? 'text-good-600' : t.tone === 'warn' ? 'text-warn-600' : 'text-brand-500')} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{t.title}</div>
            {t.body && <div className="mt-0.5 text-xs text-ink-2">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-ink-3 hover:bg-slate-100" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
