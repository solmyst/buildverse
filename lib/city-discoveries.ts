export const discoveryItems = [
  { id: "guitar", title: "Six strings, one builder", hint: "A six-string silhouette is waiting in Solmyst Courtyard.", inspect: "Inspect the courtyard guitar" },
  { id: "pitwall", title: "Race-day brain", hint: "Look for a tiny race car in the courtyard.", inspect: "Inspect the miniature race car" },
  { id: "golden-bug", title: "Practice pays off", hint: "A golden bug is hiding beside the arcade cabinet.", inspect: "Inspect the golden bug" },
  { id: "konami", title: "Player two found", hint: "Try the classic ten-key cheat code while exploring. ↑ ↑ ↓ ↓ ← → ← → B A", inspect: "" },
] as const;
export type DiscoveryId = typeof discoveryItems[number]["id"];
export function isDiscovery(id: string): id is DiscoveryId { return discoveryItems.some(item => item.id === id); }
export function restoreDiscoveries(raw: string | null): DiscoveryId[] {
  try {
    const saved: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(saved) ? Array.from(new Set(saved.filter((id): id is DiscoveryId => typeof id === "string" && isDiscovery(id)))) : [];
  } catch { return []; }
}
const code = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
export function advanceSecret(progress: number, key: string) {
  const input = key.toLowerCase();
  const next = input === code[progress] ? progress + 1 : input === code[0] ? 1 : 0;
  return { progress: next === code.length ? 0 : next, unlocked: next === code.length };
}
