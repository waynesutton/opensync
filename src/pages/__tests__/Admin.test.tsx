import { RecipientPicker } from "../../components/RecipientPicker";
import type { Id } from "../../../convex/_generated/dataModel";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { getFunctionName } from "convex/server";
import { AdminPage } from "../Admin";
import { AdminLink } from "../../components/AdminLink";

const state = vi.hoisted(() => ({ isAdmin: true, testMode: true }));
vi.mock("../../lib/theme", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/theme")>()),
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));
vi.mock("../../lib/auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { email: "wayne@socialwayne.com" },
    signOut: vi.fn(),
  }),
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () =>
    vi.fn(() => {
      throw new Error("Rendering must not mutate anything");
    }),
  useConvex: () => ({ query: vi.fn() }),
  useQuery: (reference: Parameters<typeof getFunctionName>[0]) => {
    switch (getFunctionName(reference)) {
      case "admin:getAccessStatus":
        return {
          allowed: state.isAdmin,
          message: "Platform admin access required",
        };
      case "admin:isPlatformAdmin":
        return state.isAdmin;
      case "broadcasts:listBroadcasts":
        return [
          {
            _id: "draft-1",
            subject: "Saved update",
            status: "draft",
            createdAt: 1,
          },
        ];
      case "broadcasts:recipientCount":
        return { count: 2, isExact: true };
      case "broadcasts:getEmailConfiguration":
        return {
          testMode: state.testMode,
          missing: [],
          canSend: !state.testMode,
          testRecipient: "wayne@socialwayne.com",
        };
      default:
        return undefined;
    }
  },
}));

beforeEach(() => {
  state.isAdmin = true;
  state.testMode = true;
});
function render(element: React.ReactNode) {
  return renderToStaticMarkup(
    <StaticRouter location="/admin?tab=email">{element}</StaticRouter>,
  );
}

describe("admin navigation and composer", () => {
  it("shows an Admin entry only when the server grants access", () => {
    expect(render(<AdminLink />)).toContain('aria-label="Admin"');
    state.isAdmin = false;
    expect(render(<AdminLink />)).not.toContain('aria-label="Admin"');
  });
  it("shows a restricted notice without mounting the composer for other users", () => {
    state.isAdmin = false;
    const html = render(<AdminPage />);
    expect(html).toContain("Platform admin access required");
    expect(html).not.toContain("Compose product update");
    expect(html).not.toContain("bootstrapAdmin");
  });
  it("opens Email updates with accessible fields, drafts, preview and disabled sends", () => {
    const html = render(<AdminPage />);
    expect(html).toContain('for="broadcast-subject"');
    expect(html).toContain('for="broadcast-body"');
    expect(html).toContain("Save draft");
    expect(html).toContain("Preview email");
    expect(html).toContain('aria-label="Edit draft: Saved update"');
    expect(html).toContain("sending is disabled");
    expect(html).toContain("Test recipient: wayne@socialwayne.com");
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>[\s\S]*?Send test to me/,
    );
  });
});

it("renders an accessible recipient search and exact selected address", () => {
  const empty = render(
    <RecipientPicker selected={null} onSelect={() => {}} disabled={false} />,
  );
  expect(empty).toContain('for="recipient-search"');
  expect(empty).toContain("Unsubscribed or suppressed accounts");
  const selected = render(
    <RecipientPicker
      selected={{ _id: "user-1" as Id<"users">, email: "wayne@convex.dev" }}
      onSelect={() => {}}
      disabled={false}
    />,
  );
  expect(selected).toContain("wayne@convex.dev");
  expect(selected).toContain("Change recipient");
  expect(selected).not.toContain('id="recipient-search"');
});
