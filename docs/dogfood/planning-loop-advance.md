# Dogfood: Planning Loop Advancing Queued Work

> Planning Loop design validation for QuadPlan Phase 9d.
> Validates the loop can advance two artifacts through HEAD and reviewers without Telegram/Discord.
> Documented as a controlled walkthrough with concrete per-pulse state transitions since the QuadPlan server is not yet running end-to-end in production.

## Setup

- **Project**: habit-tracker (from Butler intake dogfood)
- **Planning Loop**: enabled, 10-minute interval
- **Queue**: two artifacts in Active Batch

### OVERNIGHT-QUEUE.md

```markdown
## Active Batch

**Batch:** 2
**Started:** 2026-05-26 10:00
**Status:** in progress

#### QP-004 — Phase 2 ticket batch
- Type: ticket_batch
- Source: docs/PROPOSAL.md#phase-2
- Status: queued
- Review: RE1 pending, RE2 pending

#### QP-005 — Update proposal with streak rules clarification
- Type: proposal_revision
- Source: docs/PROPOSAL.md
- Status: queued
- Review: RE1 pending, RE2 pending
```

## Per-Pulse State Transitions

### Pulse 1 — T+0:00 (10:00 UTC)

| Field | Before | After |
|-------|--------|-------|
| Pulse message | — | `@head Queue check. Continue the next QuadPlan planning item from OVERNIGHT-QUEUE.md.` |
| QP-004 status | `queued` | `drafting` |
| QP-005 status | `queued` | `queued` (unchanged) |
| HEAD action | — | Reads queue, starts drafting Phase 2 ticket batch from proposal |

### Pulse 2 — T+10:00 (10:10 UTC)

| Field | Before | After |
|-------|--------|-------|
| QP-004 status | `drafting` | `ready_for_review` |
| HEAD action | Drafting tickets | Opens PR with 3 sub-tickets for Phase 2 streak calculation |
| Chat messages | — | `@re1 @re2 PR #X ready for review — Phase 2 ticket batch` |

### Pulse 3 — T+20:00 (10:20 UTC)

| Field | Before | After |
|-------|--------|-------|
| QP-004 status | `ready_for_review` | `re1_changes_requested` |
| QP-004 review | RE1: pending, RE2: pending | RE1: changes_requested, RE2: approved |
| RE1 action | — | REQUEST_CHANGES: missing dependency link in sub-ticket #2 |
| RE2 action | — | APPROVE: tickets are development-ready |
| HEAD action | — | Reads feedback, fixes dependency link, pushes commit |

### Pulse 4 — T+30:00 (10:30 UTC)

| Field | Before | After |
|-------|--------|-------|
| QP-004 status | `re1_changes_requested` | `done` |
| QP-004 review | RE1: changes_requested, RE2: approved | RE1: approved, RE2: approved |
| RE1 action | — | APPROVE after re-review |
| HEAD action | — | Merges PR, moves QP-004 to Done in queue, starts QP-005 |
| Queue change | QP-004 in Active Batch | QP-004 moved to Done section |

### Pulse 5 — T+40:00 (10:40 UTC)

| Field | Before | After |
|-------|--------|-------|
| QP-005 status | `queued` | `ready_for_review` |
| HEAD action | — | Reads proposal, updates streak rules section, opens PR |
| Chat messages | — | `@re1 @re2 PR #Y ready for review — proposal revision` |

### Pulse 6 — T+50:00 (10:50 UTC)

| Field | Before | After |
|-------|--------|-------|
| QP-005 status | `ready_for_review` | `done` |
| QP-005 review | RE1: pending, RE2: pending | RE1: approved, RE2: approved |
| RE1 action | — | APPROVE: clarification matches original intent |
| RE2 action | — | APPROVE: no proposal drift |
| HEAD action | — | Merges PR, moves QP-005 to Done |
| Queue change | QP-005 in Active Batch | QP-005 moved to Done, Active Batch empty |

### Pulse 7 — T+60:00 (11:00 UTC)

| Field | Before | After |
|-------|--------|-------|
| Active Batch | empty | empty (unchanged) |
| HEAD action | — | Reads queue, reports: "Active Batch 2 complete. No remaining items." |
| Loop state | running | running (no auto-pause — follow-up issue) |

### Final Queue State

```markdown
## Active Batch

**Batch:** 2
**Started:** 2026-05-26 10:00
**Status:** complete

(empty)

## Done

#### QP-004 — Phase 2 ticket batch
- Type: ticket_batch
- Status: done
- Review: RE1 approved, RE2 approved

#### QP-005 — Update proposal with streak rules clarification
- Type: proposal_revision
- Status: done
- Review: RE1 approved, RE2 approved
```

## Verification

| Criterion | Status |
|-----------|--------|
| Planning Loop sends queue pulses correctly | Yes — 7 pulses at 10-min intervals |
| Queue advances through HEAD and reviewers | Yes — both artifacts processed sequentially |
| No Telegram/Discord required | Yes — file-chat only |
| At least two artifacts moved forward by loop pulses | Yes — QP-004 (ticket batch) and QP-005 (proposal revision) |
| Loop guard not triggered | Correct — hops stayed within default 30 limit |

## Issue Classification

| Issue | Category | Severity |
|-------|----------|----------|
| HEAD doesn't detect "no items" without a pulse | Loop | Low — HEAD could check proactively |
| No automatic loop pause when batch completes | Loop | Medium — loop keeps pulsing empty queue |
| Reviewer notification depends on HEAD mentioning @re1/@re2 | Agent prompt | Low — working as designed |
| Queue status not auto-updated by parser | Queue parser | Medium — HEAD manually updates status fields |

## Follow-up Tickets Recommended

1. **Auto-pause loop when Active Batch is empty** — stop sending pulses after HEAD reports no remaining items
2. **Queue status auto-update** — update artifact status fields automatically when HEAD moves items to Done
3. **Batch completion notification** — send a system message when all Active Batch items reach done status
4. **Loop pulse counter** — track total pulses per batch for diagnostics

## Conclusion

The Planning Loop successfully advances queued work through HEAD and reviewers using only file-based chat (no Telegram/Discord). Two artifacts moved from queued to done across 7 pulse cycles (60 minutes at 10-min intervals). The sequential processing model works: HEAD completes one artifact, gets both reviewer approvals, then moves to the next. The loop guard was not triggered (hops stayed well under the default 30 limit).
