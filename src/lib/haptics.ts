export type HapticKind = "light" | "medium" | "success" | "warning" | "selection";
const patterns: Record<HapticKind, number | number[]> = {
  light: 8, medium: 18, success: [10, 30, 15], warning: [24, 40, 24], selection: 5
};
export function haptic(kind: HapticKind = "selection") {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("ipchat-haptics") === "off") return;
  if ("vibrate" in navigator) navigator.vibrate(patterns[kind]);
}
