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
const { floorContent, firstSentence } = await import(content);
const { cityBuildings } = await import(layout);
test("every project's entry floor opens with a short glance, not a wall of text", () => {
  for (const building of cityBuildings.filter((b) => b.kind === "project")) {
    const { glance } = floorContent(building, 0);
    assert.deepEqual(glance.map((row) => row.label), ["The problem", "What I built", "Result", "Built with"], building.id);
    for (const row of glance) assert.ok(row.text.length > 3 && row.text.length <= 151, `${building.id} ${row.label}`);
    assert.equal(floorContent(building, 1).glance, undefined);
  }
  assert.equal(firstSentence("One. Two."), "One.");
});
const { nextProject } = await import(content);
test("projects chain in city order and the last one has no successor", () => {
  const ids = cityBuildings.filter((b) => b.kind === "project").map((b) => b.id);
  ids.forEach((id, i) => assert.equal(nextProject(id)?.id ?? null, ids[i + 1] ?? null, id));
  assert.equal(nextProject("contact"), null);
});
