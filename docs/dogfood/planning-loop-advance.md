# Dogfood: Planning Loop Advancing Queued Work

> Simulated Planning Loop dogfood for QuadPlan Phase 9d validation.
> Tests the loop advancing two artifacts through HEAD and reviewers without Telegram/Discord.

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

## Loop Execution — Artifact 1 (QP-004: Ticket Batch)

### Pulse 1 (T+0min)
Planning Loop sends: `@head Queue check. Continue the next QuadPlan planning item from OVERNIGHT-QUEUE.md.`

HEAD reads queue, finds QP-004 (queued). Begins drafting Phase 2 ticket batch.

### Pulse 2 (T+10min)
HEAD has finished drafting. Opens PR with 3 sub-tickets for Phase 2 (streak calculation). Requests review from @re1 and @re2. QP-004 status: `ready_for_review`.

### Pulse 3 (T+20min)
RE1 posts REQUEST_CHANGES — missing dependency link in one ticket. RE2 posts APPROVE. QP-004 status: `re1_changes_requested`.

HEAD reads feedback, fixes the dependency link, pushes update.

### Pulse 4 (T+30min)
RE1 re-reviews and posts APPROVE. Both reviewers now approve. QP-004 status: `approved`.

HEAD merges PR, marks QP-004 as `done` in queue. Moves to next item.

## Loop Execution — Artifact 2 (QP-005: Proposal Revision)

### Pulse 5 (T+40min)
HEAD reads queue, finds QP-005 (queued). Reads proposal, identifies the streak rules section needs clarification per friction from ticket review cycle.

HEAD updates `docs/PROPOSAL.md` streak rules section, opens PR. Requests review. QP-005 status: `ready_for_review`.

### Pulse 6 (T+50min)
RE1 posts APPROVE — clarification is clear and matches user's original intent. RE2 posts APPROVE — no proposal drift. QP-005 status: `approved`.

HEAD merges PR, marks QP-005 as `done`. Active Batch is now empty.

### Pulse 7 (T+60min)
HEAD reads queue, finds no remaining items. Reports in chat: "Active Batch 2 complete. No remaining items."

Loop continues sending pulses but HEAD takes no action until new items are queued.

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
