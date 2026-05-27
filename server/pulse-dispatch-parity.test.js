const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const express = require("express");

const TEST_DIR = path.join(os.tmpdir(), `pulse-parity-${Date.now()}`);
const origHomedir = os.homedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
  for (const mod of ["./config", "./file-chat", "./routes", "./planning-loop-pulse"]) {
    try { delete require.cache[require.resolve(mod)]; } catch {}
  }
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function setupProject(projectId) {
  const { writeConfig, CONFIG_DIR, ensureSecureDir } = require("./config");
  ensureSecureDir(CONFIG_DIR);
  writeConfig({
    port: 8500,
    operator_name: "user",
    butler: { enabled: false, cwd: null, command: null },
    projects: [
      {
        id: projectId,
        name: "Parity Test",
        working_dir: path.join(TEST_DIR, "workspace"),
        proposal_path: path.join(TEST_DIR, "workspace", "docs", "PROPOSAL.md"),
        queue_path: path.join(CONFIG_DIR, projectId, "OVERNIGHT-QUEUE.md"),
        artifact_dir: path.join(TEST_DIR, "workspace", "artifacts"),
        agents: {
          head: { cwd: path.join(TEST_DIR, "head") },
          re1: { cwd: path.join(TEST_DIR, "re1") },
          re2: { cwd: path.join(TEST_DIR, "re2") },
        },
        chat_mode: "file",
      },
    ],
  });
  const fileChat = require("./file-chat");
  fileChat.initProject(projectId);
  return fileChat;
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function createServer(projectId) {
  setupProject(projectId);
  const routes = require("./routes");
  const dispatched = [];
  routes.setPtyDispatchCallback((project, msg) => dispatched.push({ project, msg }));
  const app = express();
  app.use(express.json());
  app.use(routes);
  const server = await listen(app);
  return { server, routes, dispatched };
}

describe("pulse sender semantics", () => {
  it("pulse always uses sender='system'", () => {
    const fileChat = setupProject("sender1");
    const { sendPlanningPulse } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("sender1", null, fileChat);
    assert.equal(result.record.sender, "system");
  });

  it("custom message pulse still uses sender='system'", () => {
    const fileChat = setupProject("sender2");
    const { sendPlanningPulse } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("sender2", "@head custom task", fileChat);
    assert.equal(result.record.sender, "system");
  });
});

describe("pulse mention normalization (parity with /api/chat)", () => {
  it("normalizes bare agent names in custom pulse via route", async () => {
    const { server, routes, dispatched } = await createServer("mention1");
    try {
      const { port } = server.address();
      const res = await fetch(`http://127.0.0.1:${port}/api/planning-loop/pulse?project=mention1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "head should check the queue" }),
      });
      assert.equal(res.status, 200);
      const fileChat = require("./file-chat");
      const msgs = fileChat.readMessages("mention1", { limit: 10 });
      const pulse = msgs[msgs.length - 1];
      assert.ok(pulse.text.includes("@head"), "bare 'head' normalized to '@head'");
      assert.deepEqual(pulse.mentions, ["head"]);
    } finally {
      await new Promise((r) => server.close(r));
      routes.setPtyDispatchCallback(null);
      if (typeof routes._testCleanup === "function") routes._testCleanup();
    }
  });

  it("does not double-prefix already @-prefixed mentions", async () => {
    const { server, routes } = await createServer("mention2");
    try {
      const { port } = server.address();
      const res = await fetch(`http://127.0.0.1:${port}/api/planning-loop/pulse?project=mention2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "@head check the queue for @re1" }),
      });
      assert.equal(res.status, 200);
      const fileChat = require("./file-chat");
      const msgs = fileChat.readMessages("mention2", { limit: 10 });
      const pulse = msgs[msgs.length - 1];
      assert.ok(!pulse.text.includes("@@head"), "no double prefix on @head");
      assert.ok(!pulse.text.includes("@@re1"), "no double prefix on @re1");
    } finally {
      await new Promise((r) => server.close(r));
      routes.setPtyDispatchCallback(null);
      if (typeof routes._testCleanup === "function") routes._testCleanup();
    }
  });

  it("preserves code blocks during normalization", async () => {
    const { server, routes } = await createServer("mention3");
    try {
      const { port } = server.address();
      const res = await fetch(`http://127.0.0.1:${port}/api/planning-loop/pulse?project=mention3`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "head check `head = getValue()` now" }),
      });
      assert.equal(res.status, 200);
      const fileChat = require("./file-chat");
      const msgs = fileChat.readMessages("mention3", { limit: 10 });
      const pulse = msgs[msgs.length - 1];
      assert.ok(pulse.text.includes("`head = getValue()`"), "code block preserved");
      assert.ok(pulse.text.startsWith("@head"), "bare head outside code normalized");
    } finally {
      await new Promise((r) => server.close(r));
      routes.setPtyDispatchCallback(null);
      if (typeof routes._testCleanup === "function") routes._testCleanup();
    }
  });
});

