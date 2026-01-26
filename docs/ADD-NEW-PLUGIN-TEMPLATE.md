# Add New Plugin to OpenSync

Reusable prompt template for adding a new CLI sync plugin to the OpenSync app.

## Required Information

Fill in these values before starting:

| Field                             | Value | Example                                                   |
| --------------------------------- | ----- | --------------------------------------------------------- |
| Package name (npm)                |       | `codex-sync-plugin`                                       |
| GitHub URL                        |       | `https://github.com/waynesutton/codex-sync-plugin-plugin` |
| Source ID (lowercase, hyphenated) |       | `codex-cli-plugin`                                        |
| Display name                      |       | `Codex CLI plugin`                                        |
| Short label (2 chars)             |       | `CX`                                                      |
| Status                            |       | `supported` / `community` / `planned`                     |
| Badge color                       |       | `blue` / `amber` / `orange` / `purple` / `green`          |
| CLI commands                      |       | `login`, `setup`, `verify`, `sync`                        |
| Tool website                      |       | `https://openai.com/codex`                                |

## Files to Update (10 locations)

### 1. README.md - Ecosystem Table

**Location**: Root `/README.md` - Ecosystem section

**Action**: Add row to Ecosystem table

```markdown
| [PACKAGE_NAME] | Sync [DISPLAY_NAME] sessions | [GitHub](GITHUB_URL) / [npm](NPM_URL) |
```

Also add to "Install sync plugins" section:

```markdown
**For [DISPLAY_NAME]:**

\`\`\`bash
npm install -g [PACKAGE_NAME]
[PACKAGE_NAME] login
\`\`\`

[[DISPLAY_NAME] plugin docs](https://www.opensync.dev/docs#[SOURCE_ID]-plugin)
```

---

### 2. src/pages/Settings.tsx - AI_AGENTS Array

**Location**: `src/pages/Settings.tsx` - AI_AGENTS array (around line 49)

**Action**: Add/update entry with status and URL

```typescript
{ id: "[SOURCE_ID]", name: "[DISPLAY_NAME]", status: "[STATUS]", defaultEnabled: false, url: "[NPM_URL]" },
```

**Location**: Plugin Setup section (around line 254)

**Action**: Add plugin links

```tsx
<p>
  <a
    href="[NPM_URL]"
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "inline-flex items-center gap-1 font-medium",
      theme === "dark"
        ? "text-blue-400 hover:text-blue-300"
        : "text-[#EB5601] hover:text-[#d14a01]",
    )}
  >
    [PACKAGE_NAME]
    <ExternalLink className="h-3 w-3" />
  </a>{" "}
  <span className={t.textDim}>Sync your [DISPLAY_NAME] sessions</span>{" "}
  <a
    href="[GITHUB_URL]"
    target="_blank"
    rel="noopener noreferrer"
    className={cn("text-xs", t.textDim, "hover:underline")}
  >
    (GitHub)
  </a>
</p>
```

**Location**: Quick Setup section (around line 400)

**Action**: Add install commands

```tsx
<p className={cn("mt-2", t.textDim)}># For [DISPLAY_NAME]</p>
<p>npm install -g [PACKAGE_NAME]</p>
<p>[PACKAGE_NAME] login</p>
```

---

### 3. src/pages/Dashboard.tsx - AI_AGENTS_MAP

**Location**: `src/pages/Dashboard.tsx` - AI_AGENTS_MAP (around line 59)

**Action**: Add source-id to display name mapping

```typescript
"[SOURCE_ID]": "[DISPLAY_NAME]",
```

---

### 4. src/pages/Login.tsx - Homepage

**Location**: `getSourceDisplayName` function (around line 110)

**Action**: Add mapping

```typescript
"[SOURCE_ID]": "[DISPLAY_NAME]",
```

**Location**: "Syncs with" section (around line 620)

**Action**: Add icon (use appropriate SVG for the tool)

