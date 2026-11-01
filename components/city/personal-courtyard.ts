import * as THREE from "three";
import type { SceneKit } from "./scene-kit";
export function createPersonalCourtyard(city: THREE.Group, kit: SceneKit) {
  const root = new THREE.Group(); root.position.set(-8, 0, 8); city.add(root);
  kit.box(root, [10, 0.12, 10], [0, 0.13, 0], "#b5b6a3");
  for (let i = -2; i <= 2; i++) {
    kit.box(root, [0.025, 0.01, 9.5], [i * 1.9, 0.2, 0], "#929d90");
    kit.box(root, [9.5, 0.01, 0.025], [0, 0.2, i * 1.9], "#929d90");
  }
  // Open pavilion: people can walk through the courtyard rather than a solid block.
  for (const x of [-3.8, 3.8]) for (const z of [-3.8, 1.7])
    kit.box(root, [0.14, 3.8, 0.14], [x, 2, z], "#6d7771");
  const roof = kit.box(root, [8.4, 0.16, 2.2], [0, 4, -3], "#617d73"); roof.rotation.z = -0.035;
  kit.label(root, "SOLMYST COURTYARD", [0, 5.1, -1], "#e9d2a3", 8);
  kit.label(root, "GUITAR · RACING · LATE-NIGHT CODE", [0, 3.35, -3.9], "#bce0c9", 7);
  for (const x of [-3.5, 3.5]) {
    kit.box(root, [0.9, 0.4, 1.6], [x, 0.4, 3.4], "#8d9a85");
    for (const z of [3, 3.8]) kit.sphere(root, 0.45, [x, 0.85, z], "#6c916e");
  }
  for (const x of [-2.7, 2.7]) {
    kit.box(root, [2, 0.15, 0.7], [x, 0.7, 3.1], "#aa8869");
    for (const dx of [-0.7, 0.7]) kit.box(root, [0.1, 0.5, 0.5], [x + dx, 0.4, 3.1], "#617575");
  }
  const guitar = new THREE.Group(); guitar.position.set(-2.6, 0.5, -1.5); guitar.userData.action = "egg:guitar"; root.add(guitar);
  kit.box(guitar, [1.8, 0.18, 1.8], [0, -0.15, 0], "#b99e78");
  const lower = kit.sphere(guitar, 0.48, [0, 0.55, 0], "#c99152"); lower.scale.set(0.8, 1, 0.25);
  const upper = kit.sphere(guitar, 0.36, [0, 1.04, 0], "#c99152"); upper.scale.set(0.8, 1, 0.3);
  kit.box(guitar, [0.14, 0.95, 0.1], [0, 1.62, 0], "#695344");
  kit.box(guitar, [0.24, 0.32, 0.12], [0, 2.2, 0], "#b99161");
  kit.sphere(guitar, 0.15, [0, 0.9, 0.11], "#364441").scale.z = 0.1;
  for (let i = 0; i < 6; i++) kit.box(guitar, [0.006, 1.7, 0.008], [(i - 2.5) * 0.018, 1.35, 0.135], "#e2d4b4");
  const pit = new THREE.Group(); pit.position.set(2.5, 0, -1.5); pit.userData.action = "egg:pitwall"; root.add(pit);
  kit.box(pit, [2, 0.8, 1.7], [0, 0.6, 0], "#596f76");
  kit.box(pit, [0.65, 0.25, 1.5], [0, 1.2, 0], "#d68165");
  kit.box(pit, [1.5, 0.08, 0.3], [0, 1.14, 0.65], "#c4dace");
  kit.box(pit, [1.3, 0.08, 0.35], [0, 1.4, -0.6], "#c4dace");
  for (const x of [-0.55, 0.55]) for (const z of [-0.5, 0.5]) {
    kit.cylinder(pit, 0.23, 0.2, [x, 1.18, z], "#273b40", 16).rotation.z = Math.PI / 2;
  }
  const arcade = new THREE.Group(); arcade.position.set(0, 0, -2.8); root.add(arcade);
  kit.box(arcade, [1.35, 1.8, 0.9], [0, 1.1, 0], "#344e5d");
  kit.box(arcade, [1.12, 0.72, 0.06], [0, 1.5, 0.48], "#9ad0bc", true);
  kit.box(arcade, [1.4, 0.16, 0.65], [0, 0.98, 0.4], "#b5a1c5");
  for (const x of [-0.3, 0.05, 0.3]) kit.sphere(arcade, 0.07, [x, 1.12, 0.55], "#eed59d");
  kit.label(arcade, "INSERT CURIOSITY", [0, 2.3, 0.5], "#e8d0a2", 2.5);
  const bug = new THREE.Group(); bug.position.set(0.95, 0.7, -2.5); bug.userData.action = "egg:golden-bug"; root.add(bug);
  const shell = kit.sphere(bug, 0.18, [0, 0, 0], "#e4be69"); shell.scale.z = 1.4;
  kit.sphere(bug, 0.1, [0, 0, 0.27], "#e4be69");
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const leg = kit.box(bug, [0.34, 0.025, 0.025], [side * 0.17, -0.05, (i - 1) * 0.15], "#b48c47"); leg.rotation.y = side * (i - 1) * 0.4;
  }
  let lastTime = 0, celebrateUntil = 0;
  return { celebrate() { celebrateUntil = lastTime + 6; }, update(time: number) {
    lastTime = time; guitar.rotation.z = Math.sin(time * 0.4) * 0.025;
    pit.rotation.y = Math.sin(time * 0.15) * 0.15;
    bug.position.y = 0.75 + Math.sin(time * 1.7) * 0.13;
    shell.material = kit.material(time < celebrateUntil ? "#ffe2a0" : "#e4be69", time < celebrateUntil);
    arcade.rotation.z = time < celebrateUntil ? Math.sin(time * 5) * 0.025 : 0;
  }};
}
