> **Canonical location:** [`docs/PROPOSAL-quadplan.md`](https://github.com/realproject7/quadplan/blob/main/docs/PROPOSAL-quadplan.md) in this repository.
> **EPIC:** [#1](https://github.com/realproject7/quadplan/issues/1)
> **Historical source:** `/Users/cho/Projects/docs/PROPOSAL-quadplan.md`

# QuadPlan — MVP Product Proposal

> A local-first planning team for the pre-development phase: proposal writing, GitHub ticket creation, and HTML design review before work enters QuadWork.

**Date:** 2026-05-25  
**Author:** Cho / Codex  
**Status:** MVP proposal  
**Base product:** QuadWork  

---

## 1. Executive Summary

QuadPlan is a focused pivot of QuadWork for the work that happens before implementation. QuadWork coordinates a coding team through the GitHub issue to PR to review to merge loop. QuadPlan coordinates a planning team through the proposal to tickets to design artifacts to reviewer approval loop.

The MVP should reuse most of the current QuadWork codebase, interface, and local architecture. The main change is the agent team and the work unit. QuadWork has `HEAD / DEV / RE1 / RE2` and tracks implementation progress through GitHub issues and PRs. QuadPlan has `Butler / HEAD / RE1 / RE2` and tracks planning artifacts such as proposals, ticket batches, HTML design files, and supporting documents.

The goal is not to build a large new planning platform from scratch. The fastest path is to fork or pivot the current web-based QuadWork implementation and replace the implementation workflow with a pre-development planning workflow.

## 2. Product Goal

QuadPlan helps the operator turn a raw product idea into a development-ready project package:

1. A detailed `PROPOSAL.md` that is ready for engineering execution.
2. A GitHub repo for the project.
3. A QuadPlan project page for the planning team.
4. GitHub EPICs and sub-tickets generated from the proposal.
5. HTML-based design artifacts or Open Design based mockups.
6. Independent review by two reviewer agents before planning artifacts are treated as done.

The output of QuadPlan should be ready to hand off to QuadWork or another engineering execution system.

## 3. Problem

QuadWork is strong once a project has clear tickets and implementation scope. The weak point is everything before that:

- product ideas are discussed manually in ad hoc chats;
- proposals are not always written with enough implementation detail;
- GitHub issues can be too large, too vague, or disconnected from the original intent;
- design artifacts are often generated once and not reviewed deeply;
- review standards for planning artifacts are less formal than code review;
- the operator has to personally act as product manager, tech lead, designer, and reviewer.

QuadPlan solves this by giving the operator a dedicated AI planning team with the same visibility, terminal control, and reviewer discipline that QuadWork gives to implementation.

## 4. MVP Scope

### 4.1 In Scope

- Web-based local dashboard based on the existing QuadWork architecture.
- Home screen with a single global Butler agent.
- Per-project pages with HEAD, RE1, and RE2 agents.
- File-based chat and terminal orchestration.
- GitHub CLI integration for repo creation and issue creation.
- Planning queue based on `OVERNIGHT-QUEUE.md`.
- Simplified Planning Loop / Queue Runner that periodically wakes HEAD to continue queued planning work.
- Artifact-oriented current batch panel.
- Proposal, ticket, document, and HTML design artifact workflows.
- Reviewer request-changes / approve cycle for all planning artifacts.
- Open Design inspired design workflow and reviewer standards.
- Dense dark QuadWork-style interface with a distinct QuadPlan neon pink / magenta identity.

### 4.2 Out of Scope for MVP

- Telegram bridge.
- Discord bridge.
- DEV agent.
- PR merge automation.
- Cloud-hosted SaaS accounts, authentication, or team billing.
- A full Open Design clone inside QuadPlan.
- A Tauri desktop rewrite.

Telegram and Discord bridge code can remain internally if removing it slows the MVP, but the product surface should hide them for QuadPlan v1. QuadWork's implementation-oriented Scheduled Trigger should not be carried over as-is; QuadPlan MVP should include a renamed, simplified Planning Loop that wakes HEAD to advance the planning queue.

## 5. Relationship to QuadWork

QuadPlan should be built from the current `/Users/cho/Projects/quadwork` codebase, not from the older Tauri-oriented QuadPlan draft.

The current QuadWork stack is already a close fit:

- Next.js App Router frontend exported as static files.
- Express backend.
- `node-pty` terminal sessions.
- WebSocket terminal streaming.
- File-based chat.
- GitHub CLI based issue and PR reads.
- Project sidebar.
- Home dashboard.
- Per-project agent terminal grid.
- `OVERNIGHT-QUEUE.md` workflow.
- Dark, dense, monospace interface.

QuadPlan keeps the shell and replaces the workflow model.

### 5.1 Concept Mapping

| QuadWork | QuadPlan |
|---|---|
| Implementation team | Planning team |
| HEAD / DEV / RE1 / RE2 | Butler / HEAD / RE1 / RE2 |
| DEV writes code | HEAD writes planning artifacts |
| PR review | Artifact review |
| GitHub issue queue | Planning artifact queue |
| Current Batch tracks issue to PR to merge | Current Batch tracks artifact to review to approval |
| QuadWork handoff target is `main` | QuadPlan handoff target is development-ready project package |

## 6. Agent Model

### 6.1 Butler

The Butler is a single global agent on the home screen. It is the operator's entry point for new project creation.

Responsibilities:

- discuss new product ideas with the operator;
- ask clarifying questions until the idea is implementation-ready;
- draft a detailed `PROPOSAL.md`;
- revise the proposal until the operator accepts it;
- create a GitHub repository when requested;
- create/register the QuadPlan project page;
- seed the project workspace with initial proposal, artifact folders, and planning queue;
- hand the project to its per-project HEAD agent.

The Butler should behave similarly to the current Codex planning conversation: it should make the proposal detailed, phase-based, and ready for another agent to implement without needing product decisions.

### 6.2 HEAD

HEAD is the project lead and the main worker inside each QuadPlan project. Unlike QuadWork, there is no DEV agent in QuadPlan MVP. HEAD both manages the planning workflow and performs the actual planning work.

Responsibilities:

- read the project proposal and `OVERNIGHT-QUEUE.md`;
- list the pending planning tasks;
- select one reviewable unit at a time;
- create or revise GitHub EPICs and sub-tickets;
- create or revise HTML design artifacts;
- create or revise supporting docs;
- decide whether an artifact should be reviewed as a single item or as a phase-sized batch;
- request review from both RE1 and RE2;
- revise artifacts after request-changes feedback;
- mark items complete only after both reviewers approve.

HEAD has practical execution authority over planning artifacts, but not unilateral approval authority. Two reviewer approvals are still required for completion.

### 6.3 RE1 and RE2

RE1 and RE2 are independent planning reviewers for each project.

Responsibilities:

- review every proposal change, ticket batch, design artifact, and supporting document requested by HEAD;
- compare each artifact against the original proposal and product intent;
- request changes when scope, acceptance criteria, UX, design quality, or implementation readiness is weak;
- identify over-engineering, missing details, hidden dependencies, and ambiguous requirements;
- approve only when the artifact can safely move to development.

Reviewers should not rewrite the product direction arbitrarily. They should preserve the proposal's original intent and request changes only when the artifact fails that intent or creates avoidable implementation risk.

## 7. Core Workflows

### 7.1 New Project Creation

```text
Operator -> Butler: describes product idea
Butler -> Operator: asks clarifying questions
Butler: drafts detailed PROPOSAL.md
Operator + Butler: iterate until accepted
Butler: creates GitHub repo
Butler: creates QuadPlan project page
Butler: seeds proposal, queue, artifact workspace
Butler -> HEAD: hands off project context
```

The proposal must be more than a high-level product memo. It should include goals, audience, user workflows, technical assumptions, phase plan, acceptance criteria, risks, and handoff notes for ticket creation.

### 7.2 Ticket Creation

```text
HEAD: reads PROPOSAL.md and queue
HEAD: creates EPIC and linked sub-tickets in GitHub
HEAD -> RE1/RE2: requests review for one ticket or one phase
RE1/RE2: review against proposal intent
HEAD: revises tickets after feedback
RE1/RE2: approve when development-ready
HEAD: marks ticket batch done
```

Ticket review batches must stay small enough for meaningful review. HEAD should avoid dumping an entire large project into one review request unless the proposal is small.

### 7.3 HTML Design Artifact Creation

```text
HEAD: reads proposal and design brief
HEAD: uses Open Design references or direct HTML generation
HEAD: creates HTML artifact in project workspace
HEAD: opens/validates artifact locally
HEAD -> RE1/RE2: requests design review
RE1/RE2: open artifact in browser and test responsiveness
HEAD: revises after request changes
RE1/RE2: approve when design is fit for development handoff
```

HTML is the canonical MVP design artifact format. It can represent landing pages, app screens, dashboards, onboarding flows, decks, or static mockups.

### 7.4 Proposal Revision

```text
Operator or HEAD: identifies proposal change
HEAD: updates PROPOSAL.md
HEAD -> RE1/RE2: requests review
RE1/RE2: check consistency, completeness, and downstream ticket impact
HEAD: revises if needed
HEAD: updates queue/tickets if proposal changes affect them
```

Proposal changes should not silently invalidate tickets or design artifacts. HEAD must explicitly update downstream artifacts when proposal intent changes.

## 8. Planning Queue

QuadPlan keeps the `OVERNIGHT-QUEUE.md` concept because it is already central to QuadWork and familiar to the operator. The meaning changes from an implementation issue queue to a planning work queue.

Recommended queue sections:

```markdown
# Planning Queue — {{project_name}}

## Project Context

- Repo: `owner/repo`
- Proposal: `docs/PROPOSAL.md`
- Artifact workspace: `artifacts/`
- Design workspace: `artifacts/design/`
- Ticket workspace: GitHub Issues

## Current Batch: Batch 1 — Proposal to Tickets

### Phase 1 — EPIC structure

#### QP-001 — Create master EPIC
- Type: ticket
- Source: docs/PROPOSAL.md
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: GitHub issue URL

#### QP-002 — Create Phase 1 sub-tickets
- Type: ticket_batch
- Source: docs/PROPOSAL.md#phase-1
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: GitHub issue URLs

### Phase 2 — Design

#### QP-003 — Create initial dashboard HTML mockup
- Type: design_html
- Source: docs/PROPOSAL.md#dashboard
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: artifacts/design/dashboard-v1.html
```

### 8.1 Artifact Statuses

QuadPlan should treat these as first-class status values:

- `queued`
- `drafting`
- `ready_for_review`
- `re1_changes_requested`
- `re2_changes_requested`
- `approved_by_re1`
- `approved_by_re2`
- `approved`
- `done`

`approved` means both reviewers approved. `done` means HEAD has completed any final bookkeeping after approval.

### 8.2 Artifact Types

Initial artifact types:

- `proposal`
- `proposal_revision`
- `ticket`
- `ticket_batch`
- `design_html`
- `doc`
- `research_note`
- `handoff_package`

The UI should not need a complex database for MVP. It can parse queue markdown and optionally maintain a small JSON cache similar to QuadWork's current batch progress cache.

## 9. Planning Loop

QuadPlan should include a simplified autonomous loop in MVP. This is one of the core reasons to keep the QuadWork architecture instead of building a single-agent prototype: HEAD, RE1, and RE2 should be able to keep moving through queued planning work without the operator manually pressing every step.

This feature should be named **Planning Loop** or **Queue Runner**, not Scheduled Trigger. The name matters because the QuadWork Scheduled Trigger is implementation-oriented and tied to the issue to PR to merge loop. QuadPlan's loop is artifact-oriented and tied to the proposal to ticket to design to review workflow.

### 9.1 Loop Behavior

At a fixed interval, the Planning Loop sends a queue pulse into the project chat:

```text
@head Queue check. Continue the next QuadPlan planning item from OVERNIGHT-QUEUE.md.
```

HEAD then:

1. reads `OVERNIGHT-QUEUE.md`;
2. finds the next `queued`, `drafting`, or changes-requested item;
3. drafts or revises the relevant artifact;
4. requests review from both RE1 and RE2 when ready;
5. marks the item `done` only after both reviewers approve;
6. waits for the next pulse before taking the next item unless the user explicitly asks it to continue immediately.

The loop does not need complex calendar scheduling in MVP. It only needs enough automation to preserve QuadWork's queued-work advantage.

### 9.2 MVP Controls

Project-level controls:

- Planning Loop on/off.
- Interval selector: 5, 10, 15, or 30 minutes.
- "Send queue pulse now" button.
- Last pulse timestamp.
- Next pulse countdown.
- Running / paused / error state.
- Loop guard setting to prevent runaway agent hops.

Recommended default interval: 10 minutes.

### 9.3 Scope Boundary

Planning Loop is in scope. Telegram and Discord bridge automation remain out of scope.

The MVP should avoid overnight-run complexity such as duration windows, mobile bridge controls, and remote notifications. Those can return later once the planning artifact workflow is stable.

## 10. Dashboard UX

### 10.1 Visual Direction

QuadPlan should preserve QuadWork's dense operator-console layout while using a distinct neon pink / magenta identity. The visual distinction should make it immediately clear that QuadPlan is the planning, design, and review stage, while QuadWork remains the development and execution stage.

- dark mode only;
- Geist Mono or equivalent monospace font;
- sharp corners;
- thin borders;
- no decorative gradients;
- no marketing-style hero page;
- high information density;
- neon pink / magenta accent instead of QuadWork green;
- terminal-first feel.

The product should feel like an operations console for planning agents, not a SaaS landing page.

Recommended color tokens:

```css
--bg: #0a0a0a;
--bg-surface: #111111;
--text: #e8e2e8;
--text-muted: #8a7f8a;
--accent: #ff2bd6;
--accent-dim: #c918a8;
--accent-soft: rgba(255, 43, 214, 0.12);
--border: #30242f;
--border-strong: #5a2a52;
--warning: #ffcc00;
--error: #ff4d6d;
--success: #00ff88;
```

### 10.2 Logo Direction

QuadPlan should look related to QuadWork but not like a simple recolor. Recommended direction:

- Use a `QP` monogram or a quad-grid planning mark.
- Prefer a quad-grid mark with one neon pink active node to signal phases, artifacts, and review flow.
- Avoid reusing the exact QuadWork symbol with only a color swap.
- Keep the logo sharp, minimal, and readable at sidebar icon size.

### 10.3 Home Screen

Home is Butler-first.

Primary surfaces:

- Butler chat/terminal at the top of the home dashboard;
- project cards below or beside it;
- recent project activity;
- "New Project" action that routes into Butler rather than a purely manual setup wizard.

The Butler panel should be treated as the main product experience, not an optional CTA.

### 10.4 Project Screen

Recommended MVP layout:

```text
┌───────────────────────────────┬───────────────────────────────┐
│ Agent Primary Chat            │ Agent Terminals                │
│ Operator + HEAD + RE1 + RE2   │ HEAD / RE1 / RE2               │
│                               │ Artifact Preview or Review Log │
├───────────────────────────────┼───────────────────────────────┤
│ Planning Artifacts            │ Operator Features              │
│ Queue + Current Batch         │ Models / history / controls    │
│ GitHub Issues                 │                               │
└───────────────────────────────┴───────────────────────────────┘
```

The existing QuadWork terminal grid should be changed from four agents to three project agents. The former DEV area can be repurposed for an artifact preview/review surface.

### 10.5 Current Batch Panel

The Current Batch panel should no longer assume GitHub issue to PR to merge. It should show planning artifacts:

```text
Current Batch: Batch 1 — Proposal to Tickets (6 items)

QP-001  ████████████████████ 100% done
QP-002  ███████████░░░░░░░░░  55% RE1 changes requested
QP-003  ██████░░░░░░░░░░░░░░  30% drafting
QP-004  ░░░░░░░░░░░░░░░░░░░░   0% queued
```

Rows should link to the relevant artifact, GitHub issue, or local preview route when available.

### 10.6 Artifact Preview

MVP preview support:

- Markdown proposal preview.
- Markdown document preview.
- Ticket batch summary preview.
- HTML design preview in a sandboxed iframe or local file route.
- "Open in browser" action for reviewers.

The design review workflow requires browser validation, so HTML preview cannot be a second-class feature.

## 11. Technical Architecture

### 11.1 Stack

Keep the QuadWork stack:

- Frontend: Next.js App Router, TypeScript, static export.
- Backend: Node.js, Express.
- Terminals: `node-pty` and `xterm.js`.
- Realtime: WebSocket.
- Config: JSON under `~/.quadplan/config.json`.
- Project data: filesystem under `~/.quadplan/{project_id}/`.
- GitHub: `gh` CLI, no SDK required for MVP.
- Agents: local CLI commands such as Codex, Claude, Gemini.

### 11.2 Config Shape

Recommended MVP config:

```json
{
  "port": 8400,
  "operator_name": "user",
  "butler": {
    "enabled": true,
    "cwd": "/Users/cho/Projects/quadplan-butler",
    "command": "codex",
    "model": "gpt-5.5"
  },
  "projects": [
    {
      "id": "example",
      "name": "Example",
      "repo": "owner/example",
      "working_dir": "/Users/cho/Projects/example",
      "proposal_path": "/Users/cho/Projects/example/docs/PROPOSAL.md",
      "queue_path": "/Users/cho/.quadplan/example/OVERNIGHT-QUEUE.md",
      "artifact_dir": "/Users/cho/Projects/example/artifacts",
      "agents": {
        "head": {
          "cwd": "/Users/cho/Projects/example-head",
          "command": "codex"
        },
        "re1": {
          "cwd": "/Users/cho/Projects/example-re1",
          "command": "codex"
        },
        "re2": {
          "cwd": "/Users/cho/Projects/example-re2",
          "command": "claude"
        }
      }
    }
  ]
}
```

The config should not require a `dev` agent. Any remaining code paths that expect `dev` must be adapted or guarded.

### 11.3 Filesystem Layout

Recommended local layout:

```text
~/.quadplan/
├── config.json
├── butler/
│   └── history-snapshots/
└── {project_id}/
    ├── chat/
    ├── OVERNIGHT-QUEUE.md
    ├── artifact-progress-cache.json
    └── history-snapshots/

/Users/cho/Projects/{project}/
├── docs/
│   └── PROPOSAL.md
├── artifacts/
│   ├── design/
│   ├── tickets/
│   └── docs/
└── ...
```

The project repo should contain durable artifacts. QuadPlan runtime state should live under `~/.quadplan`.

### 11.4 Backend APIs

Reuse existing QuadWork APIs where possible, with renamed or adapted semantics.

Recommended additions or replacements:

- `GET /api/artifacts?project=:id`
- `GET /api/artifacts/:artifactId`
- `GET /api/artifact-preview?project=:id&path=:path`
- `GET /api/planning-progress?project=:id`
- `GET /api/queue?project=:id`
- `PUT /api/queue?project=:id`
- `POST /api/projects/from-butler`

Existing GitHub issue endpoints can remain for ticket verification. PR-centric endpoints can remain internally but should not drive the main QuadPlan UX.

## 12. GitHub Integration

GitHub remains the ticket system for development handoff.

HEAD should create:

- one master EPIC when appropriate;
- phase EPICs for larger projects;
- sub-tickets with clear scope and acceptance criteria;
- links back to proposal sections;
- dependencies and ordering notes;
- labels that make handoff to QuadWork obvious.

Ticket descriptions should include:

- purpose;
- scope;
- out of scope;
- acceptance criteria;
- implementation notes;
- dependencies;
- design/doc links if relevant;
- testing expectations;
- risk notes.

RE1 and RE2 review tickets as if a development agent will implement them exactly as written.

## 13. Open Design Integration

QuadPlan should use Open Design as a reference and optional design engine, not as a mandatory dependency for MVP.

Relevant ideas to borrow:

- skills as file-based design instructions;
- design systems as portable Markdown;
- craft references for typography, color, state coverage, accessibility, and anti-AI-slop checks;
- HTML artifacts as the reviewable output;
- browser preview and visual QA as required workflow;
- design direction selection before detailed rendering.

For MVP, HEAD can either:

1. use Open Design assets/references when available, or
2. directly generate standalone HTML files inside the project artifact folder.

The reviewer standard is more important than the generation method. Designs must be opened in a browser and checked at multiple widths before approval.

## 14. Agent Instructions

### 14.1 Butler Template Requirements

The Butler system prompt should include:

- You are the global QuadPlan intake and project-creation agent.
- Your job is to turn rough ideas into development-ready project proposals.
- Ask focused questions until the proposal can be implemented by another team.
- Write proposals as Markdown with clear phases and acceptance criteria.
- After operator approval, create the GitHub repo and QuadPlan project page.
- Seed `PROPOSAL.md`, `OVERNIGHT-QUEUE.md`, and artifact directories.
- Do not create implementation PRs.

### 14.2 HEAD Template Requirements

The HEAD system prompt should include:

- You are the project lead and planning worker.
- Read `PROPOSAL.md` before creating or changing artifacts.
- Work from `OVERNIGHT-QUEUE.md`.
- Take one reviewable item or phase at a time.
- Create tickets, proposal revisions, HTML designs, and docs.
- Request review from both RE1 and RE2.
- Do not mark work done until both approve.
- Keep review batches small enough for careful review.
- Preserve proposal intent unless the operator changes it.

### 14.3 Reviewer Template Requirements

The reviewer system prompt should include:

- You review planning artifacts, not code PRs.
- Always compare the artifact against `PROPOSAL.md`.
- For tickets, check whether a development agent could implement safely from the ticket alone.
- For designs, open the HTML in a browser and test responsiveness.
- Request changes for unclear scope, missing acceptance criteria, over-engineering, weak UX, broken layout, inaccessible UI, or proposal drift.
- Approve only when the artifact is development-ready.
- Send a clear verdict: `APPROVE` or `REQUEST_CHANGES`.

## 15. Review Formats

### 15.1 Ticket Review

```markdown
## Ticket Review: {{title}}

Verdict: APPROVE | REQUEST_CHANGES

### Summary
One short paragraph.

### Blocking Issues
- [MUST] ...

### Non-Blocking Notes
- [SHOULD] ...

### Proposal Alignment
- ...

### Development Readiness
- ...
```

### 15.2 Design Review

```markdown
## Design Review: {{artifact_path}}

Verdict: APPROVE | REQUEST_CHANGES

### Browser Validation
- Opened in browser: yes/no
- Widths checked: desktop / tablet / mobile
- Console errors: yes/no

### Layout and Responsiveness
- ...

### UX and Interaction
- ...

### Visual Quality
- ...

### Proposal Alignment
- ...

### Blocking Issues
- [MUST] ...
```

### 15.3 Proposal Review

```markdown
## Proposal Review: {{proposal_path}}

Verdict: APPROVE | REQUEST_CHANGES

### Completeness
- ...

### Phase Plan
- ...

### Engineering Handoff Readiness
- ...

### Risks and Missing Decisions
- ...
```

## 16. Implementation Phases

### Phase 1 — Product Rename and Surface Cleanup

- Fork or branch from current QuadWork.
- Rename user-facing product surfaces to QuadPlan.
- Change config directory from `.quadwork` to `.quadplan`.
- Hide Telegram and Discord bridge UI.
- Rename the Scheduled Trigger surface into a simplified Planning Loop / Queue Runner instead of removing queue automation.
- Keep the current dark interface and layout conventions, but replace QuadWork green accents with QuadPlan neon pink / magenta tokens.
- Create a distinct QuadPlan logo, preferably a `QP` monogram or quad-grid planning mark, rather than a simple recolor of the QuadWork logo.
- Confirm the app starts with existing project config migrated or reset.

### Phase 2 — Agent Model Pivot

- Remove `dev` from required project agents.
- Update terminal grid to HEAD, RE1, RE2.
- Make Butler first-class on Home.
- Update setup/project creation to create three project agents.
- Rewrite `AGENTS.md` and `CLAUDE.md` templates for QuadPlan roles.

### Phase 3 — Planning Queue and Artifact Progress

- Replace batch progress parser with planning artifact parser.
- Add status handling for QuadPlan artifact statuses.
- Add artifact progress rows and summaries.
- Keep links to GitHub issues where artifact type is ticket or ticket batch.
- Add tests for queue parsing and artifact progress.

### Phase 4 — Planning Loop / Queue Runner

- Adapt the current Scheduled Trigger implementation into a project-level Planning Loop.
- Send the standard queue pulse to `@head` at the selected interval.
- Add controls for on/off, interval, pulse-now, last pulse, next pulse, and loop state.
- Keep loop guard protection so agent chains cannot run indefinitely.
- Avoid Telegram/Discord/mobile controls in MVP.
- Add tests for pulse message generation and timer state.

### Phase 5 — Artifact Preview

- Add markdown preview for proposals and docs.
- Add HTML preview route for design artifacts.
- Add "Open in browser" action.
- Add file path safety checks so preview only serves configured project artifact/proposal paths.
- Add frontend states for missing, invalid, or unsupported artifacts.

### Phase 6 — GitHub Ticket Workflow

- Adapt GitHub panel to emphasize issues over PRs.
- Add ticket batch summaries.
- Preserve GitHub CLI caching and rate-limit protections.
- Update issue creation guidance in HEAD prompt.
- Add reviewer checklists for ticket readiness.

### Phase 7 — QA and Dogfooding

- Create a sample QuadPlan project.
- Use Butler to draft a real proposal.
- Use HEAD to create a small ticket batch.
- Have RE1/RE2 request changes and approve after revision.
- Create one HTML design artifact and complete browser-based review.
- Run the Planning Loop long enough to advance at least two queued artifacts without manual per-step button clicks.
- Fix UX friction before treating MVP as usable.

## 17. Test Plan

### 17.1 Unit Tests

- Config parsing supports Butler plus three project agents.
- Config parsing does not require `dev`.
- Planning queue parser extracts batch number, artifact IDs, types, statuses, review state, and output links.
- Artifact progress summarizer maps statuses to progress percentages.
- Legacy PR-centric batch parser is not used by QuadPlan Current Batch.
- Planning Loop pulse builder generates the standard `@head Queue check` message.
- Planning Loop timer state computes running, paused, last pulse, and next pulse consistently.

### 17.2 Backend Integration Tests

- Project creation seeds `PROPOSAL.md`, `OVERNIGHT-QUEUE.md`, and artifact directories.
- Butler status/start endpoints work independently of project agents.
- HEAD/RE1/RE2 terminal sessions spawn without DEV.
- GitHub issue list endpoint still works.
- Planning progress endpoint handles missing queue file gracefully.
- Artifact preview route rejects paths outside allowed project directories.
- Planning Loop sends queue pulses to project chat at the configured interval.
- Planning Loop can be manually pulsed without enabling Telegram, Discord, or external bridges.

### 17.3 Frontend Tests

- Home renders Butler as the primary surface.
- Project dashboard renders HEAD, RE1, and RE2 terminal states.
- Current Batch displays artifact statuses, not PR merge states.
- Project dashboard exposes Planning Loop controls and state.
- GitHub panel can show issues without requiring PRs.
- Removed MVP features do not appear in normal QuadPlan UI.
- Mobile view does not overlap core chat, queue, or preview controls.

### 17.4 Manual Acceptance Tests

- Butler can take a rough idea and produce a detailed proposal.
- Butler can create/register a project workspace.
- HEAD can create GitHub tickets from the proposal.
- RE1 and RE2 can independently request changes.
- HEAD can revise and obtain both approvals.
- HEAD can create an HTML design artifact.
- Reviewers can open the design in a browser, test responsiveness, and approve.
- Planning Loop can advance at least two queued planning artifacts without the operator manually triggering each step.

## 18. Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Existing QuadWork code assumes a DEV agent | High | Audit terminal grid, setup, config, agent state, and batch progress paths early. Add tests for three-agent projects. |
| Batch progress is too GitHub PR-specific | High | Introduce separate planning progress parser instead of overloading PR logic. |
| Butler becomes a loose chat instead of a project creator | Medium | Give Butler strict proposal and project creation checklist. |
| Review batches become too large | Medium | HEAD prompt must require small review units by default. |
| Design review is superficial | Medium | Require browser validation and width checks in reviewer prompt and review format. |
| Planning Loop causes runaway or noisy agent chains | Medium | Keep loop guard, pulse interval controls, and a simple standard pulse message. Default to 10 minutes. |
| Open Design integration becomes too large for MVP | Medium | Treat Open Design as guidance/reference first, not a hard dependency. |
| Product rename causes package/release churn | Low | Rename user-facing MVP surfaces first; package publishing details can follow. |

## 19. MVP Success Criteria

QuadPlan MVP is successful when:

- the operator can start at Home with Butler and create a new project proposal;
- the project appears in the QuadPlan sidebar;
- the project page has HEAD, RE1, and RE2 running;
- HEAD can turn the proposal into GitHub EPICs and sub-tickets;
- RE1 and RE2 can review and approve ticket batches;
- HEAD can create an HTML design artifact;
- reviewers can validate the design in a browser before approval;
- the Current Batch panel accurately shows planning artifact progress;
- Planning Loop can keep the queue moving through HEAD and the reviewers;
- no MVP workflow depends on Telegram, Discord, or DEV.

## 20. Recommended First Build Target

The first build should avoid broad refactors. The highest-leverage target is:

1. create a QuadPlan branch/fork from QuadWork;
2. rename the product shell;
3. hide excluded MVP features;
4. remove DEV as a required agent;
5. add planning queue progress;
6. adapt Scheduled Trigger into the QuadPlan Planning Loop;
7. rewrite agent templates;
8. dogfood one new project from Butler to reviewed tickets and one reviewed HTML design.

This produces a usable QuadPlan faster than designing a new app architecture.

## 21. Final Recommendation

Build QuadPlan as a narrow, pragmatic QuadWork pivot. Keep the proven local web dashboard, terminal orchestration, file-based chat, GitHub CLI workflow, and dense operator UI. Change the team shape and the work unit.

QuadWork is the implementation team. QuadPlan is the planning team. The two products should feel like adjacent stages of the same operating system: QuadPlan prepares the work, QuadWork ships it.
