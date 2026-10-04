import { describe, expect, it } from "vitest";
import { getPluginEndpoints } from "./pluginEndpoints";

describe("plugin endpoint routing", () => {
  it.each(["https://app.opensync.dev", "https://reminiscent-gull-645.convex.cloud/"])(
    "maps production %s to HTTP API while retaining legacy setup", (url) => {
      expect(getPluginEndpoints(url)).toEqual({
        apiUrl: "https://api.opensync.dev",
        legacyUrl: "https://reminiscent-gull-645.convex.cloud",
      });
    },
  );
  it("keeps development isolated from production", () => {
    expect(getPluginEndpoints("https://dapper-raven-705.convex.cloud").apiUrl)
      .toBe("https://dapper-raven-705.convex.site");
  });
  it("resolves forks without sending their keys to OpenSync production", () => {
    expect(getPluginEndpoints("https://fork-123.convex.cloud").apiUrl)
      .toBe("https://fork-123.convex.site");
    expect(getPluginEndpoints("https://backend.example.com", "https://api.example.com/")).toEqual({
      apiUrl: "https://api.example.com", legacyUrl: "",
    });
  });
  it("preserves HTTP/local URLs and missing configuration", () => {
    expect(getPluginEndpoints("https://fork-123.convex.site").apiUrl).toBe("https://fork-123.convex.site");
    expect(getPluginEndpoints("http://127.0.0.1:3210", "http://127.0.0.1:3211").apiUrl).toBe("http://127.0.0.1:3211");
    expect(getPluginEndpoints()).toEqual({ apiUrl: "", legacyUrl: "" });
  });
});
