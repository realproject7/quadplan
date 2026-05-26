# Dogfood: Ticket Batch Creation & RE1/RE2 Review Cycle

> Simulated HEAD ticket creation and reviewer cycle for QuadPlan Phase 9b validation.
> Based on the habit tracker proposal from the Butler intake dogfood (#42).

## HEAD Creates Ticket Batch

HEAD reads `docs/PROPOSAL.md` and creates a 3-ticket batch for Phase 1.

### EPIC Created

**Title**: [Epic] Habit Tracker — CLI Habit Tracking Tool

**Body**:
```
## Goal
Build a local-first CLI tool for tracking daily habits with streaks and weekly summaries.

## Source proposal
docs/PROPOSAL.md

## Sub-tickets
| # | Ticket | Phase | Dependencies |
|---|--------|-------|-------------|
| #1 | [Phase 1] Core habit data model and storage | Phase 1 | None |
| #2 | [Phase 1] Implement add/remove CLI commands | Phase 1 | #1 |
| #3 | [Phase 1] Implement log/list CLI commands | Phase 1 | #1 |

## Acceptance Criteria
- [ ] User can add, log, list, and remove habits via CLI
- [ ] Data persists in ~/.habits/ as JSON files
```

### Sub-ticket #1: Core habit data model and storage

```
Parent: #epic

## Purpose
Establish the data foundation that all CLI commands depend on.

## Scope
Create the habit JSON schema, storage directory initialization, and read/write helpers.

## Out of Scope
CLI argument parsing, streak calculation, weekly summaries.

## Acceptance Criteria
- [ ] Habit JSON schema defined: { name, slug, type, entries: [{ date, value? }] }
- [ ] ~/.habits/ directory created on first use
- [ ] readHabit(slug) and writeHabit(slug, data) helpers work
- [ ] Duplicate slugs prevented

## Implementation Notes
- Use path.join(os.homedir(), '.habits') for storage
- Slugify habit names for filenames
- Write to temp file then rename for crash safety

## Dependencies
None — this is the foundation ticket.

## Testing Expectations
- [ ] Unit tests for read/write helpers
- [ ] Test slug generation from names with spaces/special chars

## Risk Notes
- JSON corruption if killed during write (mitigated by temp+rename)
```

### Sub-ticket #2: Implement add/remove CLI commands

```
Parent: #epic

## Purpose
Let users register and unregister habits.

## Scope
`habit add "Exercise" --type boolean` and `habit remove "Exercise"` commands.

## Out of Scope
Logging entries, streaks, summaries.

## Acceptance Criteria
- [ ] `habit add "Exercise"` creates exercise.json with boolean type
- [ ] `habit add "Water" --type numeric` creates water.json with numeric type
- [ ] `habit remove "Exercise"` deletes after confirmation prompt
- [ ] Adding a duplicate habit shows an error

## Dependencies
Requires #1 (data model and storage helpers)

## Testing Expectations
- [ ] Test add creates correct JSON
- [ ] Test remove deletes file
- [ ] Test duplicate prevention
```

### Sub-ticket #3: Implement log/list CLI commands

```
Parent: #epic

## Purpose
Core daily interaction — logging habit entries and viewing status.

## Scope
`habit log "Exercise"` and `habit list` commands.

## Out of Scope
Streak calculation (Phase 2), weekly summary (Phase 3).

## Acceptance Criteria
- [ ] `habit log "Exercise"` appends today's date to entries
- [ ] `habit log "Water" --value 8` stores numeric value for today
- [ ] Logging same habit twice on same day updates (not duplicates)
- [ ] `habit list` shows all habits with last logged date
- [ ] Missing habit shows clear error

## Dependencies
Requires #1 (data model and storage helpers)

## Testing Expectations
- [ ] Test log appends entry
- [ ] Test duplicate-day update behavior
- [ ] Test list output format
```

## RE1 Review — First Round (REQUEST_CHANGES)

**Verdict**: REQUEST_CHANGES

### Summary
Ticket batch covers Phase 1 scope correctly but sub-ticket #1 has ambiguous acceptance criteria.

### Findings
- [MUST] Sub-ticket #1 acceptance criterion "Duplicate slugs prevented" doesn't specify behavior — should it error, warn, or silently skip? Specify the expected CLI output.
- [SHOULD] Sub-ticket #3 doesn't mention what `habit list` output looks like — add an expected output example.

### Proposal Alignment
Phase 1 scope matches proposal. No drift.

## RE2 Review — First Round (REQUEST_CHANGES)

**Verdict**: REQUEST_CHANGES

### Summary
Good ticket structure following TICKET-TEMPLATES.md format. One implementation gap.

### Findings
- [MUST] Sub-ticket #2 acceptance criterion for `habit remove` says "after confirmation prompt" but no implementation note explains how to handle stdin confirmation in a CLI tool. Add guidance (e.g., readline prompt or --force flag).

### Proposal Alignment
Aligned with proposal Phase 1 scope.

## HEAD Revises Tickets

HEAD updates the ticket bodies:
- #1: "Duplicate slugs prevented — `habit add` exits with error: 'Habit already exists: Exercise'"
- #2: Add implementation note: "Use readline for confirmation. Support `--force` flag to skip."
- #3: Add expected output example for `habit list`

## RE1 Review — Second Round (APPROVE)

**Verdict**: APPROVE
Duplicate slug behavior now specified. List output example added.

## RE2 Review — Second Round (APPROVE)

**Verdict**: APPROVE
Remove confirmation guidance added with --force flag option. Tickets are development-ready.

## Verification

| Criterion | Status |
|-----------|--------|
| Ticket batch reaches approved/done | Yes — both reviewers approve after revision |
| Review feedback is actionable | Yes — specific criteria fixes, not vague complaints |
| Review feedback is proposal-aligned | Yes — both reviewers checked against proposal |
| At least one request-changes cycle | Yes — both RE1 and RE2 requested changes first round |
| Tickets follow TICKET-TEMPLATES.md format | Yes — Purpose, Scope, Out of Scope, AC, Notes, Deps, Testing, Risks |

## Friction Points

1. **No automated template enforcement** — HEAD manually followed TICKET-TEMPLATES.md. Missing sections not caught until reviewer read-through.
2. **Review round-trip latency** — two review cycles required even for small fixes. Consider allowing single-reviewer fast-track for trivial acceptance criteria wording changes.
3. **EPIC sub-ticket table needs manual number updates** — HEAD must edit the EPIC body after creating sub-tickets to fill in actual issue numbers. Could be automated.
