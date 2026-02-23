import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import type { EmbeddingModelV2, LanguageModelV2 } from "@ai-sdk/provider";

// Initialize RAG with user namespace filtering
// Type cast needed due to AI SDK model type mismatch
const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding(
    "text-embedding-3-small",
  ) as unknown as EmbeddingModelV2<string>,
  embeddingDimension: 1536,
  filterNames: ["userId"],
});

// Add session content to RAG index
export const indexSession = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const data = await ctx.runMutation(internal.sessions.getForEmbedding, {
      sessionId,
    });

    if (!data || !data.textContent) return null;

    // Add to RAG with user namespace
    await rag.add(ctx, {
      namespace: `user_${data.session.userId}`,
      text: data.textContent,
      filterValues: [{ name: "userId", value: data.session.userId.toString() }],
    });

    return null;
  },
});

// Search RAG index
export const searchRAG = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    results: v.array(v.any()),
    text: v.string(),
  }),
  handler: async (ctx, { query, limit = 10 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { results: [], text: "" };

    const user = await ctx.runQuery(internal.search.getUserByWorkosId, {
      workosId: identity.subject,
    });

    if (!user) return { results: [], text: "" };

    const { results, text } = await rag.search(ctx, {
      namespace: `user_${user._id}`,
      query,
      limit,
      vectorScoreThreshold: 0.5,
    });

    return { results, text };
  },
});

// Generate response with RAG context
export const generateWithContext = action({
  args: {
    query: v.string(),
    systemPrompt: v.optional(v.string()),
  },
  returns: v.object({
    text: v.string(),
    contextUsed: v.boolean(),
  }),
  handler: async (ctx, { query, systemPrompt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.search.getUserByWorkosId, {
      workosId: identity.subject,
    });

    if (!user) throw new Error("User not found");

    // Search for relevant context
    const { text: context } = await rag.search(ctx, {
      namespace: `user_${user._id}`,
      query,
      limit: 5,
      vectorScoreThreshold: 0.5,
    });

    // Generate response using RAG's generateText with proper API signature
    // Type cast needed due to AI SDK v3 -> v1 model type mismatch
    const { text } = await rag.generateText(ctx, {
      model: openai("gpt-4o-mini") as unknown as LanguageModelV2,
      search: {
        namespace: `user_${user._id}`,
        limit: 5,
        vectorScoreThreshold: 0.5,
      },
      prompt: query,
      system:
        systemPrompt ||
        "You are a helpful coding assistant. Use the provided context from previous coding sessions to answer questions.",
    });

    return { text, contextUsed: !!context };
  },
});
