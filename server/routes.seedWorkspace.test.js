const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `seed-workspace-test-${Date.now()}`);

const origHomedir = os.homedir;

let routes;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
  delete require.cache[require.resolve("./config")];
  delete require.cache[require.resolve("./routes")];
  routes = require("./routes");
});

after(() => {
  if (routes && routes._testCleanup) routes._testCleanup();
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("seedProjectWorkspace", () => {
  it("creates artifact directories and stub PROPOSAL.md", () => {
    const workDir = path.join(TEST_DIR, "proj1");
    fs.mkdirSync(workDir, { recursive: true });

    const seeded = routes.seedProjectWorkspace(workDir, "My Project");

    assert.ok(fs.existsSync(path.join(workDir, "docs")));
    assert.ok(fs.existsSync(path.join(workDir, "artifacts", "design")));
    assert.ok(fs.existsSync(path.join(workDir, "artifacts", "tickets")));
    assert.ok(fs.existsSync(path.join(workDir, "artifacts", "docs")));
    assert.ok(fs.existsSync(path.join(workDir, "docs", "PROPOSAL.md")));

    const proposal = fs.readFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "utf-8");
    assert.ok(proposal.includes("My Project"));

    assert.ok(seeded.includes("docs"));
    assert.ok(seeded.includes("docs/PROPOSAL.md"));
    assert.ok(seeded.length >= 5);
  });

  it("does not overwrite existing PROPOSAL.md", () => {
    const workDir = path.join(TEST_DIR, "proj2");
    fs.mkdirSync(path.join(workDir, "docs"), { recursive: true });
    fs.writeFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "# Existing proposal\n");

    routes.seedProjectWorkspace(workDir, "Test");

    const proposal = fs.readFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "utf-8");
    assert.equal(proposal, "# Existing proposal\n");
  });

  it("skips existing directories and files", () => {
    const workDir = path.join(TEST_DIR, "proj3");
    fs.mkdirSync(path.join(workDir, "artifacts", "design"), { recursive: true });
    fs.mkdirSync(path.join(workDir, "docs"), { recursive: true });
    fs.writeFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "existing");

    const seeded = routes.seedProjectWorkspace(workDir, "Test");
    assert.ok(seeded.includes("artifacts/tickets"));
    assert.ok(seeded.includes("artifacts/docs"));
    assert.ok(!seeded.includes("docs"));
    assert.ok(!seeded.includes("docs/PROPOSAL.md"));
  });

  it("returns empty array for nonexistent working directory", () => {
    const seeded = routes.seedProjectWorkspace("/tmp/does-not-exist-ever-xyz", "Test");
    assert.deepEqual(seeded, []);
  });
});

describe("seedProjectRuntime", () => {
  it("creates runtime directories under ~/.quadplan/{projectId}", () => {
    const { CONFIG_DIR } = require("./config");
    routes.seedProjectRuntime("testproj");
    assert.ok(fs.existsSync(path.join(CONFIG_DIR, "testproj", "chat")));
    assert.ok(fs.existsSync(path.join(CONFIG_DIR, "testproj", "history-snapshots")));
  });

  it("is idempotent — does not fail on existing dirs", () => {
    routes.seedProjectRuntime("testproj");
    routes.seedProjectRuntime("testproj");
  });
});

describe("PROJECT_AGENTS", () => {
  it("contains exactly head, re1, re2 with no dev", () => {
    assert.deepEqual(routes.PROJECT_AGENTS, ["head", "re1", "re2"]);
    assert.ok(!routes.PROJECT_AGENTS.includes("dev"));
  });
});
