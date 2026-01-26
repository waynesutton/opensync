# Claude Code Plugin - Missing sessionExternalId Fix

## Issue

The claude-code-sync plugin is sending messages to OpenSync without the required `sessionExternalId` field, causing validation errors.

## Error Message

```
ArgumentValidationError: Object is missing the required field `sessionExternalId`. 
Consider wrapping the field validator in `v.optional(...)` if this is expected.

Object: {
  externalId: "toolu_013GmUzjbkQPCvi1nzk15yFv", 
  parts: [{content: {...}, type: "tool-call"}], 
  role: "assistant", 
  source: "claude-code", 
  userId: "js78x81d4tmhc5nc7rba9x1emx7zdv4b"
}
```

## Root Cause

The `messages:upsert` mutation in OpenSync requires `sessionExternalId` to know which session a message belongs to:

```typescript
// convex/messages.ts line 10-12
args: {
  userId: v.id("users"),
  sessionExternalId: v.string(),  // REQUIRED
  externalId: v.string(),
  // ...
}
```

The plugin is not including this field when syncing messages.

## Fix Required

In the claude-code-sync plugin, when calling the message sync endpoint, ensure `sessionExternalId` is included in the payload:

```typescript
// Example fix in plugin
const messagePayload = {
  userId: userId,
  sessionExternalId: session.id,  // ADD THIS - the session's external ID
  externalId: message.id,
  role: message.role,
  parts: message.parts,
  source: "claude-code",
  // ... other fields
};
```

## Affected Component

- **Plugin**: claude-code-sync (NOT OpenSync backend)
- **Endpoint**: `/sync/message` or the internal `messages:upsert` mutation

## Status

- [ ] Locate message sync code in claude-code-sync plugin
- [ ] Add sessionExternalId to message payload
- [ ] Test sync with OpenSync backend
- [ ] Publish updated plugin version
