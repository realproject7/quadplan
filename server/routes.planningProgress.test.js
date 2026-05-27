const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `planning-progress-test-${Date.now()}`);
const origHomedir = os.homedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function setup() {
  delete require.cache[require.resolve("./config")];
  const { writeConfig, CONFIG_DIR, CONFIG_PATH } = require("./config");
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  writeConfig({
    port: 8500,
    operator_name: "user",
    butler: { enabled: false, cwd: null, command: null },
    projects: [
      {
        id: "testproj",
        name: "Test Project",
        proposal_path: "/tmp/testproj/docs/PROPOSAL.md",
        queue_path: path.join(CONFIG_DIR, "testproj", "OVERNIGHT-QUEUE.md"),
        artifact_dir: "/tmp/testproj/artifacts",
        agents: { head: { cwd: "/tmp/testproj-head" }, re1: { cwd: "/tmp/testproj-re1" }, re2: { cwd: "/tmp/testproj-re2" } },
      },
    ],
  });
  return { CONFIG_DIR };
}

describe("resolveProjectPaths validation", () => {
  it("returns paths for known project", () => {
    setup();
    const { resolveProjectPaths } = require("./config");
    const paths = resolveProjectPaths("testproj");
    assert.ok(paths);
    assert.ok(paths.queue_path.includes("testproj"));
  });

  it("returns null for unknown project", () => {
    setup();
    const { resolveProjectPaths } = require("./config");
    assert.equal(resolveProjectPaths("nonexistent"), null);
  });

  it("returns null for traversal-like project id", () => {
    setup();
    const { resolveProjectPaths } = require("./config");
    assert.equal(resolveProjectPaths("../etc"), null);
    assert.equal(resolveProjectPaths("foo/../../bar"), null);
  });
});

describe("planning-progress empty state", () => {
  it("returns empty progress for known project with missing queue file", () => {
    const { CONFIG_DIR } = setup();
    const { parsePlanningQueue, summarizeBatch } = require("./planning-queue");
    const queuePath = path.join(CONFIG_DIR, "testproj", "OVERNIGHT-QUEUE.md");
    try { fs.unlinkSync(queuePath); } catch {}
    const result = parsePlanningQueue("");
    const summary = summarizeBatch(result.artifacts);
    assert.equal(summary.total, 0);
    assert.equal(summary.progress, 0);
  });

  it("returns artifact rows for known project with queue content", () => {
    const { CONFIG_DIR } = setup();
    const queueDir = path.join(CONFIG_DIR, "testproj");
    fs.mkdirSync(queueDir, { recursive: true });
    fs.writeFileSync(path.join(queueDir, "OVERNIGHT-QUEUE.md"), `## Active Batch

**Batch:** 1

- #46 Seed repo
- #47 Commit proposal
`);
    const { parsePlanningQueue, summarizeBatch } = require("./planning-queue");
    const text = fs.readFileSync(path.join(queueDir, "OVERNIGHT-QUEUE.md"), "utf-8");
    const { artifacts } = parsePlanningQueue(text);
    assert.equal(artifacts.length, 2);
    const summary = summarizeBatch(artifacts);
    assert.equal(summary.total, 2);
    assert.equal(summary.queued, 2);
  });
});
