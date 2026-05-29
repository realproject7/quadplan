// #109: A project registered in config while the server is running (CLI,
// manual config edit, or Butler editing config.json) must be able to
// receive chat messages immediately, without a server restart. Before the
// fix, POST /api/chat returned 500 "Project ... not initialized".

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");

const TEST_DIR = path.join(os.tmpdir(), `live-chat-init-test-${Date.now()}`);
const origHomedir = os.homedir;

let routes, fileChat, express;
let server, baseUrl;

function writeConfig(cfg) {
  const dir = path.join(TEST_DIR, ".quadplan");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(cfg, null, 2));
}

// Minimal JSON HTTP client over the test server.
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${baseUrl}${urlPath}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          let json = null;
          try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }
          resolve({ status: res.statusCode, json, raw });
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

before(async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;

  // Seed config with a file-chat project that the running server has NOT
  // initialized (the Butler-created-project scenario).
  writeConfig({
    port: 8500,
    projects: [
      { id: "qp-dogfood", name: "Dogfood", repo: "owner/repo", chat_mode: "file" },
    ],
  });

  // Reload config + file-chat + routes so they all bind to TEST_DIR.
  delete require.cache[require.resolve("./config")];
  delete require.cache[require.resolve("./file-chat")];
  delete require.cache[require.resolve("./routes")];
  fileChat = require("./file-chat");
  routes = require("./routes");
  express = require("express");

  const app = express();
  app.use(express.json());
  app.use(routes);
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (routes && routes._testCleanup) routes._testCleanup();
  if (server) await new Promise((r) => server.close(r));
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("#109 on-demand file-chat init", () => {
  it("starts with the configured project uninitialized in the live server", () => {
    assert.equal(fileChat.isInitialized("qp-dogfood"), false);
  });

  it("ensureFileChatReady reports missing for an unknown project", () => {
    assert.equal(routes.ensureFileChatReady("does-not-exist"), "missing");
  });

  it("POST /api/chat succeeds immediately for a not-yet-initialized project", async () => {
    const res = await request("POST", "/api/chat?project=qp-dogfood", { text: "hello @head" });
    assert.equal(res.status, 200, `expected 200, got ${res.status}: ${res.raw}`);
    assert.equal(res.json.ok, true);
    assert.equal(res.json.message.sender, "user");
    assert.deepEqual(res.json.message.mentions, ["head"]);
    // The server now holds live runtime for the project.
    assert.equal(fileChat.isInitialized("qp-dogfood"), true);
  });

  it("the message is persisted and readable via GET /api/chat", async () => {
    const res = await request("GET", "/api/chat?project=qp-dogfood&limit=10");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json));
    assert.ok(res.json.some((m) => m.text === "hello @head"));
    // and on disk
    const file = path.join(TEST_DIR, ".quadplan", "qp-dogfood", "chat", "general.jsonl");
    assert.ok(fs.existsSync(file), "chat jsonl should exist on disk");
  });

  it("POST /api/chat returns JSON 404 for an unknown project (not HTML)", async () => {
    const res = await request("POST", "/api/chat?project=ghost", { text: "hi" });
    assert.equal(res.status, 404);
    assert.match(res.json.error, /Unknown project/);
  });

  it("POST /api/chat returns JSON 400 when text is missing", async () => {
    const res = await request("POST", "/api/chat?project=qp-dogfood", {});
    assert.equal(res.status, 400);
    assert.equal(res.json.error, "text required");
  });

  it("add-config registration leaves file-chat initialized immediately", async () => {
    const workingDir = path.join(TEST_DIR, "newproj");
    fs.mkdirSync(workingDir, { recursive: true });
    const res = await request("POST", "/api/setup?step=add-config", {
      id: "qp-fresh",
      name: "Fresh",
      repo: "owner/fresh",
      workingDir,
    });
    assert.equal(res.status, 200, res.raw);
    assert.equal(res.json.ok, true);
    assert.equal(fileChat.isInitialized("qp-fresh"), true);

    const chat = await request("POST", "/api/chat?project=qp-fresh", { text: "first message" });
    assert.equal(chat.status, 200, chat.raw);
    assert.equal(chat.json.ok, true);
  });
});
