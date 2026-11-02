import * as THREE from "three";
import type { SceneKit } from "./scene-kit";

export function buildGardens(parent: THREE.Group, kit: SceneKit) {
  const garden = new THREE.Group();
  parent.add(garden);
  for (const [x, z, size] of [[29, 27, 1.3], [19, 28, 1], [-29, -27, 1], [-29, 17, 1.2], [3, 28, 1.1]] as const) {
    kit.cylinder(garden, 0.11, 1.8, [x, 1.1, z], "#897365", 16);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 0.4;
      const crown = kit.sphere(garden, size * 0.78, [x + Math.cos(angle) * size * 0.55, 2.4 + (i % 2) * 0.4, z + Math.sin(angle) * size * 0.55], i % 2 ? "#dfbdbe" : "#eacdc9");
      crown.scale.y = 0.75;
    }
  }
  // A small bamboo grove frames the eastern arrival path.
  for (let i = 0; i < 12; i++) {
    const x = 29 + (i % 3) * 0.45, z = -27 + Math.floor(i / 3) * 0.5;
    const h = 2.4 + (i % 4) * 0.35;
    kit.cylinder(garden, 0.045, h, [x, h / 2, z], "#68866b", 8);
    const leaves = kit.sphere(garden, 0.36, [x, h * 0.8, z], "#597c60");
    leaves.scale.set(1.3, 0.35, 0.8);
  }
}
