const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `quadplan-sep-test-${Date.now()}`);
let origHomedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  origHomedir = os.homedir;
  os.homedir = () => TEST_DIR;
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function freshConfig() {
  delete require.cache[require.resolve("./config")];
  return require("./config");
}

describe("QuadPlan / QuadWork side-by-side separation", () => {
  it("package.json exposes 'quadplan' command only, not 'quadwork'", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
    );
    assert.ok(pkg.bin.quadplan, "must expose quadplan command");
    assert.equal(pkg.bin.quadwork, undefined, "must NOT expose quadwork command");
  });

  it("package.json bin points to bin/quadplan.js", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
    );
    assert.match(pkg.bin.quadplan, /quadplan\.js$/);
  });

  it("CLI entry point file exists at bin/quadplan.js", () => {
    const entry = path.join(__dirname, "..", "bin", "quadplan.js");
    assert.ok(fs.existsSync(entry), "bin/quadplan.js must exist");
  });

  it("no bin/quadwork.js file exists", () => {
    const old = path.join(__dirname, "..", "bin", "quadwork.js");
    assert.ok(!fs.existsSync(old), "bin/quadwork.js must NOT exist");
  });

  it("CONFIG_DIR is ~/.quadplan, not ~/.quadwork", () => {
    const { CONFIG_DIR } = freshConfig();
    assert.ok(CONFIG_DIR.endsWith(".quadplan"), `CONFIG_DIR should end with .quadplan, got ${CONFIG_DIR}`);
    assert.ok(!CONFIG_DIR.includes(".quadwork"), "CONFIG_DIR must not reference .quadwork");
  });

  it("default port is 8500, not 8400", () => {
    const { readConfig, CONFIG_PATH } = freshConfig();
    try { fs.unlinkSync(CONFIG_PATH); } catch {}
    const config = readConfig();
    assert.equal(config.port, 8500, "default port must be 8500");
    assert.notEqual(config.port, 8400, "default port must NOT be 8400 (QuadWork's port)");
  });

  it("fresh startup writes to ~/.quadplan, never ~/.quadwork", () => {
    const { readConfig } = freshConfig();
    readConfig();
    const quadplanDir = path.join(TEST_DIR, ".quadplan");
    const quadworkDir = path.join(TEST_DIR, ".quadwork");
    assert.ok(fs.existsSync(quadplanDir), "~/.quadplan must be created");
    assert.ok(!fs.existsSync(quadworkDir), "~/.quadwork must NOT be created");
  });

  it("MCP chat shim identifies as quadplan-chat, not quadwork-chat", () => {
    const shimPath = path.join(__dirname, "mcp-chat-shim.js");
    const src = fs.readFileSync(shimPath, "utf-8");
    assert.ok(src.includes('"quadplan-chat"'), "serverInfo.name should be quadplan-chat");
    assert.ok(!src.includes('"quadwork-chat"'), "serverInfo.name must NOT be quadwork-chat");
  });
});
