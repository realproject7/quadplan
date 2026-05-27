# Planning Loop E2E Dogfood — Evidence

> Issue: #94 | Run date: 2026-05-27
>
> **Status: COMPLETE — real local QuadPlan run captured**

## Environment

| Field | Value |
|-------|-------|
| Machine | Operator MacBook local environment |
| Node version | `v24.14.1` |
| QuadPlan git SHA | `4177cb7` plus this PR's Planning Loop dispatcher fix |
| QuadPlan port | 8500 |
| QuadWork running | Yes, existing QuadWork server on `127.0.0.1:8400` |
| Config dir | `~/.quadplan` |
| Project ID | `dogfood-e2e` |
| Working dir | `/tmp/quadplan-dogfood` |
| Proposal | `/tmp/quadplan-dogfood/docs/PROPOSAL.md` |
| Queue | `/Users/cho/.quadplan/dogfood-e2e/OVERNIGHT-QUEUE.md` |
| Artifact dir | `/tmp/quadplan-dogfood/artifacts` |

## Server Start

```bash
cd /Users/cho/Projects/quadplan
node bin/quadplan.js start
```

The server reported:

```text
QuadPlan server listening on http://127.0.0.1:8500
[file-chat] Initialized project dogfood-e2e, next ID: 1, cached: 0 messages
```

## Agent Configuration

| Agent | Command | CWD | Auth verified |
|-------|---------|-----|---------------|
| HEAD | `/tmp/qp-bin/codex` wrapper around real `/opt/homebrew/bin/codex` | `/tmp/quadplan-dogfood-head` | Yes |
| RE1 | `claude` | `/tmp/quadplan-dogfood-re1` | Yes |
| RE2 | `claude` | `/tmp/quadplan-dogfood-re2` | Yes |

Confirmation:

- `claude -p 'Reply with exactly: CLAUDE_OK'` returned `CLAUDE_OK`.
- `codex exec --skip-git-repo-check 'Reply with exactly: CODEX_OK'` returned `CODEX_OK`.
- These were real authenticated CLI sessions, not `echo`, shell stubs, or mocked agents.
- Agent workdirs used a shared `artifacts` symlink to `/tmp/quadplan-dogfood/artifacts` so HEAD output and reviewer reads resolved to the same canonical artifact files.

## Controlled Proposal

The E2E used a deliberately small proposal so the run measured Planning Loop behavior rather than the full QuadPlan proposal's planning complexity:

```markdown
# Tiny Dogfood Project Proposal

## Goal
Build a small CLI habit tracker that lets a user add a habit and view a weekly summary.

## MVP Scope
- `habit add <name>` stores a habit in a local JSON file.
- `habit done <name>` marks today's completion.
- `habit week` prints a simple seven-day summary.

## Out of Scope
- Accounts, sync, mobile apps, notifications, and analytics dashboards.

## Required Planning Artifacts
1. A ticket batch with one EPIC and two sub-tickets.
2. A one-page design overview for a future dashboard view.

## Acceptance Standard
Artifacts must be concise, implementation-ready, and avoid over-engineering.
```

## Initial Queue Snapshot

```markdown
# Overnight Queue

## Active Batch

**Batch:** 1

### QP-001 — Draft tiny habit tracker ticket batch
- Type: ticket_batch
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: artifacts/tickets/batch-1.md

### QP-002 — Write tiny habit tracker design overview
- Type: doc
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: artifacts/docs/design-overview.md

## Backlog

(empty)

## Done

(none)
```

## Planning Loop Pulses

| Pulse # | Timestamp | Chat msg ID | Delivered to |
|---------|-----------|-------------|--------------|
| 1 | `2026-05-27T07:38:11.055Z` | 4 | HEAD |
| 2 | `2026-05-27T07:42:00.173Z` | 8 | HEAD |

Both pulses were emitted through the live QuadPlan server endpoint:

```bash
curl -X POST 'http://127.0.0.1:8500/api/planning-loop/pulse?project=dogfood-e2e'
```

## Chat Evidence

Key message IDs from `/Users/cho/.quadplan/dogfood-e2e/chat/general.jsonl`:

| ID | Sender | Evidence |
|----|--------|----------|
| 1 | system | `head joined` |
| 2 | system | `re1 joined` |
| 3 | system | `re2 joined` |
| 4 | system | First Planning Loop queue-check pulse to `@head` |
| 5 | head | QP-001 ready for review, `artifacts/tickets/batch-1.md` |
| 6 | re1 | QP-001 `APPROVE` |
| 7 | re2 | QP-001 `APPROVE` |
| 8 | system | Second Planning Loop queue-check pulse to `@head` |
| 9 | head | QP-002 ready for review, `artifacts/docs/design-overview.md` |
| 10 | re2 | QP-002 `APPROVE` |
| 11 | re1 | QP-002 `APPROVE` |
| 12 | head | Active Batch 1 complete; QP-001 and QP-002 moved to Done |

