"use strict";

// #111: Codex CLI directory-trust handling for HEAD/reviewer worktrees.
//
// Codex shows an interactive gate ("Do you trust the contents of this
// directory?") the first time it runs in a directory, which silently blocks
// agents from processing chat / Planning Loop pulses until the operator
// answers it inside each terminal. Unlike Claude (pre-trusted by running
// `claude -p` in the worktree), QuadWork has no Codex trust path and leaves
// this as an unhandled gate.
//
// Codex supports a safe, noninteractive pre-trust: a trusted directory is
// recorded in `~/.codex/config.toml` (honoring $CODEX_HOME) as
//
//   [projects."/abs/worktree"]
//   trust_level = "trusted"
//
// This is exactly what Codex itself writes when the operator accepts the
// gate, so adding the entry during setup pre-trusts the worktree without
// injecting any keystrokes into a live session.
//
// As a safety net, detectsCodexTrustPrompt() identifies the gate in PTY
// output so the dashboard can show a "blocked" state instead of implying the
// agent is ready — we never auto-answer Codex (that path is fragile); we
// surface the gate.

const fs = require("fs");
const path = require("path");
const os = require("os");

function codexConfigPath() {
  const home = process.env.CODEX_HOME && process.env.CODEX_HOME.trim()
    ? process.env.CODEX_HOME
    : path.join(os.homedir(), ".codex");
  return path.join(home, "config.toml");
}

// Encode an absolute path as a TOML basic-string key segment, escaping the
// characters that are significant inside a double-quoted TOML string.
function tomlPathKey(absDir) {
  const escaped = absDir.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function projectHeader(absDir) {
  return `[projects.${tomlPathKey(absDir)}]`;
}

// True when config text declares a [projects."<absDir>"] table (regardless
// of its trust_level). Used to decide append-vs-edit so we never create a
// duplicate table (which would make the TOML invalid).
function isCodexProjectConfigured(configText, absDir) {
  if (typeof configText !== "string" || !configText) return false;
  return configText.includes(projectHeader(absDir));
}

// Locate the [projects."<dir>"] table block: from its header to the next
// top-level header (a "[" at column 0) or EOF. Returns { start, end, block }
// or null if absent.
function findProjectBlock(text, absDir) {
  const header = projectHeader(absDir);
  const start = text.indexOf(header);
  if (start === -1) return null;
  const afterHeader = start + header.length;
  const rel = text.slice(afterHeader).search(/\n\[/);
  const end = rel === -1 ? text.length : afterHeader + rel + 1; // keep the newline
  return { start, end, block: text.slice(start, end) };
}

// True only when the path's table exists AND its trust_level is "trusted".
function isCodexTrusted(configText, absDir) {
  if (typeof configText !== "string" || !configText) return false;
  const found = findProjectBlock(configText, absDir);
  if (!found) return false;
  return /^\s*trust_level\s*=\s*"trusted"\s*$/m.test(found.block);
}

/**
 * Ensure `<dir>` is recorded as a *trusted* Codex project. Idempotent and
 * non-destructive — only the path's own table is ever touched.
 *
 * Returns { action, path }:
 *   - "added"   — no table existed; a trusted-project table was appended
 *   - "updated" — the table existed but was not trusted; trust_level set/fixed
 *   - "present" — the table already declared trust_level = "trusted"
 */
function ensureCodexTrusted(dir, opts = {}) {
  const configPath = opts.configPath || codexConfigPath();
  const absDir = path.resolve(dir);

  let text = "";
  try {
    text = fs.readFileSync(configPath, "utf8");
  } catch {
    text = "";
  }

  const found = findProjectBlock(text, absDir);

  if (!found) {
    // No table for this path — append a fresh trusted one.
    const sep = text === "" ? "" : text.endsWith("\n") ? "\n" : "\n\n";
    const block = `${sep}${projectHeader(absDir)}\ntrust_level = "trusted"\n`;
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.appendFileSync(configPath, block);
    return { action: "added", path: configPath };
  }

  if (/^\s*trust_level\s*=\s*"trusted"\s*$/m.test(found.block)) {
    return { action: "present", path: configPath };
  }

  // Table exists but is not trusted: replace an existing trust_level line, or
  // insert one right after the header. Only this block is rewritten.
  let newBlock;
  if (/^\s*trust_level\s*=.*$/m.test(found.block)) {
    newBlock = found.block.replace(/^\s*trust_level\s*=.*$/m, 'trust_level = "trusted"');
  } else {
    const header = projectHeader(absDir);
    newBlock = found.block.replace(header, `${header}\ntrust_level = "trusted"`);
  }
  const updated = text.slice(0, found.start) + newBlock + text.slice(found.end);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, updated);
  return { action: "updated", path: configPath };
}

// --- Trust-gate detection (for surfacing a blocked state, not auto-answer) -

const ANSI_RE = new RegExp(
  "[\\x1b\\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PR-TZcf-ntqry=><]",
  "g",
);
const CTRL_RE = new RegExp("[\\x00-\\x1f\\x7f]", "g");

function normalize(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(ANSI_RE, "")
    .replace(CTRL_RE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// The Codex gate's question is distinctive enough to anchor on; it does not
// appear in normal agent output. We only surface a blocked state on a match
// (never auto-answer), so the cost of a stray match is a spurious badge, not
// injected input.
const CODEX_TRUST_RE = /do you trust the contents of this (directory|folder)/;

function detectsCodexTrustPrompt(text) {
  return CODEX_TRUST_RE.test(normalize(text));
}

module.exports = {
  codexConfigPath,
  isCodexProjectConfigured,
  isCodexTrusted,
  ensureCodexTrusted,
  detectsCodexTrustPrompt,
  // exposed for testing
  _tomlPathKey: tomlPathKey,
  _normalize: normalize,
};
