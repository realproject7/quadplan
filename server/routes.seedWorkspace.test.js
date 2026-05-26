const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `seed-workspace-test-${Date.now()}`);

const origHomedir = os.homedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function loadRoutes() {
  delete require.cache[require.resolve("./config")];
  delete require.cache[require.resolve("./routes")];
  return require("./routes");
}

describe("seedProjectWorkspace", () => {
  it("creates artifact directories and stub PROPOSAL.md", () => {
    const { seedProjectWorkspace } = loadRoutes();
    const workDir = path.join(TEST_DIR, "proj1");
    fs.mkdirSync(workDir, { recursive: true });

    const seeded = seedProjectWorkspace(workDir, "My Project");

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
    const { seedProjectWorkspace } = loadRoutes();
    const workDir = path.join(TEST_DIR, "proj2");
    fs.mkdirSync(path.join(workDir, "docs"), { recursive: true });
    fs.writeFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "# Existing proposal\n");

    seedProjectWorkspace(workDir, "Test");

    const proposal = fs.readFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "utf-8");
    assert.equal(proposal, "# Existing proposal\n");
  });

  it("skips existing directories and files", () => {
    const { seedProjectWorkspace } = loadRoutes();
    const workDir = path.join(TEST_DIR, "proj3");
    fs.mkdirSync(path.join(workDir, "artifacts", "design"), { recursive: true });
    fs.mkdirSync(path.join(workDir, "docs"), { recursive: true });
    fs.writeFileSync(path.join(workDir, "docs", "PROPOSAL.md"), "existing");

    const seeded = seedProjectWorkspace(workDir, "Test");
    assert.ok(seeded.includes("artifacts/tickets"));
    assert.ok(seeded.includes("artifacts/docs"));
    assert.ok(!seeded.includes("docs"));
    assert.ok(!seeded.includes("docs/PROPOSAL.md"));
  });

  it("returns empty array for nonexistent working directory", () => {
    const { seedProjectWorkspace } = loadRoutes();
    const seeded = seedProjectWorkspace("/tmp/does-not-exist-ever-xyz", "Test");
    assert.deepEqual(seeded, []);
  });
});

describe("seedProjectRuntime", () => {
  it("creates runtime directories under ~/.quadplan/{projectId}", () => {
    const { seedProjectRuntime } = loadRoutes();
    const { CONFIG_DIR } = require("./config");

    seedProjectRuntime("testproj");

    assert.ok(fs.existsSync(path.join(CONFIG_DIR, "testproj", "chat")));
    assert.ok(fs.existsSync(path.join(CONFIG_DIR, "testproj", "history-snapshots")));
  });

  it("is idempotent — does not fail on existing dirs", () => {
    const { seedProjectRuntime } = loadRoutes();
    seedProjectRuntime("testproj");
    seedProjectRuntime("testproj");
  });
});

describe("PROJECT_AGENTS", () => {
  it("contains exactly head, re1, re2 with no dev", () => {
    const { PROJECT_AGENTS } = loadRoutes();
    assert.deepEqual(PROJECT_AGENTS, ["head", "re1", "re2"]);
    assert.ok(!PROJECT_AGENTS.includes("dev"));
  });
});
