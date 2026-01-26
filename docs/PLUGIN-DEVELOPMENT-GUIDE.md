# OpenSync Plugin Development Guide

Build sync plugins for AI coding assistants. This guide covers everything needed to create a plugin that syncs sessions to the OpenSync dashboard.

**Version**: 1.1.0  
**Last Updated**: 2026-01-26  
**OpenSync Repo**: [github.com/waynesutton/opensync](https://github.com/waynesutton/opensync)

## Table of Contents

- [Quick Reference](#quick-reference)
- [Architecture Overview](#architecture-overview)
  - [Sync Mechanisms: Hooks vs File Parsing](#sync-mechanisms-hooks-vs-file-parsing)
  - [Token and Cost Data Availability](#token-and-cost-data-availability)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [CLI Commands Reference](#cli-commands-reference)
- [Plugin Architecture](#plugin-architecture)
- [Code Examples](#code-examples)
- [README Template](#readme-template)
- [Package.json Template](#packagejson-template)
- [Eval Export Compatibility](#eval-export-compatibility)
- [Testing Checklist](#testing-checklist)
- [Existing Plugins](#existing-plugins)

---

## Quick Reference

### Minimum Requirements for a Plugin

| Requirement | Description |
|-------------|-------------|
| Authentication | API key auth via `Authorization: Bearer osk_xxx` header |
| Session sync | POST to `/sync/session` with session data |
| Message sync | POST to `/sync/message` with message data |
| Source identifier | Unique string like `opencode`, `claude-code`, `codex-cli` |
| Config storage | Store credentials locally (e.g., `~/.config/your-plugin/`) |

### Required Data for Sync

**Session (minimum)**:
```json
{
  "externalId": "session-uuid-from-cli",
  "source": "your-plugin-id",
  "promptTokens": 0,
  "completionTokens": 0,
  "cost": 0
}
```

**Message (minimum)**:
```json
{
  "sessionExternalId": "session-uuid-from-cli",
  "externalId": "message-uuid",
  "role": "user",
  "textContent": "Hello world"
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User's Machine                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────────────────────────────┐ │
│  │  CLI Tool    │         │         Your Sync Plugin             │ │
│  │  (Claude,    │────────▶│                                      │ │
│  │   OpenCode,  │  hooks  │  1. Hook triggers on events          │ │
│  │   Codex)     │   or    │  2. Parse session files              │ │
│  └──────────────┘  events │  3. Extract messages & tokens        │ │
│         │                 │  4. Send to OpenSync API             │ │
│         │ writes          └──────────────────┬───────────────────┘ │
│         ▼                                    │                     │
│  ┌──────────────┐                            │                     │
│  │ Session      │◀───────────────────────────┘                     │
│  │ Storage      │   reads                                          │
│  │ (~/.tool/    │                                                  │
│  │  sessions/)  │                                                  │
│  └──────────────┘                                                  │
│                                                                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS POST
                                  ▼
                        ┌─────────────────────┐
                        │   OpenSync Backend  │
                        │      (Convex)       │
                        │                     │
                        │  POST /sync/session │
                        │  POST /sync/message │
                        │  POST /sync/batch   │
                        └─────────────────────┘
```

### Data Flow

1. **User runs CLI tool** (Claude Code, OpenCode, Codex CLI, etc.)
2. **CLI writes session data** to local storage (JSONL files, SQLite, etc.)
3. **Plugin hooks into CLI events** (session end, turn complete, etc.)
4. **Plugin parses session files** and extracts structured data
5. **Plugin sends data to OpenSync** via HTTP API
6. **OpenSync stores and indexes** sessions for search and analytics

### Sync Mechanisms: Hooks vs File Parsing

Different CLI tools expose session data differently. Your plugin architecture depends on which mechanism the CLI supports.

**Hook-based sync** (Cursor):
- CLI provides a hooks API that triggers your plugin on events
- Events: `beforeSubmitPrompt`, `afterAgentResponse`, `afterFileEdit`, `beforeShellExecution`, etc.
- You receive event payloads directly, no file parsing needed
- Limitation: May not include token counts or cost data

**File-based sync** (Codex CLI, Claude Code, OpenCode):
- CLI writes complete session data to local files (JSONL, SQLite)
- Your plugin watches for file changes or syncs on command
- You parse the files to extract messages, tokens, and metadata
- Full data available: tokens, costs, model info per message

**Hybrid approach**:
- Use hooks for real-time sync during active sessions
- Parse session files for complete data after session ends

### Token and Cost Data Availability

Not all CLIs expose the same data. Design your plugin to handle missing fields gracefully.

| CLI | Token Data | Cost Data | Model per Message |
|-----|:----------:|:---------:|:-----------------:|
| Codex CLI | Yes | Yes | Yes |
| Claude Code | Yes | Yes | Yes |
| OpenCode | Yes | Yes | Yes |
| Cursor (hooks) | No | No | No |

For CLIs without token data, send `promptTokens: 0`, `completionTokens: 0`, `cost: 0`. The dashboard handles this gracefully and still tracks sessions, messages, and tool calls.

---

## Authentication

### API Key Authentication

All sync endpoints require API key authentication. Keys start with `osk_`.

**Getting an API Key**:
1. Log into OpenSync dashboard
2. Go to Settings
3. Click "Generate API Key"
4. Copy the key (starts with `osk_`)

**Using the API Key**:
```bash
curl "https://your-project.convex.site/sync/session" \
  -X POST \
  -H "Authorization: Bearer osk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"externalId": "test-123", "source": "my-plugin"}'
```

### URL Formats

OpenSync accepts both URL formats:
- `https://your-project.convex.cloud` (dashboard URL)
- `https://your-project.convex.site` (HTTP API URL)

Plugins should normalize to `.convex.site` for API calls:

```typescript
function normalizeUrl(url: string): string {
  return url.replace(".convex.cloud", ".convex.site").replace(/\/$/, "");
}
```

---

## API Endpoints

### POST /sync/session

Create or update a session.

**Request**:
```json
{
  "externalId": "7f9f9a2e-1b3c-4c7a-9b0e-abc123",
  "sessionId": "7f9f9a2e-1b3c-4c7a-9b0e-abc123",
  "title": "Fix authentication bug",
  "projectPath": "/Users/dev/myapp",
  "projectName": "myapp",
  "model": "claude-sonnet-4-20250514",
  "provider": "anthropic",
  "source": "claude-code",
  "promptTokens": 1500,
  "completionTokens": 2000,
  "cost": 0.0245,
  "durationMs": 45000
}
```

**Notes**:
- `externalId` or `sessionId` accepted (backward compatibility)
- `source` identifies your plugin (required for filtering)
- Tokens and cost can be 0 initially, updated later

**Response**:
```json
{
  "ok": true,
  "sessionId": "jd72ksl9x..."
}
```

**Response Handling**:
The API returns `ok: true` on success. For robustness, handle both `ok` and `success` fields:

```typescript
function isSuccessResponse(result: { ok?: boolean; success?: boolean }): boolean {
  return result.ok === true || result.success === true;
}
```

### POST /sync/message

Add or update a message within a session.

**Request**:
```json
{
  "sessionExternalId": "7f9f9a2e-1b3c-4c7a-9b0e-abc123",
  "externalId": "msg-456",
  "role": "user",
  "textContent": "Fix the login bug",
  "model": "claude-sonnet-4-20250514",
  "promptTokens": 500,
  "completionTokens": 0,
  "durationMs": 0,
  "source": "claude-code",
  "parts": [
    {
      "type": "text",
      "content": "Fix the login bug"
    }
  ]
}
```

**Role Values**: `user`, `assistant`, `system`, `tool`, `unknown`

Note: The `tool` role is used for tool call messages (shell commands, MCP calls, file edits). Some plugins use `assistant` with tool-type parts instead.

**Part Types**:
| Type | Description |
|------|-------------|
| `text` | Plain text content |
| `tool-call` | Tool invocation with name and args |
| `tool-result` | Tool execution result |
| `tool_use` | Alternative format for tool calls (used by cursor-sync) |

**Response**:
```json
{
  "ok": true,
  "messageId": "kx82msp3y..."
}
```

### POST /sync/batch

Batch sync multiple sessions and messages in one request. Reduces API calls and write conflicts.

**Request**:
```json
{
  "sessions": [
    {
      "externalId": "session-1",
      "source": "my-plugin",
      "title": "Session 1",
      "promptTokens": 100,
      "completionTokens": 200,
      "cost": 0.01
    }
  ],
  "messages": [
    {
      "sessionExternalId": "session-1",
      "externalId": "msg-1",
      "role": "user",
      "textContent": "Hello"
    },
    {
      "sessionExternalId": "session-1",
      "externalId": "msg-2",
      "role": "assistant",
      "textContent": "Hi there!"
    }
  ]
}
```

**Response**:
```json
{
  "ok": true,
  "sessions": 1,
  "messages": 2,
  "errors": []
}
```

### GET /sync/sessions/list

List all synced session external IDs for the authenticated user. Useful for incremental sync.

**Response**:
```json
{
  "sessionIds": [
    "7f9f9a2e-1b3c-4c7a-9b0e-abc123",
    "8a0b1c2d-3e4f-5g6h-7i8j-def456"
  ]
}
```

### GET /health

Health check endpoint (no auth required).

**Response**:
```json
{
  "status": "ok",
  "timestamp": 1706198400000
}
```

---

## Database Schema

Understanding the schema helps you send the right data.

### Sessions Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `externalId` | string | Yes | Unique ID from CLI tool |
| `userId` | Id | Auto | Set by API from auth |
| `title` | string | No | Session title or first prompt |
| `projectPath` | string | No | Full path to project |
| `projectName` | string | No | Project folder name |
| `model` | string | No | Model used (e.g., `claude-sonnet-4-20250514`) |
| `provider` | string | No | Provider name (anthropic, openai, etc.) |
| `source` | string | Yes | Plugin identifier |
| `promptTokens` | number | Yes | Input tokens (can be 0) |
| `completionTokens` | number | Yes | Output tokens (can be 0) |
| `totalTokens` | number | Auto | Calculated from prompt + completion |
| `cost` | number | Yes | Estimated cost in dollars (can be 0) |
| `durationMs` | number | No | Session duration in milliseconds |
| `isPublic` | boolean | Auto | Default false |
| `messageCount` | number | Auto | Updated on message sync |
| `searchableText` | string | Auto | Built from messages for search |
| `createdAt` | number | Auto | Timestamp |
| `updatedAt` | number | Auto | Timestamp |

### Messages Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | Id | Auto | Linked from session lookup |
| `externalId` | string | Yes | Unique message ID |
| `role` | enum | Yes | `user`, `assistant`, `system`, `tool`, `unknown` |
| `textContent` | string | No | Plain text content |
| `model` | string | No | Model for this message |
| `promptTokens` | number | No | Input tokens for this message |
| `completionTokens` | number | No | Output tokens for this message |
| `durationMs` | number | No | Response time |
| `createdAt` | number | Auto | Timestamp |

### Parts Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | Id | Auto | Parent message |
| `type` | string | Yes | `text`, `tool-call`, `tool-result` |
| `content` | any | Yes | Part content (varies by type) |
| `order` | number | Yes | Display order |

### Part Content Formats

**Text Part**:
```json
{
  "type": "text",
  "content": "This is the message content"
}
```

Or:
```json
{
  "type": "text",
  "content": {
    "text": "This is the message content"
  }
}
```

**Tool Call Part**:
```json
{
  "type": "tool-call",
  "content": {
    "name": "read_file",
    "args": { "path": "src/main.ts" }
  }
}
```

**Tool Result Part**:
```json
{
  "type": "tool-result",
  "content": {
    "result": "File contents here..."
  }
}
```

---

## CLI Commands Reference

Every plugin should implement these standard commands. Not all CLIs support all features, but provide what you can.

### Core Commands

| Command | Description | Required |
|---------|-------------|----------|
| `login` | Configure Convex URL and API Key | Yes |
| `logout` | Clear stored credentials | Yes |
| `status` | Show connection status | Yes |
| `verify` | Verify credentials and config | Yes |
| `sync` | Sync recent sessions | Yes |
| `--version` | Show version number | Yes |
| `--help` | Show help | Yes |

### Extended Commands

| Command | Description | Required |
|---------|-------------|----------|
| `setup` | Add hooks to CLI config (if supported) | No |
| `config` | Show current configuration | No |
| `config --json` | Show config as JSON | No |
| `set <key> <value>` | Update a config value | No |
| `synctest` | Test connectivity and sync a test session | No |
| `sync --all` | Sync all sessions | No |
| `sync --new` | Sync only new sessions (incremental) | No |
| `sync --limit N` | Sync last N sessions | No |
| `sync --force` | Clear tracking and resync all | No |
| `hook <event>` | Handle CLI hook events (internal) | No |

### Command Behavior Reference

#### login

```
your-plugin login

Prompts for:
  - Convex URL: https://your-project.convex.cloud
  - API Key: osk_your_api_key

Stores credentials in:
  ~/.config/your-plugin/config.json
```

#### logout

```
your-plugin logout

Clears:
  - Stored API key
  - Stored Convex URL
  - (Optional) Sync tracking data
```

#### status

```
your-plugin status

Output:
  Configuration:
    Convex URL: https://your-project.convex.site
    API Key:    osk_****1234
    Auto Sync:  enabled

  Testing connection...
  Connected to OpenSync backend
```

#### verify

```
your-plugin verify

Checks:
  1. Credentials exist
  2. API key is valid
  3. Can connect to backend
  4. (If applicable) Hook is configured in CLI
  5. Sessions directory exists

Output:
  Credentials: OK
  Connection: OK
  Hook: OK
  Sessions: Found 15 sessions
```

#### sync

```
your-plugin sync [options]

Options:
  --all        Sync all sessions
  --new        Sync only unsynced sessions
  --limit N    Sync last N sessions
  --force      Clear tracking and resync

Default behavior:
  Sync recent sessions (e.g., last 10)
```

#### synctest

```
your-plugin synctest

Actions:
  1. Verify credentials
  2. Test API connection
  3. Sync most recent session
  4. Report success/failure
```

#### hook

```
your-plugin hook <event> [payload]

Internal command called by CLI tool.

Events vary by CLI:
  - agent-turn-complete (Codex)
  - SessionEnd (Claude Code)
  - session.end (OpenCode)

Should:
  - Parse event payload
  - Sync relevant session
  - Exit silently on error (don't disrupt CLI)
```

---

## Plugin Architecture

### File Structure

```
your-plugin/
├── src/
│   ├── index.ts        # CLI entry point
│   ├── cli.ts          # Command implementations
│   ├── config.ts       # Configuration management
│   ├── client.ts       # OpenSync API client
│   ├── parser.ts       # Session file parser
│   ├── hook.ts         # Hook event handler
│   └── types.ts        # TypeScript types
├── package.json
├── tsconfig.json
├── README.md
└── changelog.md
```

### Configuration Storage

Store credentials in user's config directory:

```typescript
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".config", "your-plugin");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  convexUrl: string;
  apiKey: string;
  autoSync: boolean;
  syncToolCalls: boolean;
  syncThinking: boolean;
  debug: boolean;
}
```

### Environment Variables

Support environment variables as alternative to config file:

| Variable | Description |
|----------|-------------|
| `YOUR_PLUGIN_CONVEX_URL` | Convex deployment URL |
| `YOUR_PLUGIN_API_KEY` | API key (osk_*) |
| `YOUR_PLUGIN_AUTO_SYNC` | Enable auto sync (true/false) |
| `YOUR_PLUGIN_DEBUG` | Enable debug logging (true/false) |

### Session File Locations

Common locations for CLI session storage:

| CLI | Session Storage |
|-----|-----------------|
| Claude Code | `~/.claude/projects/*/sessions/` |
| OpenCode | `~/.opencode/sessions/` |
| Codex CLI | `~/.codex/sessions/YYYY/MM/DD/` |

### Hook Systems

Different CLIs have different hook mechanisms:

**Codex CLI** (config.toml):
```toml
notify = ["your-plugin", "hook", "agent-turn-complete"]
```

**Claude Code** (plugin registration):
```typescript
export default {
  name: "your-plugin",
  hooks: {
    SessionEnd: async (session) => { /* sync */ },
    UserPromptSubmit: async (prompt) => { /* track */ },
  }
};
```

**OpenCode** (opencode.json):
```json
{
  "plugins": ["your-plugin"]
}
```

---

## Code Examples

### TypeScript API Client

```typescript
// client.ts
interface SyncClient {
  convexUrl: string;
  apiKey: string;
}

export async function syncSession(
  client: SyncClient,
  session: SessionData
): Promise<{ ok: boolean; sessionId?: string; error?: string }> {
  const url = `${client.convexUrl}/sync/session`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { ok: false, error: data.error || "Unknown error" };
    }

    return { ok: true, sessionId: data.sessionId };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function syncMessage(
  client: SyncClient,
  message: MessageData
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const url = `${client.convexUrl}/sync/message`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { ok: false, error: data.error || "Unknown error" };
    }

    return { ok: true, messageId: data.messageId };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function testConnection(
  client: SyncClient
): Promise<{ ok: boolean; error?: string }> {
  const url = `${client.convexUrl}/health`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "ok") {
      return { ok: true };
    }
    return { ok: false, error: "Health check failed" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
```

### Session Parser Example

```typescript
// parser.ts
import { readFileSync } from "fs";

interface ParsedSession {
  externalId: string;
  title?: string;
  model?: string;
  projectPath?: string;
  messages: ParsedMessage[];
  promptTokens: number;
  completionTokens: number;
}

interface ParsedMessage {
  externalId: string;
  role: "user" | "assistant" | "system" | "unknown";
  textContent?: string;
  parts: Array<{ type: string; content: any }>;
}

export function parseJSONLSession(filePath: string): ParsedSession {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  
  let session: Partial<ParsedSession> = {
    messages: [],
    promptTokens: 0,
    completionTokens: 0,
  };

  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      
      // Handle session metadata
      if (item.type === "session_meta") {
        session.externalId = item.payload.id;
        session.model = item.payload.model;
        session.projectPath = item.payload.cwd;
      }
      
      // Handle user messages
      if (item.type === "event_msg" && item.payload?.type === "user_message") {
        session.messages!.push({
          externalId: `${session.externalId}-msg-${session.messages!.length}`,
          role: "user",
          textContent: item.payload.content,
          parts: [{ type: "text", content: item.payload.content }],
        });
      }
      
      // Handle assistant responses
      if (item.type === "response_item" && item.payload?.type === "Message") {
        const text = extractTextFromContent(item.payload.content);
        session.messages!.push({
          externalId: `${session.externalId}-msg-${session.messages!.length}`,
          role: "assistant",
          textContent: text,
          parts: convertContentToParts(item.payload.content),
        });
      }
      
      // Handle token counts
      if (item.payload?.type === "token_count") {
        const usage = item.payload.info?.total_token_usage;
        if (usage) {
          session.promptTokens = usage.input_tokens || 0;
          session.completionTokens = usage.output_tokens || 0;
        }
      }
    } catch {
      // Skip malformed lines
    }
  }

  // Set title from first user message
  if (!session.title && session.messages!.length > 0) {
    const firstUser = session.messages!.find(m => m.role === "user");
    if (firstUser?.textContent) {
      session.title = firstUser.textContent.slice(0, 100);
    }
  }

  return session as ParsedSession;
}

function extractTextFromContent(content: any[]): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter(c => c.type === "OutputText" || c.type === "text")
    .map(c => c.text || c.content || "")
    .join("\n");
}

function convertContentToParts(content: any[]): Array<{ type: string; content: any }> {
  if (!Array.isArray(content)) return [];
  return content.map(c => {
    if (c.type === "OutputText" || c.type === "text") {
      return { type: "text", content: c.text || c.content };
    }
    if (c.type === "FunctionCall") {
      return {
        type: "tool-call",
        content: { name: c.name, args: JSON.parse(c.arguments || "{}") },
      };
    }
    return { type: c.type, content: c };
  });
}
```

### Cost Calculation

```typescript
// costs.ts
interface TokenPricing {
  inputPerMillion: number;
  cachedPerMillion: number;
  outputPerMillion: number;
}

const MODEL_PRICING: Record<string, TokenPricing> = {
  // Anthropic
  "claude-sonnet-4-20250514": { inputPerMillion: 3, cachedPerMillion: 0.3, outputPerMillion: 15 },
  "claude-3-5-sonnet-20241022": { inputPerMillion: 3, cachedPerMillion: 0.3, outputPerMillion: 15 },
  "claude-3-opus": { inputPerMillion: 15, cachedPerMillion: 1.5, outputPerMillion: 75 },
  
  // OpenAI
  "gpt-4o": { inputPerMillion: 2.5, cachedPerMillion: 1.25, outputPerMillion: 10 },
  "gpt-4o-mini": { inputPerMillion: 0.15, cachedPerMillion: 0.075, outputPerMillion: 0.6 },
  "gpt-5-codex": { inputPerMillion: 2.5, cachedPerMillion: 0.62, outputPerMillion: 10 },
  
  // Default fallback
  "default": { inputPerMillion: 3, cachedPerMillion: 0.3, outputPerMillion: 15 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["default"];
  
  const uncachedInput = inputTokens - cachedTokens;
  const inputCost = (uncachedInput / 1_000_000) * pricing.inputPerMillion;
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cachedPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  
  return inputCost + cachedCost + outputCost;
}
```

### Debug Logging

Add conditional debug logging for troubleshooting. Users can enable it via config.

```typescript
// api.ts
async function apiRequest<T>(
  method: string,
  url: string,
  body?: object
): Promise<T> {
  const config = loadConfig();
  
  // Log request if debug enabled
  if (config.debug) {
    console.error(`[your-plugin] ${method} ${url}`);
    if (body) {
      console.error(`[your-plugin] Body: ${JSON.stringify(body, null, 2)}`);
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  
  // Log response if debug enabled
  if (config.debug) {
    console.error(`[your-plugin] Response (${response.status}): ${text}`);
  }

  // Parse JSON safely
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}
```

### CLI Implementation

```typescript
#!/usr/bin/env node
// index.ts
import { Command } from "commander";
import { loadConfig, saveConfig, clearConfig } from "./config";
import { syncSession, syncMessage, testConnection } from "./client";
import { parseJSONLSession } from "./parser";
import { version } from "../package.json";

const program = new Command();

program
  .name("your-plugin")
  .description("Sync your CLI sessions to OpenSync")
  .version(version);

program
  .command("login")
  .description("Configure Convex URL and API Key")
  .action(async () => {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (q: string): Promise<string> =>
      new Promise((resolve) => rl.question(q, resolve));

    const convexUrl = await question("Convex URL: ");
    const apiKey = await question("API Key: ");
    rl.close();

    await saveConfig({ convexUrl, apiKey });
    console.log("Configuration saved.");
  });

program
  .command("logout")
  .description("Clear stored credentials")
  .action(async () => {
    await clearConfig();
    console.log("Credentials cleared.");
  });

program
  .command("status")
  .description("Show connection status")
  .action(async () => {
    const config = await loadConfig();
    if (!config.convexUrl || !config.apiKey) {
      console.log("Not configured. Run: your-plugin login");
      return;
    }

    console.log("Configuration:");
    console.log(`  Convex URL: ${config.convexUrl}`);
    console.log(`  API Key:    ${config.apiKey.slice(0, 8)}...`);

    console.log("\nTesting connection...");
    const result = await testConnection(config);
    if (result.ok) {
      console.log("Connected to OpenSync backend");
    } else {
      console.log(`Connection failed: ${result.error}`);
    }
  });

program
  .command("verify")
  .description("Verify credentials and config")
  .action(async () => {
    const config = await loadConfig();
    
    // Check credentials
    if (!config.convexUrl || !config.apiKey) {
      console.log("Credentials: MISSING");
      console.log("Run: your-plugin login");
      return;
    }
    console.log("Credentials: OK");

    // Check connection
    const result = await testConnection(config);
    if (result.ok) {
      console.log("Connection: OK");
    } else {
      console.log(`Connection: FAILED (${result.error})`);
      return;
    }

    // Check sessions directory (customize for your CLI)
    // const sessionsDir = getSessionsDirectory();
    // if (existsSync(sessionsDir)) {
    //   console.log(`Sessions: Found at ${sessionsDir}`);
    // }

    console.log("\nReady to sync!");
  });

program
  .command("sync")
  .description("Sync sessions to OpenSync")
  .option("--all", "Sync all sessions")
  .option("--limit <n>", "Sync last N sessions", "10")
  .action(async (options) => {
    const config = await loadConfig();
    if (!config.convexUrl || !config.apiKey) {
      console.log("Not configured. Run: your-plugin login");
      return;
    }

    // Implement your sync logic here
    console.log(`Syncing sessions...`);
    // const sessions = findSessions(options);
    // for (const session of sessions) {
    //   const parsed = parseJSONLSession(session.path);
    //   await syncSession(config, parsed);
    // }
  });

program
  .command("synctest")
  .description("Test connectivity and sync a session")
  .action(async () => {
    const config = await loadConfig();
    if (!config.convexUrl || !config.apiKey) {
      console.log("Not configured. Run: your-plugin login");
      return;
    }

    console.log("Testing connection...");
    const result = await testConnection(config);
    if (!result.ok) {
      console.log(`Connection failed: ${result.error}`);
      return;
    }
    console.log("Connection OK");

    // Sync test session
    const testSession = {
      externalId: `test-${Date.now()}`,
      source: "your-plugin",
      title: "Test Session",
      promptTokens: 100,
      completionTokens: 200,
      cost: 0.001,
    };

    console.log("Syncing test session...");
    const syncResult = await syncSession(config, testSession);
    if (syncResult.ok) {
      console.log(`Success! Session ID: ${syncResult.sessionId}`);
    } else {
      console.log(`Failed: ${syncResult.error}`);
    }
  });

program
  .command("config")
  .description("Show current configuration")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const config = await loadConfig();
    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log("Configuration:");
      for (const [key, value] of Object.entries(config)) {
        if (key === "apiKey" && value) {
          console.log(`  ${key}: ${String(value).slice(0, 8)}...`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }
  });

program
  .command("set <key> <value>")
  .description("Update a config value")
  .action(async (key, value) => {
    const config = await loadConfig();
    
    // Handle boolean values
    if (value === "true") config[key] = true;
    else if (value === "false") config[key] = false;
    else config[key] = value;
    
    await saveConfig(config);
    console.log(`Set ${key} = ${value}`);
  });

program
  .command("hook <event>")
  .description("Handle CLI hook events (internal)")
  .argument("[payload]", "JSON payload")
  .action(async (event, payload) => {
    // Silent execution - don't disrupt CLI
    try {
      const config = await loadConfig();
      if (!config.convexUrl || !config.apiKey) return;

      // Parse payload if provided
      let data = {};
      if (payload) {
        try {
          data = JSON.parse(payload);
        } catch {
          // Ignore parse errors
        }
      }

      // Sync based on event type
      // Customize for your CLI's events
      if (event === "agent-turn-complete" || event === "session-end") {
        // Find and sync the relevant session
      }
    } catch {
      // Fail silently
    }
  });

program.parse();
```

---

## README Template

Use this template for your plugin's README:

```markdown
# your-plugin

[![npm version](https://badge.fury.io/js/your-plugin.svg)](https://www.npmjs.com/package/your-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sync your [CLI Name] sessions to OpenSync dashboard. Track coding sessions, analyze tool usage, and monitor token consumption across projects.

**GitHub:** [github.com/your/repo](https://github.com/your/repo)
**npm:** [npmjs.com/package/your-plugin](https://www.npmjs.com/package/your-plugin)

## OpenSync Ecosystem

| Project | Description | Links |
|---------|-------------|-------|
| OpenSync | Dashboards for AI coding sessions | [Website](https://www.opensync.dev/) / [GitHub](https://github.com/waynesutton/opensync) |
| opencode-sync-plugin | Sync OpenCode sessions | [GitHub](https://github.com/waynesutton/opencode-sync-plugin) / [npm](https://www.npmjs.com/package/opencode-sync-plugin) |
| claude-code-sync | Sync Claude Code sessions | [GitHub](https://github.com/waynesutton/claude-code-sync) / [npm](https://www.npmjs.com/package/claude-code-sync) |
| codex-sync | Sync Codex CLI sessions | [GitHub](https://github.com/waynesutton/codex-sync-plugin) / [npm](https://www.npmjs.com/package/codex-sync) |

## Installation

\`\`\`bash
npm install -g your-plugin
\`\`\`

## Quick Start

### 1. Get Your API Key

1. Log into your OpenSync dashboard
2. Go to **Settings**
3. Click **Generate API Key**
4. Copy the key (starts with \`osk_\`)

### 2. Configure the Plugin

\`\`\`bash
your-plugin login
\`\`\`

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., \`https://your-project.convex.cloud\`)
- **API Key**: Your API key from Settings (e.g., \`osk_abc123...\`)

### 3. Verify Setup

\`\`\`bash
your-plugin verify
\`\`\`

## CLI Commands

| Command | Description |
|---------|-------------|
| \`your-plugin login\` | Configure Convex URL and API Key |
| \`your-plugin logout\` | Clear stored credentials |
| \`your-plugin status\` | Show connection status |
| \`your-plugin verify\` | Verify credentials and config |
| \`your-plugin sync\` | Sync recent sessions |
| \`your-plugin sync --all\` | Sync all sessions |
| \`your-plugin sync --limit N\` | Sync last N sessions |
| \`your-plugin synctest\` | Test connectivity and sync a session |
| \`your-plugin config\` | Show current configuration |
| \`your-plugin config --json\` | Show config as JSON |
| \`your-plugin set <key> <value>\` | Update a config value |
| \`your-plugin --version\` | Show version number |
| \`your-plugin --help\` | Show help |

## What Gets Synced

| Data | Description |
|------|-------------|
| Session metadata | Project path, working directory, timestamps |
| User prompts | Your messages to the AI |
| Assistant responses | AI responses |
| Tool calls | Shell commands, file operations, and their results |
| Token usage | Input, output, cached token counts |
| Model info | Which model was used |
| Cost estimate | Estimated session cost based on token usage |

## Configuration

Credentials are stored at \`~/.config/your-plugin/config.json\`.

### Environment Variables

\`\`\`bash
export YOUR_PLUGIN_CONVEX_URL="https://your-project.convex.cloud"
export YOUR_PLUGIN_API_KEY="osk_your_api_key"
\`\`\`

## Privacy

- All data goes to YOUR Convex deployment
- Sensitive patterns are redacted
- Full file contents are not synced, only paths
- You control what gets synced via configuration

## Troubleshooting

### Not syncing?

\`\`\`bash
your-plugin status    # Check connection
your-plugin verify    # Full verification
your-plugin synctest  # Test with a session
\`\`\`

### Invalid API key?

1. Go to OpenSync Settings
2. Generate a new API key
3. Run \`your-plugin login\`

## License

MIT
```

---

## Package.json Template

```json
{
  "name": "your-plugin",
  "version": "1.0.0",
  "description": "Sync your CLI sessions to OpenSync dashboard",
  "main": "dist/index.js",
  "bin": {
    "your-plugin": "dist/index.js"
  },
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "opensync",
    "ai",
    "coding",
    "sessions",
    "sync",
    "cli"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your/repo.git"
  },
  "bugs": {
    "url": "https://github.com/your/repo/issues"
  },
  "homepage": "https://github.com/your/repo#readme",
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

---

## Eval Export Compatibility

OpenSync supports exporting sessions as eval datasets (DeepEval JSON, OpenAI JSONL, Promptfoo JSONL, Filesystem). Structure your messages to work with all export formats.

### Message Structure for Evals

```typescript
// User message
{
  role: "user",
  textContent: "user prompt text",
  parts: [{ type: "text", content: "user prompt text" }],
}

// Assistant message
{
  role: "assistant",
  textContent: "assistant response",
  parts: [{ type: "text", content: "assistant response" }],
}

// Tool message (shell, MCP, file edit)
{
  role: "tool",
  textContent: "shell: npm install",
  parts: [{ type: "tool_use", content: "shell: npm install" }],
}
```

### Export Format Mappings

| cursor-sync field | DeepEval | OpenAI JSONL | Filesystem |
|-------------------|----------|--------------|------------|
| `role: "user"` | `input` | `role: user` | `[timestamp] USER:` |
| `role: "assistant"` | `actual_output` | `role: assistant` | `[timestamp] ASSISTANT:` |
| `role: "tool"` | `context` | `role: tool` | `[TOOL_CALL: name]` |
| `textContent` | main content | `content` | message body |
| `parts[type:tool_use]` | `context` | tool block | `[TOOL_CALL]` |
| `timestamp` | `metadata.timestamp` | N/A | `[ISO format]` prefix |
| `source` | `metadata.source` | `metadata.source` | `SESSION: source` |

### File Edits with Diff Content

For file edit tool calls, include the actual diff in the content:

```typescript
{
  role: "tool",
  textContent: "Edited: src/config.ts\n\n- old line\n+ new line",
  parts: [{
    type: "tool_use",
    content: JSON.stringify({
      tool: "file_edit",
      path: "src/config.ts",
      edits: [{ old: "old line", new: "new line" }]
    })
  }],
}
```

### Testing Eval Export

After syncing sessions:

1. Mark sessions as eval-ready in the OpenSync dashboard
2. Export in each format (DeepEval, OpenAI, Promptfoo, Filesystem)
3. Verify your plugin's messages appear correctly:
   - User prompts map to inputs
   - Assistant responses map to outputs
   - Tool calls appear in context

---

## Testing Checklist

### Before Publishing

- [ ] `login` saves credentials correctly
- [ ] `logout` clears credentials
- [ ] `status` shows connection info
- [ ] `verify` checks all requirements
- [ ] `sync` sends data to OpenSync
- [ ] `synctest` creates a test session
- [ ] `--version` shows correct version
- [ ] `--help` shows all commands
- [ ] Sessions appear in OpenSync dashboard
- [ ] Source filter shows your plugin
- [ ] Token counts are accurate
- [ ] Cost estimates are reasonable

### API Integration

- [ ] Health check passes (`/health`)
- [ ] Session sync works (`/sync/session`)
- [ ] Message sync works (`/sync/message`)
- [ ] Batch sync works (`/sync/batch`)
- [ ] Error responses are handled gracefully
- [ ] Invalid API key returns 401
- [ ] Missing fields return 400

### Edge Cases

- [ ] Empty sessions handled
- [ ] Very long messages truncated
- [ ] Unicode content preserved
- [ ] Network errors don't crash
- [ ] Malformed session files skipped
- [ ] Duplicate syncs are idempotent

### Test Session Visibility

Test sessions should create both a session AND at least one message. Sessions without messages may not appear in the dashboard list.

```typescript
// Good: Test creates session + message
async function createTestSession() {
  const now = Date.now();
  const testId = `test-${now}`;
  
  // Create session
  await syncSession({
    externalId: testId,
    source: "your-plugin",
    title: "Test Session",
    promptTokens: 50,
    completionTokens: 50,
  });
  
  // Create message (required for dashboard visibility)
  await syncMessage({
    sessionExternalId: testId,
    externalId: `${testId}-msg-1`,
    role: "user",
    textContent: "Test message from your-plugin",
    parts: [{ type: "text", content: "Test message from your-plugin" }],
  });
}
```

---

## Existing Plugins

Reference these implementations:

| Plugin | Source | Docs | Sync Type |
|--------|--------|------|-----------|
| opencode-sync-plugin | [GitHub](https://github.com/waynesutton/opencode-sync-plugin) | [npm](https://www.npmjs.com/package/opencode-sync-plugin) | File-based |
| claude-code-sync | [GitHub](https://github.com/waynesutton/claude-code-sync) | [npm](https://www.npmjs.com/package/claude-code-sync) | File-based |
| codex-sync | [GitHub](https://github.com/waynesutton/codex-sync-plugin) | [npm](https://www.npmjs.com/package/codex-sync) | File-based |
| cursor-sync | [GitHub](https://github.com/waynesutton/cursor-cli-sync-plugin) | [npm](https://www.npmjs.com/package/cursor-opensync-plugin) | Hook-based |
| droid-sync | [GitHub](https://github.com/yemyat/droid-sync-plugin) | [npm](https://www.npmjs.com/package/droid-sync) | File-based |

---

## Getting Help

- **OpenSync Docs**: [opensync.dev/docs](https://www.opensync.dev/docs)
- **GitHub Issues**: [github.com/waynesutton/opensync/issues](https://github.com/waynesutton/opensync/issues)
- **API Reference**: [docs/API.md](./API.md)

---

## Contributing

To add your plugin to the OpenSync ecosystem:

1. Follow this guide to build your plugin
2. Publish to npm
3. Open a PR to add your plugin to the OpenSync README
4. Follow the [ADD-NEW-PLUGIN-TEMPLATE.md](./ADD-NEW-PLUGIN-TEMPLATE.md) checklist
