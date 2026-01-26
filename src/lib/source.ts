// Source type for CLI tools that sync sessions
export type SourceType =
  | "claude-code"
  | "factory-droid"
  | "opencode"
  | "codex-cli"
  | "cursor-sync";

/**
 * Get display label for a source
 * @param source - Source identifier (e.g., "opencode", "claude-code", "factory-droid", "codex-cli")
 * @param short - If true, returns abbreviated label (OC, CC, FD, CX)
 */
export function getSourceLabel(
  source: string | undefined,
  short = false,
): string {
  const s = source || "opencode";
  if (short) {
    return s === "claude-code"
      ? "CC"
      : s === "factory-droid"
        ? "FD"
        : s === "codex-cli"
          ? "CX"
          : s === "cursor-sync"
            ? "CR"
            : "OC";
  }
  return s === "claude-code"
    ? "Claude Code"
    : s === "factory-droid"
      ? "Factory Droid"
      : s === "codex-cli"
        ? "Codex CLI"
        : s === "cursor-sync"
          ? "Cursor"
          : "OpenCode";
}

/**
 * Get themed color classes for source badges
 * @param source - Source identifier
 * @param options - Theme options
 */
export function getSourceColorClass(
  source: string | undefined,
  options: { theme?: "dark" | "tan"; themed?: boolean } = {},
): string {
  const s = source || "opencode";
  const { theme = "dark", themed = true } = options;
  const isDark = theme === "dark";

  if (themed) {
    if (s === "claude-code") {
      return isDark
        ? "bg-amber-500/20 text-amber-400"
        : "bg-amber-100 text-amber-700";
    }
    if (s === "factory-droid") {
      return isDark
        ? "bg-orange-500/20 text-orange-400"
        : "bg-orange-100 text-orange-700";
    }
    if (s === "codex-cli") {
      return isDark
        ? "bg-purple-500/20 text-purple-400"
        : "bg-purple-100 text-purple-700";
    }
    if (s === "cursor-sync") {
      return isDark
        ? "bg-violet-500/20 text-violet-400"
        : "bg-violet-100 text-violet-700";
    }
    return isDark
      ? "bg-blue-500/20 text-blue-400"
      : "bg-blue-100 text-blue-700";
  }

  // Non-themed static colors (used in some components)
  if (s === "claude-code") return "bg-amber-500/15 text-amber-500";
  if (s === "factory-droid") return "bg-orange-500/15 text-orange-400";
  if (s === "codex-cli") return "bg-purple-500/15 text-purple-400";
  if (s === "cursor-sync") return "bg-violet-500/15 text-violet-400";
  return "bg-blue-500/15 text-blue-400";
}
