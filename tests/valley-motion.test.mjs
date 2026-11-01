import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../lib/valley-motion.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { boatPose, valleyPlaces } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
test("coastal boats stay clear of the island and face their direction of travel", () => {
  for (let i = 0; i < 3; i++) for (let time = 0; time < 700; time += 2) {
    const point = boatPose(time, i), next = boatPose(time + 0.001, i);
    assert.ok(Math.max(Math.abs(point.x), Math.abs(point.z)) > 54);
    const heading = Math.atan2(next.x - point.x, next.z - point.z);
    assert.ok(Math.abs(Math.atan2(Math.sin(heading - point.heading), Math.cos(heading - point.heading))) < 0.001);
  }
  assert.equal(new Set(valleyPlaces.map(place => place.id)).size, 2);
});
