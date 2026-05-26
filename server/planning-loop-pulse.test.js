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
  it("writes a chat message via fileChat.appendMessage", () => {
    const { CONFIG_DIR } = require("./config");
    const chatDir = path.join(CONFIG_DIR, "pulsetest", "chat");
    fs.mkdirSync(chatDir, { recursive: true });

    const fileChat = require("./file-chat");
    fileChat.initProject("pulsetest");

    const { sendPlanningPulse, PLANNING_PULSE_MESSAGE } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("pulsetest", null, fileChat);

    assert.equal(result.ok, true);
    assert.equal(result.message, PLANNING_PULSE_MESSAGE);

    const messages = fileChat.readMessages("pulsetest", { limit: 10 });
    assert.ok(messages.length >= 1);
    const pulse = messages[messages.length - 1];
    assert.equal(pulse.sender, "system");
    assert.ok(pulse.text.includes("Queue check"));
  });

  it("supports custom message", () => {
    const { CONFIG_DIR } = require("./config");
    const chatDir = path.join(CONFIG_DIR, "pulsetest2", "chat");
    fs.mkdirSync(chatDir, { recursive: true });

    const fileChat = require("./file-chat");
    fileChat.initProject("pulsetest2");

    const { sendPlanningPulse } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("pulsetest2", "@head Custom pulse", fileChat);

    assert.equal(result.ok, true);
    assert.equal(result.message, "@head Custom pulse");

    const messages = fileChat.readMessages("pulsetest2", { limit: 10 });
    const pulse = messages[messages.length - 1];
    assert.ok(pulse.text.includes("Custom pulse"));
  });

  it("PLANNING_PULSE_MESSAGE matches issue #24 standard format", () => {
    const { PLANNING_PULSE_MESSAGE } = require("./planning-loop-pulse");
    assert.ok(PLANNING_PULSE_MESSAGE.includes("@head"));
    assert.ok(PLANNING_PULSE_MESSAGE.includes("Queue check"));
    assert.ok(PLANNING_PULSE_MESSAGE.includes("QuadPlan"));
    assert.ok(PLANNING_PULSE_MESSAGE.includes("OVERNIGHT-QUEUE.md"));
    assert.ok(!PLANNING_PULSE_MESSAGE.includes("@dev"));
  });
});
