import { Chrome as Home, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-elevated border-t border-border/50">
      <div className="grid grid-cols-2 h-16">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center transition-all duration-200 group ${
            isActive("/dashboard")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-xs font-medium mt-0.5">Dashboard</span>
          {isActive("/dashboard") && (
            <div className="absolute bottom-0 h-0.5 w-8 bg-gradient-to-r from-primary to-accent rounded-t" />
          )}
        </Link>
        <Link
          to="/settings"
          className={`flex flex-col items-center justify-center transition-all duration-200 group ${
            isActive("/settings")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-xs font-medium mt-0.5">Settings</span>
          {isActive("/settings") && (
            <div className="absolute bottom-0 h-0.5 w-8 bg-gradient-to-r from-primary to-accent rounded-t" />
          )}
        </Link>
      </div>
      <div className="h-[var(--safe-area-bottom)]" />
    </nav>
  );
}
