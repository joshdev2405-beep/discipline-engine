import { ChartBar as BarChart3, Chrome as Home, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-sm">
      <div className="grid grid-cols-4 h-16">
        <Link
          to="/dashboard"
          className={`flex items-center justify-center text-xs font-medium transition-colors ${
            isActive("/dashboard")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="w-5 h-5" />
        </Link>
        <Link
          to="/journal"
          className={`flex items-center justify-center text-xs font-medium transition-colors ${
            isActive("/journal")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-5 h-5" />
        </Link>
        <Link
          to="/analytics"
          className={`flex items-center justify-center text-xs font-medium transition-colors ${
            isActive("/analytics")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
        </Link>
        <Link
          to="/profile"
          className={`flex items-center justify-center text-xs font-medium transition-colors ${
            isActive("/profile")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-5 h-5" />
        </Link>
      </div>
      <div className="h-[var(--safe-area-bottom)]" />
    </nav>
  );
}
