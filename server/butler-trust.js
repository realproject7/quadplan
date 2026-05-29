"use strict";

// #107: Precisely detect the Claude Code folder-trust gate.
//
// Butler used to auto-answer the trust prompt by writing `1\r` whenever
// early terminal output contained the substring "trust", "Yes,", or "1.".
// That is far too broad: a numbered list, a version like "1.0", or the
// word "trust" in normal output would fire the auto-answer AFTER Claude
// had already reached its REPL, turning the "1" into a real user message
// (the phantom-input bug the operator observed).
//
// The genuine gate looks like:
//
//   Do you trust the files in this folder?
//   /path/to/folder
//   ...
//   > 1. Yes, proceed
//     2. No, exit
//
// We require BOTH the unique question line AND a "Yes, proceed" option, so
// neither a stray "1." nor the bare word "trust" can trigger a response.

// Strip ANSI escape sequences and lone control bytes so styling and
// line-wrapping in the PTY stream don't break the match. Built from strings
// with \x escapes so no literal control bytes live in source.
// \x1b = ESC, \x9b = single-char CSI.
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
    // collapse all whitespace (incl. newlines from wrapping) to single spaces
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// The question is the stable anchor; the option line confirms it is the
// real, selectable gate rather than the phrase appearing in prose/output.
const TRUST_QUESTION_RE = /do you trust the files in this (folder|directory)/;
const TRUST_OPTION_RE = /(?:\b1\.\s*)?yes,?\s*proceed\b/;

// True only when `text` (a chunk or accumulated buffer of PTY output)
// contains the genuine Claude Code folder-trust gate.
function detectsClaudeTrustPrompt(text) {
  const norm = normalize(text);
  return TRUST_QUESTION_RE.test(norm) && TRUST_OPTION_RE.test(norm);
}

module.exports = {
  detectsClaudeTrustPrompt,
  // exposed for testing
  _normalize: normalize,
};
