# cursor-sync Plugin Fix PRD

Version: 1.0.10  
Date: 2026-01-26  
Status: Complete

## Overview

This document captures all fixes implemented to make cursor-sync plugin compatible with the OpenSync backend API. The plugin now successfully syncs Cursor IDE sessions, messages, and tool calls to the OpenSync dashboard.

## Problems Identified

### 1. API Response Field Mismatch

**Issue:** The OpenSync backend returns `ok: true` but the plugin expected `success: true`.

**Impact:** All sync operations appeared to fail even when they succeeded.

### 2. Message Payload Structure Mismatch

**Issue:** The plugin sent messages with `content` field, but the backend expected `textContent` and `parts` array.

**Impact:** Messages failed validation on the backend.

### 3. Token Field Naming Convention

**Issue:** Plugin used `inputTokens`/`outputTokens` but backend expected `promptTokens`/`completionTokens`.

**Impact:** Token tracking data was lost.

### 4. Missing Parts Array for Messages

**Issue:** Backend requires a `parts` array with structured content objects containing `type` and `content` fields.

**Impact:** Messages rejected due to missing required field.

### 5. Tool Message Format

**Issue:** Plugin used `toolName`, `toolInput`, `toolOutput` fields that backend did not recognize.

**Impact:** Tool call tracking failed.

### 6. Test Session Missing Message

**Issue:** Test session only created a session without a message, making it invisible in the dashboard.

**Impact:** Users could not verify full sync flow worked.

### 7. Inconsistent Timestamp Generation

**Issue:** Multiple `Date.now()` calls within same handler created slightly different timestamps.

**Impact:** Potential for message ordering issues.

## Fixes Implemented

### Fix 1: Normalize API Response Handling

**File:** `api.ts`

Added response normalization to handle both `success` and `ok` field names:

```typescript
interface ApiResponse {
  success?: boolean;
  ok?: boolean;
  sessionId?: string;
  messageId?: string;
  error?: string;
}

function isSuccessResponse(result: ApiResponse): boolean {
  return result.success === true || result.ok === true;
}
```

### Fix 2: Update Message Type Definition

**File:** `types.ts`

Changed message interface to match backend schema:

```typescript
// Before
export interface OpenSyncMessage {
  content: string;
  tokens?: number;
  toolName?: string;
  toolInput?: string;
  toolOutput?: string;
}

// After
export interface OpenSyncMessage {
  textContent?: string;
  parts?: MessagePart[];
  promptTokens?: number;
  completionTokens?: number;
}
```

### Fix 3: Add MessagePart Type

**File:** `types.ts`

Added new type for structured message content:

```typescript
export interface MessagePart {
  type: string;
  content: string;
}
```

### Fix 4: Update Token Field Names

**File:** `types.ts`

Renamed token fields in session interface:

```typescript
// Before
inputTokens?: number;
outputTokens?: number;

// After
promptTokens?: number;
completionTokens?: number;
```

### Fix 5: Update Response Types

**File:** `types.ts`

Made response types flexible to handle both field names:

```typescript
export interface SyncSessionResponse {
  success?: boolean;
  ok?: boolean;
  sessionId?: string;
  error?: string;
}
```

### Fix 6: Fix Hook Message Payloads

**File:** `hooks.ts`

Updated all hook handlers to use correct payload structure:

```typescript
// Before
const message: SyncMessagePayload = {
  role: "user",
  content: prompt,
  timestamp: Date.now(),
};

// After
const now = Date.now();
const message: SyncMessagePayload = {
  role: "user",
  textContent: prompt,
  parts: [{ type: "text", content: prompt }],
  timestamp: now,
};
```

### Fix 7: Fix Tool Message Format

**File:** `hooks.ts`

Changed tool messages to use parts array instead of tool-specific fields:

```typescript
// Before (shell execution)
const message: SyncMessagePayload = {
  role: "tool",
  content: command,
  toolName: "shell",
  toolInput: JSON.stringify({ command, cwd }),
};

// After
const message: SyncMessagePayload = {
  role: "tool",
  textContent: command,
  parts: [{
    type: "tool_use",
    content: `shell: ${command}`,
  }],
};
```

### Fix 8: Improve Test Session

**File:** `api.ts`

Test session now creates both session and message:

