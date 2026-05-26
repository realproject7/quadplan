# QuadPlan — Product Proposal

> **Source:** Originally authored at `/Users/cho/Projects/docs/PROPOSAL-quadplan.md` (historical local path).
> **Canonical location:** [`docs/PROPOSAL-quadplan.md`](./PROPOSAL-quadplan.md) in this repository.
> **EPIC:** [#1](https://github.com/realproject7/quadplan/issues/1)

---

## Vision

QuadPlan is a narrow, pragmatic pivot of QuadWork for the **pre-development phase**: proposal writing, GitHub ticket creation, HTML design artifact creation, and two-reviewer planning review.

QuadPlan keeps QuadWork's local web dashboard, terminal orchestration, file-based chat, GitHub CLI integration, project sidebar, and dense operator-console UI. It replaces the implementation-focused agent model with a planning-focused team.

---

## Product Shape

- **Home** has a global Butler agent for new project intake and proposal creation.
- Each **project** has HEAD, RE1, and RE2 agents.
- There is **no DEV agent** in MVP; HEAD performs planning work and coordinates review.
- QuadPlan uses a **distinct neon pink / magenta identity** instead of QuadWork green.
- **Planning Loop / Queue Runner** remains in MVP so queued planning work can continue automatically.

---

## Agent Model

| Agent | Role | Authority |
|-------|------|-----------|
| Butler | Global intake, proposal creation, project setup | Intake + handoff |
| HEAD | Project lead + planning worker | Artifact production |
| RE1 | Independent reviewer 1 | VETO (design/planning) |
| RE2 | Independent reviewer 2 | VETO (design/planning) |

- HEAD is both project lead and artifact producer (no separate DEV).
- RE1 and RE2 review independently; both approvals required.
- Model configuration supports per-agent CLI/model choices (e.g., RE1 = Claude, RE2 = Codex).

---

## Planning Artifact Types

| Type | Description |
|------|-------------|
| `proposal` | Full project proposal document |
| `proposal_revision` | Revised proposal after review |
| `ticket` | Single GitHub issue/ticket |
| `ticket_batch` | Group of related tickets |
| `design_html` | HTML design artifact for browser review |
| `doc` | Supporting documentation |
| `research_note` | Research or investigation notes |
| `handoff_package` | Complete handoff for implementation |

### Artifact Statuses

`queued` > `drafting` > `ready_for_review` > `re1_changes_requested` / `re2_changes_requested` > `approved_by_re1` / `approved_by_re2` > `approved` > `done`

---

## Identity and Design

- **Accent color:** Neon pink / magenta (`#ff2bd6`)
- **Dim accent:** `#c918a8`
- **Soft accent:** `rgba(255, 43, 214, 0.12)`
- **Border:** `#30242f` / `#5a2a52` (strong)
- **Typography:** Geist Mono, dark mode, sharp borders, dense tool-like layout
- **Logo direction:** QP monogram or quad-grid planning mark with neon pink active node

---

## MVP Phases

### Phase 0 — Foundation
Seed the repo from QuadWork baseline, commit proposal docs, update EPIC references.

### Phase 1 — Product Rename and Identity
Rename user-facing surfaces from QuadWork to QuadPlan. Change config namespace from `.quadwork` to `.quadplan`. Replace green accents with neon pink/magenta. Hide Telegram/Discord bridge UI. Create distinct QuadPlan icon/logo.

### Phase 2 — Agent Model Pivot
Replace QuadWork's 4-agent implementation model (Head/RE1/RE2/Dev) with QuadPlan's planning model (Butler + HEAD/RE1/RE2). Remove DEV requirement from all runtime paths. Add global Butler to Home.

### Phase 3 — Planning Artifact Queue
Replace PR/merge-centric batch progress with planning artifact progress based on `OVERNIGHT-QUEUE.md`. Parse artifact queue, track statuses, render Current Batch as artifact progress rows.

### Phase 4 — Planning Loop / Queue Runner
Adapt Scheduled Trigger into Planning Loop. Per-project on/off, configurable interval (5/10/15/30 min, default 10), pulse message to HEAD for queue processing. Keep loop guard protection.

### Phase 5 — Artifact Preview
Markdown preview for proposals/docs. Ticket batch summary preview. HTML design preview in safe iframe with "Open in browser" action. Path traversal protection.

### Phase 6 — GitHub Integration Rework
Emphasize GitHub issues over PRs. Support EPIC / phase EPIC / sub-ticket conventions. Ticket descriptions include purpose, scope, acceptance criteria, implementation notes, dependencies, and risk notes.

### Phase 7 — Agent Templates
Rewrite Butler, HEAD, RE1, RE2 templates for planning workflows. Butler drives intake-to-proposal. HEAD processes queue and produces artifacts. RE1/RE2 review tickets, proposals, docs, and HTML designs independently.

### Phase 8 — Setup and Config
Config path: `~/.quadplan/config.json`. Artifact workspace: `docs/PROPOSAL.md`, `artifacts/design`, `artifacts/tickets`, `artifacts/docs`. Support global Butler + per-project HEAD/RE1/RE2 configuration.

### Phase 9 — End-to-End QA Dogfood
Validate full planning loop: Butler intake > proposal > HEAD ticket batch > RE1/RE2 review > revision > approval > HTML design artifact > browser review > Planning Loop advances queue items autonomously.

---

## MVP Deliverables

- QuadPlan-branded fork/pivot from QuadWork
- Butler-first home surface
- Project dashboard with HEAD, RE1, RE2
- Planning artifact queue based on OVERNIGHT-QUEUE.md
- Artifact-oriented Current Batch panel
- Planning Loop / Queue Runner
- Markdown and HTML artifact preview
- GitHub issue-first ticket workflow
- Agent templates for Butler, HEAD, RE1, and RE2
- End-to-end dogfooding run from raw idea to reviewed tickets and reviewed HTML design

---

## Success Criteria

- User can create/open the QuadPlan app and immediately see a distinct QuadPlan identity.
- Butler can drive new project proposal creation.
- A project can run HEAD/RE1/RE2 without requiring DEV.
- HEAD can process queued planning artifacts.
- RE1 and RE2 can independently request changes or approve.
- Planning Loop can advance queued items without manual per-step triggering.
- GitHub tickets can be created and reviewed as development-ready planning artifacts.
- HTML design artifacts can be previewed and browser-reviewed.
- Telegram and Discord are not required for MVP workflows.

---

## Filesystem Layout

```
~/.quadplan/
  config.json                   # Global config (Butler + project registry)
  {project_id}/
    chat/                       # File-based agent chat
    OVERNIGHT-QUEUE.md          # Planning artifact queue
    history/                    # History snapshots
    progress-cache.json         # Batch progress cache

{project_repo}/
  docs/
    PROPOSAL.md                 # Project proposal
  artifacts/
    design/                     # HTML design artifacts
    tickets/                    # Ticket batch artifacts
    docs/                       # Supporting documents
```

---

## Out of Scope for MVP

- Telegram and Discord bridge integration
- DEV agent / code implementation workflows
- Complex overnight duration windows
- Mobile remote controls
- PR-centric batch progress
