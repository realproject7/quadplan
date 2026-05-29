"use strict";

// #106: Single source of truth for the agent model dropdowns, shared by the
// per-agent Agent Models widget and the Butler settings selector.
//
// Empty string = use the CLI's own default (no -c / --model flag). Operators
// who need a bleeding-edge slug can still hand-edit ~/.quadplan/config.json;
// these lists are the guided happy path and the persisted value is always
// kept selectable via withCustomOption() even if it isn't listed here.
//
// Codex policy: mirror exactly the models the Codex CLI surfaces in its own
// picker — every model with visibility:"list" in ~/.codex/models_cache.json,
// ordered newest-first by the cache's priority. Hidden/internal models (e.g.
// codex-auto-review, visibility:"hide") are excluded. Verified against
// codex-cli 0.135.0 in this environment. Claude lists claude-opus-4-8 first
// as the current top model.
/** @typedef {{ value: string, label: string }} ModelOption */

/** @type {Record<string, ModelOption[]>} */
const MODEL_OPTIONS = {
  codex: [
    { value: "", label: "(CLI default)" },
    { value: "gpt-5.5", label: "gpt-5.5" },
    { value: "gpt-5.4", label: "gpt-5.4" },
    { value: "gpt-5.4-mini", label: "gpt-5.4-mini" },
    { value: "gpt-5.3-codex", label: "gpt-5.3-codex" },
    { value: "gpt-5.3-codex-spark", label: "gpt-5.3-codex-spark" },
    { value: "gpt-5.2", label: "gpt-5.2" },
  ],
  claude: [
    { value: "", label: "(CLI default)" },
    { value: "claude-opus-4-8", label: "claude-opus-4-8" },
    { value: "claude-opus-4-7", label: "claude-opus-4-7" },
    { value: "claude-opus-4-6", label: "claude-opus-4-6" },
    { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
    { value: "claude-haiku-4-5-20251001", label: "claude-haiku-4-5" },
  ],
  gemini: [
    { value: "", label: "(CLI default)" },
    { value: "gemini-2.5-pro", label: "gemini-2.5-pro" },
    { value: "gemini-2.5-flash", label: "gemini-2.5-flash" },
  ],
};

/**
 * @param {string} backend
 * @returns {ModelOption[]}
 */
function optionsForBackend(backend) {
  return MODEL_OPTIONS[backend] || [{ value: "", label: "(CLI default)" }];
}

// Keep a persisted model selectable even when it isn't in the shipped list —
// e.g. a hand-edited slug, a now-removed legacy model, or the Butler "opus"
// alias default — so existing configs render their value instead of silently
// losing it. Returns a new array; never mutates the input.
/**
 * @param {ModelOption[]} options
 * @param {string} current
 * @param {string} [customLabel]
 * @returns {ModelOption[]}
 */
function withCustomOption(options, current, customLabel = "(custom)") {
  if (current && !options.some((o) => o.value === current)) {
    return [...options, { value: current, label: `${current} ${customLabel}` }];
  }
  return options;
}

module.exports = { MODEL_OPTIONS, optionsForBackend, withCustomOption };
