import * as THREE from "three";
import type { SceneKit } from "./scene-kit";
import { createCharacter, heroLook } from "./characters";

// An open gateway frames the pedestrian lane without adding a collision volume.
export function createArrivalStreet(city: THREE.Group, kit: SceneKit) {
  const root = new THREE.Group(); city.add(root);
  for (const side of [-1, 1]) {
    const x = side * 2.5;
    kit.box(root, [0.22, 4.2, 0.22], [x, 2.2, 3.5], "#764e42");
    kit.box(root, [0.6, 0.25, 0.6], [x, 0.3, 3.5], "#b4ae94");
    for (const z of [1, 5, 9, 13]) {
      kit.box(root, [0.6, 0.4, 1], [side * 2.7, 0.35, z], "#a1ad96");
      kit.sphere(root, 0.4, [side * 2.7, 0.8, z], "#668f76");
      kit.box(root, [0.05, 2.8, 0.05], [side * 2.8, 1.5, z], "#5c655a");
      kit.cylinder(root, 0.23, 0.46, [side * 2.8, 2.8, z], "#f4c586", 16);
      for (const y of [2.6, 3]) kit.cylinder(root, 0.25, 0.05, [side * 2.8, y, z], "#815544", 16);
    }
  }
  kit.box(root, [5.8, 0.22, 0.65], [0, 4.3, 3.5], "#764e42");
  kit.box(root, [6.4, 0.14, 0.9], [0, 4.5, 3.5], "#365f58");
  kit.label(root, "BUILDVERSE / ようこそ", [0, 3.85, 3.5], "#f4d69b", 2.4);
  for (let i = 0; i < 10; i++) {
    kit.box(root, [1.8, 0.025, 0.65], [0, 0.16, i * 1.2 + 2], i % 2 ? "#acb9aa" : "#c1c9b7");
  }
  const guide = createCharacter(kit, { ...heroLook, top: "#ce8469", backpack: undefined });
  guide.root.position.set(1.7, 0.2, 6); guide.root.rotation.y = -0.5; root.add(guide.root);
  kit.label(root, "CITY GUIDE", [1.7, 2.4, 6], "#f4d69b", 1.8);
}
