"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  SEED_MARKER,
  DEFAULT_BUTLER_CWD,
  resolveButlerCwd,
  isManagedSeed,
  isCurrentSeed,
  ensureButlerInstructions,
} = require("./butler-instructions");

const HOME = "/home/tester";
const SEED_BODY = `${SEED_MARKER}\n# Butler — QuadPlan\n\nQuadPlan instructions.\n`;

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "butler-instr-"));
}

function writeSeed(dir) {
  const seedPath = path.join(dir, "seed.md");
  fs.writeFileSync(seedPath, SEED_BODY);
  return seedPath;
}

test("resolveButlerCwd falls back to the QuadPlan-specific default (not ~/docs)", () => {
  const resolved = resolveButlerCwd(null, HOME);
  assert.strictEqual(resolved, path.join(HOME, ".quadplan/butler"));
  assert.strictEqual(DEFAULT_BUTLER_CWD, "~/.quadplan/butler");
  // empty / whitespace also falls back
  assert.strictEqual(resolveButlerCwd("", HOME), path.join(HOME, ".quadplan/butler"));
  assert.strictEqual(resolveButlerCwd("   ", HOME), path.join(HOME, ".quadplan/butler"));
});

test("resolveButlerCwd expands ~/ and passes absolute paths through", () => {
  assert.strictEqual(resolveButlerCwd("~/docs/", HOME), path.join(HOME, "docs/"));
  assert.strictEqual(resolveButlerCwd("~", HOME), HOME);
  assert.strictEqual(resolveButlerCwd("/var/butler", HOME), "/var/butler");
});

test("marker helpers distinguish managed vs stale content", () => {
  assert.ok(isManagedSeed(SEED_BODY));
  assert.ok(isCurrentSeed(SEED_BODY));
  assert.ok(!isManagedSeed("# QuadWork Butler\n~/.quadwork\n"));
  assert.ok(!isCurrentSeed(""));
  // managed but older version: prefix present, current marker absent
  const older = "<!-- quadplan-butler-seed: v0 -->\nold managed\n";
  assert.ok(isManagedSeed(older));
  assert.ok(!isCurrentSeed(older));
});

test("creates CLAUDE.md on a fresh directory", () => {
  const dir = tmpDir();
  const seedPath = writeSeed(dir);
  const target = path.join(dir, "work");
  const res = ensureButlerInstructions(target, seedPath);

  assert.strictEqual(res.action, "created");
  assert.strictEqual(res.backup, null);
  assert.strictEqual(fs.readFileSync(res.path, "utf8"), SEED_BODY);
});

test("keeps an existing current managed seed untouched (allows operator append)", () => {
  const dir = tmpDir();
  const seedPath = writeSeed(dir);
  const claudePath = path.join(dir, "CLAUDE.md");
  const withNotes = SEED_BODY + "\n## My operator notes\nkeep me\n";
  fs.writeFileSync(claudePath, withNotes);

  const res = ensureButlerInstructions(dir, seedPath);
  assert.strictEqual(res.action, "kept");
  assert.strictEqual(res.backup, null);
  assert.strictEqual(fs.readFileSync(claudePath, "utf8"), withNotes);
});

test("backs up a stale QuadWork CLAUDE.md before re-seeding", () => {
  const dir = tmpDir();
  const seedPath = writeSeed(dir);
  const claudePath = path.join(dir, "CLAUDE.md");
  const stale = "# QuadWork Butler\nUses ~/.quadwork, AgentChattr.\n";
  fs.writeFileSync(claudePath, stale);

  const now = new Date(2026, 4, 29, 1, 2, 3);
  const res = ensureButlerInstructions(dir, seedPath, { now });

  assert.strictEqual(res.action, "updated");
  assert.ok(res.backup, "expected a backup path");
  // active file is now the QuadPlan seed; stale content preserved in backup
  assert.strictEqual(fs.readFileSync(claudePath, "utf8"), SEED_BODY);
  assert.strictEqual(fs.readFileSync(res.backup, "utf8"), stale);
  assert.match(path.basename(res.backup), /^CLAUDE\.md\.bak-20260529010203/);
});

test("re-seeds an older managed version (with backup)", () => {
  const dir = tmpDir();
  const seedPath = writeSeed(dir);
  const claudePath = path.join(dir, "CLAUDE.md");
  fs.writeFileSync(claudePath, "<!-- quadplan-butler-seed: v0 -->\nold managed\n");

  const res = ensureButlerInstructions(dir, seedPath);
  assert.strictEqual(res.action, "updated");
  assert.ok(res.backup);
  assert.strictEqual(fs.readFileSync(claudePath, "utf8"), SEED_BODY);
});

test("an empty existing file is replaced without a needless backup", () => {
  const dir = tmpDir();
  const seedPath = writeSeed(dir);
  const claudePath = path.join(dir, "CLAUDE.md");
  fs.writeFileSync(claudePath, "   \n");

  const res = ensureButlerInstructions(dir, seedPath);
  assert.strictEqual(res.action, "updated");
  assert.strictEqual(res.backup, null);
  assert.strictEqual(fs.readFileSync(claudePath, "utf8"), SEED_BODY);
});

test("does not collide when a backup with the same timestamp exists", () => {
  const dir = tmpDir();
  const seedPath = writeSeed(dir);
  const claudePath = path.join(dir, "CLAUDE.md");
  fs.writeFileSync(claudePath, "stale one\n");
  const now = new Date(2026, 4, 29, 1, 2, 3);
  const first = ensureButlerInstructions(dir, seedPath, { now });

  // simulate a second stale write at the same wall-clock second
  fs.writeFileSync(claudePath, "stale two\n");
  const second = ensureButlerInstructions(dir, seedPath, { now });

  assert.notStrictEqual(first.backup, second.backup);
  assert.strictEqual(fs.readFileSync(first.backup, "utf8"), "stale one\n");
  assert.strictEqual(fs.readFileSync(second.backup, "utf8"), "stale two\n");
});

test("returns skipped when the seed file is unreadable", () => {
  const dir = tmpDir();
  const res = ensureButlerInstructions(dir, path.join(dir, "missing-seed.md"));
  assert.strictEqual(res.action, "skipped");
  assert.ok(!fs.existsSync(path.join(dir, "CLAUDE.md")));
});

test("the shipped Butler seed carries the current marker", () => {
  const shipped = path.join(__dirname, "..", "templates", "seeds", "butler.CLAUDE.md");
  const content = fs.readFileSync(shipped, "utf8");
  assert.ok(isCurrentSeed(content), "shipped seed must contain the current marker");
});
