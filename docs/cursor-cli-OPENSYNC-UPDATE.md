# OpenSync Update for cursor-sync-plugin

Instructions to add cursor-sync-plugin support to OpenSync.

## Plugin Info

| Field | Value |
|-------|-------|
| Package name (npm) | `cursor-sync-plugin` |
| GitHub URL | `https://github.com/waynesutton/cursor-cli-sync-plugin` |
| npm URL | `https://www.npmjs.com/package/cursor-sync-plugin` |
| Source ID | `cursor-sync` |
| Display name | `Cursor` |
| Short label | `CR` |
| Status | `supported` |
| Badge color | `purple` |

---

## 1. src/lib/source.ts

### Add to SourceType union (around line 2)

```typescript
export type SourceType =
  | "claude-code"
  | "factory-droid"
  | "opencode"
  | "codex-cli"
  | "cursor-sync";
```

### Add to getSourceLabel - short labels (around line 9)

```typescript
: s === "cursor-sync"
  ? "CR"
```

### Add to getSourceLabel - full labels

```typescript
: s === "cursor-sync"
  ? "Cursor"
```

### Add to getSourceColorClass - themed (around line 22)

```typescript
if (s === "cursor-sync") {
  return isDark
    ? "bg-purple-500/20 text-purple-400"
    : "bg-purple-100 text-purple-700";
}
```

### Add to getSourceColorClass - non-themed

```typescript
if (s === "cursor-sync") return "bg-purple-500/15 text-purple-400";
```

---

## 2. src/pages/Settings.tsx

### Add to AI_AGENTS array (around line 49)

```typescript
{ id: "cursor-sync", name: "Cursor", status: "supported", defaultEnabled: false, url: "https://www.npmjs.com/package/cursor-sync-plugin" },
```

### Add to Plugin Setup section (around line 254)

```tsx
<p>
  <a
    href="https://www.npmjs.com/package/cursor-sync-plugin"
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "inline-flex items-center gap-1 font-medium",
      theme === "dark"
        ? "text-blue-400 hover:text-blue-300"
        : "text-[#EB5601] hover:text-[#d14a01]",
    )}
  >
    cursor-sync-plugin
    <ExternalLink className="h-3 w-3" />
  </a>{" "}
  <span className={t.textDim}>Sync your Cursor sessions</span>{" "}
  <a
    href="https://github.com/waynesutton/cursor-cli-sync-plugin"
    target="_blank"
    rel="noopener noreferrer"
    className={cn("text-xs", t.textDim, "hover:underline")}
  >
    (GitHub)
  </a>
</p>
```

### Add to Quick Setup section (around line 400)

```tsx
<p className={cn("mt-2", t.textDim)}># For Cursor</p>
<p>npm install -g cursor-sync-plugin</p>
<p>cursor-sync login</p>
```

---

## 3. src/pages/Dashboard.tsx

### Add to AI_AGENTS_MAP (around line 59)

```typescript
"cursor-sync": "Cursor",
```

---

## 4. src/pages/Login.tsx

### Add to getSourceDisplayName function (around line 110)

```typescript
"cursor-sync": "Cursor",
```

### Add to "Syncs with" section (around line 620)

```tsx
{/* Cursor */}
<div className="flex flex-col items-center gap-1.5" title="Cursor">
  <svg className={`h-8 w-8 ${isDark ? "text-zinc-300" : "text-[#1a1a1a]"}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
  <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}>
    Cursor
  </span>
</div>
```

### Add to "Getting started" section (around line 750)

```tsx
{/* Cursor */}
<a
  href="https://www.npmjs.com/package/cursor-sync-plugin"
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
    cursor-sync-plugin
  </span>
  <span
    className={`rounded px-1.5 py-0.5 text-[10px] ${
      isDark ? "bg-zinc-800 text-zinc-600" : "bg-[#ebe9e6] text-[#8b7355]"
    }`}
  >
    npm
  </span>
</a>
```

---

## 5. src/pages/Docs.tsx

### Add to searchIndex array (around line 80)

```typescript
// Cursor Plugin
{ id: "cursor-sync-plugin", title: "Cursor Plugin", section: "Plugins", keywords: ["cursor", "cursor-sync", "cursor-sync-plugin", "ide"], snippet: "Cursor sync plugin documentation" },
{ id: "cursor-sync-install", title: "Installation", section: "Cursor Plugin", keywords: ["install", "npm install", "cursor-sync-plugin", "global", "-g"], snippet: "npm install -g cursor-sync-plugin" },
{ id: "cursor-sync-config", title: "Configuration", section: "Cursor Plugin", keywords: ["config", "login", "setup", "hooks"], snippet: "cursor-sync login and setup configuration" },
{ id: "cursor-sync-commands", title: "Commands", section: "Cursor Plugin", keywords: ["commands", "login", "setup", "verify", "synctest", "logout", "status"], snippet: "cursor-sync CLI commands" },
```

### Add to navItems array (around line 360)

```typescript
{
  id: "cursor-sync-plugin",
  title: "Cursor Plugin",
  icon: <Package className="h-4 w-4" />,
  subsections: [
    { id: "cursor-sync-install", title: "Installation" },
    { id: "cursor-sync-config", title: "Configuration" },
    { id: "cursor-sync-commands", title: "Commands" },
  ],
},
```

---

## 6. README.md - Ecosystem Table

Add to the ecosystem table:

```markdown
| cursor-sync-plugin   | Sync Cursor sessions                    | [GitHub](https://github.com/waynesutton/cursor-cli-sync-plugin) / [npm](https://www.npmjs.com/package/cursor-sync-plugin) |
```

Add to install section:

```markdown
**For Cursor:**

\`\`\`bash
npm install -g cursor-sync-plugin
cursor-sync login
\`\`\`

[Cursor plugin docs](https://www.opensync.dev/docs#cursor-sync-plugin)
```

---

## 7. changelog.md

```markdown
## [X.X.X] - YYYY-MM-DD

### Added

- cursor-sync-plugin integration: sync Cursor sessions to OpenSync
- Added cursor-sync to AI Coding Agents in Settings
- Added Cursor to homepage "Syncs with" and "Getting started" sections
- Added Cursor Plugin documentation section
- Added CR source badge with purple theme color
```

---

## Testing Checklist

After making all changes, verify:

- [ ] Package appears in README.md Ecosystem table
- [ ] Agent shows in Settings > AI Coding Agents with correct status badge
- [ ] Plugin links appear in Settings > Plugin Setup section
- [ ] Install commands appear in Settings > Quick Setup section
- [ ] Source filter dropdown includes Cursor when enabled
- [ ] Icon appears in homepage "Syncs with" section
- [ ] Package link appears in homepage "Getting started" section
- [ ] Source badges display "CR" label with purple color
- [ ] Docs search finds plugin entries
- [ ] Docs sidebar shows plugin navigation
- [ ] No TypeScript errors
