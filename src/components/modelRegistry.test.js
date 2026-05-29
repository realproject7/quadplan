"use strict";

// #106: lock the shared agent-model registry — the list the Agent Models
// widget and Butler settings both render.

const test = require("node:test");
const assert = require("node:assert/strict");

const { MODEL_OPTIONS, optionsForBackend, withCustomOption } = require("./modelRegistry");

const values = (opts) => opts.map((o) => o.value);

test("Claude list leads with claude-opus-4-8 (after the CLI-default entry)", () => {
  const claude = MODEL_OPTIONS.claude;
  assert.equal(claude[0].value, ""); // (CLI default)
  assert.equal(claude[1].value, "claude-opus-4-8");
  // older models still offered for pinning
  assert.ok(values(claude).includes("claude-opus-4-7"));
  assert.ok(values(claude).includes("claude-sonnet-4-6"));
});

test("Codex list mirrors the env CLI's visibility:list models, newest-first", () => {
  // Exactly the visibility:"list" models from ~/.codex/models_cache.json
  // (codex-cli 0.135.0), ordered by the cache's priority; hidden internal
  // models (codex-auto-review) are excluded.
  assert.deepEqual(values(MODEL_OPTIONS.codex), [
    "",
    "gpt-5.5",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.3-codex",
    "gpt-5.3-codex-spark",
    "gpt-5.2",
  ]);
});

test("optionsForBackend falls back to CLI-default for unknown backends", () => {
  assert.deepEqual(optionsForBackend("nope"), [{ value: "", label: "(CLI default)" }]);
  assert.equal(optionsForBackend("gemini")[0].value, "");
});

test("withCustomOption keeps an out-of-list persisted value selectable", () => {
  const base = optionsForBackend("claude");
  // the Butler "opus" alias default is not a shipped slug → kept as custom
  const augmented = withCustomOption(base, "opus");
  const opus = augmented.find((o) => o.value === "opus");
  assert.ok(opus, "opus should be appended");
  assert.match(opus.label, /opus \(custom\)/);
  // a legacy slug an operator hand-edited stays selectable too
  assert.ok(withCustomOption(base, "gpt-4o").some((o) => o.value === "gpt-4o"));
});

test("withCustomOption is a no-op for listed values, empty, and does not mutate", () => {
  const base = optionsForBackend("claude");
  assert.equal(withCustomOption(base, "claude-opus-4-8"), base); // already present → same ref
  assert.equal(withCustomOption(base, ""), base); // empty current → same ref
  const before = base.length;
  withCustomOption(base, "something-new");
  assert.equal(base.length, before, "input array must not be mutated");
});

test("custom label is overridable (localized callers pass their own)", () => {
  const out = withCustomOption(optionsForBackend("codex"), "gpt-old", "(맞춤)");
  assert.match(out.find((o) => o.value === "gpt-old").label, /gpt-old \(맞춤\)/);
});
