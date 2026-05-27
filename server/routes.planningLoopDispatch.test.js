const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const express = require("express");

const TEST_DIR = path.join(os.tmpdir(), `routes-planning-loop-dispatch-${Date.now()}`);
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

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

test("planning-loop pulse route dispatches appended chat message to PTY callback", async () => {
  const { writeConfig, CONFIG_DIR, ensureSecureDir } = require("./config");
  const projectId = "routepulse";
  ensureSecureDir(CONFIG_DIR);
  writeConfig({
    port: 8500,
    operator_name: "user",
    butler: { enabled: false, cwd: null, command: null },
    projects: [
      {
        id: projectId,
        name: "Route Pulse",
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

  const routes = require("./routes");
  const dispatched = [];
  routes.setPtyDispatchCallback((project, msg) => dispatched.push({ project, msg }));

  const app = express();
  app.use(express.json());
  app.use(routes);

  const server = await listen(app);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/planning-loop/pulse?project=${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(dispatched.length, 1);
    assert.equal(dispatched[0].project, projectId);
    assert.equal(dispatched[0].msg.sender, "system");
    assert.equal(dispatched[0].msg.type, "message");
    assert.deepEqual(dispatched[0].msg.mentions, ["head"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    routes.setPtyDispatchCallback(null);
    if (typeof routes._testCleanup === "function") routes._testCleanup();
  }
});
