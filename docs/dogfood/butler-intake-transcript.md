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

## Resulting Proposal

Butler would produce the following `docs/PROPOSAL.md`:

### Vision
A local-first CLI tool for tracking daily habits (exercise, reading, hydration) with streak tracking and weekly summaries. No cloud, no accounts — just a fast terminal command.

### Audience
Single developer/user on macOS or Linux who wants lightweight habit tracking without a web app.

### User Workflows
- `habit add "Exercise" --type boolean` — register a new habit
- `habit log "Exercise"` — mark today's entry (boolean: done)
- `habit log "Water" --value 8` — log a numeric value
- `habit streak "Exercise"` — show current and longest streak
- `habit week` — show weekly summary table
- `habit week --export md` — export weekly summary as markdown

### Technical Assumptions
- Node.js CLI (bin entry in package.json)
- JSON storage: `~/.habits/{habit-slug}.json` (one file per habit)
- Days determined by local system time, midnight cutoff
- No external dependencies beyond Node.js built-ins + a table formatter

### Phase 1 — Core CLI Commands
- **Scope**: `habit add`, `habit log`, `habit list`, `habit remove`
- **Acceptance criteria**:
  - [ ] `habit add "Exercise"` creates `~/.habits/exercise.json`
  - [ ] `habit log "Exercise"` appends today's date to the log
  - [ ] `habit log "Water" --value 8` stores numeric value
  - [ ] `habit list` shows all registered habits with last logged date
  - [ ] `habit remove "Exercise"` deletes the habit file after confirmation
  - [ ] Duplicate log for same day updates rather than duplicates

### Phase 2 — Streak Calculation
- **Scope**: `habit streak`, streak display in `habit list`
- **Depends on**: Phase 1
- **Acceptance criteria**:
  - [ ] `habit streak "Exercise"` shows current streak count and longest streak
  - [ ] Streak resets on any missed day (hard reset, no grace)
  - [ ] `habit list` shows current streak next to each habit
  - [ ] Streak correctly handles timezone by using local midnight

### Phase 3 — Weekly Summary
- **Scope**: `habit week`, markdown export
- **Depends on**: Phase 1 + Phase 2
- **Acceptance criteria**:
  - [ ] `habit week` renders a terminal table with days as columns, habits as rows
  - [ ] Boolean habits show checkmarks, numeric habits show values
  - [ ] `habit week --export md` writes a markdown file to stdout or a specified path
  - [ ] Week boundary is Monday-Sunday

### Risks
- Date edge cases around midnight and timezone changes
- JSON file corruption if process is killed during write (mitigate: write to temp then rename)
- Large habit files over months of daily logging (mitigate: archive old entries)

### Success Criteria
User can track 3+ habits with accurate streaks for 2 weeks using only CLI commands.

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
