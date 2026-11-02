import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../lib/city-activities.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { activities, nearestActivity, approachProgress } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('each activity has a distinct, reachable interaction trigger and distant points do not trigger', () => {
  assert.equal(new Set(activities.map(a => a.id)).size, 5);
  for (const activity of activities) assert.equal(nearestActivity(activity.x, activity.z), activity.id);
  assert.equal(nearestActivity(0, 0), null);
  assert.equal(nearestActivity(48, 38), "boat");
});
test('transport approach settles after five seconds without overshooting or moving backward', () => {
  assert.equal(approachProgress(-10), 0);
  assert.equal(approachProgress(0), 0);
  assert.equal(approachProgress(5), 1);
  assert.equal(approachProgress(100), 1);
  let previous = 0;
  for (let t = 0; t <= 6; t += 0.02) {
    const current = approachProgress(t);
    assert.ok(current >= previous && current <= 1); previous = current;
  }
});

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
const require = createRequire(import.meta.url);
const definitionsUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
let controllerSource = ts.transpileModule(readFileSync(new URL('../components/city/activities.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
controllerSource = controllerSource.replace('"three"', JSON.stringify(new URL('./three.module.js', pathToFileURL(require.resolve('three'))).href)).replace('"@/lib/city-activities"', JSON.stringify(definitionsUrl));
const { createActivities } = await import(`data:text/javascript;base64,${Buffer.from(controllerSource).toString('base64')}`);
function controller() {
  const city = new THREE.Group(), plane = new THREE.Group(), boat = new THREE.Group(), gondola = new THREE.Group();
  plane.position.set(-80, 33, 0); boat.position.set(-90, 0, 0);
  const kit = { box(parent) { const object = new THREE.Object3D(); parent.add(object); return object; }, label() {} };
  return createActivities(city, kit, plane, boat, gondola);
}
test('transport cannot board until pickup completes; leaving clears the activity', () => {
  for (const id of ['plane', 'boat']) {
    const ride = controller(); ride.start(id); ride.board();
    assert.equal(ride.update(1).stage, 'calling');
    assert.equal(ride.update(4).stage, 'ready');
    ride.board(); assert.equal(ride.update(0).stage, 'riding');
    for (let i = 0; i < 300; i++) {
      const state = ride.update(0.1);
      for (const v of [state.target, state.eye, state.person]) assert.ok(v.toArray().every(Number.isFinite));
    }
    ride.stop(); assert.equal(ride.update(1), null);
  }
});
test('seated activities can be replaced and return finite camera and seat positions', () => {
  const ride = controller();
  for (const id of ['swing', 'ferris', 'cinema']) {
    ride.start(id); const state = ride.update(1);
    assert.equal(state.id, id); assert.equal(state.stage, 'riding');
    for (const v of [state.target, state.eye, state.person]) assert.ok(v.toArray().every(Number.isFinite));
  }
});

test('reduced motion allows boarding and presents a stable aerial view', () => {
  const ride = controller(); ride.start('plane');
  assert.equal(ride.update(0, true).stage, 'ready');
  ride.board(); const state = ride.update(0, true);
  assert.ok(state.person.y > 20);
  const eye = state.eye.clone();
  assert.ok(eye.equals(ride.update(0, true).eye));
  ride.toggleView(); assert.equal(ride.update(0, true).passenger, true);
});
