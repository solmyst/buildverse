import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../lib/camera-flight.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { flightDuration, flightProgress } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
test("camera flights settle at their destination with bounded, time-based easing", () => {
  assert.equal(flightProgress(-1, 2), 0);
  assert.equal(flightProgress(0, 2), 0);
  assert.equal(flightProgress(1, 2), 0.5);
  assert.equal(flightProgress(2, 2), 1);
  assert.equal(flightProgress(100, 2), 1);
  assert.equal(flightProgress(0, 0), 1);
  let previous = 0;
  for (let t = 0; t <= 2; t += 0.01) {
    const value = flightProgress(t, 2); assert.ok(value >= previous && value <= 1); previous = value;
  }
  for (const distance of [-1, 0, 1, 50, 1000]) assert.ok(flightDuration(distance) >= 0.8 && flightDuration(distance) <= 2.6);
  assert.ok(flightDuration(80) > flightDuration(10));
});
