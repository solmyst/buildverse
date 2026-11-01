export const valleyPlaces = [
  { id: "garden", name: "Sakura Garden", detail: "Cherry blossoms, lanterns & a quiet pond", x: 23, z: 34 },
  { id: "cinema", name: "After Hours Cinema", detail: "Original animation, coding & a seated audience", x: -23, z: 38 },
] as const;
export function boatPose(time: number, index: number) {
  const angle = time * (0.018 + index * 0.003) + index * 2.1;
  const rx = 80 + index * 7, rz = 84 + index * 6;
  return { x: Math.cos(angle) * rx, z: Math.sin(angle) * rz,
    heading: Math.atan2(-rx * Math.sin(angle), rz * Math.cos(angle)) };
}
