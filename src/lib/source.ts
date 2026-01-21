export type SourceType = "claude-code" | "factory-droid" | "opencode";

export function getSourceLabel(source: string | undefined, short = false): string {
  const s = source || "opencode";
  if (short) {
    return s === "claude-code" ? "CC" : s === "factory-droid" ? "FD" : "OC";
  }
  return s === "claude-code" ? "Claude Code" : s === "factory-droid" ? "Factory Droid" : "OpenCode";
}

export function getSourceColorClass(
  source: string | undefined,
  options: { theme?: "dark" | "tan"; themed?: boolean } = {}
): string {
  const s = source || "opencode";
  const { theme = "dark", themed = true } = options;
  const isDark = theme === "dark";

  if (themed) {
    if (s === "claude-code") {
      return isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700";
    }
    if (s === "factory-droid") {
      return isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-700";
    }
    return isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700";
  }

  // Non-themed static colors (used in some components)
  if (s === "claude-code") return "bg-amber-500/15 text-amber-500";
  if (s === "factory-droid") return "bg-orange-500/15 text-orange-400";
  return "bg-blue-500/15 text-blue-400";
}
