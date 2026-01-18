import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { DocsPage } from "./pages/Docs";
import { PublicSessionPage } from "./pages/PublicSession";
import { SettingsPage } from "./pages/Settings";
import { Loader2, ArrowLeft } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

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
      <Route path="/callback" element={<LoginPage />} />
      <Route path="/s/:slug" element={<PublicSessionPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Catch-all 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ThemeProvider>
  );
}