describe("pulse PTY dispatch", () => {
  it("dispatches pulse record to PTY callback", async () => {
    const { server, routes, dispatched } = await createServer("pty1");
    try {
      const { port } = server.address();
      await fetch(`http://127.0.0.1:${port}/api/planning-loop/pulse?project=pty1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(dispatched.length, 1);
      assert.equal(dispatched[0].project, "pty1");
      assert.equal(dispatched[0].msg.sender, "system");
      assert.deepEqual(dispatched[0].msg.mentions, ["head"]);
    } finally {
      await new Promise((r) => server.close(r));
      routes.setPtyDispatchCallback(null);
      if (typeof routes._testCleanup === "function") routes._testCleanup();
    }
  });
});

describe("pulse loop guard behavior", () => {
  it("pulse skips loop guard hop counter (sender=system, type=message)", () => {
    const fileChat = setupProject("guard1");
    const { sendPlanningPulse } = require("./planning-loop-pulse");

    const maxHops = 3;
    for (let i = 0; i < maxHops; i++) {
      sendPlanningPulse("guard1", null, fileChat);
      // Pulses use _skipLoopGuard=true, so no checkLoopGuard call
    }
    assert.equal(fileChat.isLoopGuardPaused("guard1"), false,
      "pulses do not trigger loop guard pause");
  });

  it("timer callback skips pulse append and PTY dispatch when guard is paused", () => {
    const fileChat = setupProject("guard2");
    const { sendPlanningPulse, PLANNING_PULSE_MESSAGE } = require("./planning-loop-pulse");

    const dispatched = [];
    const msgCountBefore = fileChat.readMessages("guard2", { limit: 100 }).length;

    // Simulate the timer callback logic from routes.js /api/planning-loop/start
    // The actual timer callback does:
    //   if (fileChat.isLoopGuardPaused(projectId)) { return; }
    //   const result = sendPlanningPulse(...);
    //   if (callback && result.ok) callback(projectId, result.record);
    const timerCallback = () => {
      if (fileChat.isLoopGuardPaused("guard2")) return;
      const result = sendPlanningPulse("guard2", PLANNING_PULSE_MESSAGE, fileChat);
      if (result.ok && result.record) dispatched.push(result.record);
    };

    // Trigger loop guard pause
    const maxHops = 3;
    for (let i = 0; i < maxHops; i++) {
      const msg = fileChat.appendMessage("guard2", {
        sender: "head", text: `msg ${i}`, channel: "general",
      });
      fileChat.checkLoopGuard("guard2", msg, maxHops);
    }
    assert.ok(fileChat.isLoopGuardPaused("guard2"), "guard is paused");
    const msgCountAfterPause = fileChat.readMessages("guard2", { limit: 100 }).length;

    // Fire timer callback — should skip entirely
    timerCallback();

    const msgCountAfterTimer = fileChat.readMessages("guard2", { limit: 100 }).length;
    assert.equal(dispatched.length, 0, "no PTY dispatch when guard is paused");
    // Account for the system "Loop guard: paused" message that checkLoopGuard appends
    assert.equal(msgCountAfterTimer, msgCountAfterPause,
      "no pulse appended when guard is paused");

    // Reset guard and verify timer fires normally
    fileChat.resetLoopGuard("guard2");
    timerCallback();
    assert.equal(dispatched.length, 1, "pulse fires after guard reset");
    assert.equal(msgCountAfterTimer + 1,
      fileChat.readMessages("guard2", { limit: 100 }).length,
      "pulse appended after guard reset");
  });

  it("manual pulse appends message when guard is paused but dispatcher suppresses PTY wake", async () => {
    const { server, routes, dispatched } = await createServer("guard3");
    try {
      const { port } = server.address();
      const fileChat = require("./file-chat");

      // Trigger loop guard pause
      const maxHops = 3;
      for (let i = 0; i < maxHops; i++) {
        const msg = fileChat.appendMessage("guard3", {
          sender: "head", text: `msg ${i}`, channel: "general",
        });
        fileChat.checkLoopGuard("guard3", msg, maxHops);
      }
      assert.ok(fileChat.isLoopGuardPaused("guard3"), "guard is paused");

      // Manual pulse appends the message and invokes the dispatch callback
      const res = await fetch(`http://127.0.0.1:${port}/api/planning-loop/pulse?project=guard3`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(res.status, 200);
      assert.equal(dispatched.length, 1, "route invokes dispatch callback");

      // Message is persisted in chat even when guard is paused
      const msgs = fileChat.readMessages("guard3", { limit: 50 });
      const pulse = msgs.find(m => m.sender === "system" && m.text.includes("Queue check"));
      assert.ok(pulse, "pulse message persisted in chat log during paused guard");
    } finally {
      await new Promise((r) => server.close(r));
      routes.setPtyDispatchCallback(null);
      if (typeof routes._testCleanup === "function") routes._testCleanup();
    }
  });

  it("dispatchToAgentPTY suppresses PTY injection when guard is paused", () => {
    const { dispatchToAgentPTY, cleanupSession } = require("./pty-dispatcher");
    const written = [];
    const term = {
      write: (data) => written.push(data),
      onData: (cb) => ({ dispose: () => {} }),
    };
    const sessions = new Map();
    sessions.set("guard4/head", {
      projectId: "guard4", agentId: "head", term, state: "running", lastOutputAt: 0,
    });
    const deps = {
      isLoopGuardPaused: () => true,
      safeWrite: (t, data) => { t.write(data); return true; },
    };
    const msg = {
      id: 1, sender: "system", text: "@head Queue check", type: "message", mentions: ["head"],
    };
    dispatchToAgentPTY("guard4", msg, sessions, deps);
    assert.equal(written.length, 0, "dispatcher blocks PTY injection when guard is paused");
    cleanupSession("guard4/head");
  });
});

describe("pulse append mechanics", () => {
  it("appended record has correct fields", () => {
    const fileChat = setupProject("append1");
    const { sendPlanningPulse, PLANNING_PULSE_MESSAGE } = require("./planning-loop-pulse");
    const result = sendPlanningPulse("append1", null, fileChat);

    assert.equal(result.ok, true);
    assert.equal(typeof result.record.id, "number");
    assert.equal(typeof result.record.ts, "string");
    assert.equal(result.record.sender, "system");
    assert.equal(result.record.channel, "general");
    assert.equal(result.record.type, "message");
    assert.deepEqual(result.record.mentions, ["head"]);
  });

  it("pulse is persisted in JSONL file", () => {
    const fileChat = setupProject("append2");
    const { sendPlanningPulse } = require("./planning-loop-pulse");
    sendPlanningPulse("append2", null, fileChat);

    const messages = fileChat.readMessages("append2", { limit: 10 });
    assert.ok(messages.length >= 1);
    const last = messages[messages.length - 1];
    assert.equal(last.sender, "system");
    assert.ok(last.text.includes("Queue check"));
  });
});