```tsx
{/* [DISPLAY_NAME] */}
<div className="flex flex-col items-center gap-1.5" title="[DISPLAY_NAME]">
  <svg className={`h-8 w-8 ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`} ...>
    {/* SVG path */}
  </svg>
  <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}>
    [DISPLAY_NAME]
  </span>
</div>
```

**Location**: "Getting started" section (around line 750)

**Action**: Add package link

```tsx
{
  /* [DISPLAY_NAME] */
}
<a
  href="[NPM_URL]"
  target="_blank"
  rel="noopener noreferrer"
  className={`group flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
    isDark
      ? "border-zinc-800 bg-[#0E0E0E] hover:border-zinc-700"
      : "border-[#e6e4e1] bg-[#faf8f5] hover:border-[#8b7355]"
  }`}
>
  <span
    className={`font-mono text-xs ${
      isDark
        ? "text-zinc-100 group-hover:text-zinc-300"
        : "text-[#6b6b6b] group-hover:text-[#1a1a1a]"
    }`}
  >
    [PACKAGE_NAME]
  </span>
  <span
    className={`rounded px-1.5 py-0.5 text-[10px] ${
      isDark ? "bg-zinc-800 text-zinc-600" : "bg-[#ebe9e6] text-[#8b7355]"
    }`}
  >
    npm
  </span>
</a>;
```

---

### 5. src/lib/source.ts - Source Utilities

**Location**: `src/lib/source.ts`

**Action**: Update SourceType union (line 2)

```typescript
export type SourceType =
  | "claude-code"
  | "factory-droid"
  | "opencode"
  | "[SOURCE_ID]";
```

**Action**: Update `getSourceLabel` (around line 9)

Add to short labels:

```typescript
: s === "[SOURCE_ID]"
  ? "[SHORT_LABEL]"
```

Add to full labels:

```typescript
: s === "[SOURCE_ID]"
  ? "[DISPLAY_NAME]"
```

**Action**: Update `getSourceColorClass` (around line 22)

Add themed colors:

```typescript
if (s === "[SOURCE_ID]") {
  return isDark
    ? "bg-[COLOR]-500/20 text-[COLOR]-400"
    : "bg-[COLOR]-100 text-[COLOR]-700";
}
```

Add non-themed colors:

```typescript
if (s === "[SOURCE_ID]") return "bg-[COLOR]-500/15 text-[COLOR]-400";
```

---

### 6. src/pages/Docs.tsx - Search Index

**Location**: `src/pages/Docs.tsx` - searchIndex array (around line 80)

**Action**: Add search entries

```typescript
// [DISPLAY_NAME] Plugin
{ id: "[SOURCE_ID]-plugin", title: "[DISPLAY_NAME] Plugin", section: "Plugins", keywords: ["[keywords]"], snippet: "[DISPLAY_NAME] sync plugin documentation" },
{ id: "[SOURCE_ID]-install", title: "Installation", section: "[DISPLAY_NAME] Plugin", keywords: ["install", "npm install", "[PACKAGE_NAME]", "global", "-g"], snippet: "npm install -g [PACKAGE_NAME]" },
{ id: "[SOURCE_ID]-config", title: "Configuration", section: "[DISPLAY_NAME] Plugin", keywords: ["config", "[keywords]"], snippet: "[config description]" },
{ id: "[SOURCE_ID]-commands", title: "Commands", section: "[DISPLAY_NAME] Plugin", keywords: ["commands", "[command list]"], snippet: "[commands list]" },
```

---

### 7. src/pages/Docs.tsx - Navigation

**Location**: `src/pages/Docs.tsx` - navItems array (around line 360)

**Action**: Add navigation entry

```typescript
{
  id: "[SOURCE_ID]-plugin",
  title: "[DISPLAY_NAME] Plugin",
  icon: <Package className="h-4 w-4" />,
  subsections: [
    { id: "[SOURCE_ID]-install", title: "Installation" },
    { id: "[SOURCE_ID]-config", title: "Configuration" },
    { id: "[SOURCE_ID]-commands", title: "Commands" },
  ],
},
```

