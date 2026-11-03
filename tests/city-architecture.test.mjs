import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import * as THREE from "three";
const require = createRequire(import.meta.url);
function compile(path, replacements = {}) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(`"${from}"`, `"${to}"`);
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const moduleUrl = (name) => name === "three"
  ? new URL("./three.module.js", pathToFileURL(require.resolve(name))).href
  : pathToFileURL(require.resolve(name)).href;
const layoutUrl = compile("../lib/city-layout.ts");
const { cityBuildings } = await import(layoutUrl);
const { createSceneKit } = await import(compile("../components/city/scene-kit.ts", {
  three: moduleUrl("three"),
  "three/examples/jsm/geometries/RoundedBoxGeometry.js": moduleUrl("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
  "three/examples/jsm/utils/BufferGeometryUtils.js": moduleUrl("three/examples/jsm/utils/BufferGeometryUtils.js"),
}));
const { createLandmark, landmarkStyles } = await import(compile("../components/city/landmarks.ts", {
  three: moduleUrl("three"), "@/lib/city-layout": layoutUrl,
}));
test("every address has a distinct landmark with finite geometry and pickable floors", () => {
  assert.equal(new Set(cityBuildings.map((b) => landmarkStyles[b.id])).size, cityBuildings.length);
  for (const building of cityBuildings) {
    const kit = createSceneKit(), root = new THREE.Group();
    root.userData.buildingId = building.id;
    const { floors } = createLandmark(kit, root, building);
    assert.equal(floors.length, building.floors.length);
    for (const [index, floor] of floors.entries()) assert.deepEqual(floor.userData, { floor: index });
    const { before, after } = kit.batch(root);
    assert.ok(after <= 12 && after * 3 < before, `${building.id} batches ${before} meshes into ${after}`);
    root.traverse((object) => {
      if (!object.isMesh) return;
      const positions = object.geometry.getAttribute("position");
      assert.ok(Array.from(positions.array).every(Number.isFinite), building.id);
      object.geometry.computeBoundingSphere();
      assert.ok(Number.isFinite(object.geometry.boundingSphere.radius));
    });
    const bounds = new THREE.Box3().setFromObject(root);
    assert.ok(bounds.max.y >= building.floors.length * 3, building.id);
    kit.dispose();
  }
});

test("static batching folds props per material and leaves moving parts alone", () => {
  const kit = createSceneKit(), root = new THREE.Group();
  for (let i = 0; i < 10; i++) kit.box(root, [1, 1, 1], [i * 2, 0, 0], "#aabbcc");
  kit.box(root, [1, 1, 1], [0, 3, 0], "#112233");
  const live = new THREE.Group();
  live.userData.batch = "live";
  live.position.set(5, 0, 0);
  root.add(live);
  kit.box(live, [1, 1, 1], [1, 0, 0], "#aabbcc");
  kit.box(live, [1, 1, 1], [2, 0, 0], "#aabbcc");
  const hidden = new THREE.Group();
  hidden.visible = false;
  root.add(hidden);
  kit.box(hidden, [1, 1, 1], [0, 0, 0], "#aabbcc");
  const sign = new THREE.Group();
  root.add(sign);
  kit.box(sign, [1, 1, 1], [0, 6, 0], "#aabbcc");
  const result = kit.batch(root);
  assert.equal(result.before, 14);
  assert.equal(result.after, 3);
  assert.equal(live.children.length, 1, "live parts batch relative to themselves");
  assert.equal(hidden.children.length, 1, "hidden parts may be revealed later");
  const bounds = new THREE.Box3().setFromObject(root);
  assert.deepEqual([bounds.min.x, bounds.max.x, bounds.max.y], [-0.5, 18.5, 6.5]);
  assert.deepEqual(result.stale(), []);
  sign.rotation.y = 1;
  assert.deepEqual(result.stale(), [sign], "moving a batched object is reported");
  kit.dispose();
});
