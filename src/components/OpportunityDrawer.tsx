import { CheckCircle2, FilePen, History, Link2, Save, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  API_KEY_DEPENDENCIES, APP_HEALTH, CONTRADICTORY_EVIDENCE, CUSTOMER_STATEMENTS, DEFAULT_HYPOTHESIS, EVIDENCE, EXISTING_WORK, GUARDRAILS, INFRA,
  MISSING_EVIDENCE, OPPORTUNITY, PRIMARY_METRIC, PROBLEM_STATEMENT, RELEASE_INFO, SECONDARY_METRICS, TELEMETRY,
} from '../data/apiKey';
import { AGGREGATES } from '../data/drivers';
import { fmtInt, fmtMoney } from '../lib/format';
import { go } from '../lib/router';
import { useStore } from '../store';
import { DependencyStatusBadge } from './Dependencies';
import { AIGenerated, Badge, Button, ConfidenceIndicator, Drawer, HumanApprovalNote, KindTag, Modal, Section } from './ui';

const STATUS_LABEL = {
  unreviewed: ['AI draft · awaiting review', 'amber'],
  draft: ['Saved as draft', 'neutral'],
  more_evidence: ['More evidence requested', 'amber'],
  linked: ['Linked to existing epic (review)', 'blue'],
  approved: ['Approved · on roadmap', 'green'],
  rejected: ['Recommendation rejected', 'neutral'],
} as const;

