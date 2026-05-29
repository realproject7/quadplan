"use strict";

// #107: The Butler trust-prompt auto-answer must fire ONLY on the genuine
// Claude Code folder-trust gate. These tests lock the detector that gates
// `safeWrite(term, "1\r")` so arbitrary early terminal output can never
// inject a phantom "1" into the live session.

const test = require("node:test");
const assert = require("node:assert/strict");

const { detectsClaudeTrustPrompt, _normalize } = require("./butler-trust");

// A realistic gate frame, including ANSI styling, a leading dim line, the
// folder path, and the numbered options — split nothing, full frame.
const REAL_GATE =
  "\x1b[2mClaude Code\x1b[0m\r\n\r\n" +
  "\x1b[1mDo you trust the files in this folder?\x1b[0m\r\n" +
  "/home/op/.quadplan/butler\r\n\r\n" +
  "Claude Code may read, write, and execute files here.\r\n\r\n" +
  "\x1b[36m> 1. Yes, proceed\x1b[0m\r\n" +
  "  2. No, exit\r\n";

test("detects the genuine Claude trust gate (with ANSI + wrapping)", () => {
  assert.equal(detectsClaudeTrustPrompt(REAL_GATE), true);
});

test("detects the gate when the question wraps across lines", () => {
  const wrapped =
    "Do you trust the files in this\r\nfolder?\r\n\r\n> 1. Yes, proceed\r\n  2. No, exit";
  assert.equal(detectsClaudeTrustPrompt(wrapped), true);
});

test('detects the "directory" wording variant', () => {
  const v = "Do you trust the files in this directory?\n  1. Yes, proceed\n  2. No";
  assert.equal(detectsClaudeTrustPrompt(v), true);
});

// ── False positives: these must NEVER trigger the auto-answer ──────────────

test('REGRESSION: arbitrary early output containing "1." does not match', () => {
  assert.equal(detectsClaudeTrustPrompt("Steps:\r\n1. clone\r\n2. build\r\n3. run"), false);
  assert.equal(detectsClaudeTrustPrompt("1. first\r\n"), false);
  assert.equal(detectsClaudeTrustPrompt("• 1. bullet"), false);
});

test('a version string like "1.0" does not match', () => {
  assert.equal(detectsClaudeTrustPrompt("Claude Code v1.0.33 starting up"), false);
});

test('"Yes," appearing in prose does not match', () => {
  assert.equal(detectsClaudeTrustPrompt("Yes, that change looks correct."), false);
});

test('the bare word "trust" does not match', () => {
  assert.equal(detectsClaudeTrustPrompt("I trust this will work. 1. step one"), false);
});

test("the question without a Yes/proceed option does not match", () => {
  // e.g. the phrase echoed in a doc or chat, with no selectable option
  assert.equal(detectsClaudeTrustPrompt("Do you trust the files in this folder? (FAQ)"), false);
});

test("a normal REPL prompt does not match", () => {
  assert.equal(detectsClaudeTrustPrompt("\x1b[2m>\x1b[0m "), false);
  assert.equal(detectsClaudeTrustPrompt("Human: hi\r\nAssistant: "), false);
});

test("empty / non-string input is safe", () => {
  assert.equal(detectsClaudeTrustPrompt(""), false);
  assert.equal(detectsClaudeTrustPrompt(null), false);
  assert.equal(detectsClaudeTrustPrompt(undefined), false);
  assert.equal(detectsClaudeTrustPrompt(123), false);
});

// ── Accumulation across PTY chunks (how index.js feeds the detector) ────────

test("gate split across multiple PTY chunks is detected once buffered", () => {
  const chunks = [
    "\x1b[1mDo you trust the files ",
    "in this folder?\x1b[0m\r\n/home/op\r\n",
    "> 1. Yes, ",
    "proceed\r\n  2. No, exit\r\n",
  ];
  let buf = "";
  let matchedAt = -1;
  chunks.forEach((c, i) => {
    buf = (buf + c).slice(-8192);
    if (matchedAt === -1 && detectsClaudeTrustPrompt(buf)) matchedAt = i;
  });
  // Only matches once the full gate (question + option) has arrived.
  assert.equal(matchedAt, 3);
});

test("normalize strips ANSI and collapses whitespace", () => {
  assert.equal(_normalize("\x1b[36mYes,\x1b[0m   proceed"), "yes, proceed");
  assert.equal(_normalize("a\r\n\tb"), "a b");
});
