/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as api_ from "../api.js";
import type * as authHelper from "../authHelper.js";
import type * as broadcasts from "../broadcasts.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as embeddings from "../embeddings.js";
import type * as evals from "../evals.js";
import type * as hostingChecks from "../hostingChecks.js";
import type * as http from "../http.js";
import type * as lib_adminPolicy from "../lib/adminPolicy.js";
import type * as messages from "../messages.js";
import type * as rag from "../rag.js";
import type * as search from "../search.js";
import type * as sessions from "../sessions.js";
import type * as usageAccounting from "../usageAccounting.js";
import type * as usageDirectory from "../usageDirectory.js";
import type * as users from "../users.js";
import type * as wrapped from "../wrapped.js";
import type * as wrappedActions from "../wrappedActions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analytics: typeof analytics;
  api: typeof api_;
  authHelper: typeof authHelper;
  broadcasts: typeof broadcasts;
  crons: typeof crons;
  email: typeof email;
  embeddings: typeof embeddings;
  evals: typeof evals;
  hostingChecks: typeof hostingChecks;
  http: typeof http;
  "lib/adminPolicy": typeof lib_adminPolicy;
  messages: typeof messages;
  rag: typeof rag;
  search: typeof search;
  sessions: typeof sessions;
  usageAccounting: typeof usageAccounting;
  usageDirectory: typeof usageDirectory;
  users: typeof users;
  wrapped: typeof wrapped;
  wrappedActions: typeof wrappedActions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
