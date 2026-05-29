// #106: Agent model registry refresh — config persistence for the updated
// model list (claude-opus-4-8 + current Codex slugs), reasoning_supported
// reporting, effort validation, and the documented Codex "medium" default
// for fresh projects. Existing configs naming older models must still load.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");

const TEST_DIR = path.join(os.tmpdir(), `agent-models-test-${Date.now()}`);
const origHomedir = os.homedir;

let routes, express, server, baseUrl;

function writeConfig(cfg) {
  const dir = path.join(TEST_DIR, ".quadplan");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(cfg, null, 2));
}
function readConfig() {
  return JSON.parse(fs.readFileSync(path.join(TEST_DIR, ".quadplan", "config.json"), "utf8"));
}

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(`${baseUrl}${urlPath}`, {
      method,
      headers: { "Content-Type": "application/json", ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}) },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }
        resolve({ status: res.statusCode, json, raw });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

before(async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
  writeConfig({
    port: 8500,
    projects: [
      {
        id: "qp-models",
        name: "Models",
        chat_mode: "file",
        agents: {
          // codex head with a legacy model slug that's no longer in the
          // dropdown — must still load and be reported back verbatim.
          head: { command: "codex", model: "gpt-4o", reasoning_effort: "medium" },
          re1: { command: "claude", model: "claude-opus-4-7" },
          re2: { command: "claude" },
        },
      },
    ],
  });

  delete require.cache[require.resolve("./config")];
  delete require.cache[require.resolve("./file-chat")];
  delete require.cache[require.resolve("./routes")];
  routes = require("./routes");
  express = require("express");

  const app = express();
  app.use(express.json());
  app.use(routes);
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (routes && routes._testCleanup) routes._testCleanup();
  if (server) await new Promise((r) => server.close(r));
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("#106 agent model registry", () => {
  it("reports reasoning_supported only for Codex; preserves legacy model slugs", async () => {
    const res = await request("GET", "/api/project/qp-models/agent-models");
    assert.equal(res.status, 200);
    const byId = Object.fromEntries(res.json.agents.map((a) => [a.agent_id, a]));
    assert.equal(byId.head.backend, "codex");
    assert.equal(byId.head.reasoning_supported, true);
    // legacy slug still loads and round-trips (existing configs keep working)
    assert.equal(byId.head.model, "gpt-4o");
    assert.equal(byId.re1.backend, "claude");
    assert.equal(byId.re1.reasoning_supported, false);
    assert.equal(byId.re1.model, "claude-opus-4-7");
  });

  it("persists claude-opus-4-8 as a per-agent model override", async () => {
    const put = await request("PUT", "/api/project/qp-models/agent-models/re1", { model: "claude-opus-4-8" });
    assert.equal(put.status, 200);
    assert.equal(put.json.ok, true);
    assert.equal(put.json.agent.model, "claude-opus-4-8");
    assert.equal(readConfig().projects[0].agents.re1.model, "claude-opus-4-8");
  });

  it("persists a current Codex slug + reasoning effort", async () => {
    const put = await request("PUT", "/api/project/qp-models/agent-models/head", { model: "gpt-5.5", reasoning_effort: "high" });
    assert.equal(put.status, 200);
    assert.equal(put.json.ok, true);
    const agent = readConfig().projects[0].agents.head;
    assert.equal(agent.model, "gpt-5.5");
    assert.equal(agent.reasoning_effort, "high");
  });

  it("rejects an invalid reasoning effort (e.g. xhigh)", async () => {
    const put = await request("PUT", "/api/project/qp-models/agent-models/head", { reasoning_effort: "xhigh" });
    assert.equal(put.json.ok, false);
    assert.match(put.json.error, /Invalid reasoning_effort/);
  });

  it("defaults fresh Codex agents to reasoning_effort=medium (kept by decision)", async () => {
    const workingDir = path.join(TEST_DIR, "freshproj");
    fs.mkdirSync(workingDir, { recursive: true });
    const res = await request("POST", "/api/setup?step=add-config", {
      id: "qp-fresh-codex",
      name: "FreshCodex",
      repo: "owner/r",
      workingDir,
      backends: { head: "codex", re1: "claude", re2: "claude" },
    });
    assert.equal(res.status, 200, res.raw);
    const proj = readConfig().projects.find((p) => p.id === "qp-fresh-codex");
    // Decision (#343/#106): keep medium — high/xhigh is the capacity hot spot.
    assert.equal(proj.agents.head.reasoning_effort, "medium");
    // Claude agents get no reasoning_effort (effort follows Claude Code default).
    assert.equal(proj.agents.re1.reasoning_effort, undefined);
  });
});
