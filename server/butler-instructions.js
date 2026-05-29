"use strict";

// #108: Managed QuadPlan Butler instructions.
//
// Butler historically ran in `~/docs/` and only copied its seed to
// `~/docs/CLAUDE.md` when that file did not already exist. On machines
// that also ran QuadWork, a stale QuadWork `~/docs/CLAUDE.md` shadowed
// the QuadPlan seed, so Butler followed old QuadWork workflows.
//
// This module gives QuadPlan Butler a product-specific, self-managing
// instruction file:
//   - Default working directory is `~/.quadplan/butler` — NOT `~/docs/`
//     — so a QuadWork `~/docs/CLAUDE.md` can never shadow it.
//   - The seed carries a version marker. When the on-disk CLAUDE.md is
//     missing, stale (no marker / QuadWork content), or an older managed
//     version, it is re-seeded. Any pre-existing, non-managed file is
//     backed up first so operator notes are never lost.

const fs = require("fs");
const path = require("path");
const os = require("os");

// Marker embedded at the top of the managed seed. Bump SEED_VERSION when
// the seed's meaning changes so existing installs get re-seeded (with a
// backup) instead of continuing to run an older managed version.
const SEED_MARKER_PREFIX = "<!-- quadplan-butler-seed:";
const SEED_VERSION = "v1";
const SEED_MARKER = `${SEED_MARKER_PREFIX} ${SEED_VERSION} -->`;

// QuadPlan-specific default. Deliberately not `~/docs/` (see header).
const DEFAULT_BUTLER_CWD = "~/.quadplan/butler";

// Resolve a configured cwd (possibly `~/`-relative, possibly empty) to an
// absolute path, falling back to the QuadPlan-specific default.
function resolveButlerCwd(cwdRaw, homedir = os.homedir()) {
  const raw = cwdRaw && String(cwdRaw).trim() ? String(cwdRaw).trim() : DEFAULT_BUTLER_CWD;
  if (raw === "~") return homedir;
  if (raw.startsWith("~/")) return path.join(homedir, raw.slice(2));
  return raw;
}

// True when content is a QuadPlan-managed seed (any version).
function isManagedSeed(content) {
  return typeof content === "string" && content.includes(SEED_MARKER_PREFIX);
}

// True when content is the current managed seed version.
function isCurrentSeed(content) {
  return typeof content === "string" && content.includes(SEED_MARKER);
}

function timestampSuffix(now) {
  const d = now instanceof Date ? now : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

// Pick a backup path that does not collide with an existing file.
function pickBackupPath(claudePath, now) {
  const base = `${claudePath}.bak-${timestampSuffix(now)}`;
  if (!fs.existsSync(base)) return base;
  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}.${i}`;
    if (!fs.existsSync(candidate)) return candidate;
  }
  return `${base}.${process.pid}`;
}

/**
 * Ensure `<docsDir>/CLAUDE.md` holds the current managed QuadPlan Butler
 * seed. Creates the directory if needed.
 *
 * Returns { path, action, backup }:
 *   - action: "created" — no CLAUDE.md existed; seed written
 *   - action: "updated" — existing file was stale/older; backed up, seed written
 *   - action: "kept"    — current managed seed already present; untouched
 *   - action: "skipped" — seed file unreadable; nothing written
 *   - backup: absolute path of the backup, when one was made
 */
function ensureButlerInstructions(docsDir, seedPath, { now } = {}) {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true, mode: 0o700 });
  }

  const claudePath = path.join(docsDir, "CLAUDE.md");

  let seed = null;
  try {
    seed = fs.readFileSync(seedPath, "utf8");
  } catch {
    return { path: claudePath, action: "skipped", backup: null };
  }

  let existing = null;
  try {
    existing = fs.readFileSync(claudePath, "utf8");
  } catch {
    existing = null;
  }

  // Already on the current managed seed — leave it (operators may have
  // appended notes below the seed; we only re-seed on stale/older content).
  if (existing !== null && isCurrentSeed(existing)) {
    return { path: claudePath, action: "kept", backup: null };
  }

  if (existing === null) {
    fs.writeFileSync(claudePath, seed);
    return { path: claudePath, action: "created", backup: null };
  }

  // A file exists but is not the current managed seed: stale QuadWork
  // instructions, operator notes, or an older managed version. Back it up
  // before overwriting so nothing is lost without a trail.
  let backup = null;
  if (existing.trim()) {
    backup = pickBackupPath(claudePath, now);
    fs.copyFileSync(claudePath, backup);
  }
  fs.writeFileSync(claudePath, seed);
  return { path: claudePath, action: "updated", backup };
}

module.exports = {
  SEED_MARKER,
  SEED_MARKER_PREFIX,
  SEED_VERSION,
  DEFAULT_BUTLER_CWD,
  resolveButlerCwd,
  isManagedSeed,
  isCurrentSeed,
  ensureButlerInstructions,
};
