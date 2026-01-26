import { useState, useEffect, type ReactNode } from "react";
import { Routes, Route, Navigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuth } from "./lib/auth";
import { useAuth as useAuthKit } from "@workos-inc/authkit-react";
import { ThemeProvider } from "./lib/theme";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { DocsPage } from "./pages/Docs";
import { PublicSessionPage } from "./pages/PublicSession";
import { SettingsPage } from "./pages/Settings";
import { EvalsPage } from "./pages/Evals";
import { ContextPage } from "./pages/Context";
import { StatsPage } from "./pages/Stats";
import { UpdatesPage } from "./pages/Updates";
import { Loader2, ArrowLeft } from "lucide-react";

// Storage key for preserving intended route across auth flow
const RETURN_TO_KEY = "opensync_return_to";

// Dedicated callback handler that waits for AuthKit to finish processing
// before redirecting to the intended route
function CallbackHandler() {
  const { isLoading: workosLoading, user } = useAuthKit();
  const { isLoading, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [processingTimeout, setProcessingTimeout] = useState(false);

  // Check if we have an authorization code in the URL
  const hasCode = searchParams.has("code");

  // Timeout after 10 seconds to prevent infinite loading
  useEffect(() => {
    if (hasCode) {
      const timer = setTimeout(() => setProcessingTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [hasCode]);

  // If we have a code and are still loading, show processing state
  if (hasCode && (workosLoading || isLoading) && !processingTimeout) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mx-auto" />
          <p className="mt-2 text-xs text-zinc-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  // If processing timed out, redirect to login
  if (processingTimeout && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, redirect to saved route or dashboard
  if (isAuthenticated || user) {
    const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || "/dashboard";
    sessionStorage.removeItem(RETURN_TO_KEY);
    return <Navigate to={returnTo} replace />;
  }

  // No code and not authenticated, show login
  return <LoginPage />;
}

// ProtectedRoute using Convex auth as source of truth
// Delays spinner to avoid flash, times out for Safari compatibility
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const location = useLocation();
  const [showSpinner, setShowSpinner] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Delay showing spinner by 500ms to avoid flash on fast loads
  useEffect(() => {
    if (isLoading) {
      const spinnerTimer = setTimeout(() => setShowSpinner(true), 500);
      return () => clearTimeout(spinnerTimer);
    }
    setShowSpinner(false);
  }, [isLoading]);

  // Timeout after 5s to handle Safari infinite loading issue
  useEffect(() => {
    if (isLoading) {
      const timeoutTimer = setTimeout(() => setLoadingTimeout(true), 5000);
      return () => clearTimeout(timeoutTimer);
    }
    setLoadingTimeout(false);
  }, [isLoading]);

  // Save intended route before redirecting to login
  useEffect(() => {
    if ((!isLoading || loadingTimeout) && !isAuthenticated) {
      const currentPath = location.pathname + location.search;
      if (currentPath !== "/login" && currentPath !== "/callback") {
        sessionStorage.setItem(RETURN_TO_KEY, currentPath);
      }
    }
  }, [isLoading, loadingTimeout, isAuthenticated, location]);

  // Loading timed out (Safari issue) - redirect to login
  if (loadingTimeout && isLoading) {
    return <Navigate to="/login" replace />;
  }

  // Still loading - only show spinner after delay
  if (isLoading) {
    if (!showSpinner) {
      // Render nothing while waiting for spinner delay (avoids flash)
      return null;
    }
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mx-auto" />
          <p className="mt-2 text-xs text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// 404 page for unmatched routes
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
      <div className="text-center">
        <pre className="text-xs mb-4 text-zinc-600 whitespace-pre">
{`
 _  _    ___  _  _   
| || |  / _ \\| || |  
| || |_| | | | || |_ 
|__   _| | | |__   _|
   | | | |_| |  | |  
   |_|  \\___/   |_|  
`}
        </pre>
        <p className="text-zinc-400 mb-2">Page not found</p>
        <p className="text-sm text-zinc-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackHandler />} />
      <Route path="/s/:slug" element={<PublicSessionPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/updates" element={<UpdatesPage />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      {/* Profile redirects to settings (profile tab is in settings) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evals"
        element={
          <ProtectedRoute>
            <EvalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/context"
        element={
          <ProtectedRoute>
            <ContextPage />
          </ProtectedRoute>
        }
      />
      {/* Dashboard - protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Homepage - public, shows LoginPage with dashboard link if logged in */}
      <Route path="/" element={<LoginPage />} />
      {/* Catch-all 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ThemeProvider>
  );
}
