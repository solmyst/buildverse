import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../lib/render-quality.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { createQualityGovernor } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const run = (governor, interval, seconds) => {
  const changes = [];
  for (let t = 0; t < seconds * 1000; t += interval) { const next = governor.sample(interval); if (next) changes.push(next); }
  return changes;
};
test("quality holds on smooth devices and steps down one tier per slow window", () => {
  const smooth = createQualityGovernor("high");
  assert.deepEqual(run(smooth, 1000 / 60, 30), []);
  assert.deepEqual(run(smooth, 1000 / 45, 30), [], "45 fps is fine");
  const slow = createQualityGovernor("high");
  assert.deepEqual(run(slow, 1000 / 25, 3.1), ["medium"]);
  assert.deepEqual(run(slow, 1000 / 25, 30), ["low"], "stops at low");
  assert.equal(slow.tier, "low");
});
test("quality ignores stalls and never steps back up", () => {
  const governor = createQualityGovernor("medium");
  assert.deepEqual(run(governor, 400, 30), [], "stalls are not frames");
  run(governor, 1000 / 20, 4);
  assert.equal(governor.tier, "low");
  run(governor, 1000 / 60, 30);
  assert.equal(governor.tier, "low");
});
