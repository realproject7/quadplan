# Dogfood: Butler Intake — Sample Project

> Simulated Butler intake session for QuadPlan Phase 9a validation.

## Raw Idea

"I want a CLI tool that tracks daily habits — like exercise, reading, and hydration — with streaks and weekly summaries. Local-first, no cloud."

## Butler Intake Questions

1. **Target audience?** Personal use — single user, local machine.
2. **Platform?** CLI on macOS/Linux. No GUI needed for MVP.
3. **Data format?** JSON or SQLite? → JSON files for simplicity, one file per habit.
4. **Habit types?** Boolean (did/didn't) vs. numeric (glasses of water). → Both. Boolean default, numeric optional.
5. **Streak rules?** Reset on miss, or allow grace days? → Hard reset, but show longest streak in history.
6. **Weekly summary output?** Terminal table, markdown file, or both? → Terminal table with optional `--export md`.
7. **Time zone handling?** → Use local system time. Days cut at midnight.
8. **Existing tools to integrate with?** → None. Standalone CLI.

## Resulting Proposal (Summary)

Butler would produce `docs/PROPOSAL.md` with:

- **Vision**: Local CLI habit tracker with streaks and weekly summaries
- **Audience**: Single developer/user on macOS/Linux
- **User workflows**: `habit add`, `habit log`, `habit streak`, `habit week`
- **Technical assumptions**: Node.js CLI, JSON storage in `~/.habits/`
- **Phases**:
  - Phase 1: Core CLI commands (add, log, list)
  - Phase 2: Streak calculation and display
  - Phase 3: Weekly summary with terminal table + markdown export
- **Acceptance criteria** per phase
- **Risks**: date edge cases, timezone handling
- **Success criteria**: user can track 3+ habits with streaks for 2 weeks

## Butler Role Verification

| Aspect | Butler Behavior | Distinct from HEAD? |
|--------|-----------------|---------------------|
| Asks clarifying questions | Yes — 8 questions before drafting | HEAD doesn't do intake |
| Drafts detailed proposal | Yes — phases, criteria, risks | HEAD creates tickets from it |
| Creates GitHub repo | Would create when operator confirms | HEAD works in existing repo |
| Seeds workspace | Would create docs/PROPOSAL.md + artifacts/ | HEAD reads these files |
| Hands off to HEAD | Would send "@head here's the project" | HEAD takes over from there |

## Friction Points Observed

1. **Butler template assumes `gh repo create` access** — if the operator hasn't authenticated `gh`, Butler can't create the repo. Should check auth first or guide through it.
2. **No structured proposal validation** — Butler writes free-form markdown. No schema enforcement ensures all required sections (phases, risks, acceptance criteria) are present.
3. **Handoff message format undefined** — Butler says "hand off to @head" but no standard message format exists for the handoff. HEAD might not know what to do first.
4. **Butler workspace isolation** — Butler works from `~/docs/` but there's no clear boundary preventing it from accidentally editing project files.
5. **Proposal iteration UX** — no built-in mechanism for "revise section 3" without re-reading the whole proposal. Butler would benefit from section-level editing guidance.

## Conclusion

The Butler template can guide a raw idea to a development-ready proposal through clarifying questions and structured drafting. The role distinction is clear: Butler does intake + proposal, HEAD does tickets + artifacts from the proposal. The friction points above should be filed as follow-up issues.
