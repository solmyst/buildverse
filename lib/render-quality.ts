export type QualityTier = "high" | "medium" | "low";
export type QualityMode = QualityTier | "auto";
export const qualityTiers: Record<QualityTier, { pixelRatio: number; shadows: boolean; ink: boolean }> = {
  high: { pixelRatio: 2, shadows: true, ink: true },
  medium: { pixelRatio: 1.5, shadows: false, ink: true },
  low: { pixelRatio: 1, shadows: false, ink: false },
};
const order: QualityTier[] = ["high", "medium", "low"];
// Drops one tier when a 3 s window of rendered frames averages under 40 fps.
// It never steps back up, so the city cannot flicker between tiers.
export function createQualityGovernor(tier: QualityTier) {
  let span = 0,
    frames = 0;
  return {
    get tier() {
      return tier;
    },
    // Returns the new tier when this frame interval (ms) triggers a drop.
    sample(interval: number): QualityTier | null {
      // Stalls from loading, shader compiles or tab switches are not steady-state cost.
      if (interval > 250) return null;
      span += interval;
      frames++;
      if (span < 3000) return null;
      const fps = (frames * 1000) / span;
      span = frames = 0;
      if (fps >= 40 || tier === "low") return null;
      tier = order[order.indexOf(tier) + 1];
      return tier;
    },
    reset() {
      span = frames = 0;
    },
  };
}
