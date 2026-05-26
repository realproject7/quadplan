# QuadPlan — Standardized Review Formats

Use these formats when posting review verdicts. Copy the appropriate template, fill in each section, and post via `gh pr review` and `chat_send`.

---

## Ticket Review

Use for individual tickets and ticket batches.

```markdown
## Ticket Review: {{title}}

Verdict: APPROVE | REQUEST_CHANGES

### Summary
One short paragraph.

### Development Readiness
- Could a dev agent implement this from the ticket alone? yes/no
- Are acceptance criteria specific and testable? yes/no
- Are file paths or component names identified? yes/no
- Are dependencies listed and ordered? yes/no

### Proposal Alignment
- Does this ticket match the proposal's scope for this phase?
- Any drift from the original intent?

### Blocking Issues
- [MUST] ...

### Non-Blocking Notes
- [SHOULD] ...
```

---

## Design Review

Use for HTML design artifacts. **You must open the artifact in a browser before reviewing.**

```markdown
## Design Review: {{artifact_path}}

Verdict: APPROVE | REQUEST_CHANGES

### Browser Validation
- Opened in browser: yes/no
- Desktop checked (1024px+): yes/no
- Tablet checked (~768px): yes/no
- Mobile checked (~375px): yes/no
- Console errors: none / [list errors]

### Layout and Responsiveness
- Does the layout stack correctly on narrow screens?
- Do touch targets meet 44x44px minimum on mobile?
- Are left edges aligned on a consistent grid?

### UX and Interaction
- Do interactive elements have hover, focus, and disabled states?
- Are animations limited to color/opacity/transform under 300ms?
- Does the design respect prefers-reduced-motion?

### Visual Quality
- Spacing follows 4px grid?
- Typography: max 3 sizes per component, ALL CAPS has letter-spacing?
- Accent color used max 2 times per screen?
- Text contrast: 4.5:1 body, 3:1 large text?
- No AI slop patterns (default indigo, emoji icons, hero gradients)?

### Proposal Alignment
- Does this design match the proposal's intent for this feature?
- Any deviation from specified UX or visual direction?

### Blocking Issues
- [MUST] ...
```

---

## Proposal Review

Use when HEAD revises the project proposal.

```markdown
## Proposal Review: {{proposal_path}}

Verdict: APPROVE | REQUEST_CHANGES

### Completeness
- Are all planned phases covered?
- Are there gaps between the vision and the phase plan?

### Phase Plan
- Is ordering logical with clear dependencies?
- Are phases small enough for focused ticket creation?
- Are acceptance criteria specific enough for each phase?

### Engineering Handoff Readiness
- Can HEAD create tickets from each phase without product decisions?
- Are technical assumptions stated?
- Are risks and mitigations identified?

### Risks and Missing Decisions
- Any unresolved open questions?
- Any hidden dependencies or assumptions?

### Blocking Issues
- [MUST] ...

### Non-Blocking Notes
- [SHOULD] ...
```

---

## Severity Levels

- `[MUST]` — Must fix before approval. Blocks the artifact.
- `[SHOULD]` — Should fix, but not a blocker. Can be addressed in a follow-up.
- `[CONSIDER]` — Optional improvement. Note for HEAD's discretion.