export function OpportunityDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useStore((s) => s.opportunityStatus);
  const hypothesis = useStore((s) => s.hypothesis);
  const history = useStore((s) => s.hypothesisHistory);
  const setHypothesis = useStore((s) => s.setHypothesis);
  const approve = useStore((s) => s.approveOpportunity);
  const setStatus = useStore((s) => s.setOpportunityStatus);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const [draft, setDraft] = useState(hypothesis);
  const [confirm, setConfirm] = useState<null | 'approve' | 'reject' | 'link'>(null);
  const [rejectReason, setRejectReason] = useState('');
  const approved = status === 'approved';
  const a = AGGREGATES.api_key_management;

  useEffect(() => {
    if (open) setDraft(hypothesis);
  }, [open, hypothesis]);

  const edited = draft.trim() !== hypothesis.trim();
  const [label, tone] = STATUS_LABEL[status];

  const commitHypothesisIfEdited = () => {
    if (edited) {
      setHypothesis(draft.trim());
      log('Edited hypothesis', 'OPP-0192 hypothesis text changed by a human reviewer.');
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        wide
        title={<span className="flex flex-wrap items-center gap-2">{OPPORTUNITY.id} · {OPPORTUNITY.title} <Badge tone={tone}>{label}</Badge></span>}
        subtitle="Product opportunity package · API Key Management driver · evidence linked from alert EA-301"
        footer={
          approved ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-good-700"><CheckCircle2 size={16} /> Approved. {OPPORTUNITY.epicId} and {OPPORTUNITY.featureId} created.</span>
              <div className="flex gap-2">
                <Button onClick={() => { onClose(); go('#/outcomes/roadmap'); }}>View roadmap</Button>
                <Button variant="primary" onClick={() => { onClose(); go('#/outcomes'); }}>Open Product Outcomes</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <HumanApprovalNote>
                Approval assigns owners, creates a Jira Align epic and an Azure DevOps feature, and locks the baseline, hypothesis, target and guardrails to the roadmap item.
              </HumanApprovalNote>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="danger" icon={<XCircle size={14} />} onClick={() => setConfirm('reject')}>Reject Recommendation</Button>
                <Button icon={<Link2 size={14} />} onClick={() => setConfirm('link')}>Link Existing Epic</Button>
                <Button icon={<Search size={14} />} onClick={() => { commitHypothesisIfEdited(); setStatus('more_evidence', 'Requested more evidence for OPP-0192'); toast({ title: 'More evidence requested', body: 'Engineering and Analytics asked for the 5 missing-evidence items.', tone: 'info' }); }}>
                  Request More Evidence
                </Button>
                <Button icon={<Save size={14} />} onClick={() => { commitHypothesisIfEdited(); setStatus('draft', 'Saved OPP-0192 as draft'); toast({ title: 'Saved as draft', tone: 'info' }); }}>Save as Draft</Button>
                <Button variant="success" icon={<CheckCircle2 size={14} />} onClick={() => setConfirm('approve')}>Approve Opportunity</Button>
              </div>
            </div>
          )
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <AIGenerated label="AI-drafted package" />
            <ConfidenceIndicator level="moderate" />
            <span className="text-xs text-ink-3">Causal confidence: low · Intervention type: {OPPORTUNITY.interventionType}</span>
          </div>

          <Section title="Problem statement">
            <p className="text-sm text-ink">{PROBLEM_STATEMENT}</p>
          </Section>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['Baseline contact rate', '37 / 10k developers', 'Pre-release: 27'],
              ['Current trend', `+${a.fourWeekChange.toFixed(0)}%`, 'Four weeks'],
              ['Est. support cost', fmtMoney(a.annualCost), 'Annualized'],
              ['Affected population', fmtInt(a.affectedAccounts), 'Accounts, 28 days'],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-md border border-line bg-white px-3 py-2">
                <div className="text-[11px] text-ink-3">{k}</div>
                <div className="text-lg font-semibold tabular-nums text-ink">{v}</div>
                <div className="text-[11px] text-ink-3">{s}</div>
              </div>
            ))}
          </div>

          <Section title="Evidence summary">
            <ul className="space-y-1.5 rounded-md border border-line bg-white p-3">
              {EVIDENCE.filter((e) => e.supports === 'supports').map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-xs">
                  <KindTag kind={e.kind} />
                  <span><span className="font-medium text-ink">{e.title}.</span> <span className="text-ink-2">{e.detail}</span> <span className="text-ink-3">({e.source})</span></span>
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Representative cases">
              <ul className="space-y-1 text-xs text-ink-2">
                {CUSTOMER_STATEMENTS.map((s) => <li key={s.caseId}><span className="font-medium text-ink">{s.caseId}</span> “{s.text}”</li>)}
              </ul>
            </Section>
            <Section title="Product telemetry">
              <ul className="space-y-1 text-xs text-ink-2">
                {TELEMETRY.map((t) => <li key={t.id}>{t.metric}: <strong className="text-ink">{t.baseline} → {t.current}</strong></li>)}
              </ul>
            </Section>
            <Section title="Application-health signals (Dynatrace)">
              <ul className="space-y-1 text-xs text-ink-2">
                {APP_HEALTH.map((h) => <li key={h.id}>{h.service} {h.region}: {h.metric} <strong className="text-ink">{h.baseline} → {h.current}</strong></li>)}
              </ul>
            </Section>
            <Section title="Infrastructure signals (SolarWinds)">
              <ul className="space-y-1 text-xs text-ink-2">
                {INFRA.map((i) => <li key={i.id}>{i.component} {i.region}: {i.alert} · <strong className="text-ink">{i.status}</strong></li>)}
              </ul>
            </Section>
            <Section title="Release information">
              <p className="text-xs text-ink-2">{RELEASE_INFO.product} {RELEASE_INFO.version}, {RELEASE_INFO.date}: {RELEASE_INFO.changes.join('; ')}.</p>
            </Section>
            <Section title="Existing roadmap & engineering work">
              <p className="text-xs text-ink-2">{EXISTING_WORK.roadmap}</p>
              <p className="mt-1 text-xs text-ink-2">{EXISTING_WORK.engineering}</p>
            </Section>
          </div>

          <div className="grid gap-3 rounded-md border border-line bg-white p-3 sm:grid-cols-3">
            {[
              ['Suggested Product owner', OPPORTUNITY.suggestedProductOwner],
              ['Suggested Engineering team', OPPORTUNITY.suggestedEngineeringTeam],
              ['Suggested intervention type', OPPORTUNITY.interventionType],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] text-ink-3">{k}</div>
                <div className="text-sm font-semibold text-ink">{v}</div>
                <div className="text-[11px] text-ink-3">{approved ? 'Assigned by human approval' : 'Suggestion only'}</div>
              </div>
            ))}
          </div>

          <Section title="Hypothesis">
            <div className="rounded-md border border-brand-100 bg-white p-3">
              <label htmlFor="hyp" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink">
                <FilePen size={13} /> {approved ? 'Locked to roadmap item' : 'Editable. Changes are recorded in the decision log.'}
              </label>
              <textarea
                id="hyp"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                readOnly={approved}
                rows={4}
                className="w-full rounded-md border border-line px-3 py-2 text-sm leading-relaxed text-ink focus:border-brand-500 focus:outline-none read-only:bg-slate-50"
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-3">
                <span className="flex items-center gap-1">
                  <History size={12} /> {history.length ? `${history.length} prior version${history.length > 1 ? 's' : ''}` : 'Original AI draft'}
                  {edited && <Badge tone="amber" className="ml-1">Unsaved edit</Badge>}
                </span>
                {!approved && draft !== DEFAULT_HYPOTHESIS && (
                  <button className="text-brand-600 hover:underline" onClick={() => setDraft(DEFAULT_HYPOTHESIS)}>Restore original</button>
                )}
              </div>
            </div>
          </Section>

          <div className="grid gap-4 md:grid-cols-3">
            <Section title="Primary success metric">
              <p className="text-xs text-ink">{PRIMARY_METRIC}</p>
              <p className="mt-1 text-xs text-ink-2">Baseline 37 → target &lt; 24 within 30 days of release</p>
            </Section>
            <Section title="Secondary metrics">
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-ink-2">{SECONDARY_METRICS.map((m) => <li key={m}>{m}</li>)}</ul>
            </Section>
            <Section title="Guardrails">
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-ink-2">{GUARDRAILS.map((m) => <li key={m}>{m}</li>)}</ul>
            </Section>
          </div>

          <Section title="Dependencies (draft plan)">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {API_KEY_DEPENDENCIES.map((dep) => (
                <li key={dep.id} className="flex items-center justify-between gap-2 rounded border border-line bg-white px-2.5 py-1.5 text-xs">
                  <span className="text-ink">{dep.name}</span>
                  <DependencyStatusBadge status={dep.status} coordination={dep.coordinationRequired} />
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Contradictory evidence">
              <ul className="space-y-1.5 rounded-md border border-amber-200 bg-warn-50/50 p-3 text-xs">
                {CONTRADICTORY_EVIDENCE.map((e) => <li key={e.id}><span className="font-medium text-ink">{e.title}.</span> <span className="text-ink-2">{e.detail}</span></li>)}
              </ul>
            </Section>
            <Section title="Missing evidence">
              <ul className="list-disc space-y-1 rounded-md border border-line bg-white p-3 pl-7 text-xs text-ink-2">
                {MISSING_EVIDENCE.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </Section>
          </div>

          <div className="flex items-center justify-between rounded-md border border-line bg-white px-3 py-2.5">
            <span className="text-xs font-semibold text-ink">Evidence-confidence rating</span>
            <span className="flex items-center gap-3 text-xs text-ink-2">
              <ConfidenceIndicator level="moderate" label="Product friction" /> product friction
              <ConfidenceIndicator level="low" label="Release causality" /> release causality
            </span>
          </div>
        </div>
      </Drawer>

      <Modal
        open={confirm === 'approve'}
        onClose={() => setConfirm(null)}
        title="Approve OPP-0192 and create roadmap items?"
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant="success"
              icon={<CheckCircle2 size={14} />}
              onClick={() => {
                commitHypothesisIfEdited();
                approve();
                setConfirm(null);
                toast({ title: 'Opportunity approved', body: `Owners assigned. ${OPPORTUNITY.epicId} (Jira Align) and ${OPPORTUNITY.featureId} (Azure DevOps) created. Added to Product Outcomes.`, tone: 'success' });
              }}
            >
              Approve
            </Button>
          </>
        }
      >
        <p className="mb-2">As the accountable human reviewer, you are approving:</p>
        <ul className="space-y-1 text-xs">
          <li>• Product owner: <strong className="text-ink">Developer Platform</strong>; Engineering team: <strong className="text-ink">Identity Platform</strong></li>
          <li>• Jira Align portfolio epic <strong className="text-ink">{OPPORTUNITY.epicId}</strong> under “{OPPORTUNITY.objective}”</li>
          <li>• Azure DevOps feature <strong className="text-ink">{OPPORTUNITY.featureId}</strong> “{OPPORTUNITY.featureTitle}”</li>
          <li>• Locked: baseline 37 / 10k developers, target &lt; 24, 6 guardrails, {edited ? 'your edited' : 'the'} hypothesis</li>
        </ul>
        <p className="mt-3 text-xs text-ink-3">Approval is based on aggregated evidence from {fmtInt(AGGREGATES.api_key_management.cases28d)} cases, not on any single case.</p>
      </Modal>

      <Modal
        open={confirm === 'reject'}
        onClose={() => setConfirm(null)}
        title="Reject recommendation?"
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" disabled={rejectReason.trim().length < 8} onClick={() => { setStatus('rejected', `Rejected OPP-0192: ${rejectReason.trim()}`); setConfirm(null); toast({ title: 'Recommendation rejected', body: 'The driver remains unowned and the alert stays open.', tone: 'warn' }); }}>
              Reject
            </Button>
          </>
        }
      >
        <label className="block text-xs font-medium text-ink">Reason (required; recorded in the decision log)
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
      </Modal>

      <Modal
        open={confirm === 'link'}
        onClose={() => setConfirm(null)}
        title="Link an existing epic"
        footer={<Button onClick={() => setConfirm(null)}>Close</Button>}
      >
        <p>Searched Jira Align for epics covering key rotation, propagation or Console key management:</p>
        <ul className="mt-2 space-y-1.5 text-xs">
          <li className="rounded border border-line px-3 py-2"><strong className="text-ink">JA-EPIC-2981</strong> Developer Console navigation refresh: <span className="text-ink-3">partial overlap (key list layout only)</span></li>
          <li className="rounded border border-line px-3 py-2"><strong className="text-ink">JA-EPIC-3104</strong> Enterprise key policies: <span className="text-ink-3">no overlap (policy configuration)</span></li>
        </ul>
        <p className="mt-3 text-xs">No existing epic directly covers rotation-state or propagation visibility. Linking is not recommended; approve as a new opportunity or request more evidence.</p>
      </Modal>
    </>
  );
}
