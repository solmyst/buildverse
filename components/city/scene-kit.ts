import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
export function createSceneKit() {
  const resources: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(resource: T): T => {
    resources.push(resource);
    return resource;
  };
  const cube = track(new RoundedBoxGeometry(1, 1, 1, 2, 0.045));
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const labels = new Map<string, THREE.Texture>();
  const finishes = new Map<string, THREE.MeshStandardMaterial>();
  // Deterministic micro-grain gives stone a surface without downloading textures.
  const grain = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < 128 * 128; i++) {
    const value = 170 + ((i * 73 + (i >> 7) * 19) % 70);
    grain.set([value, value, value, 255], i * 4);
  }
  const roughness = track(new THREE.DataTexture(grain, 128, 128));
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.magFilter = THREE.LinearFilter;
  roughness.needsUpdate = true;
  function finish(color: string, kind: "stone" | "metal" | "glass" | "wood" = "stone") {
    const key = kind + color;
    if (!finishes.has(key)) finishes.set(key, track(new THREE.MeshStandardMaterial({
      color,
      roughness: kind === "glass" ? 0.17 : kind === "metal" ? 0.29 : 0.78,
      metalness: kind === "glass" ? 0.58 : kind === "metal" ? 0.75 : 0.05,
      ...(kind === "stone" || kind === "wood" ? { roughnessMap: roughness } : {}),
      ...(kind === "glass" ? { emissive: color, emissiveIntensity: 0.12 } : {}),
    })));
    return finishes.get(key)!;
  }
  function material(color: string, emissive = false) {
    const key = color + emissive;
    if (!mats.has(key))
      mats.set(
        key,
        track(
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.72,
            metalness: 0.08,
            ...(emissive ? { emissive: color, emissiveIntensity: 0.45 } : {}),
          }),
        ),
      );
    return mats.get(key)!;
  }
  function box(
    parent: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    color: string,
    emissive = false,
  ) {
    const mesh = new THREE.Mesh(cube, material(color, emissive));
    mesh.scale.set(...size);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(
    parent: THREE.Object3D,
    radius: number,
    height: number,
    position: [number, number, number],
    color: string,
    vertices = 48,
    top = radius,
  ) {
    const geometry = track(
      new THREE.CylinderGeometry(top, radius, height, vertices),
    );
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function sphere(
    parent: THREE.Object3D,
    radius: number,
    position: [number, number, number],
    color: string,
  ) {
    const mesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(radius, 32, 20)),
      material(color),
    );
    mesh.position.set(...position);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function textTexture(text: string, color = "#e8eee8") {
    const key = text + color;
    if (labels.has(key)) return labels.get(key)!;
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#122733";
    context.beginPath();
    context.roundRect(4, 4, 760, 120, 20);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.stroke();
    context.font = "600 34px Arial";
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 384, 66, 700);
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    labels.set(key, texture);
    return texture;
  }
  function label(
    parent: THREE.Object3D,
    text: string,
    position: [number, number, number],
    color: string,
    width = 8,
  ) {
    const sprite = new THREE.Sprite(
      track(
        new THREE.SpriteMaterial({
          map: textTexture(text, color),
          depthTest: true,
        }),
      ),
    );
    sprite.position.set(...position);
    sprite.scale.set(width, width / 6, 1);
    parent.add(sprite);
    return sprite;
  }
  function ring(
    parent: THREE.Object3D,
    radius: number,
    position: [number, number, number],
    color: string,
  ) {
    const mesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(radius, 0.035, 6, 48)),
      material(color, true),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  function screenTexture(
    title: string,
    subtitle: string,
    text: string,
    color: string,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#0d202c";
    context.fillRect(0, 0, 1024, 640);
    context.fillStyle = color;
    context.fillRect(0, 0, 1024, 10);
    context.font = "22px monospace";
    context.fillText(subtitle.toUpperCase(), 55, 75, 920);
    context.font = "bold 49px Arial";
    const titleWords = title.split(" ");
    let line = "",
      y = 155;
    for (const word of titleWords) {
      if (context.measureText(line + word).width > 900) {
        context.fillText(line, 55, y);
        y += 58;
        line = "";
      }
      line += word + " ";
    }
    context.fillText(line, 55, y);
    y += 70;
    context.font = "27px Arial";
    context.fillStyle = "#bacdd1";
    line = "";
    for (const word of text.slice(0, 290).split(" ")) {
      if (context.measureText(line + word).width > 900) {
        context.fillText(line, 55, y);
        y += 40;
        line = "";
        if (y > 500) break;
      }
      line += word + " ";
    }
    if (y <= 500) context.fillText(line, 55, y);
    context.font = "22px monospace";
    context.fillStyle = color;
    context.fillText(
      "SELECT THIS DISPLAY TO OPEN THE COMPLETE DOSSIER  ↗",
      55,
      590,
      920,
    );
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }
  // Folds static meshes into one draw call per material under their nearest anchor:
  // the root, a pick target (userData.buildingId/action), or anything marked
  // userData.batch = "live" because code moves, swaps or toggles it after build.
  // "skip" and hidden objects keep their whole subtree as built.
  function batch(root: THREE.Object3D) {
    root.updateWorldMatrix(true, true);
    const batches = new Map<string, { anchor: THREE.Object3D; material: THREE.Material; mesh: THREE.Mesh; geometries: THREE.BufferGeometry[] }>();
    const frozen: Array<{ object: THREE.Object3D; matrix: THREE.Matrix4; visible: boolean; material?: unknown }> = [];
    const inverses = new Map<THREE.Object3D, THREE.Matrix4>();
    const removed: Array<[THREE.Mesh, THREE.Object3D]> = [];
    const combined: THREE.Mesh[] = [];
    let before = 0;
    const visit = (object: THREE.Object3D, anchor: THREE.Object3D) => {
      for (const child of [...object.children]) {
        const { batch: mode, buildingId, action } = child.userData;
        if (mode === "skip" || !child.visible) continue;
        const isAnchor = mode === "live" || buildingId !== undefined || action !== undefined;
        if (!isAnchor) {
          child.updateMatrix();
          frozen.push({ object: child, matrix: child.matrix.clone(), visible: true, material: (child as THREE.Mesh).material });
        }
        const mesh = child as THREE.Mesh;
        if (
          !isAnchor && mesh.isMesh && mesh.constructor === THREE.Mesh && !mesh.children.length &&
          !Array.isArray(mesh.material) && !mesh.material.transparent && mesh.matrixWorld.determinant() > 0
        ) {
          before++;
          if (!inverses.has(anchor)) inverses.set(anchor, anchor.matrixWorld.clone().invert());
          const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
          source.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverses.get(anchor)!, mesh.matrixWorld));
          const key = [anchor.id, mesh.material.uuid, mesh.castShadow, mesh.receiveShadow, Object.keys(source.attributes).sort()].join();
          const entry = batches.get(key) ?? { anchor, material: mesh.material, mesh, geometries: [] };
          entry.geometries.push(source);
          batches.set(key, entry);
          removed.push([mesh, object]);
          mesh.removeFromParent();
          continue;
        }
        visit(child, isAnchor ? child : anchor);
      }
    };
    visit(root, root);
    for (const { anchor, material, mesh, geometries } of Array.from(batches.values())) {
      const merged = geometries.length > 1 ? mergeGeometries(geometries, false) : geometries[0];
      if (merged !== geometries[0]) geometries.forEach((geometry) => geometry.dispose());
      if (!merged) throw new Error(`Cannot batch meshes of material ${material.name || material.uuid}`);
      const batchMesh = new THREE.Mesh(track(merged), material);
      batchMesh.castShadow = mesh.castShadow;
      batchMesh.receiveShadow = mesh.receiveShadow;
      anchor.add(batchMesh);
      combined.push(batchMesh);
    }
    return {
      before,
      after: batches.size,
      // Restores the original meshes so the engineer HUD can show the unbatched cost.
      setMerged(value: boolean) {
        combined.forEach((mesh) => (mesh.visible = value));
        for (const [mesh, parent] of removed) {
          if (value) mesh.removeFromParent();
          else parent.add(mesh);
        }
      },
      // Objects changed after batching no longer reach the screen; they need userData.batch = "live".
      stale: () =>
        frozen.filter(({ object, matrix, material }) => {
          object.updateMatrix();
          return !object.matrix.equals(matrix) || !object.visible || (object as THREE.Mesh).material !== material;
        }).map(({ object }) => object),
    };
  }
  return {
    track,
    batch,
    box,
    cylinder,
    sphere,
    label,
    ring,
    material,
    finish,
    screenTexture,
    dispose() {
      resources.forEach((resource) => resource.dispose());
    },
  };
}
export type SceneKit = ReturnType<typeof createSceneKit>;