---

### 8. src/pages/Docs.tsx - Documentation Content

**Location**: `src/pages/Docs.tsx` - After existing plugin sections (around line 2300)

**Action**: Add full documentation section (copy and modify from existing plugin sections)

Include:

- Installation with npm command
- GitHub and npm links
- Configuration steps (login, setup, etc.)
- Config file example
- Commands table

---

### 9. convex/analytics.ts - Provider Inference (if needed)

**Location**: `convex/analytics.ts` - inferProvider function (around line 30)

**Action**: Add model pattern matching if the tool uses specific model names

```typescript
// [Provider] models
if (model.includes("[pattern]")) return "[provider]";
```

---

### 10. files.md - File Descriptions

**Location**: Root `/files.md`

**Action**: Update relevant file descriptions to mention the new plugin

---

### 11. changelog.md - Changelog Entry

**Location**: Root `/changelog.md`

**Action**: Add changelog entry following changelog.mdc format

```markdown
## [VERSION] - YYYY-MM-DD

### Added

- [PACKAGE_NAME] plugin integration: sync [DISPLAY_NAME] sessions to OpenSync
- Added [SOURCE_ID] to AI Coding Agents in Settings
- Added [DISPLAY_NAME] to homepage "Syncs with" and "Getting started" sections
- Added [DISPLAY_NAME] Plugin documentation section
- Added [SHORT_LABEL] source badge with [COLOR] theme color
```

---

## Testing Checklist

After making all changes, verify:

- [ ] Package appears in README.md Ecosystem table
- [ ] Quick install instructions in README.md
- [ ] Agent shows in Settings > AI Coding Agents with correct status badge
- [ ] Plugin links appear in Settings > Plugin Setup section
- [ ] Install commands appear in Settings > Quick Setup section
- [ ] Source filter dropdown includes new agent when enabled
- [ ] Icon appears in homepage "Syncs with" section
- [ ] Package link appears in homepage "Getting started" section
- [ ] Platform Stats shows correct display name (getSourceDisplayName)
- [ ] Source badges display correct label (getSourceLabel)
- [ ] Source badges display correct color (getSourceColorClass)
- [ ] Docs search finds plugin entries (searchIndex)
- [ ] Docs sidebar shows plugin navigation (navItems)
- [ ] Full documentation section is navigable and accurate
- [ ] Markdown export includes plugin in Resources section
- [ ] No TypeScript errors in any modified files
- [ ] No linter warnings

---

## Quick Reference

### Color Options for Badges

| Color  | Dark Theme                           | Light Theme                       |
| ------ | ------------------------------------ | --------------------------------- |
| blue   | `bg-blue-500/20 text-blue-400`       | `bg-blue-100 text-blue-700`       |
| amber  | `bg-amber-500/20 text-amber-400`     | `bg-amber-100 text-amber-700`     |
| orange | `bg-orange-500/20 text-orange-400`   | `bg-orange-100 text-orange-700`   |
| purple | `bg-purple-500/20 text-purple-400`   | `bg-purple-100 text-purple-700`   |
| green  | `bg-emerald-500/20 text-emerald-400` | `bg-emerald-100 text-emerald-700` |

### Status Options

| Status    | Badge Color | Description                    |
| --------- | ----------- | ------------------------------ |
| supported | emerald     | Official, maintained plugin    |
| community | blue        | Community-contributed plugin   |
| planned   | amber       | Planned for future development |
| tbd       | gray        | Under consideration            |

### Existing Source IDs

- `opencode` - OpenCode (OC, blue)
- `claude-code` - Claude Code (CC, amber)
- `factory-droid` - Factory Droid (FD, orange)
- `codex-cli` - Codex CLI (CX, purple)
