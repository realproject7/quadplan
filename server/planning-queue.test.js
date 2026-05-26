const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parsePlanningQueue, statusToProgress, ARTIFACT_TYPES, ARTIFACT_STATUSES } = require("./planning-queue");

describe("parsePlanningQueue", () => {
  it("parses a full planning queue with artifact details", () => {
    const text = `# Planning Queue — MyProject

## Active Batch: Batch 1 — Proposal to Tickets

**Batch:** 1
**Started:** 2026-05-26 10:00
**Status:** in progress

#### QP-001 — Create master EPIC
- Type: ticket
- Source: docs/PROPOSAL.md
- Status: drafting
- Review: RE1 pending, RE2 pending
- Output: GitHub issue URL

#### QP-002 — Create Phase 1 sub-tickets
- Type: ticket_batch
- Source: docs/PROPOSAL.md#phase-1
- Status: queued
- Review: RE1 pending, RE2 pending
- Output: GitHub issue URLs

## Done
`;

    const result = parsePlanningQueue(text);
    assert.equal(result.batchNumber, 1);
    assert.equal(result.artifacts.length, 2);

    assert.equal(result.artifacts[0].id, "QP-001");
    assert.equal(result.artifacts[0].title, "Create master EPIC");
    assert.equal(result.artifacts[0].type, "ticket");
    assert.equal(result.artifacts[0].source, "docs/PROPOSAL.md");
    assert.equal(result.artifacts[0].status, "drafting");
    assert.equal(result.artifacts[0].review.re1, "pending");
    assert.equal(result.artifacts[0].review.re2, "pending");

    assert.equal(result.artifacts[1].id, "QP-002");
    assert.equal(result.artifacts[1].type, "ticket_batch");
    assert.equal(result.artifacts[1].status, "queued");
  });

  it("parses issue-number style items (backward compat)", () => {
    const text = `## Active Batch

**Batch:** 3
**Status:** pending kickoff

- #46 Seed repo from baseline
- #47 Commit proposal docs
- #50 Replace proposal with canonical
`;

    const result = parsePlanningQueue(text);
    assert.equal(result.batchNumber, 3);
    assert.equal(result.artifacts.length, 3);
    assert.equal(result.artifacts[0].id, "#46");
    assert.equal(result.artifacts[0].title, "Seed repo from baseline");
    assert.equal(result.artifacts[0].type, "ticket");
    assert.equal(result.artifacts[1].id, "#47");
    assert.equal(result.artifacts[2].id, "#50");
  });

  it("parses review states correctly", () => {
    const text = `## Active Batch

**Batch:** 2

#### QP-005 — Dashboard design
- Type: design_html
- Status: re1_changes_requested
- Review: RE1 changes_requested, RE2 approved
`;

    const result = parsePlanningQueue(text);
    assert.equal(result.artifacts[0].review.re1, "changes_requested");
    assert.equal(result.artifacts[0].review.re2, "approved");
    assert.equal(result.artifacts[0].status, "re1_changes_requested");
  });

  it("handles empty string", () => {
    const result = parsePlanningQueue("");
    assert.equal(result.batchNumber, null);
    assert.equal(result.batchTitle, null);
    assert.deepEqual(result.artifacts, []);
  });

  it("handles null/undefined", () => {
    assert.deepEqual(parsePlanningQueue(null).artifacts, []);
    assert.deepEqual(parsePlanningQueue(undefined).artifacts, []);
  });

  it("handles queue with no Active Batch section", () => {
    const text = `# Planning Queue

## Backlog

- #100 Some future ticket

## Done

- #99 Already done
`;
    const result = parsePlanningQueue(text);
    assert.equal(result.batchNumber, null);
    assert.deepEqual(result.artifacts, []);
  });

  it("handles malformed artifact entries gracefully", () => {
    const text = `## Active Batch

**Batch:** 1

#### QP-001 — Good entry
- Type: ticket
- Status: queued

Some random text that should be ignored

#### QP-002 — Missing fields
`;

    const result = parsePlanningQueue(text);
    assert.equal(result.artifacts.length, 2);
    assert.equal(result.artifacts[0].id, "QP-001");
    assert.equal(result.artifacts[0].type, "ticket");
    assert.equal(result.artifacts[1].id, "QP-002");
    assert.equal(result.artifacts[1].type, null);
    assert.equal(result.artifacts[1].status, "queued");
  });

  it("parses batch title from header", () => {
    const text = `## Active Batch: Batch 2 — Design Review

**Batch:** 2

- #10 Design task
`;
    const result = parsePlanningQueue(text);
    assert.equal(result.batchNumber, 2);
    assert.ok(result.batchTitle?.includes("Design Review"));
  });
});

describe("statusToProgress", () => {
  it("maps known statuses to percentages", () => {
    assert.equal(statusToProgress("queued"), 0);
    assert.equal(statusToProgress("drafting"), 20);
    assert.equal(statusToProgress("ready_for_review"), 40);
    assert.equal(statusToProgress("re1_changes_requested"), 50);
    assert.equal(statusToProgress("approved"), 90);
    assert.equal(statusToProgress("done"), 100);
  });

  it("returns 0 for unknown status", () => {
    assert.equal(statusToProgress("unknown"), 0);
    assert.equal(statusToProgress(""), 0);
  });
});

describe("constants", () => {
  it("ARTIFACT_TYPES contains expected types", () => {
    assert.ok(ARTIFACT_TYPES.has("proposal"));
    assert.ok(ARTIFACT_TYPES.has("ticket_batch"));
    assert.ok(ARTIFACT_TYPES.has("design_html"));
    assert.ok(ARTIFACT_TYPES.has("handoff_package"));
    assert.equal(ARTIFACT_TYPES.size, 8);
  });

  it("ARTIFACT_STATUSES contains expected statuses", () => {
    assert.ok(ARTIFACT_STATUSES.has("queued"));
    assert.ok(ARTIFACT_STATUSES.has("done"));
    assert.ok(ARTIFACT_STATUSES.has("approved_by_re1"));
    assert.equal(ARTIFACT_STATUSES.size, 9);
  });
});
