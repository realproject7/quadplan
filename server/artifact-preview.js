const fs = require("fs");
const path = require("path");
const { resolveProjectPaths } = require("./config");

function isPathSafe(filePath, allowedRoots) {
  let resolved;
  try {
    resolved = fs.realpathSync(filePath);
  } catch {
    resolved = path.resolve(filePath);
  }
  return allowedRoots.some((root) => {
    let resolvedRoot;
    try {
      resolvedRoot = fs.realpathSync(root);
    } catch {
      resolvedRoot = path.resolve(root);
    }
    return resolved.startsWith(resolvedRoot + path.sep) || resolved === resolvedRoot;
  });
}

function getAllowedRoots(projectId) {
  const paths = resolveProjectPaths(projectId);
  if (!paths) return null;
  const roots = [];
  if (paths.proposal_path) roots.push(path.dirname(paths.proposal_path));
  if (paths.artifact_dir) roots.push(paths.artifact_dir);
  return roots;
}

function resolveWorkingDir(paths) {
  if (paths.proposal_path) return path.dirname(path.dirname(paths.proposal_path));
  if (paths.artifact_dir) return path.dirname(paths.artifact_dir);
  return null;
}

function discoverArtifacts(projectId) {
  const paths = resolveProjectPaths(projectId);
  if (!paths) return null;

  const artifacts = [];

  if (paths.proposal_path && fs.existsSync(paths.proposal_path)) {
    artifacts.push({
      path: paths.proposal_path,
      relativePath: "docs/PROPOSAL.md",
      type: "proposal",
      name: "PROPOSAL.md",
      ext: ".md",
    });
  }

  if (paths.artifact_dir && fs.existsSync(paths.artifact_dir)) {
    const subdirs = ["design", "tickets", "docs"];
    for (const sub of subdirs) {
      const dir = path.join(paths.artifact_dir, sub);
      if (!fs.existsSync(dir)) continue;
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.lstatSync(fullPath);
          if (!stat.isFile()) continue;
          if (stat.isSymbolicLink()) continue;
          const ext = path.extname(file).toLowerCase();
          artifacts.push({
            path: fullPath,
            relativePath: `artifacts/${sub}/${file}`,
            type: sub === "design" ? "design_html" : sub === "tickets" ? "ticket" : "doc",
            name: file,
            ext,
          });
        }
      } catch {}
    }
  }

  return artifacts;
}

function readArtifactContent(projectId, relativePath) {
  const roots = getAllowedRoots(projectId);
  if (!roots || roots.length === 0) return { ok: false, error: "No configured roots" };

  const paths = resolveProjectPaths(projectId);
  if (!paths) return { ok: false, error: "Unknown project" };

  const workingDir = resolveWorkingDir(paths);
  if (!workingDir) return { ok: false, error: "No configured working directory" };

  const fullPath = path.resolve(workingDir, relativePath);

  if (!fs.existsSync(fullPath)) {
    return { ok: false, error: "File not found" };
  }

  const stat = fs.lstatSync(fullPath);
  if (stat.isSymbolicLink()) {
    return { ok: false, error: "Symlinks not allowed" };
  }

  if (!isPathSafe(fullPath, roots)) {
    return { ok: false, error: "Path outside allowed directories" };
  }

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    const ext = path.extname(fullPath).toLowerCase();
    return { ok: true, content, ext, path: fullPath };
  } catch (err) {
    return { ok: false, error: err.message || "Read failed" };
  }
}

module.exports = {
  isPathSafe,
  getAllowedRoots,
  discoverArtifacts,
  readArtifactContent,
};
