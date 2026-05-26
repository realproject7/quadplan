const fs = require("fs");
const path = require("path");
const { CONFIG_DIR, ensureSecureDir } = require("./config");

const PLANNING_PULSE_MESSAGE = `@head @re1 @re2 — Queue check.
HEAD: Continue the next planning item from OVERNIGHT-QUEUE.md.
RE1/RE2: Review open artifacts. If HEAD pushed revisions, re-review. Post verdict and notify here.
ALL: Communicate via this chat by tagging agents. Your terminal is NOT visible.`;

function sendPlanningPulse(projectId, customMessage) {
  const message = customMessage || PLANNING_PULSE_MESSAGE;
  try {
    const chatDir = path.join(CONFIG_DIR, projectId, "chat");
    ensureSecureDir(chatDir);
    const chatFile = path.join(chatDir, "general.jsonl");

    let nextId = 1;
    if (fs.existsSync(chatFile)) {
      const lines = fs.readFileSync(chatFile, "utf-8").trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (rec.id >= nextId) nextId = rec.id + 1;
        } catch {}
      }
    }

    const record = {
      id: nextId,
      seq: nextId,
      ts: new Date().toISOString(),
      sender: "system",
      channel: "general",
      type: "message",
      text: message,
      mentions: extractMentions(message),
    };

    fs.appendFileSync(chatFile, JSON.stringify(record) + "\n");
    return { ok: true, message };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to send pulse" };
  }
}

function extractMentions(text) {
  const re = /@(\w[\w-]*)/g;
  const mentions = [];
  let m;
  while ((m = re.exec(text)) !== null) mentions.push(m[1]);
  return [...new Set(mentions)];
}

module.exports = {
  PLANNING_PULSE_MESSAGE,
  sendPlanningPulse,
};
