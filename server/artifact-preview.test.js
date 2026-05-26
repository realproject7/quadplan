const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `artifact-preview-test-${Date.now()}`);
const origHomedir = os.homedir;

before(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  os.homedir = () => TEST_DIR;
  delete require.cache[require.resolve("./config")];

  const { writeConfig, CONFIG_PATH } = require("./config");
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });

  const projectDir = path.join(TEST_DIR, "myproject");
  fs.mkdirSync(path.join(projectDir, "docs"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "artifacts", "design"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "artifacts", "docs"), { recursive: true });
  fs.writeFileSync(path.join(projectDir, "docs", "PROPOSAL.md"), "# Test Proposal\n");
  fs.writeFileSync(path.join(projectDir, "artifacts", "design", "dashboard.html"), "<h1>Dashboard</h1>");
  fs.writeFileSync(path.join(projectDir, "artifacts", "docs", "notes.md"), "# Notes\n");

  fs.writeFileSync(path.join(TEST_DIR, "secret.txt"), "TOP SECRET");

  writeConfig({
    port: 8400,
    operator_name: "user",
    butler: { enabled: false, cwd: null, command: null },
    projects: [{
      id: "myproject",
      name: "My Project",
      proposal_path: path.join(projectDir, "docs", "PROPOSAL.md"),
      queue_path: path.join(TEST_DIR, ".quadplan", "myproject", "OVERNIGHT-QUEUE.md"),
      artifact_dir: path.join(projectDir, "artifacts"),
      agents: { head: { cwd: "/tmp/h" }, re1: { cwd: "/tmp/r1" }, re2: { cwd: "/tmp/r2" } },
    }],
  });
});

after(() => {
  os.homedir = origHomedir;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function fresh() {
  delete require.cache[require.resolve("./artifact-preview")];
  delete require.cache[require.resolve("./config")];
  return require("./artifact-preview");
}

describe("isPathSafe", () => {
  it("allows path inside root", () => {
    const { isPathSafe } = fresh();
    assert.equal(isPathSafe("/a/b/c.md", ["/a/b"]), true);
  });

  it("rejects traversal", () => {
    const { isPathSafe } = fresh();
    assert.equal(isPathSafe("/a/b/../secret.txt", ["/a/b"]), false);
  });

  it("rejects path outside root", () => {
    const { isPathSafe } = fresh();
    assert.equal(isPathSafe("/other/file.md", ["/a/b"]), false);
  });
});

describe("discoverArtifacts", () => {
  it("returns proposal and artifact files for known project", () => {
    const { discoverArtifacts } = fresh();
    const artifacts = discoverArtifacts("myproject");
    assert.ok(artifacts);
    assert.ok(artifacts.length >= 3);
    assert.ok(artifacts.some((a) => a.type === "proposal"));
    assert.ok(artifacts.some((a) => a.type === "design_html"));
    assert.ok(artifacts.some((a) => a.type === "doc"));
  });

  it("returns null for unknown project", () => {
    const { discoverArtifacts } = fresh();
    assert.equal(discoverArtifacts("nonexistent"), null);
  });
});

describe("readArtifactContent", () => {
  it("reads proposal content", () => {
    const { readArtifactContent } = fresh();
    const result = readArtifactContent("myproject", "docs/PROPOSAL.md");
    assert.equal(result.ok, true);
    assert.ok(result.content.includes("Test Proposal"));
    assert.equal(result.ext, ".md");
  });

  it("reads design artifact", () => {
    const { readArtifactContent } = fresh();
    const result = readArtifactContent("myproject", "artifacts/design/dashboard.html");
    assert.equal(result.ok, true);
    assert.ok(result.content.includes("Dashboard"));
    assert.equal(result.ext, ".html");
  });

  it("rejects traversal to parent directory", () => {
    const { readArtifactContent } = fresh();
    const result = readArtifactContent("myproject", "../../secret.txt");
    assert.equal(result.ok, false);
    assert.equal(result.error, "Path outside allowed directories");
  });

  it("rejects traversal with docs prefix", () => {
    const { readArtifactContent } = fresh();
    const result = readArtifactContent("myproject", "docs/../../secret.txt");
    assert.equal(result.ok, false);
    assert.equal(result.error, "Path outside allowed directories");
  });

  it("returns error for unknown project", () => {
    const { readArtifactContent } = fresh();
    const result = readArtifactContent("nonexistent", "docs/PROPOSAL.md");
    assert.equal(result.ok, false);
  });

  it("returns error for missing file", () => {
    const { readArtifactContent } = fresh();
    const result = readArtifactContent("myproject", "docs/MISSING.md");
    assert.equal(result.ok, false);
    assert.equal(result.error, "File not found");
  });
});
