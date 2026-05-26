const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  SUPPORTED_INTERVALS,
  DEFAULT_INTERVAL_MIN,
  LOOP_STATES,
  createLoopState,
  computeNextPulse,
  afterPulse,
  pause,
  resume,
  countdown,
} = require("./planning-loop");

describe("constants", () => {
  it("supported intervals are 5, 10, 15, 30", () => {
    assert.deepEqual(SUPPORTED_INTERVALS, [5, 10, 15, 30]);
  });

  it("default interval is 10 minutes", () => {
    assert.equal(DEFAULT_INTERVAL_MIN, 10);
  });
});

describe("createLoopState", () => {
  it("creates paused state by default", () => {
    const s = createLoopState();
    assert.equal(s.enabled, false);
    assert.equal(s.intervalMin, 10);
    assert.equal(s.state, LOOP_STATES.PAUSED);
    assert.equal(s.nextPulse, null);
    assert.equal(s.lastPulse, null);
  });

  it("creates running state when enabled", () => {
    const s = createLoopState({ enabled: true, intervalMin: 15 });
    assert.equal(s.enabled, true);
    assert.equal(s.intervalMin, 15);
    assert.equal(s.intervalMs, 15 * 60 * 1000);
    assert.equal(s.state, LOOP_STATES.RUNNING);
    assert.ok(s.nextPulse > Date.now() - 1000);
  });

  it("falls back to default interval for unsupported value", () => {
    const s = createLoopState({ enabled: true, intervalMin: 7 });
    assert.equal(s.intervalMin, 10);
  });
});

describe("computeNextPulse", () => {
  it("returns now + interval when no last pulse", () => {
    const before = Date.now();
    const next = computeNextPulse(null, 10);
    assert.ok(next >= before + 10 * 60 * 1000 - 50);
    assert.ok(next <= before + 10 * 60 * 1000 + 100);
  });

  it("returns lastPulse + interval when in the future", () => {
    const future = Date.now() + 5 * 60 * 1000;
    const next = computeNextPulse(future, 10);
    const expected = future + 10 * 60 * 1000;
    assert.ok(Math.abs(next - expected) < 100);
  });

  it("returns now + interval when lastPulse + interval is in the past", () => {
    const pastPulse = Date.now() - 20 * 60 * 1000;
    const before = Date.now();
    const next = computeNextPulse(pastPulse, 10);
    assert.ok(next >= before + 10 * 60 * 1000 - 50);
  });
});

describe("afterPulse", () => {
  it("updates state after successful pulse", () => {
    const s = createLoopState({ enabled: true, intervalMin: 5 });
    const updated = afterPulse(s, null);
    assert.equal(updated.state, LOOP_STATES.RUNNING);
    assert.ok(updated.lastPulse > 0);
    assert.equal(updated.lastError, null);
    assert.ok(updated.nextPulse > updated.lastPulse);
  });

  it("sets error state after failed pulse", () => {
    const s = createLoopState({ enabled: true });
    const updated = afterPulse(s, "Chat send failed");
    assert.equal(updated.state, LOOP_STATES.ERROR);
    assert.equal(updated.lastError, "Chat send failed");
    assert.ok(updated.nextPulse > Date.now() - 1000);
  });

  it("accepts Error objects", () => {
    const s = createLoopState({ enabled: true });
    const updated = afterPulse(s, new Error("Network timeout"));
    assert.equal(updated.lastError, "Network timeout");
  });
});

describe("pause and resume", () => {
  it("pause sets enabled false and clears nextPulse", () => {
    const s = createLoopState({ enabled: true, intervalMin: 10 });
    const paused = pause(s);
    assert.equal(paused.enabled, false);
    assert.equal(paused.state, LOOP_STATES.PAUSED);
    assert.equal(paused.nextPulse, null);
  });

  it("resume restores running state", () => {
    const s = pause(createLoopState({ enabled: true }));
    const resumed = resume(s, 15);
    assert.equal(resumed.enabled, true);
    assert.equal(resumed.intervalMin, 15);
    assert.equal(resumed.state, LOOP_STATES.RUNNING);
    assert.ok(resumed.nextPulse > Date.now() - 1000);
    assert.equal(resumed.lastError, null);
  });

  it("resume falls back to existing interval for unsupported value", () => {
    const s = createLoopState({ enabled: false, intervalMin: 30 });
    const resumed = resume(s, 99);
    assert.equal(resumed.intervalMin, 30);
  });
});

describe("countdown", () => {
  it("returns positive ms when next pulse is in the future", () => {
    const s = createLoopState({ enabled: true, intervalMin: 10 });
    const ms = countdown(s);
    assert.ok(ms > 0);
    assert.ok(ms <= 10 * 60 * 1000 + 100);
  });

  it("returns 0 when next pulse is in the past", () => {
    const s = { ...createLoopState({ enabled: true }), nextPulse: Date.now() - 5000 };
    assert.equal(countdown(s), 0);
  });

  it("returns null when paused", () => {
    const s = createLoopState({ enabled: false });
    assert.equal(countdown(s), null);
  });
});
