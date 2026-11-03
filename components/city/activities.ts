import * as THREE from "three";
import type { SceneKit } from "./scene-kit";
import { activities, approachProgress, type ActivityId } from "@/lib/city-activities";

export function createActivities(city: THREE.Group, kit: SceneKit, plane: THREE.Group, boat: THREE.Group, gondola: THREE.Group) {
  const swing = new THREE.Group(); swing.userData.action = "ride:swing"; swing.position.set(29, 0, 37); city.add(swing);
  for (const x of [-1, 1]) for (const z of [-0.6, 0.6]) {
    const leg = kit.box(swing, [0.12, 3.7, 0.12], [x, 1.9, z], "#765e4e"); leg.rotation.x = z > 0 ? 0.15 : -0.15;
  }
  kit.box(swing, [2.5, 0.18, 0.2], [0, 3.7, 0], "#765e4e");
  const pivot = new THREE.Group(); pivot.position.y = 3.6; pivot.userData.batch = "live"; swing.add(pivot);
  for (const x of [-0.6, 0.6]) kit.box(pivot, [0.035, 2.7, 0.035], [x, -1.35, 0], "#d7caa5");
  kit.box(pivot, [1.5, 0.12, 0.55], [0, -2.7, 0], "#b48660");
  const seat = new THREE.Object3D(); seat.position.set(0, -2.55, 0); pivot.add(seat);
  // A visible meeting point gives summoned transport a place in the world.
  kit.box(city, [7, 0.25, 12], [49, 0.1, 37], "#ac9272");
  kit.label(city, "AIR DOCK / COASTAL CRUISES", [48, 3.5, 36], "#f0d49d", 7);
  kit.box(city, [1.25, 0.25, 1.3], [-21, 0.35, 38.4], "#d49a9f");
  kit.box(city, [1.25, 0.8, 0.18], [-21, 0.7, 38.9], "#d49a9f");
  let id: ActivityId | null = null, stage: "calling" | "ready" | "riding" = "riding", seconds = 0;
  let passenger = false;
  let origin = new THREE.Vector3();
  const target = new THREE.Vector3(), eye = new THREE.Vector3();
  function start(next: ActivityId) {
    id = next; seconds = 0; passenger = false;
    stage = next === "plane" || next === "boat" ? "calling" : "riding";
    origin = (next === "plane" ? plane : boat).position.clone();
  }
  function update(delta: number, reducedMotion = false) {
    if (!id) return null;
    if (reducedMotion) {
      if (stage === "calling") seconds = 5;
      else if (stage === "riding" && (id === "plane" || id === "boat")) seconds = Math.max(seconds, 8);
    } else seconds += delta;
    const vehicle = id === "plane" ? plane : boat;
    const dock = new THREE.Vector3(53, id === "plane" ? 1.5 : 0, id === "plane" ? 35 : 40);
    if (id === "plane" || id === "boat") {
      if (stage !== "riding") {
        const progress = approachProgress(seconds);
        if (id === "boat" && seconds < 4) {
          const startAngle = Math.atan2(origin.z, origin.x), endAngle = Math.atan2(40, 60);
          const arc = Math.atan2(Math.sin(endAngle - startAngle), Math.cos(endAngle - startAngle));
          const t = approachProgress(seconds * 1.25);
          const angle = startAngle + arc * t;
          const radius = THREE.MathUtils.lerp(Math.max(72, Math.hypot(origin.x, origin.z)), Math.hypot(60, 40), t);
          vehicle.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        } else if (id === "boat") {
          vehicle.position.lerpVectors(new THREE.Vector3(60, 0, 40), dock, approachProgress((seconds - 4) * 5));
        } else {
          vehicle.position.lerpVectors(origin, dock, progress);
          vehicle.position.y += Math.sin(progress * Math.PI) * 20;
        }
        vehicle.rotation.set(0, Math.PI / 2, 0);
        if (seconds >= 5) stage = "ready";
        target.copy(dock); eye.copy(dock).add(new THREE.Vector3(-10, 6, 12));
      } else {
        // Ease away from the dock into a broad, continuous scenic loop.
        const a = seconds * (id === "plane" ? 0.06 : 0.035);
        const path = id === "plane"
          ? new THREE.Vector3(Math.cos(a) * 80, 32 + Math.sin(a * 2) * 4, Math.sin(a) * 80)
          : new THREE.Vector3(Math.cos(a) * 85, 0, Math.sin(a) * 90);
        vehicle.position.lerpVectors(dock, path, approachProgress(seconds));
        vehicle.rotation.set(0, -a, id === "plane" ? -0.08 : 0);
        target.copy(vehicle.position).add(new THREE.Vector3(0, 0.8, 0));
        eye.copy(target).add(new THREE.Vector3(Math.cos(a) * (id === "plane" ? 18 : 12), id === "plane" ? 9 : 5, Math.sin(a) * (id === "plane" ? 18 : 12)));
      }
    } else if (id === "swing") {
      pivot.rotation.x = Math.sin(seconds * 1.5) * 0.45;
      swing.updateMatrixWorld(true); seat.getWorldPosition(target);
      eye.copy(target).add(new THREE.Vector3(4, 2.5, 6));
    } else if (id === "ferris") {
      gondola.updateWorldMatrix(true, false); gondola.getWorldPosition(target); target.y -= 0.85;
      eye.copy(target).add(new THREE.Vector3(3, 1.8, -5));
    } else {
      target.set(-23, 4, 30.5); eye.set(-21, 1.65, 38.8);
    }
    const person = id === "cinema" ? new THREE.Vector3(-21, -0.25, 38.4) : target.clone().add(new THREE.Vector3(0, -0.83, 0));
    if ((id === "plane" || id === "boat") && stage !== "riding") person.set(46, 0.15, 37);
    if (id === "boat" && stage === "riding") {
      person.copy(boat.localToWorld(new THREE.Vector3(0, -0.25, 1.4)));
    }
    if (passenger && stage === "riding" && (id === "plane" || id === "boat")) {
      eye.copy(vehicle.localToWorld(new THREE.Vector3(id === "plane" ? 0.7 : 0.65, id === "plane" ? 2.4 : 1.7, 1.3)));
      target.set(0, id === "plane" ? 8 : 2, 0);
    }
    return { id, stage, passenger, target, eye, person, heading: id === "boat" ? boat.rotation.y : id === "cinema" ? Math.PI : 0, label: activities.find(a => a.id === id)!.name };
  }
  return { start, update, toggleView() { passenger = !passenger; }, board() { if (stage === "ready") { stage = "riding"; seconds = 0; } }, stop() { id = null; pivot.rotation.x = 0; } };
}
