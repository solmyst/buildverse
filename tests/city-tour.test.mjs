import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const load = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const url = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const data = url(load("../lib/data.ts"));
const layout = url(load("../lib/city-layout.ts"));
const content = url(load("../lib/city-content.ts").replaceAll('"@/lib/data"', `"${data}"`).replaceAll('"@/lib/city-layout"', `"${layout}"`));
const tour = load("../lib/city-tour.ts")
  .replaceAll('"@/lib/data"', `"${data}"`)
  .replaceAll('"@/lib/city-layout"', `"${layout}"`)
  .replaceAll('"@/lib/city-content"', `"${content}"`);
const { cityTour, tourStopSeconds } = await import(url(tour));
test("the autopilot tour fits a minute and every stop has a caption", () => {
  assert.equal(cityTour.length * tourStopSeconds, 60);
  for (const stop of cityTour) assert.ok(stop.name && stop.line.length > 8, stop.id);
  assert.equal(cityTour.at(-1).id, "contact", "the tour ends on how to reach me");
});
