const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `pulse-test-${Date.now()}`);
const origHomedir = os.homedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
  delete require.cache[require.resolve("./config")];
  delete require.cache[require.resolve("./file-chat")];
  delete require.cache[require.resolve("./planning-loop-pulse")];
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("sendPlanningPulse", () => {
  it("writes a chat message to the project chat file", () => {
    const { CONFIG_DIR } = require("./config");
    const chatDir = path.join(CONFIG_DIR, "pulsetest", "chat");
    fs.mkdirSync(chatDir, { recursive: true });

    const { sendPlanningPulse, PLANNING_PULSE_MESSAGE } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("pulsetest");

    assert.equal(result.ok, true);
    assert.equal(result.message, PLANNING_PULSE_MESSAGE);

    const chatFile = path.join(chatDir, "general.jsonl");
    assert.ok(fs.existsSync(chatFile), "Chat file should be created");

    const lines = fs.readFileSync(chatFile, "utf-8").trim().split("\n");
    assert.ok(lines.length >= 1);
    const msg = JSON.parse(lines[lines.length - 1]);
    assert.equal(msg.sender, "system");
    assert.equal(msg.channel, "general");
    assert.ok(msg.text.includes("Queue check"));
  });

  it("supports custom message", () => {
    const { CONFIG_DIR } = require("./config");
    const chatDir = path.join(CONFIG_DIR, "pulsetest2", "chat");
    fs.mkdirSync(chatDir, { recursive: true });

    const { sendPlanningPulse } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("pulsetest2", "@head Custom pulse message");

    assert.equal(result.ok, true);
    assert.equal(result.message, "@head Custom pulse message");

    const chatFile = path.join(chatDir, "general.jsonl");
    const lines = fs.readFileSync(chatFile, "utf-8").trim().split("\n");
    const msg = JSON.parse(lines[lines.length - 1]);
    assert.ok(msg.text.includes("Custom pulse message"));
  });

  it("PLANNING_PULSE_MESSAGE contains @head and Queue check", () => {
    const { PLANNING_PULSE_MESSAGE } = require("./planning-loop-pulse");
    assert.ok(PLANNING_PULSE_MESSAGE.includes("@head"));
    assert.ok(PLANNING_PULSE_MESSAGE.includes("Queue check"));
    assert.ok(!PLANNING_PULSE_MESSAGE.includes("@dev"));
  });
});
