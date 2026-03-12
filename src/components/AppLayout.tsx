import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, BarChart3, Settings } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Config" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-6 h-14 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Trade Tracker" className="h-8 w-8 object-contain" />
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-wider text-primary leading-none">
                TRADE TRACKER
              </span>
              <span className="text-[9px] font-mono text-muted-foreground leading-none mt-0.5">
                THE DISCIPLINE ENGINE
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary neon-border-teal"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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

      <main className="p-6 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
