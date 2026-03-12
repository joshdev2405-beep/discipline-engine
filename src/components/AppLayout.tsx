import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, BarChart3, Activity } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Command Center" },
  { to: "/journal", icon: BookOpen, label: "Trade Journal" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background terminal-grid">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-bold tracking-wider text-primary">
              TRADE TRACKER
            </span>
            <span className="text-xs font-mono text-muted-foreground ml-1">
              // THE DISCIPLINE ENGINE
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
