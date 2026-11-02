import { CalcBody, Card, CardHeader, PageHeader } from '../components/ui';
import { API_KEY_CALCS, OVERVIEW_CALCS } from '../data/calculations';
import { GLOSSARY, LADDER } from '../data/glossary';

export function Glossary() {
  const groups = ['Rates', 'Resolution', 'Product'] as const;
  return (
    <>
      <PageHeader eyebrow="Reference" title="Metric glossary" description="Shared definitions and the calculation behind every headline number." />
      <Card className="mb-5">
        <CardHeader title="Resolution is a ladder" subtitle="Each step is stronger evidence of value than the one before." />
        <ol className="grid gap-px bg-line sm:grid-cols-4">
          {LADDER.map((l, i) => (
            <li key={l.term} className="bg-white p-4">
              <div className="text-[11px] font-semibold text-ink-3">Step {i + 1}</div>
              <div className="text-sm font-semibold text-ink">{l.term}</div>
              <p className="mt-1 text-xs text-ink-2">{l.definition}</p>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        {[
          { title: 'How the Overview numbers are calculated', calcs: OVERVIEW_CALCS },
          { title: 'How the API Key Management numbers are calculated', calcs: API_KEY_CALCS },
        ].map((g) => (
          <Card key={g.title}>
            <CardHeader title={g.title} subtitle="Formula, then the actual inputs from the synthetic dataset" />
            <dl className="divide-y divide-line">
              {g.calcs.map((c) => (
                <div key={c.id} className="px-4 py-3 text-xs">
                  <dt className="flex items-baseline justify-between gap-3">
                    <span className="font-bold uppercase tracking-wide text-ink">{c.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-ink">{c.value}</span>
                  </dt>
                  <dd className="mt-1"><CalcBody calc={c} light /></dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g}>
            <CardHeader title={g} />
            <dl className="divide-y divide-line">
              {GLOSSARY.filter((x) => x.group === g).map((x) => (
                <div key={x.term} className="px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink">{x.term}</dt>
                  <dd className="mt-1 text-sm text-ink-2">{x.definition}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}
