const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `quadplan-config-test-${Date.now()}`);
const TEST_CONFIG_PATH = path.join(TEST_DIR, "config.json");

let origHomedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  origHomedir = os.homedir;
  os.homedir = () => TEST_DIR;
  delete require.cache[require.resolve("./config")];
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function freshConfig() {
  delete require.cache[require.resolve("./config")];
  return require("./config");
}

describe("QuadPlan config schema", () => {
  it("CONFIG_DIR points to ~/.quadplan", () => {
    const { CONFIG_DIR } = freshConfig();
    assert.equal(CONFIG_DIR, path.join(TEST_DIR, ".quadplan"));
  });

  it("CONFIG_PATH points to ~/.quadplan/config.json", () => {
    const { CONFIG_PATH } = freshConfig();
    assert.equal(CONFIG_PATH, path.join(TEST_DIR, ".quadplan", "config.json"));
  });

  it("readConfig creates default config with butler field", () => {
    const { readConfig, CONFIG_PATH } = freshConfig();
    try { fs.unlinkSync(CONFIG_PATH); } catch {}
    const config = readConfig();
    assert.equal(config.port, 8500);
    assert.equal(config.operator_name, "user");
    assert.ok(config.butler, "default config should include butler");
    assert.equal(config.butler.enabled, false);
    assert.equal(config.butler.cwd, null);
    assert.equal(config.butler.command, null);
    assert.ok(Array.isArray(config.projects));
    assert.equal(config.projects.length, 0);
  });

  it("writeConfig + readConfig round-trips QuadPlan config with butler", () => {
    const { readConfig, writeConfig, CONFIG_PATH } = freshConfig();
    const cfg = {
      port: 8500,
      operator_name: "user",
      butler: {
        enabled: true,
        cwd: "/tmp/butler-workspace",
        command: "codex",
      },
      projects: [],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig(cfg);
    const loaded = readConfig();
    assert.equal(loaded.butler.enabled, true);
    assert.equal(loaded.butler.cwd, "/tmp/butler-workspace");
    assert.equal(loaded.butler.command, "codex");
  });

  it("writeConfig + readConfig round-trips project with proposal_path, queue_path, artifact_dir", () => {
    const { readConfig, writeConfig, CONFIG_PATH } = freshConfig();
    const cfg = {
      port: 8500,
      operator_name: "user",
      butler: { enabled: false, cwd: null, command: null },
      projects: [
        {
          id: "myproject",
          name: "My Project",
          repo: "owner/myproject",
          working_dir: "/tmp/myproject",
          proposal_path: "/tmp/myproject/docs/PROPOSAL.md",
          queue_path: "/tmp/.quadplan/myproject/OVERNIGHT-QUEUE.md",
          artifact_dir: "/tmp/myproject/artifacts",
          agents: {
            head: { cwd: "/tmp/myproject-head", command: "codex" },
            re1: { cwd: "/tmp/myproject-re1", command: "codex" },
            re2: { cwd: "/tmp/myproject-re2", command: "claude" },
          },
        },
      ],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig(cfg);
    const loaded = readConfig();
    const project = loaded.projects[0];
    assert.equal(project.id, "myproject");
    assert.equal(project.proposal_path, "/tmp/myproject/docs/PROPOSAL.md");
    assert.equal(project.queue_path, "/tmp/.quadplan/myproject/OVERNIGHT-QUEUE.md");
    assert.equal(project.artifact_dir, "/tmp/myproject/artifacts");
  });

  it("project config works without dev agent", () => {
    const { readConfig, writeConfig, resolveAgentCwd, CONFIG_PATH } = freshConfig();
    const cfg = {
      port: 8500,
      operator_name: "user",
      butler: { enabled: false, cwd: null, command: null },
      projects: [
        {
          id: "nodev",
          name: "No Dev Project",
          agents: {
            head: { cwd: "/tmp/nodev-head", command: "codex" },
            re1: { cwd: "/tmp/nodev-re1", command: "codex" },
            re2: { cwd: "/tmp/nodev-re2", command: "claude" },
          },
        },
      ],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig(cfg);
    assert.equal(resolveAgentCwd("nodev", "head"), "/tmp/nodev-head");
    assert.equal(resolveAgentCwd("nodev", "re1"), "/tmp/nodev-re1");
    assert.equal(resolveAgentCwd("nodev", "re2"), "/tmp/nodev-re2");
    assert.equal(resolveAgentCwd("nodev", "dev"), null);
  });

  it("no-dev project config: Object.keys(agents) returns exactly head/re1/re2", () => {
    const { readConfig, writeConfig, CONFIG_PATH } = freshConfig();
    const cfg = {
      port: 8500,
      operator_name: "user",
      butler: { enabled: false, cwd: null, command: null },
      projects: [
        {
          id: "threeagent",
          name: "Three Agent Project",
          agents: {
            head: { cwd: "/tmp/ta-head", command: "claude" },
            re1: { cwd: "/tmp/ta-re1", command: "claude" },
            re2: { cwd: "/tmp/ta-re2", command: "codex" },
          },
        },
      ],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig(cfg);
    const loaded = readConfig();
    const agentIds = Object.keys(loaded.projects[0].agents);
    assert.deepEqual(agentIds.sort(), ["head", "re1", "re2"]);
    assert.ok(!agentIds.includes("dev"));
  });

  it("resolveButlerConfig returns butler settings", () => {
    const { writeConfig, resolveButlerConfig, CONFIG_PATH } = freshConfig();
    const cfg = {
      port: 8500,
      operator_name: "user",
      butler: { enabled: true, cwd: "/tmp/butler", command: "claude" },
      projects: [],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig(cfg);
    const butler = resolveButlerConfig();
    assert.equal(butler.enabled, true);
    assert.equal(butler.cwd, "/tmp/butler");
    assert.equal(butler.command, "claude");
  });

  it("resolveButlerConfig returns defaults when butler is missing", () => {
    const { writeConfig, resolveButlerConfig, CONFIG_PATH } = freshConfig();
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig({ port: 8500, operator_name: "user", projects: [] });
    const butler = resolveButlerConfig();
    assert.equal(butler.enabled, false);
    assert.equal(butler.cwd, null);
    assert.equal(butler.command, null);
  });

  it("resolveProjectPaths returns project paths with queue_path fallback", () => {
    const { writeConfig, resolveProjectPaths, CONFIG_DIR, CONFIG_PATH } = freshConfig();
    const cfg = {
      port: 8500,
      operator_name: "user",
      butler: { enabled: false, cwd: null, command: null },
      projects: [
        {
          id: "pathtest",
          name: "Path Test",
          proposal_path: "/tmp/pathtest/docs/PROPOSAL.md",
          artifact_dir: "/tmp/pathtest/artifacts",
          agents: { head: { cwd: "/tmp/pathtest-head" } },
        },
      ],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    writeConfig(cfg);
    const paths = resolveProjectPaths("pathtest");
    assert.equal(paths.proposal_path, "/tmp/pathtest/docs/PROPOSAL.md");
    assert.equal(paths.queue_path, path.join(CONFIG_DIR, "pathtest", "OVERNIGHT-QUEUE.md"));
    assert.equal(paths.artifact_dir, "/tmp/pathtest/artifacts");
  });

  it("resolveProjectPaths returns null for unknown project", () => {
    const { resolveProjectPaths } = freshConfig();
    assert.equal(resolveProjectPaths("nonexistent"), null);
  });

  it("sanitizeOperatorName rejects butler as reserved", () => {
    const { sanitizeOperatorName } = freshConfig();
    assert.equal(sanitizeOperatorName("butler"), "user");
    assert.equal(sanitizeOperatorName("Butler"), "user");
  });
});
