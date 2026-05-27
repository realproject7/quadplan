# QuadPlan — Mac Installation Guide

Step-by-step guide for installing QuadPlan on macOS. Designed for both humans and AI coding agents.

---

## Prerequisites

### Check existing tools

```bash
node --version   # Need 20+ (24 recommended)
git --version
gh --version
```

### Install missing prerequisites

**Node.js 20+** (via nvm — recommended):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.zshrc
nvm install 24
nvm use 24
```

**Git** (included with Xcode Command Line Tools):
```bash
xcode-select --install
```

**GitHub CLI:**
```bash
brew install gh
```

### Authenticate GitHub CLI

```bash
gh auth login
```

> **This is interactive** — the operator must complete the browser-based auth flow. Ask the user to run this command if not already authenticated.

Verify:
```bash
gh auth status
# You should see: "Logged in to github.com account <username>"
```

---

## Install AI Coding Agents

Install one or more of the supported agent CLIs:

```bash
# Claude Code (Anthropic)
npm install -g @anthropic-ai/claude-code

# Codex CLI (OpenAI)
npm install -g @openai/codex

# Gemini CLI (Google) — if using Gemini agents
npm install -g @google/gemini-cli
```

### Authenticate agent CLIs

Each CLI requires a one-time interactive login:

```bash
# Claude Code — follow the login prompt
claude

# Codex — follow the login prompt
codex
```

> **These are interactive steps.** Ask the operator to run each command and complete the login flow.

---

## Install QuadPlan

```bash
npm install -g quadplan@latest
```

Verify:
```bash
quadplan --version
# You should see the version number (e.g., 1.14.5)
```

---

## Initialize & Start

### Interactive setup

```bash
quadplan init
```

> **This is interactive.** The operator will be prompted to configure their first project (name, repo, working directory, agent backends).

### Start the server

```bash
quadplan start
```

You should see output like:
```
QuadPlan dashboard: http://localhost:8500
```

Open the dashboard URL in your browser to access the web UI.

---

## Create Your First Project

1. Open the dashboard at `http://localhost:8500`
2. Click **"+ New Project"** or navigate to `/setup`
3. Fill in the project details:
   - **Name:** Your project name
   - **Repo:** GitHub repo in `owner/repo` format
   - **Working directory:** Absolute path to the repo clone
   - **Agent backends:** Choose Claude, Codex, or Gemini for each agent role
4. Click **Create**

QuadPlan will:
- Create worktree directories for each project agent (e.g., `project-head/`, `project-re1/`, `project-re2/`)
- Seed AGENTS.md files for each role

---

## Trust Prompt (Claude Code)

On first launch, Claude Code agents may get stuck at a "Do you trust this directory?" prompt. QuadPlan v1.14.5+ automatically pre-trusts worktree directories for Claude-configured agents during project creation.

**If agents are still stuck** (e.g., upgraded from an older version), manually pre-trust each worktree:

```bash
# Run in each worktree directory
cd /path/to/project-head && claude -p "echo ok"
cd /path/to/project-re1 && claude -p "echo ok"
cd /path/to/project-re2 && claude -p "echo ok"
```

---

---

## Stopping & Restarting

```bash
# Stop the server (Ctrl+C if running in foreground)
# Or if running in background:
quadplan stop

# Restart
quadplan start
```

For persistent background operation on Mac, consider using pm2:
```bash
npm install -g pm2
pm2 start "quadplan start" --name quadplan
pm2 save
```
