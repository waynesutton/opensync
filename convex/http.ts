import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

// Validate JWT token from WorkOS
async function validateJWT(ctx: any, request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing Authorization header", status: 401 };
  }

  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "Invalid or expired token", status: 401 };
    }

    const user = await ctx.runMutation(internal.users.getByWorkosId, {
      workosId: identity.subject,
    });

    return { user, identity };
  } catch (e) {
    return { error: `Auth failed: ${e}`, status: 401 };
  }
}

// Validate API key
async function validateApiKey(ctx: any, request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer osk_")) {
    return { error: "Invalid API key format", status: 401 };
  }

  const apiKey = authHeader.slice(7);

  try {
    const user = await ctx.runMutation(internal.users.getByApiKey, { apiKey });
    if (!user) {
      return { error: "Invalid API key", status: 401 };
    }
    return { user };
  } catch (e) {
    return { error: `API key validation failed: ${e}`, status: 401 };
  }
}

// Authenticate via JWT or API key
async function authenticate(ctx: any, request: Request) {
  const authHeader = request.headers.get("Authorization");
  
  if (authHeader?.startsWith("Bearer osk_")) {
    return validateApiKey(ctx, request);
  }
  
  return validateJWT(ctx, request);
}

// JSON response helper
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

// CORS preflight
http.route({
  path: "/*",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// ============================================================================
// SYNC ENDPOINTS (for plugin)
// ============================================================================

// Sync session
http.route({
  path: "/sync/session",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const body = await request.json();

      const sessionId = await ctx.runMutation(internal.sessions.upsert, {
        userId: auth.user._id,
        externalId: body.externalId,
        title: body.title,
        projectPath: body.projectPath,
        projectName: body.projectName,
        model: body.model,
        provider: body.provider,
        source: body.source, // "opencode" or "claude-code"
        promptTokens: body.promptTokens,
        completionTokens: body.completionTokens,
        cost: body.cost,
        durationMs: body.durationMs,
      });

      // Schedule embedding generation
      await ctx.scheduler.runAfter(0, internal.embeddings.generateForSession, {
        sessionId,
      });

      return json({ ok: true, sessionId });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// Sync message
http.route({
  path: "/sync/message",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const body = await request.json();

      const messageId = await ctx.runMutation(internal.messages.upsert, {
        userId: auth.user._id,
        sessionExternalId: body.sessionExternalId,
        externalId: body.externalId,
        role: body.role,
        textContent: body.textContent,
        model: body.model,
        promptTokens: body.promptTokens,
        completionTokens: body.completionTokens,
        durationMs: body.durationMs,
        parts: body.parts,
      });

      return json({ ok: true, messageId });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// Batch sync
http.route({
  path: "/sync/batch",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const body = await request.json();
      const results = { sessions: 0, messages: 0, errors: [] as string[] };

      for (const session of body.sessions || []) {
        try {
          await ctx.runMutation(internal.sessions.upsert, {
            userId: auth.user._id,
            ...session,
          });
          results.sessions++;
        } catch (e) {
          results.errors.push(`Session ${session.externalId}: ${e}`);
        }
      }

      for (const message of body.messages || []) {
        try {
          await ctx.runMutation(internal.messages.upsert, {
            userId: auth.user._id,
            ...message,
          });
          results.messages++;
        } catch (e) {
          results.errors.push(`Message ${message.externalId}: ${e}`);
        }
      }

      return json({ ok: true, ...results });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// List all session external IDs for the authenticated user
http.route({
  path: "/sync/sessions/list",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await validateApiKey(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const sessionIds = await ctx.runQuery(internal.sessions.listExternalIds, {
        userId: auth.user._id,
      });

      return json({ sessionIds });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// ============================================================================
// SECURE API ENDPOINTS (for external apps)
// ============================================================================

// GET /api/sessions - List sessions
http.route({
  path: "/api/sessions",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const start = Date.now();
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "50");

      const sessions = await ctx.runQuery(internal.api.listSessions, {
        userId: auth.user._id,
        limit,
      });

      // Log API access
      await ctx.runMutation(internal.api.logAccess, {
        userId: auth.user._id,
        endpoint: "/api/sessions",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - start,
      });

      return json({ sessions });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// GET /api/sessions/:id - Get session with messages
http.route({
  path: "/api/sessions/get",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const start = Date.now();
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("id");

      if (!sessionId) {
        return json({ error: "Missing session ID" }, 400);
      }

      const result = await ctx.runQuery(internal.api.getSession, {
        userId: auth.user._id,
        sessionId: sessionId as any,
      });

      if (!result) {
        return json({ error: "Session not found" }, 404);
      }

      await ctx.runMutation(internal.api.logAccess, {
        userId: auth.user._id,
        endpoint: "/api/sessions/get",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - start,
      });

      return json(result);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// GET /api/search - Search sessions
http.route({
  path: "/api/search",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const start = Date.now();
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const url = new URL(request.url);
      const query = url.searchParams.get("q");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const type = url.searchParams.get("type") || "fulltext";

      if (!query) {
        return json({ error: "Missing query parameter 'q'" }, 400);
      }

      let results;
      if (type === "semantic") {
        results = await ctx.runAction(internal.api.semanticSearch, {
          userId: auth.user._id,
          query,
          limit,
        });
      } else if (type === "hybrid") {
        results = await ctx.runAction(internal.api.hybridSearch, {
          userId: auth.user._id,
          query,
          limit,
        });
      } else {
        results = await ctx.runQuery(internal.api.fullTextSearch, {
          userId: auth.user._id,
          query,
          limit,
        });
      }

      await ctx.runMutation(internal.api.logAccess, {
        userId: auth.user._id,
        endpoint: "/api/search",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - start,
      });

      return json({ results });
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// GET /api/context - Get relevant sessions for context engineering
http.route({
  path: "/api/context",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const start = Date.now();
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const url = new URL(request.url);
      const query = url.searchParams.get("q");
      const limit = parseInt(url.searchParams.get("limit") || "5");
      const format = url.searchParams.get("format") || "text";

      if (!query) {
        return json({ error: "Missing query parameter 'q'" }, 400);
      }

      const context = await ctx.runAction(internal.api.getContext, {
        userId: auth.user._id,
        query,
        limit,
        format,
      });

      await ctx.runMutation(internal.api.logAccess, {
        userId: auth.user._id,
        endpoint: "/api/context",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - start,
      });

      return json(context);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// GET /api/export - Export sessions in various formats
http.route({
  path: "/api/export",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const start = Date.now();
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("id");
      const format = url.searchParams.get("format") || "json";

      if (!sessionId) {
        return json({ error: "Missing session ID" }, 400);
      }

      const result = await ctx.runQuery(internal.api.exportSession, {
        userId: auth.user._id,
        sessionId: sessionId as any,
        format,
      });

      if (!result) {
        return json({ error: "Session not found" }, 404);
      }

      await ctx.runMutation(internal.api.logAccess, {
        userId: auth.user._id,
        endpoint: "/api/export",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - start,
      });

      if (format === "markdown") {
        return new Response(result.content, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="${result.filename}"`,
          },
        });
      }

      return json(result);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// GET /api/stats - Get user stats
http.route({
  path: "/api/stats",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const start = Date.now();
    const auth = await authenticate(ctx, request);
    if (auth.error) return json({ error: auth.error }, auth.status);

    try {
      const stats = await ctx.runQuery(internal.api.getStats, {
        userId: auth.user._id,
      });

      await ctx.runMutation(internal.api.logAccess, {
        userId: auth.user._id,
        endpoint: "/api/stats",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - start,
      });

      return json(stats);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }),
});

// Health check
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return json({ status: "ok", timestamp: Date.now() });
  }),
});

export default http;
