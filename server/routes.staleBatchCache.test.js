// #99: Stale batch-progress-cache invalidation tests.
// Ensures empty Active Batch overrides any persistent snapshot.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), `quadplan-stale-cache-test-${Date.now()}`);
const origHomedir = os.homedir;

fs.mkdirSync(TEST_DIR, { recursive: true });
os.homedir = () => TEST_DIR;

// Force fresh require so CONFIG_DIR picks up the overridden homedir
delete require.cache[require.resolve("./config")];
delete require.cache[require.resolve("./routes")];

const {
  resolveDisplayedBatch,
  writeBatchSnapshot,
  readBatchSnapshot,
  batchSnapshotPath,
  parseActiveBatch,
  _testCleanup,
} = require("./routes");

const PROJECT_ID = "stale-test";

function queueWithActiveBatch(body, batchLine = "**Batch:** 5") {
  return `# Overnight Queue\n\n## Active Batch\n\n${batchLine}\n\n${body}\n\n## Done\n\n**Batch:** 4\n- #80 old item\n`;
}

function queueWithEmptyActiveBatch() {
  return `# Overnight Queue\n\n## Active Batch\n\n(none)\n\n## Done\n\n**Batch:** 5\n- #93 done item\n- #94 done item\n`;
}

function queueWithNoActiveBatchSection() {
  return `# Overnight Queue\n\n## Done\n\n**Batch:** 5\n- #93 done item\n`;
}

// Setup: ensure project dir exists for snapshot writes
const projectDir = path.join(TEST_DIR, ".quadplan", PROJECT_ID);
fs.mkdirSync(projectDir, { recursive: true });

// 1) Empty Active Batch with stale snapshot returns empty, not snapshot
{
  writeBatchSnapshot(PROJECT_ID, { batchNumber: 5, issueNumbers: [93, 94] });
  assert.ok(readBatchSnapshot(PROJECT_ID), "precondition: snapshot exists");

  const result = resolveDisplayedBatch(queueWithEmptyActiveBatch(), PROJECT_ID);
  assert.equal(result.issueNumbers.length, 0, "empty Active Batch must return no items");
  assert.equal(result.batchNumber, null, "empty Active Batch must return null batchNumber");
}

// 2) Stale snapshot is deleted after empty Active Batch
{
  const snapshot = readBatchSnapshot(PROJECT_ID);
  assert.equal(snapshot, null, "snapshot must be deleted when Active Batch is empty");
  assert.ok(!fs.existsSync(batchSnapshotPath(PROJECT_ID)), "snapshot file must not exist on disk");
}

// 3) Active Batch with items still uses snapshot for merged items (existing behavior)
{
  writeBatchSnapshot(PROJECT_ID, { batchNumber: 5, issueNumbers: [93, 94] });
  const queueText = queueWithActiveBatch("- #93 item A\n- #94 item B");
  const result = resolveDisplayedBatch(queueText, PROJECT_ID);
  assert.deepEqual(result.issueNumbers, [93, 94], "same items should use snapshot");
  assert.equal(result.batchNumber, 5);
}

// 4) Active Batch "(none)" text is parsed as empty by parseActiveBatch
{
  const result = parseActiveBatch(queueWithEmptyActiveBatch());
  assert.equal(result.issueNumbers.length, 0, "(none) text must yield empty items");
  assert.equal(result.batchNumber, null);
}

// 5) No Active Batch section at all returns empty
{
  writeBatchSnapshot(PROJECT_ID, { batchNumber: 5, issueNumbers: [93, 94] });
  const result = resolveDisplayedBatch(queueWithNoActiveBatchSection(), PROJECT_ID);
  assert.equal(result.issueNumbers.length, 0, "missing Active Batch section must return empty");
}

// 6) New batch overrides stale snapshot (existing behavior preserved)
{
  writeBatchSnapshot(PROJECT_ID, { batchNumber: 5, issueNumbers: [93, 94] });
  const queueText = queueWithActiveBatch("- #100 new item\n- #101 new item", "**Batch:** 6");
  const result = resolveDisplayedBatch(queueText, PROJECT_ID);
  assert.equal(result.batchNumber, 6, "new batch number takes precedence");
  assert.deepEqual(result.issueNumbers, [100, 101], "new items replace snapshot");
}

// 7) queueReadOk=false returns empty regardless of snapshot
{
  writeBatchSnapshot(PROJECT_ID, { batchNumber: 5, issueNumbers: [93, 94] });
  const result = resolveDisplayedBatch("", PROJECT_ID, { queueReadOk: false });
  assert.equal(result.issueNumbers.length, 0, "queueReadOk=false must return empty");
}

// Cleanup
os.homedir = origHomedir;
fs.rmSync(TEST_DIR, { recursive: true, force: true });
if (_testCleanup) _testCleanup();

console.log("routes.staleBatchCache.test.js: all assertions passed (7 cases)");
