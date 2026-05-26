# QuadPlan — Ticket Body Templates

Use these templates when creating GitHub issues. Copy the appropriate template, fill in each section, and create the issue via `gh issue create`.

---

## EPIC Template

```markdown
## Goal

[One paragraph: what this epic achieves and why it matters.]

## Source proposal

[Link to docs/PROPOSAL.md or relevant section]

## Sub-tickets

| # | Ticket | Phase | Dependencies |
|---|--------|-------|-------------|
| | [Phase N] Task description | Phase N | None / #NNN |

## Implementation order

1. #NNN + #NNN (parallel — no dependencies)
2. #NNN (depends on #NNN)

## Acceptance Criteria

- [ ] [From the proposal — specific, testable]
- [ ] [Each criterion should be verifiable]
```

---

## Sub-ticket Template

```markdown
Parent: #[epic-number]

## Scope

[What this ticket covers. 2-3 sentences.]

## Out of Scope

[What this ticket explicitly does NOT cover.]

## Acceptance Criteria

- [ ] [Specific, testable requirement]
- [ ] [Each criterion verifiable by a reviewer]

## Implementation Notes

[Specific guidance for the implementing agent:]
- Files to create or modify
- Patterns to follow from existing code
- Technical constraints or decisions

## Dependencies

- Requires #NNN (if any)
- Blocked by: [describe if applicable]

## Design / Doc Links

- Proposal: docs/PROPOSAL.md#[section]
- Design: artifacts/design/[file].html (if applicable)
- Related docs: [links]

## Testing Expectations

- [ ] [What tests should be written or verified]
- [ ] [Manual verification steps]

## Risk Notes

- [Any risks, edge cases, or concerns]
- [Migration or backward compatibility notes]

## Parent Tracking

This is a sub-ticket for #[epic-number]. Keep the parent issue open as the phase tracker until all linked sub-tickets are complete.
```

---

## Bug Fix Template

```markdown
## Bug

[What happened and what should happen instead. Include reproduction steps.]

## Root Cause

[What's broken. File paths, line numbers, code context.]

## Proposed Fix

[Specific changes. Show code snippets or diffs where helpful.]

## Safety

[Why this won't break existing functionality.]

## Acceptance Criteria

- [ ] [Bug no longer reproduces]
- [ ] [Existing tests still pass]
```

---

## Tips for Development-Ready Tickets

1. **Scope narrowly** — one ticket per focused change, not multiple unrelated changes
2. **Include file paths** — tell the implementing agent exactly where to look
3. **Specify acceptance criteria** — if a reviewer can't verify it, it's not done
4. **Note dependencies** — list which tickets must merge first
5. **Keep implementation notes helpful, not prescriptive** — guide, don't micromanage
6. **Link to the proposal** — every ticket should trace back to the original intent
