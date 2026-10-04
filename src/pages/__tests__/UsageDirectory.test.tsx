import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { getFunctionName } from "convex/server";
import { AdminUsageUsers } from "../../components/AdminUsageUsers";
import { UsageLeaderboardPreferences } from "../../components/UsageLeaderboardPreferences";
import { UsageLeaderboardPage } from "../UsageLeaderboard";

const state = vi.hoisted(() => ({
  theme: "tan",
  loading: false,
  empty: false,
  optedIn: false,
  backfill: false,
  pageStatus: "Exhausted",
  pagination: vi.fn(),
  mutate: vi.fn(() => {
    throw new Error("Rendering must not change consent or data");
  }),
}));
vi.mock("../../lib/theme", () => ({
  useTheme: () => ({ theme: state.theme, toggleTheme: vi.fn() }),
}));
vi.mock("convex/react", () => ({
  useMutation: () => state.mutate,
  usePaginatedQuery: (
    reference: Parameters<typeof getFunctionName>[0],
    args: unknown,
    options: unknown,
  ) => {
    const name = getFunctionName(reference);
    state.pagination(name, args, options);
    const person =
      name === "usageDirectory:publicPage"
        ? {
            firstName: "Ada",
            totalTokens: 1300000,
            topModel: "model-example",
            email: "must-not-render@example.test",
            name: "PRIVATE FULL NAME",
            userId: "private-id",
            sessions: "PRIVATE SESSION TEXT",
          }
        : {
            _id: "private-id",
            name: "Ada Lovelace",
            email: "ada@example.test",
            totalTokens: 1300000,
            sessionCount: 14,
            topModel: "model-example",
            lastActiveAt: 172800000,
            joinedAt: 86400000,
            publicOptIn: false,
            updatedAt: 172800000,
          };
    return {
      results: state.empty || state.loading ? [] : [person],
      status: state.loading ? "LoadingFirstPage" : state.pageStatus,
      loadMore: vi.fn(),
    };
  },
  useQuery: (reference: Parameters<typeof getFunctionName>[0]) => {
    if (state.loading) return undefined;
    switch (getFunctionName(reference)) {
      case "usageDirectory:publicStatus":
        return { ready: !state.backfill };
      case "usageDirectory:status":
        return {
          phase: state.backfill ? "sessions" : "complete",
          processedUsers: 2,
          processedSessions: 10,
          updatedAt: 1,
        };
      case "usageDirectory:myPreference":
        return {
          optedIn: state.optedIn,
          firstName: "Ada",
          totalTokens: 1300000,
          topModel: "model-example",
        };
      default:
        return undefined;
    }
  },
}));
function render(element: React.ReactNode) {
  return renderToStaticMarkup(
    <StaticRouter location="/usage-leaderboard">{element}</StaticRouter>,
  );
}
beforeEach(() => {
  state.theme = "tan";
  state.loading = false;
  state.empty = false;
  state.optedIn = false;
  state.backfill = false;
  state.pageStatus = "Exhausted";
  state.pagination.mockClear();
  state.mutate.mockClear();
});

