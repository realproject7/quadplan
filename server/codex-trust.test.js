"use strict";

// #111: Codex worktree pre-trust + trust-gate detection.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  codexConfigPath,
  isCodexProjectConfigured,
  isCodexTrusted,
  ensureCodexTrusted,
  detectsCodexTrustPrompt,
  _tomlPathKey,
} = require("./codex-trust");

function tmpConfig() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-trust-"));
  return path.join(dir, "config.toml");
}

test("codexConfigPath honors CODEX_HOME, else ~/.codex", () => {
  const orig = process.env.CODEX_HOME;
  try {
    process.env.CODEX_HOME = "/custom/codex-home";
    assert.equal(codexConfigPath(), path.join("/custom/codex-home", "config.toml"));
    delete process.env.CODEX_HOME;
    assert.equal(codexConfigPath(), path.join(os.homedir(), ".codex", "config.toml"));
  } finally {
    if (orig === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = orig;
  }
});

test("ensureCodexTrusted adds a trusted-project table on a fresh config", () => {
  const cfg = tmpConfig();
  const r = ensureCodexTrusted("/home/op/proj-head", { configPath: cfg });
  assert.equal(r.action, "added");
  const text = fs.readFileSync(cfg, "utf8");
  assert.match(text, /\[projects\."\/home\/op\/proj-head"\]/);
  assert.match(text, /trust_level = "trusted"/);
});

test("ensureCodexTrusted is idempotent (present on second call)", () => {
  const cfg = tmpConfig();
  assert.equal(ensureCodexTrusted("/home/op/proj-head", { configPath: cfg }).action, "added");
  assert.equal(ensureCodexTrusted("/home/op/proj-head", { configPath: cfg }).action, "present");
  // exactly one table for the path
  const text = fs.readFileSync(cfg, "utf8");
  const count = text.split('[projects."/home/op/proj-head"]').length - 1;
  assert.equal(count, 1);
});

test("ensureCodexTrusted preserves existing entries and stays valid TOML", () => {
  const cfg = tmpConfig();
  fs.writeFileSync(cfg, '[projects."/home/op/existing"]\ntrust_level = "trusted"\n');
  ensureCodexTrusted("/home/op/proj-re1", { configPath: cfg });
  const text = fs.readFileSync(cfg, "utf8");
  assert.match(text, /\[projects\."\/home\/op\/existing"\]/);
  assert.match(text, /\[projects\."\/home\/op\/proj-re1"\]/);
  // a blank line separates the two tables (no header glued to a prior value)
  assert.match(text, /trusted"\n\n\[projects\."\/home\/op\/proj-re1"\]/);
});

test("ensureCodexTrusted inserts a separator when file lacks a trailing newline", () => {
  const cfg = tmpConfig();
  fs.writeFileSync(cfg, '[projects."/a"]\ntrust_level = "trusted"'); // no trailing \n
  ensureCodexTrusted("/b", { configPath: cfg });
  const text = fs.readFileSync(cfg, "utf8");
  // header must start on its own line, not appended to the prior token
  assert.ok(!/"trusted"\[projects/.test(text), "header glued to previous line");
  assert.match(text, /\[projects\."\/b"\]/);
});

test("creates the config directory if missing", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-nodir-"));
  const cfg = path.join(base, "nested", "deeper", "config.toml");
  const r = ensureCodexTrusted("/home/op/x", { configPath: cfg });
  assert.equal(r.action, "added");
  assert.ok(fs.existsSync(cfg));
});

test("tomlPathKey escapes quotes and backslashes", () => {
  assert.equal(_tomlPathKey("/a/b"), '"/a/b"');
  assert.equal(_tomlPathKey('/a/"q"'), '"/a/\\"q\\""');
  assert.equal(_tomlPathKey("C:\\proj"), '"C:\\\\proj"');
});

test("ensureCodexTrusted UPDATES an existing untrusted entry", () => {
  const cfg = tmpConfig();
  fs.writeFileSync(cfg, '[projects."/home/op/proj-head"]\ntrust_level = "untrusted"\n');
  const r = ensureCodexTrusted("/home/op/proj-head", { configPath: cfg });
  assert.equal(r.action, "updated");
  const text = fs.readFileSync(cfg, "utf8");
  assert.match(text, /trust_level = "trusted"/);
  assert.ok(!/untrusted/.test(text), "old untrusted value should be gone");
  // still exactly one table
  assert.equal(text.split('[projects."/home/op/proj-head"]').length - 1, 1);
  // a second call is now a no-op
  assert.equal(ensureCodexTrusted("/home/op/proj-head", { configPath: cfg }).action, "present");
});

test("ensureCodexTrusted INSERTS trust_level when the table has none", () => {
  const cfg = tmpConfig();
  // table exists with some other key but no trust_level
  fs.writeFileSync(cfg, '[projects."/home/op/p"]\nsome_other = 1\n\n[other]\nx = 2\n');
  const r = ensureCodexTrusted("/home/op/p", { configPath: cfg });
  assert.equal(r.action, "updated");
  const text = fs.readFileSync(cfg, "utf8");
  assert.match(text, /\[projects\."\/home\/op\/p"\]\ntrust_level = "trusted"\nsome_other = 1/);
  // the unrelated [other] table is untouched
  assert.match(text, /\[other\]\nx = 2/);
});

test("isCodexTrusted requires trust_level = trusted, not just the table", () => {
  assert.equal(isCodexTrusted('[projects."/a"]\ntrust_level = "trusted"\n', "/a"), true);
  assert.equal(isCodexTrusted('[projects."/a"]\ntrust_level = "untrusted"\n', "/a"), false);
  assert.equal(isCodexTrusted('[projects."/a"]\nfoo = 1\n', "/a"), false);
  assert.equal(isCodexTrusted("", "/a"), false);
});

test("isCodexProjectConfigured detects an existing path entry", () => {
  const text = '[projects."/home/op/proj-head"]\ntrust_level = "trusted"\n';
  assert.equal(isCodexProjectConfigured(text, "/home/op/proj-head"), true);
  assert.equal(isCodexProjectConfigured(text, "/home/op/other"), false);
  assert.equal(isCodexProjectConfigured("", "/x"), false);
  assert.equal(isCodexProjectConfigured(null, "/x"), false);
});

// --- trust-gate detection ---

test("detectsCodexTrustPrompt matches the genuine gate (with ANSI)", () => {
  const gate =
    "\x1b[1mDo you trust the contents of this directory?\x1b[0m\r\n" +
    "/home/op/proj-head\r\n> 1. Yes\r\n  2. No, exit\r\n";
  assert.equal(detectsCodexTrustPrompt(gate), true);
});

test("detectsCodexTrustPrompt does not fire on normal output", () => {
  assert.equal(detectsCodexTrustPrompt("Running in a trusted directory; contents look fine."), false);
  assert.equal(detectsCodexTrustPrompt("Steps:\r\n1. build\r\n2. test"), false);
  assert.equal(detectsCodexTrustPrompt(""), false);
  assert.equal(detectsCodexTrustPrompt(null), false);
});
