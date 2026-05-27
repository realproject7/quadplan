# Planning Loop E2E Dogfood — Operator Runbook

> Issue: #94 | Prerequisites: #98 (merged), #99 (merged)
>
> **This E2E must be run by the operator at the QuadPlan dashboard.**
> A single CLI agent cannot operate the dashboard plus three concurrent
> real interactive HEAD/RE1/RE2 CLI sessions and observe Planning Loop
> pulses. See "Blocker" section below.

## Blocker: Environment

**Classification**: `environment`

The #94 E2E requires simultaneously:
1. A running QuadPlan dashboard server (port 8500)
2. Three concurrent interactive AI CLI sessions (HEAD, RE1, RE2) in PTY terminals managed by the dashboard
3. Active Planning Loop emitting pulses to HEAD via the chat system
4. Real-time observation of agent processing and artifact status transitions

A single CLI agent (Dev) cannot operate the dashboard UI, manage multiple live agent PTY sessions, or observe asynchronous multi-agent activity. This is an operator task.

---

## Pre-Run Checklist

- [ ] #98 merged (side-by-side separation — confirmed)
- [ ] #99 merged (stale batch cache invalidation — confirmed)
- [ ] Latest `main` pulled in `/Users/cho/Projects/quadplan`
- [ ] `npm test` passes (expect 105/105)
- [ ] `npm run build` succeeds (static frontend in `out/`)
- [ ] No QuadWork server running on port 8400 that could interfere (optional — side-by-side is safe)

## Step 1: Create Disposable Dogfood Project

```bash
mkdir -p /tmp/quadplan-dogfood
cd /tmp/quadplan-dogfood
git init
mkdir -p docs artifacts/design artifacts/tickets artifacts/docs
```

Create a minimal proposal:

```bash
cat > docs/PROPOSAL.md << 'EOF'
# Dogfood Test Project

A minimal disposable project for validating the QuadPlan Planning Loop E2E.

## Scope
Two small planning artifacts to verify:
1. HEAD processes Planning Loop pulses
2. RE1 and RE2 review artifacts
3. Status transitions are recorded in OVERNIGHT-QUEUE.md

## Deliverables
- One ticket batch (2 tickets)
- One design document
EOF
```

## Step 2: Configure QuadPlan

Edit `~/.quadplan/config.json`:

```json
{
  "port": 8500,
  "operator_name": "user",
  "butler": {
    "enabled": false,
    "cwd": null,
    "command": null
  },
  "projects": [
    {
      "id": "dogfood-e2e",
      "name": "Dogfood E2E",
      "repo": "",
      "working_dir": "/tmp/quadplan-dogfood",
      "proposal_path": "/tmp/quadplan-dogfood/docs/PROPOSAL.md",
      "queue_path": "/Users/cho/.quadplan/dogfood-e2e/OVERNIGHT-QUEUE.md",
      "artifact_dir": "/tmp/quadplan-dogfood/artifacts",
      "agents": {
        "head": {
          "cwd": "/tmp/quadplan-dogfood",
          "command": "claude"
        },
        "re1": {
          "cwd": "/tmp/quadplan-dogfood",
          "command": "claude"
        },
        "re2": {
          "cwd": "/tmp/quadplan-dogfood",
          "command": "claude"
        }
      },
      "chat_mode": "file"
    }
  ]
}
```

> **Note**: No `dev` agent. HEAD/RE1/RE2 only per QuadPlan agent model.
> Adjust `command` to `"codex"` if preferred for any agent.

## Step 3: Seed the Queue

Create `~/.quadplan/dogfood-e2e/OVERNIGHT-QUEUE.md`:

```markdown
# Overnight Queue

## Active Batch

**Batch:** 1

### QP-001 — Draft ticket batch for dogfood project (2 tickets covering proposal scope)
- Type: ticket_batch
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: artifacts/tickets/batch-1.md

### QP-002 — Write a one-page design overview for the dogfood project
- Type: doc
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: artifacts/docs/design-overview.md

## Backlog

(empty)

## Done

(none)
```

## Step 4: Start QuadPlan Server

```bash
cd /Users/cho/Projects/quadplan
node bin/quadplan.js start
```

Dashboard opens at `http://127.0.0.1:8500`.

## Step 5: Run the E2E

1. Open the **dogfood-e2e** project in the dashboard
2. Click on HEAD/RE1/RE2 terminals to start agent sessions
3. Verify each agent terminal shows a real `claude` or `codex` session
4. Enable **Planning Loop** from the control bar (10-minute interval recommended)
5. Wait for the first pulse — HEAD should receive a queue-check message
6. Observe HEAD processing the artifacts (TICKETS-1, DOC-1)
7. Observe RE1/RE2 reviewing HEAD's output
8. Capture at least **two artifact status transitions** in the queue

## Step 6: Capture Evidence

While running, record:

1. **Server start command**: exact command used
2. **Agent commands**: what's configured for HEAD/RE1/RE2 (no secrets)
3. **Initial queue snapshot**: copy of OVERNIGHT-QUEUE.md before first pulse
4. **Pulse timestamps**: from server logs or Planning Loop UI
5. **Chat message IDs**: from `~/.quadplan/dogfood-e2e/chat/general.jsonl`
6. **Queue after each pulse**: copy of OVERNIGHT-QUEUE.md showing transitions
7. **Artifact outputs**: any files created in `artifacts/`
8. **Failures/friction**: classify as `loop`, `queue parser`, `agent prompt`, `reviewer workflow`, or `environment`

Save all evidence to `docs/dogfood/planning-loop-e2e-evidence.md` using the template below.

## Step 7: Finalize

1. Commit the evidence document
2. Push to the `task/94-e2e-dogfood-prep` branch (or create a new branch)
3. The PR should close #94 only after real evidence is captured

---

## Cleanup

After the E2E run:

```bash
rm -rf /tmp/quadplan-dogfood
```

Remove the `dogfood-e2e` project from `~/.quadplan/config.json` if no longer needed.