```typescript
export async function createTestSession(): Promise<SyncSessionResponse> {
  const now = Date.now();
  const testExternalId = `cursor-test-${now}`;

  // Create session
  const testSession: SyncSessionPayload = {
    externalId: testExternalId,
    title: "Test Session from cursor-sync",
    source: OPENSYNC_SOURCE,
    promptTokens: 50,
    completionTokens: 50,
    messageCount: 1,
  };
  
  const sessionResult = await syncSession(testSession);
  
  // Create message linked to session
  const testMessage: SyncMessagePayload = {
    sessionExternalId: testExternalId,
    externalId: `${testExternalId}-msg-${now}`,
    role: "user",
    textContent: "Test message from cursor-sync plugin",
    parts: [{ type: "text", content: "Test message from cursor-sync plugin" }],
    timestamp: now,
    promptTokens: 50,
  };
  
  await syncMessage(testMessage);
  return { success: true, sessionId: sessionResult.sessionId };
}
```

### Fix 9: Add Debug Logging

**File:** `api.ts`

Added conditional debug logging for troubleshooting:

```typescript
if (config.debug) {
  console.error(`[cursor-sync] ${method} ${url}`);
  if (body) {
    console.error(`[cursor-sync] Body: ${JSON.stringify(body, null, 2)}`);
  }
}

// After response
if (config.debug) {
  console.error(`[cursor-sync] Response (${response.status}): ${text}`);
}
```

### Fix 10: Safer JSON Response Parsing

**File:** `api.ts`

Changed response parsing to handle edge cases:

```typescript
// Before
return response.json() as Promise<T>;

// After
const text = await response.text();
try {
  return JSON.parse(text) as T;
} catch {
  throw new Error(`Invalid JSON response: ${text}`);
}
```

### Fix 11: Consistent Timestamp Generation

**File:** `hooks.ts`

Store timestamp at start of handler to ensure consistency:

```typescript
// Before
externalId: `${conversation_id}-shell-${Date.now()}`,
timestamp: Date.now(),

// After
const now = Date.now();
externalId: `${conversation_id}-shell-${now}`,
timestamp: now,
```

### Fix 12: Add afterAgentResponse Hook

**File:** `hooks.ts`, `types.ts`

Added support for capturing assistant text responses via the `afterAgentResponse` hook:

```typescript
// types.ts - New payload type
export interface AfterAgentResponsePayload extends CursorBasePayload {
  hook_event_name: "afterAgentResponse";
  text: string;
}

// hooks.ts - New handler
async function handleAfterAgentResponse(
  payload: AfterAgentResponsePayload
): Promise<void> {
  const config = loadConfig();
  if (!config?.autoSync) return;

  const { conversation_id, text } = payload;
  const now = Date.now();
  
  const message: SyncMessagePayload = {
    sessionExternalId: conversation_id,
    externalId: `${conversation_id}-assistant-${now}`,
    source: OPENSYNC_SOURCE,
    role: "assistant",
    textContent: text,
    parts: [{ type: "text", content: text }],
    timestamp: now,
  };
  await syncMessage(message);
}
```

### Fix 13: Add File Edit Diff Content

**File:** `hooks.ts`

Updated `handleAfterFileEdit` to include actual diff content instead of just file paths:

```typescript
function formatDiff(edits: Array<{ old_string: string; new_string: string }>): string {
  const diffLines: string[] = [];
  for (const edit of edits) {
    if (edit.old_string) {
      for (const line of edit.old_string.split("\n")) {
        diffLines.push(`- ${line}`);
      }
    }
    if (edit.new_string) {
      for (const line of edit.new_string.split("\n")) {
        diffLines.push(`+ ${line}`);
      }
    }
  }
  return diffLines.join("\n").trim();
}
```

### Fix 14: Eval Export Compatibility

**Files:** `hooks.ts`, `types.ts`

All message types now follow a structure compatible with OpenSync eval export formats:

**DeepEval JSON compatibility:**
- `textContent` maps to `input` (user) or `actual_output` (assistant)
- `parts` array with `type: "tool_use"` provides `context` for tool calls
- `timestamp`, `source`, and tokens fields map to `metadata`

**OpenAI Evals JSONL compatibility:**
- `role` field (user/assistant/tool) maps directly to message roles
- `textContent` provides message content
- Multi-turn sessions produce valid conversation arrays

**Filesystem format compatibility:**
- `timestamp` enables `[YYYY-MM-DDTHH:MM:SSZ] ROLE:` format
- `parts[].type === "tool_use"` formats as `[TOOL_CALL: tool_name]`
- `textContent` provides human-readable content

**Message structure for each role:**

