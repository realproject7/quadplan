const fs = require("fs");

const ARTIFACT_TYPES = new Set([
  "proposal", "proposal_revision", "ticket", "ticket_batch",
  "design_html", "doc", "research_note", "handoff_package",
]);

const ARTIFACT_STATUSES = new Set([
  "queued", "drafting", "ready_for_review",
  "re1_changes_requested", "re2_changes_requested",
  "approved_by_re1", "approved_by_re2",
  "approved", "done",
]);

function parsePlanningQueue(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { batchNumber: null, batchTitle: null, artifacts: [], raw: "" };
  }

  const sectionMatch = text.match(/##\s+Active Batch[^\n]*[\s\S]*?(?=\n##\s|$)/i);
  if (!sectionMatch) {
    return { batchNumber: null, batchTitle: null, artifacts: [], raw: text };
  }

  const section = sectionMatch[0];
  const headerLine = section.split("\n")[0] || "";

  const batchNumMatch = section.match(/\*\*Batch:\*\*\s*(\d+)/i) || section.match(/Batch:\s*(\d+)/i);
  const batchNumber = batchNumMatch ? parseInt(batchNumMatch[1], 10) : null;

  const titleMatch = headerLine.match(/Active Batch[:\s]*(?:Batch\s+\d+\s*[—–-]\s*)?(.+)/i);
  const batchTitle = titleMatch ? titleMatch[1].trim() : null;

  const artifacts = parseArtifacts(section);

  return { batchNumber, batchTitle, artifacts, raw: text };
}

function parseArtifacts(section) {
  const artifacts = [];
  const lines = section.split("\n");

  let current = null;

  for (const line of lines) {
    const artifactMatch = line.match(/^#{3,4}\s+([A-Z]{1,4}-\d{1,4})\s*[—–-]\s*(.+)/);
    if (artifactMatch) {
      if (current) artifacts.push(current);
      current = {
        id: artifactMatch[1],
        title: artifactMatch[2].trim(),
        type: null,
        source: null,
        status: "queued",
        review: { re1: "pending", re2: "pending" },
        output: null,
      };
      continue;
    }

    const issueMatch = line.match(/^\s*[-*]\s+#(\d+)\s+(.*)/);
    if (issueMatch && !current) {
      current = {
        id: `#${issueMatch[1]}`,
        title: issueMatch[2].trim(),
        type: "ticket",
        source: null,
        status: "queued",
        review: { re1: "pending", re2: "pending" },
        output: null,
      };
      continue;
    }
    if (issueMatch && current && current.id.startsWith("#")) {
      artifacts.push(current);
      current = {
        id: `#${issueMatch[1]}`,
        title: issueMatch[2].trim(),
        type: "ticket",
        source: null,
        status: "queued",
        review: { re1: "pending", re2: "pending" },
        output: null,
      };
      continue;
    }

    if (!current) continue;

    const kvMatch = line.match(/^\s*[-*]\s+(Type|Source|Status|Review|Output)\s*:\s*(.+)/i);
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase();
      const val = kvMatch[2].trim();

      if (key === "type") {
        current.type = ARTIFACT_TYPES.has(val) ? val : val;
      } else if (key === "source") {
        current.source = val;
      } else if (key === "status") {
        current.status = ARTIFACT_STATUSES.has(val) ? val : val;
      } else if (key === "review") {
        current.review = parseReviewState(val);
      } else if (key === "output") {
        current.output = val;
      }
    }
  }

  if (current) artifacts.push(current);
  return artifacts;
}

function parseReviewState(val) {
  const state = { re1: "pending", re2: "pending" };
  const re1Match = val.match(/RE1\s+(pending|approved|changes_requested)/i);
  const re2Match = val.match(/RE2\s+(pending|approved|changes_requested)/i);
  if (re1Match) state.re1 = re1Match[1].toLowerCase();
  if (re2Match) state.re2 = re2Match[1].toLowerCase();
  return state;
}

function readPlanningQueue(queuePath) {
  try {
    if (!fs.existsSync(queuePath)) {
      return { batchNumber: null, batchTitle: null, artifacts: [], raw: "" };
    }
    const text = fs.readFileSync(queuePath, "utf-8");
    return parsePlanningQueue(text);
  } catch {
    return { batchNumber: null, batchTitle: null, artifacts: [], raw: "" };
  }
}

function statusToProgress(status) {
  const map = {
    queued: 0,
    drafting: 20,
    ready_for_review: 40,
    re1_changes_requested: 50,
    re2_changes_requested: 50,
    approved_by_re1: 65,
    approved_by_re2: 65,
    approved: 90,
    done: 100,
  };
  return map[status] ?? 0;
}

function statusToLabel(status) {
  const map = {
    queued: "Queued",
    drafting: "Drafting",
    ready_for_review: "Ready for review",
    re1_changes_requested: "RE1 changes requested",
    re2_changes_requested: "RE2 changes requested",
    approved_by_re1: "RE1 approved",
    approved_by_re2: "RE2 approved",
    approved: "Approved",
    done: "Done",
  };
  return map[status] || status || "Unknown";
}

function resolveEffectiveStatus(artifact) {
  if (!artifact) return "queued";
  if (artifact.status === "done" || artifact.status === "approved") return artifact.status;
  const { re1, re2 } = artifact.review || {};
  if (re1 === "approved" && re2 === "approved") return "approved";
  if (re1 === "approved" && re2 !== "approved") return "approved_by_re1";
  if (re2 === "approved" && re1 !== "approved") return "approved_by_re2";
  if (re1 === "changes_requested") return "re1_changes_requested";
  if (re2 === "changes_requested") return "re2_changes_requested";
  return artifact.status || "queued";
}

function summarizeBatch(artifacts) {
  if (!artifacts || artifacts.length === 0) {
    return { total: 0, done: 0, approved: 0, inReview: 0, drafting: 0, queued: 0, progress: 0 };
  }
  let done = 0, approved = 0, inReview = 0, drafting = 0, queued = 0;
  let totalProgress = 0;

  for (const a of artifacts) {
    const effective = resolveEffectiveStatus(a);
    const p = statusToProgress(effective);
    totalProgress += p;

    if (effective === "done") done++;
    else if (effective === "approved") approved++;
    else if (effective === "ready_for_review" || effective === "re1_changes_requested" ||
             effective === "re2_changes_requested" || effective === "approved_by_re1" ||
             effective === "approved_by_re2") inReview++;
    else if (effective === "drafting") drafting++;
    else queued++;
  }

  return {
    total: artifacts.length,
    done,
    approved,
    inReview,
    drafting,
    queued,
    progress: Math.round(totalProgress / artifacts.length),
  };
}

module.exports = {
  parsePlanningQueue,
  readPlanningQueue,
  statusToProgress,
  statusToLabel,
  resolveEffectiveStatus,
  summarizeBatch,
  ARTIFACT_TYPES,
  ARTIFACT_STATUSES,
};
