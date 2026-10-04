import { Link } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { ShieldCheck } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useTheme, getThemeClasses } from "../lib/theme";
import { cn } from "../lib/utils";
// Navigation reflects server authorization; hiding this link is not the access gate.
export function AdminLink() {
  const { isAuthenticated } = useConvexAuth();
  const allowed = useQuery(api.admin.isPlatformAdmin, isAuthenticated ? {} : "skip");
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  if (!allowed) return null;
  return <Link to="/admin" aria-label="Admin" title="Admin" className={cn("p-1.5 rounded transition-colors", t.textSubtle, t.bgHover)}><ShieldCheck className="h-4 w-4" /></Link>;
}