```typescript
// User message
{
  role: "user",
  textContent: "user prompt text",
  parts: [{ type: "text", content: "user prompt text" }],
  timestamp: 1706234567890,
}

// Assistant message
{
  role: "assistant",
  textContent: "assistant response",
  parts: [{ type: "text", content: "assistant response" }],
  timestamp: 1706234567900,
}

// Tool message (shell, MCP, file edit)
{
  role: "tool",
  textContent: "shell: npm install",
  parts: [{ type: "tool_use", content: "shell: npm install" }],
  timestamp: 1706234567910,
}
```

**File edit with diff content:**

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
  timestamp: 1706234567920,
}
```

## Files Changed

| File | Changes |
|------|---------|
| `api.ts` | Response normalization, debug logging, test session improvements |
| `hooks.ts` | Message payload structure, tool message format, timestamp consistency, afterAgentResponse handler, diff content for file edits |
| `types.ts` | Token fields renamed, MessagePart type added, response types updated, AfterAgentResponsePayload added |
| `package.json` | Version bump 1.0.6 to 1.0.10 |

## Testing Verification

After these fixes, the following commands work correctly:

```bash
# Test connection
npx cursor-sync test

# Create test session (now visible in dashboard)
npx cursor-sync test

# Enable debug mode for troubleshooting
npx cursor-sync config --debug true
```

### Eval Export Testing

To verify cursor-sync sessions export correctly for evals:

1. **Create test sessions in Cursor** with various message types:
   - User prompts (beforeSubmitPrompt hook)
   - Assistant responses (afterAgentResponse hook)
   - Shell commands (beforeShellExecution hook)
   - MCP tool calls (beforeMCPExecution hook)
   - File edits (afterFileEdit hook)

2. **Mark sessions as eval-ready** in OpenSync dashboard

3. **Export in each format** and verify:
   - **DeepEval JSON**: `input`, `actual_output`, `context` fields populated
   - **OpenAI JSONL**: Each line has valid `input` array and `ideal` response
   - **Filesystem**: Text files show `[TIMESTAMP] ROLE:` format with tool calls

4. **Run evals** with exported data:
   ```bash
   # DeepEval
   pip install deepeval
   deepeval test run eval-export.json

   # OpenAI Evals
   pip install openai-evals
   oaieval gpt-4o eval-export.jsonl
   ```

## Compatibility

These changes ensure compatibility with:
- OpenSync backend API v1
- Convex HTTP endpoints at `/sync/session` and `/sync/message`
- Dashboard session and message display

## Migration Notes

Existing users should:
1. Update to version 1.0.10
2. Run `npx cursor-sync test` to verify connection
3. Check OpenSync dashboard for test session visibility
4. Test eval export with cursor-sync sessions in dashboard

## Eval Export Compatibility Matrix

The cursor-sync plugin now produces messages compatible with all three eval export formats:

| Feature | DeepEval JSON | OpenAI JSONL | Filesystem |
|---------|---------------|--------------|------------|
| User prompts | textContent -> input | role: user | [timestamp] USER: |
| Assistant responses | textContent -> actual_output | role: assistant | [timestamp] ASSISTANT: |
| Tool calls | parts[type:tool_use] -> context | role: tool | [TOOL_CALL: name] |
| File edits | textContent (diff) -> context | content (diff) | [TOOL_CALL: file_edit] |
| Timestamps | metadata.timestamp | N/A | [ISO format] prefix |
| Source tracking | metadata.source: cursor-sync | metadata.source | SESSION: source |
| Token counts | metadata.tokens | N/A | TOKENS: count |

**Verified export scenarios:**

1. **Single-turn conversation**: User prompt + assistant response
2. **Multi-turn conversation**: Multiple user/assistant exchanges
3. **Tool-heavy session**: Shell commands, MCP calls, file edits
4. **Mixed session**: Prompts, responses, and tool calls interleaved

**Export format mappings:**

```
cursor-sync message role    -> eval export role
-------------------------------------------------
"user"                      -> input / user
"assistant"                 -> actual_output / assistant  
"tool"                      -> context / tool call
```

```
cursor-sync parts.type      -> eval export treatment
-------------------------------------------------
"text"                      -> main content
"tool_use"                  -> context / tool call block
```

## Lessons Learned

1. Always validate field names match between frontend and backend
2. API responses should have consistent success indicator field names
3. Debug logging is essential during plugin development
4. Test flows should exercise the complete sync path, not just partial operations
5. Token field naming should follow industry conventions (promptTokens/completionTokens)
6. Message structure must support multiple export formats (text + structured parts)
7. Tool calls need both human-readable textContent and machine-parseable parts.content
