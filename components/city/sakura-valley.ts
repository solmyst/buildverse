import { boatPose } from "@/lib/valley-motion";
import * as THREE from "three";
import type { SceneKit } from "./scene-kit";
import { createCharacter, crowdLook } from "./characters";

// Original scenery and screen animation; no film clips or external media requests.
export function createSakuraValley(city: THREE.Group, scene: THREE.Scene, kit: SceneKit) {
  const park = new THREE.Group(); city.add(park);
  const cherryPositions = [[18, 32], [28, 32], [32, 20], [32, 29], [18, 19], [-31, 35], [-15, 35]];
  for (const [x, z] of cherryPositions) {
    kit.cylinder(park, 0.16, 2.7, [x, 1.4, z], "#785954", 12);
    for (let j = 0; j < 5; j++) {
      const angle = j * Math.PI * 0.4;
      const crown = kit.sphere(park, 1.2, [x + Math.cos(angle) * 0.8, 3.1 + j % 2 * 0.5, z + Math.sin(angle) * 0.8], j % 2 ? "#e9a9bc" : "#f5c9d4");
      crown.scale.y = 0.75;
    }
  }
  // Vermilion garden gateway, stone lanterns, and a path to the pond.
  for (const x of [21.5, 24.5]) kit.cylinder(park, 0.15, 3.7, [x, 1.9, 31], "#b85845", 16);
  const lintel = kit.box(park, [4.5, 0.24, 0.42], [23, 3.65, 31], "#343b3b");
  lintel.rotation.z = 0.025;
  kit.box(park, [3.8, 0.18, 0.25], [23, 3.05, 31], "#b85845");
  for (let i = 0; i < 7; i++) kit.box(park, [1.5, 0.07, 0.7], [23 + Math.sin(i * 0.7) * 0.3, 0.17, 30 - i * 0.8], "#b7b5a4");
  for (const [x, z] of [[20, 29], [26, 29], [20, 33], [26, 33]]) {
    kit.cylinder(park, 0.15, 0.8, [x, 0.5, z], "#939c91", 8);
    kit.box(park, [0.5, 0.4, 0.5], [x, 1.05, z], "#f2d4a0", true);
    kit.cylinder(park, 0.5, 0.28, [x, 1.4, z], "#637b71", 8, 0.1);
  }
  kit.label(park, "SAKURA GARDEN / 桜", [23, 5, 31], "#f3becd", 6);

  // Falling petals are instanced: all 210 petals use a single draw call.
  const petalMaterial = kit.track(new THREE.MeshStandardMaterial({ color: "#f3b8cb", roughness: 0.8, side: THREE.DoubleSide }));
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, -0.115);
  petalShape.bezierCurveTo(-0.1, -0.04, -0.06, 0.09, 0, 0.115);
  petalShape.bezierCurveTo(0.06, 0.09, 0.1, -0.04, 0, -0.115);
  const petals = kit.track(new THREE.InstancedMesh(kit.track(new THREE.ShapeGeometry(petalShape, 6)), petalMaterial, 210));
  petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  petals.frustumCulled = false; scene.add(petals);
  const dummy = new THREE.Object3D();

  // A cozy outdoor coding/anime-inspired cinema on the southern lawn.
  const cinema = new THREE.Group(); cinema.position.set(-23, 0, 34); city.add(cinema);
  kit.box(cinema, [13, 0.08, 9], [0, 0.12, 0], "#789382");
  for (const x of [-4.6, 4.6]) kit.box(cinema, [0.18, 6, 0.18], [x, 3, -3.6], "#52646a");
  kit.box(cinema, [9.6, 5.1, 0.24], [0, 4.0, -3.6], "#263f49");
  const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  const texture = kit.track(new THREE.CanvasTexture(canvas)); texture.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(kit.track(new THREE.PlaneGeometry(9, 4.6)), kit.track(new THREE.MeshBasicMaterial({ map: texture })));
  screen.position.set(0, 4, -3.45); cinema.add(screen);
  kit.label(cinema, "ANUSH’S AFTER HOURS / CODE × CINEMA", [0, 7.6, -3.5], "#e9b9cf", 10);
  const viewers = Array.from({ length: 6 }, (_, i) => {
    const x = (i % 3 - 1) * 2.5, z = 0.2 + Math.floor(i / 3) * 2.4;
    kit.box(cinema, [1.25, 0.25, 1.3], [x, 0.35, z], i % 2 ? "#d49a9f" : "#9fb7a4");
    kit.box(cinema, [1.25, 0.8, 0.18], [x, 0.7, z + 0.5], i % 2 ? "#d49a9f" : "#9fb7a4");
    const viewer = createCharacter(kit, crowdLook(i + 60));
    viewer.root.scale.setScalar(0.6); viewer.root.position.set(x, 0.1, z); viewer.root.rotation.y = Math.PI;
    viewer.legs.forEach(leg => { leg.hip.rotation.x = -1.1; leg.knee.rotation.x = 1.2; });
    cinema.add(viewer.root); return viewer;
  });
  const projector = kit.box(cinema, [0.6, 0.4, 0.8], [0, 1.3, 3.8], "#2c4550");
  kit.cylinder(cinema, 0.08, 1.2, [0, 0.7, 3.8], "#52646a", 12);
  projector.castShadow = false;
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 1.5;
    kit.sphere(cinema, 0.07, [x, 5 - Math.cos(x / 6) * 0.7, 1], "#f5d59c").material = kit.material("#f5d59c", true);
  }

  // Rounded green headlands turn the open ocean into a sheltered valley bay.
  const hillMaterial = kit.track(new THREE.MeshStandardMaterial({ color: "#345e4d", roughness: 1, envMapIntensity: 0.18 }));
  const forestMaterial = kit.track(new THREE.MeshStandardMaterial({ color: "#254b42", roughness: 1, envMapIntensity: 0.1 }));
  const bank = new THREE.Mesh(kit.track(new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2)), hillMaterial);
  bank.position.set(0, -0.5, -114); bank.scale.set(130, 5, 29); scene.add(bank);
  for (let i = 0; i < 8; i++) {
    const geometry = kit.track(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2));
    const points = geometry.getAttribute("position");
    for (let j = 0; j < points.count; j++) {
      const x = points.getX(j), z = points.getZ(j);
      points.setY(j, points.getY(j) * (1 + Math.sin(x * 4 + i) * 0.13 + Math.sin(z * 5) * 0.1));
    }
    geometry.computeVertexNormals();
    const hill = new THREE.Mesh(geometry, hillMaterial);
    hill.position.set(-100 + i * 29, -0.5, -105 - i % 3 * 7);
    const width = 25 + i % 3 * 3, height = 11 + i % 4 * 4;
    hill.scale.set(width, height, 24); scene.add(hill);
    for (let j = 0; j < 7; j++) {
      const x = (j - 3) * 0.18, z = 0.65;
      const y = Math.sqrt(1 - x * x - z * z) * (1 + Math.sin(x * 4 + i) * 0.13 + Math.sin(z * 5) * 0.1);
      const tree = new THREE.Mesh(kit.track(new THREE.ConeGeometry(0.9, 3.2, 7)), forestMaterial);
      tree.position.set(hill.position.x + x * width, y * height + 0.6, hill.position.z + z * 24); scene.add(tree);
    }
  }

  const plane = new THREE.Group(); scene.add(plane);
  const fuselage = kit.sphere(plane, 0.55, [0, 0, 0], "#efe7d6"); fuselage.scale.set(0.8, 0.8, 4);
  kit.box(plane, [6, 0.12, 1.2], [0, 0, 0.1], "#d2796c");
  kit.box(plane, [2.1, 0.1, 0.7], [0, 0.2, -1.6], "#d2796c");
  kit.box(plane, [0.12, 0.9, 0.8], [0, 0.5, -1.5], "#d2796c");
  kit.box(plane, [0.6, 0.4, 0.7], [0, 0.45, 0.8], "#294e60");
  const propeller = kit.box(plane, [0.08, 1.6, 0.1], [0, 0, 2.15], "#354b52");

  const boats = Array.from({ length: 3 }, (_, i) => {
    const boat = new THREE.Group(); scene.add(boat);
    const hull = kit.sphere(boat, 1, [0, 0, 0], i % 2 ? "#d28b73" : "#e3ddc9"); hull.scale.set(1.1, 0.5, 3);
    kit.box(boat, [1.7, 0.25, 4.3], [0, 0.35, 0], "#ad8864");
    kit.box(boat, [1.4, 0.9, 1.6], [0, 0.9, -0.4], "#e5e0cf");
    kit.box(boat, [1.1, 0.35, 0.05], [0, 1.1, 0.43], "#3d6975");
    kit.cylinder(boat, 0.04, 2.7, [0, 1.5, -0.7], "#6d7775", 8);
    const wake = new THREE.Group(); boat.add(wake);
    for (const side of [-1, 1]) {
      const foam = kit.box(wake, [0.09, 0.03, 5], [side * 1.2, 0.03, -4], "#b8dbd7"); foam.rotation.y = side * 0.18;
    }
    return boat;
  });
  let lastScreenFrame = -1;
  function update(time: number) {
    for (let i = 0; i < 210; i++) {
      const [x, z] = cherryPositions[i % cherryPositions.length];
      const phase = time * 0.45 + i * 0.618;
      dummy.position.set(x + Math.sin(phase * 0.8) * 2.5 + Math.cos(i * 3) * 0.8, 0.2 + ((6 - time * 0.65 + i * 0.37) % 6 + 6) % 6, z + Math.cos(phase) * 2);
      dummy.rotation.set(phase, phase * 0.7, phase * 1.5); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
    const angle = time * 0.045;
    plane.position.set(Math.cos(angle) * 76, 33 + Math.sin(angle * 2) * 3, Math.sin(angle) * 68);
    plane.rotation.set(0, -angle, -0.13); propeller.rotation.z = time * 28;
    boats.forEach((boat, i) => {
      const pose = boatPose(time, i);
      boat.position.set(pose.x, -0.15 + Math.sin(time * 1.1 + i) * 0.12, pose.z);
      boat.rotation.set(Math.sin(time + i) * 0.025, pose.heading, Math.sin(time * 0.7 + i) * 0.04);
    });
    viewers.forEach((viewer, i) => { viewer.head.rotation.y = Math.sin(time * 0.4 + i) * 0.08; });
    const frame = Math.floor(time * 8);
    if (frame !== lastScreenFrame) {
      lastScreenFrame = frame;
      const coding = Math.floor(time / 24) % 2 === 1;
      ctx.fillStyle = coding ? "#11232c" : "#172b48"; ctx.fillRect(0, 0, 640, 360);
      if (coding) {
        ctx.font = "bold 25px monospace"; ctx.fillStyle = "#a4d9bb"; ctx.fillText("AFTER HOURS // BUILD SOMETHING", 25, 45);
        ctx.font = "21px monospace";
        ["const curiosity = true;", "while (curiosity) {", "  learn();", "  build();", "  share();", "}"].forEach((line, i) => {
          ctx.fillStyle = i === frame % 6 ? "#f2c989" : "#a4c6cb"; ctx.fillText(line, 40, 95 + i * 36);
        });
      } else {
        ctx.fillStyle = "#f2d8b6"; ctx.beginPath(); ctx.arc(485, 80, 37, 0, Math.PI * 2); ctx.fill();
        for (let layer = 0; layer < 3; layer++) {
          ctx.fillStyle = ["#405b70", "#426e77", "#63918b"][layer]; ctx.beginPath(); ctx.moveTo(0, 360);
          for (let x = 0; x <= 640; x += 8) ctx.lineTo(x, 200 + layer * 43 + Math.sin(x * 0.012 + layer * 2 + time * 0.07) * 40);
          ctx.lineTo(640, 360); ctx.fill();
        }
        ctx.font = "20px monospace"; ctx.fillStyle = "#f3c6d5"; ctx.fillText("A QUIET NIGHT IN SAKURA VALLEY", 32, 330);
      }
      texture.needsUpdate = true;
    }
  }
  update(0);
  return { update };
}