describe.each(["tan", "dark"])("usage directory in %s mode", (theme) => {
  it("renders only the four intended public fields even when data contains private extras", () => {
    state.theme = theme;
    const html = render(<UsageLeaderboardPage />);
    expect(html).toContain(`data-usage-theme="${theme}"`);
    expect(html).toContain("Ada");
    expect(html).toContain("1.3M");
    expect(html).toContain("model-example");
    expect(html).not.toContain("must-not-render");
    expect(html).not.toContain("PRIVATE FULL NAME");
    expect(html).not.toContain("private-id");
    expect(html).not.toContain("PRIVATE SESSION TEXT");
    expect(html).toContain(
      "Sessions, prompts, and email addresses stay private",
    );
    expect(html).toContain(
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
  });
  it("renders useful public empty and loading states without invented accounts", () => {
    state.theme = theme;
    state.empty = true;
    let html = render(<UsageLeaderboardPage />);
    expect(html).toContain("The board starts with a choice");
    expect(html).not.toContain("Ada");
    state.loading = true;
    html = render(<UsageLeaderboardPage />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading the leaderboard");
  });
  it("defaults to private with an unchecked checkbox and explicit save action", () => {
    state.theme = theme;
    const html = render(<UsageLeaderboardPreferences />);
    expect(html).toContain('type="checkbox"');
    expect(html).not.toMatch(/type="checkbox"[^>]* checked/);
    expect(html).toContain("Save preference");
    expect(html).toContain("including past sessions");
    expect(html).toContain("You are private");
    expect(html).not.toContain("Public preview");
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it("shows current consent and an accurate public preview for an opted-in account", () => {
    state.theme = theme;
    state.optedIn = true;
    const html = render(<UsageLeaderboardPreferences />);
    expect(html).toMatch(/type="checkbox"[^>]* checked/);
    expect(html).toContain("Public preview");
    expect(html).toContain("1,300,000");
    expect(html).toContain("You are opted in");
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it("provides owner search, global sorting, filters, columns and honest relative gauges", () => {
    state.theme = theme;
    const html = render(<AdminUsageUsers />);
    expect(html).toContain("first name, last name, full name, or email");
    expect(html).toContain('aria-sort="descending"');
    expect(html).toContain("Filters");
    expect(html).toContain("Columns");
    expect(html).toContain("ada@example.test");
    expect(html).toContain("relative to the highest loaded account");
    expect(html).toContain("they are not quotas");
    expect(html).toContain("End of results");
    expect(html).not.toContain("Send email");
  });
  it("distinguishes indexing, loading and empty account states", () => {
    state.theme = theme;
    state.backfill = true;
    state.empty = true;
    let html = render(<AdminUsageUsers />);
    expect(html).toContain("Preparing historical usage");
    expect(html).toContain("No accounts in this view");
    state.loading = true;
    html = render(<AdminUsageUsers />);
    expect(html).toContain("Loading accounts");
    expect(html).toContain('aria-busy="true"');
  });
});

it("labels incomplete public rankings while historical usage is indexed", () => {
  state.backfill = true;
  expect(render(<UsageLeaderboardPage />)).toContain(
    "Token totals and rankings are incomplete",
  );
});

it("requests the first 100 public entries with global sort/filter arguments", () => {
  const html = render(<UsageLeaderboardPage />);
  expect(state.pagination).toHaveBeenCalledWith(
    "usageDirectory:publicPage",
    { sort: "tokens", direction: "desc", model: undefined },
    { initialNumItems: 100 },
  );
  expect(html).toContain("Tokens · highest first");
  expect(html).toContain("Tokens · lowest first");
  expect(html).toContain("First name · A–Z");
  expect(html).toContain("First name · Z–A");
  expect(html).toContain("Exact top model");
  expect(html).toContain("Apply filter");
  expect(html).toContain("End of results");
  expect(html).not.toContain("Load 100 more");
});
it("shows public Load more only while more results are available", () => {
  state.pageStatus = "CanLoadMore";
  let html = render(<UsageLeaderboardPage />);
  expect(html).toContain("Load 100 more");
  expect(html).not.toContain("End of results");
  state.pageStatus = "LoadingMore";
  html = render(<UsageLeaderboardPage />);
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Loading/);
  expect(html).toContain("Ada");
});
it("requests and exposes admin pagination in batches of 100", () => {
  state.pageStatus = "CanLoadMore";
  const html = render(<AdminUsageUsers />);
  expect(state.pagination).toHaveBeenCalledWith(
    "usageDirectory:list",
    expect.objectContaining({ sort: "tokens", direction: "desc" }),
    { initialNumItems: 100 },
  );
  expect(html).toContain("Load 100 more accounts");
});

it("keeps pagination available for a batch with no eligible public entries", () => {
  state.empty = true;
  state.pageStatus = "CanLoadMore";
  const html = render(<UsageLeaderboardPage />);
  expect(html).toContain("No eligible entries in this batch");
  expect(html).toContain("Load more to continue");
  expect(html).toContain("Load 100 more");
  expect(html).not.toContain("No public entries yet");
});
