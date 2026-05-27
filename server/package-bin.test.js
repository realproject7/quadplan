const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const pkg = require("../package.json");

describe("QuadPlan package binary isolation", () => {
  it("installs only the quadplan command, not a quadwork alias", () => {
    assert.deepEqual(Object.keys(pkg.bin).sort(), ["quadplan"]);
    assert.equal(pkg.bin.quadplan, "./bin/quadwork.js");
    assert.equal(pkg.bin.quadwork, undefined);
  });
});
