const SUPPORTED_INTERVALS = [5, 10, 15, 30];
const DEFAULT_INTERVAL_MIN = 10;

const LOOP_STATES = {
  RUNNING: "running",
  PAUSED: "paused",
  ERROR: "error",
};

function createLoopState(opts = {}) {
  const intervalMin = SUPPORTED_INTERVALS.includes(opts.intervalMin)
    ? opts.intervalMin
    : DEFAULT_INTERVAL_MIN;
  const enabled = !!opts.enabled;
  const knownStates = new Set(Object.values(LOOP_STATES));
  let state;
  if (!enabled) {
    state = LOOP_STATES.PAUSED;
  } else if (opts.state && knownStates.has(opts.state)) {
    state = opts.state;
  } else {
    state = LOOP_STATES.RUNNING;
  }
  return {
    enabled,
    intervalMin,
    intervalMs: intervalMin * 60 * 1000,
    state,
    lastPulse: opts.lastPulse || null,
    nextPulse: enabled ? (opts.nextPulse || computeNextPulse(opts.lastPulse, intervalMin)) : null,
    lastError: opts.lastError || null,
  };
}

function computeNextPulse(lastPulse, intervalMin) {
  const intervalMs = intervalMin * 60 * 1000;
  if (!lastPulse) return Date.now() + intervalMs;
  const next = new Date(lastPulse).getTime() + intervalMs;
  return next > Date.now() ? next : Date.now() + intervalMs;
}

function afterPulse(loopState, error) {
  const now = Date.now();
  if (error) {
    return {
      ...loopState,
      state: LOOP_STATES.ERROR,
      lastPulse: now,
      lastError: typeof error === "string" ? error : error.message || "Unknown error",
      nextPulse: computeNextPulse(now, loopState.intervalMin),
    };
  }
  return {
    ...loopState,
    state: LOOP_STATES.RUNNING,
    lastPulse: now,
    lastError: null,
    nextPulse: computeNextPulse(now, loopState.intervalMin),
  };
}

function pause(loopState) {
  return { ...loopState, enabled: false, state: LOOP_STATES.PAUSED, nextPulse: null };
}

function resume(loopState, intervalMin) {
  const interval = SUPPORTED_INTERVALS.includes(intervalMin)
    ? intervalMin
    : loopState.intervalMin;
  return {
    ...loopState,
    enabled: true,
    intervalMin: interval,
    intervalMs: interval * 60 * 1000,
    state: LOOP_STATES.RUNNING,
    nextPulse: computeNextPulse(loopState.lastPulse, interval),
    lastError: null,
  };
}

function countdown(loopState) {
  if (!loopState.nextPulse) return null;
  const ms = loopState.nextPulse - Date.now();
  return ms > 0 ? ms : 0;
}

module.exports = {
  SUPPORTED_INTERVALS,
  DEFAULT_INTERVAL_MIN,
  LOOP_STATES,
  createLoopState,
  computeNextPulse,
  afterPulse,
  pause,
  resume,
  countdown,
};