## Artifact Status Transitions

### Transition 1

| Field | Before | After |
|-------|--------|-------|
| Artifact | QP-001 ticket batch | QP-001 ticket batch |
| Status | `queued` | `in review` |
| Caused by | Pulse #1 woke HEAD | HEAD created `artifacts/tickets/batch-1.md` and requested review |
| Chat evidence | Msg 4 | Msg 5 |

### Transition 2

| Field | Before | After |
|-------|--------|-------|
| Artifact | QP-001 ticket batch | QP-001 ticket batch |
| Status | `in review` | `done` |
| Caused by | RE1/RE2 approved after HEAD review request | HEAD processed approvals on pulse #2 and moved item to Done |
| Chat evidence | Msg 6, 7 | Msg 12 |

### Transition 3

| Field | Before | After |
|-------|--------|-------|
| Artifact | QP-002 design overview | QP-002 design overview |
| Status | `queued` | `in review` |
| Caused by | Pulse #2 woke HEAD after QP-001 approvals | HEAD created `artifacts/docs/design-overview.md` and requested review |
| Chat evidence | Msg 8 | Msg 9 |

### Transition 4

| Field | Before | After |
|-------|--------|-------|
| Artifact | QP-002 design overview | QP-002 design overview |
| Status | `in review` | `done` |
| Caused by | RE1/RE2 approved QP-002 | HEAD moved both approved artifacts to Done |
| Chat evidence | Msg 10, 11 | Msg 12 |

## Artifact Outputs

Created by HEAD:

- `/tmp/quadplan-dogfood/artifacts/tickets/batch-1.md`
- `/tmp/quadplan-dogfood/artifacts/docs/design-overview.md`

Reviewer outcomes:

- QP-001: approved by RE1 and RE2.
- QP-002: approved by RE1 and RE2.

## Queue After Run

```markdown
# Overnight Queue

## Active Batch

**Batch:** 1

## Backlog

(empty)

## Done

### QP-001 — Draft tiny habit tracker ticket batch
- Type: ticket_batch
- Status: done
- Review: RE1 approved, RE2 approved
- Output: artifacts/tickets/batch-1.md

### QP-002 — Write tiny habit tracker design overview
- Type: doc
- Status: done
- Review: RE1 approved, RE2 approved
- Output: artifacts/docs/design-overview.md
```

## Failures / Friction

| # | Classification | Description | Resolved? |
|---|---------------|-------------|-----------|
| 1 | loop | Initial validation showed `/api/planning-loop/pulse` appended the queue-check message to file-chat but did not dispatch the appended record to PTY sessions, so HEAD was not woken by the pulse. This PR fixes that by returning the appended record from `sendPlanningPulse` and dispatching it in both manual pulse and timer paths. | Yes |
| 2 | environment | Codex with an explicit `gpt-5.1-codex-mini` model failed for this account. The run used Codex's default authenticated model instead. | Yes |
| 3 | environment | Some fresh CLI workdirs showed trust prompts. They were accepted for disposable dogfood workdirs before the run. | Yes |
| 4 | environment | Separate agent workdirs initially caused HEAD to write artifacts into its own local `artifacts` folder while reviewers checked the canonical artifact dir. The clean run used a shared artifact symlink across HEAD/RE1/RE2 workdirs. | Yes |
| 5 | agent prompt | Using the full QuadPlan proposal made HEAD generate a large ticket batch and slowed the E2E. The successful run used a controlled tiny proposal, which is appropriate for #94 because the acceptance target is Planning Loop behavior, not full product ticket coverage. | Yes |

Classification key:

- `loop` — Planning Loop timer, pulse delivery, or interval issues
- `queue parser` — OVERNIGHT-QUEUE.md parsing or status detection
- `agent prompt` — HEAD/RE1/RE2 prompt, AGENTS.md, or agent behavior
- `reviewer workflow` — Review routing, approval flow, or verdict handling
- `environment` — CLI auth, server startup, terminal, or session issues

## Verification Commands

```bash
npm test
npm run build
node --test server/planning-loop-pulse.test.js server/pty-dispatcher.test.js
```

Results:

- `npm test`: 106 passing.
- `npm run build`: successful Next static export build; existing export rewrites warning only.
- Focused pulse/dispatcher tests: passing.

## Conclusion

The Planning Loop E2E succeeded on a real local QuadPlan server with real authenticated HEAD/RE1/RE2 CLI sessions.

The run proved that:

- QuadPlan can run side-by-side with QuadWork (`8500` and `8400` respectively).
- Planning Loop pulses are written to file-chat and, after this PR's fix, delivered to the HEAD PTY session.
- HEAD can create planning artifacts from a queue pulse.
- RE1 and RE2 can independently review the created artifacts and approve them through chat.
- HEAD can process approvals and move approved artifacts to Done.

Issue #94's required evidence is satisfied by chat messages 4-12, the final queue snapshot, and the two created artifact files.
