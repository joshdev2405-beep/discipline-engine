import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, BarChart3, Settings, ImageIcon, Trophy, Zap, X, UserPlus, Ghost } from "lucide-react";
import logo from "@/assets/logo-new.jpeg";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/components/AuthProvider";
import { useOperatorMode } from "@/lib/operator-mode";
import RankProgression from "@/components/RankProgression";
import XPSystemInfo from "@/components/XPSystemInfo";
import ProfileDropdown from "@/components/ProfileDropdown";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/vault", icon: ImageIcon, label: "The Vault" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/settings", icon: Settings, label: "Config" },
];

function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [rankOpen, setRankOpen] = useState(false);
  const [xpInfoOpen, setXpInfoOpen] = useState(false);
  const { profile, rankInfo } = useProfile();
  const { user } = useAuth();
  const { operatorMode } = useOperatorMode(user?.email);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="py-4 flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 mb-4 ${collapsed ? "justify-center px-2" : ""}`}>
          <img src={logo} alt="Trade Tracker" className="h-8 w-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <span className="text-xs font-bold tracking-wider text-primary leading-none">TRADE TRACKER</span>
              <span className="text-[9px] text-muted-foreground leading-none mt-0.5">THE DISCIPLINE ENGINE</span>
            </div>
          )}
        </div>

        {/* Operator Rank — Live Data */}
        <div className={`px-4 mb-6 ${collapsed ? "px-2" : ""}`}>
          <button onClick={() => setRankOpen(true)} className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity">
            {!collapsed ? (
              <div className="glass-card !p-3 space-y-2 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">Current Rank</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setXpInfoOpen(true); }}
                    className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="XP System"
                  >
                    <Zap className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary whitespace-nowrap">⬡ {rankInfo.rank.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">XP</span>
                    <span className="text-[10px] text-muted-foreground">
                      {rankInfo.xp} / {rankInfo.nextRank?.xpRequired ?? "∞"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${rankInfo.progress}%`, boxShadow: "0 0 8px hsl(var(--emerald-glow) / 0.4)" }}
                    />
                  </div>
                </div>
                {operatorMode && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
                    <span className="text-[9px] text-amber-500/80 whitespace-nowrap">Operator Mode</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-primary text-sm">⬡</span>
                <div className="h-8 w-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="w-full rounded-full bg-primary"
                    style={{ height: `${rankInfo.progress}%`, boxShadow: "0 0 6px hsl(var(--emerald-glow) / 0.4)" }}
                  />
                </div>
              </div>
            )}
          </button>
          <RankProgression open={rankOpen} onOpenChange={setRankOpen} />
          <XPSystemInfo open={xpInfoOpen} onOpenChange={setXpInfoOpen} />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.to}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden whitespace-nowrap ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const isGuest = profile?.is_guest === true || (user as any)?.is_anonymous === true;
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background terminal-grid">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 h-12 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <ProfileDropdown />
          </header>
          {isGuest && !bannerDismissed && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 text-xs">
              <div className="flex items-center gap-2 text-amber-500/90 min-w-0">
                <Ghost className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Sign up to sync your data across devices.</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-upgrade-account"))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                >
                  <UserPlus className="h-3 w-3" /> Sign Up
                </button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="p-1 rounded text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
