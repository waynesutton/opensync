import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import App from "./App";
import "./index.css";
import "./styles/typography.css";

// Ensure VITE_CONVEX_URL is defined before creating client
const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error(
    "VITE_CONVEX_URL is not set. Please check your environment variables.",
  );
}
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Handle redirect after OAuth callback
// This is called by AuthKit after the authorization code exchange completes
// We just clean the URL here - the actual navigation is handled by CallbackHandler
const onRedirectCallback = () => {
  // Just clean the URL params without navigating
  // The CallbackHandler component handles the actual redirect
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
};

function Root() {
  // If Convex client failed to initialize, show setup error
  if (!convex) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-medium text-zinc-100 mb-2">
            Setup Required
          </h1>
          <p className="text-sm text-zinc-400 mb-4">
            Missing VITE_CONVEX_URL environment variable. Please complete the
            setup.
          </p>
          <a
            href="https://github.com/waynesutton/opensync/blob/main/ONE-CLICK-DEPLOY.md"
            className="inline-flex items-center gap-1 text-sm text-yellow-500 hover:text-yellow-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View setup guide
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthKitProvider
      clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
      redirectUri={
        import.meta.env.VITE_REDIRECT_URI ||
        `${window.location.origin}/callback`
      }
      devMode={true} // Force localStorage tokens to avoid third-party cookie blocking in production
      onRedirectCallback={onRedirectCallback}
    >
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
