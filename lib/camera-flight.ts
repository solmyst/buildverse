export function flightDuration(distance: number) {
  return Math.min(2.6, Math.max(0.8, 0.8 + Math.max(0, distance) * 0.012));
}
export function flightProgress(elapsed: number, duration: number) {
  const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
  return t * t * (3 - 2 * t);
}
