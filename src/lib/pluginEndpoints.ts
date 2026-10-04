// HTTP plugin endpoints are distinct from the Convex client/WebSocket endpoint.
export function getPluginEndpoints(cloudUrl = "", apiUrl = "") {
  const cloud = cloudUrl.trim().replace(/\/+$/, "");
  const explicitApi = apiUrl.trim().replace(/\/+$/, "");
  const hostedProduction = [
    "https://reminiscent-gull-645.convex.cloud",
    "https://app.opensync.dev",
  ].includes(cloud);
  return {
    apiUrl: explicitApi || (hostedProduction
      ? "https://api.opensync.dev"
      : cloud.replace(/\.convex\.cloud$/, ".convex.site")),
    // Published OpenCode/Claude Code login validators still require this suffix.
    legacyUrl: hostedProduction
      ? "https://reminiscent-gull-645.convex.cloud"
      : cloud.endsWith(".convex.cloud") ? cloud : "",
  };
}
