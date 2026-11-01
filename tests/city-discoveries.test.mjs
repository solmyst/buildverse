import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../lib/city-discoveries.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { restoreDiscoveries, advanceSecret } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
test("discovery restore rejects invalid data and deduplicates known secrets", () => {
  assert.deepEqual(restoreDiscoveries('["guitar","bogus","guitar",3,"konami"]'), ["guitar", "konami"]);
  for (const bad of [null, "not-json", "{}", "null"]) assert.deepEqual(restoreDiscoveries(bad), []);
});
test("the classic code unlocks only on the complete sequence and resets afterward", () => {
  let progress = 0;
  const keys = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "B", "A"];
  keys.forEach((key, index) => {
    const next = advanceSecret(progress, key); progress = next.progress;
    assert.equal(next.unlocked, index === keys.length - 1);
  });
  assert.equal(progress, 0);
  assert.equal(advanceSecret(5, "x").progress, 0);
  assert.equal(advanceSecret(5, "ArrowUp").progress, 1);
});
