export const activities = [
  { id: "swing", name: "Sakura swing", detail: "Take a seat beneath the blossoms.", x: 29, z: 37 },
  { id: "cinema", name: "Watch the cinema", detail: "Sit down for the original animated landscape and code reel.", x: -23, z: 37 },
  { id: "ferris", name: "Ferris wheel", detail: "Board a gondola and see the waterfront from above.", x: -28, z: -35.5 },
  { id: "plane", name: "Call the plane", detail: "Summon a sightseeing flight, then board at the air dock.", x: 48, z: 35 },
  { id: "boat", name: "Call the boat", detail: "Meet your boat at the pier for a coastal cruise.", x: 48, z: 40 },
] as const;
export type ActivityId = typeof activities[number]["id"];
export function nearestActivity(x: number, z: number): ActivityId | null {
  let closest: ActivityId | null = null, distance = 4;
  for (const item of activities) {
    const candidate = Math.hypot(x - item.x, z - item.z);
    if (candidate < distance) { closest = item.id; distance = candidate; }
  }
  return closest;
}
export function approachProgress(seconds: number) {
  const t = Math.min(1, Math.max(0, seconds / 5));
  return t * t * (3 - 2 * t);
}
