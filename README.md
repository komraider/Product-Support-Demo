# Support Intelligence Loop

**Resolve real support needs with AI. Eliminate avoidable ones with product fixes. Measure the difference.**

A working product prototype of a closed-loop system. It safely resolves today's support cases and identifies and validates the product changes that prevent tomorrow's.

> **Synthetic demonstration data.** "Lattice API Platform" is fictional. No real company, customer or product is represented. AI outputs in the app are pre-authored and deterministic. No live model or external service is called.

![Overview](docs/screenshots/overview.png)

## The argument

High-volume support should not be managed only as a cost center. Support interactions are evidence about product quality.

The demo is built around one contradiction:

> The AI agent verifies resolution for **81%** of API-key-management contacts, yet the normalized contact rate rose from **27 to 37 per 10,000 active developers (+31%)** after a Console release.

High AI resolution combined with a rising contact rate can mean the support operation is succeeding while the product is failing. Support automation reduces the cost of demand. Only product improvement can eliminate avoidable demand.

## What you can do in the app

| Workspace | What it shows |
|---|---|
| **1. Overview** | Headline KPIs, loop-health metrics (cases per user, drivers fixed at the root, time from first case to shipped fix, time to owner, first response time, CSAT), top support drivers, demand handled by AI, humans, self-service and product changes, and the ladder from deflection to resolution to verified resolution to demand elimination |
| **2. Support Intelligence** | A driver explorer with 15 filters and search, normalized contact rates, emerging-driver alerts, a **fix-first prioritization** with adjustable trade-offs (intake reduction, response time, cost, quality), and a full **API Key Management investigation**: 12-week trend with release and signal markers, segments, telemetry, Dynatrace and SolarWinds signals, representative cases, blast radius at detection, an AI summary that separates observation, correlation and inference, and an AI-drafted bug report (repro steps, proposed fix, owning team). Ends with a **product-opportunity drawer** that requires human approval |
| **3. Agent Trust Lab** | Nine scenarios, including billing/fraud escalation, covering ANSWER, CLARIFY, RETRIEVE, USE TOOL, ESCALATE and REFUSE. Each shows simulated tool calls and results (secret key material is never returned), a structured escalation package, customer follow-up to confirm resolution, and an evaluation panel. Includes a what-if where escalation is the correct outcome |
| **4. Product Outcomes** | A lifecycle board (Proposed, In Development, Production & Measuring), roadmap traceability (objective → Jira Align epic → Azure DevOps feature → stories → release → measurement), dependency risk, and a validated **Usage Billing Transparency** outcome analysis |
| **Analyze Evidence** | Ten predefined questions. Each answer gives a direct response, cited evidence, inference, uncertainty, a next action, and exactly how it was produced (data queried and calculation steps) |

Use **Guided demo** in the header for a 12-step walkthrough. **Reset** clears all decisions for the session.

## Design decisions

- **Normalized contact rates.** Contact rate = contacts for a driver ÷ relevant active population × 10,000. Active developers grow 29% across the 12 weeks, and raw volume alone would mislead.
- **Deflection is not success.** Verified resolution, recontact, customer effort and demand elimination are measured separately. Lower AI case volume after a product fix is treated as a positive outcome.
- **Correlation is not causation.** Every AI statement is labelled as observation, evidence, correlation, inference, uncertainty or recommendation. Contradictory and missing evidence are shown next to the supporting evidence.
- **Human oversight.** Assigning owners, creating roadmap items, editing hypotheses, dismissing material trends and declaring outcomes all require explicit human action, and each is written to a decision log. A single case cannot create an epic. Alerts come from an aggregation rule.
- **Escalation is not failure.** The Trust Lab grades a correct escalation as a pass.
- **Deterministic AI.** Outputs are pre-authored so every visitor sees the intended behavior, and no API keys live in a public static site.

## Architecture

- React 18 + TypeScript + Tailwind CSS + Recharts + Lucide icons, built with Vite. No backend.
- `src/data/`: the normalized model (23 entity types), seeded synthetic generators and mock source adapters (ServiceNow, Dynatrace, SolarWinds, Azure DevOps, Jira Align, agent logs). Swapping a mock for a real client changes only the adapter.
- `src/store.ts`: session state (Zustand, persisted to `sessionStorage`).
- `scripts/check-data.ts`: verifies that the dataset reproduces every headline number (127,842 cases, 46 per 10k, 61% / 27% / 8%, and the API-key story). It runs in CI before every deploy.

```bash
npm install
npm run dev          # local dev server
npm run check-data   # dataset consistency checks
npm run build        # production build in dist/
```

Pushes to `main` deploy to GitHub Pages through `.github/workflows/deploy.yml`.

## Screenshots

| | |
|---|---|
| ![Driver investigation](docs/screenshots/driver-investigation.png) | ![Agent Trust Lab](docs/screenshots/agent-trust-lab.png) |
| ![Lifecycle board](docs/screenshots/lifecycle-board.png) | ![Roadmap](docs/screenshots/roadmap.png) |

---

Designed and built by **Karen DeVore**: [karendevore.com](https://www.karendevore.com) · [LinkedIn](https://www.linkedin.com/in/karen-devore)

*The best support interaction is safely resolved. The best support problem is eliminated.*
