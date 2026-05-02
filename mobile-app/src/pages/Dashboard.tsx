import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/lib/types";
import DailyTargetCircle from "@/components/DailyTargetCircle";
import XPProgressBar from "@/components/XPProgressBar";
import TradingDaysCard from "@/components/TradingDaysCard";
import QuickLogModal from "@/components/QuickLogModal";
import { Zap, Plus } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todaysTrades, setTodaysTrades] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const DAILY_TARGET = 3;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        const today = new Date().toISOString().split("T")[0];
        const { data: tradesData, count } = await supabase
          .from("trades")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .gte("entry_date", today + "T00:00:00")
          .lt("entry_date", today + "T23:59:59");

        setTodaysTrades(count || 0);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const subscription = supabase
      .channel("trades-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "trades",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleQuickLogSuccess = () => {
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      supabase
        .from("trades")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .gte("entry_date", today + "T00:00:00")
        .lt("entry_date", today + "T23:59:59")
        .then(({ count }) => setTodaysTrades(count || 0));
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="mobile-screen pb-28">
      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <button
            onClick={() => setShowQuickLog(true)}
            className="p-2 bg-gradient-to-br from-primary to-profit text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="glass-elevated p-6 flex justify-center">
          <DailyTargetCircle currentTrades={todaysTrades} dailyTarget={DAILY_TARGET} />
        </div>

        {profile && (
          <>
            <XPProgressBar totalXP={profile.total_xp} />
            <TradingDaysCard />

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 space-y-1">
                <p className="stat-label">Streak</p>
                <p className="text-3xl font-bold text-accent">
                  {profile.current_streak}
                  <span className="text-lg ml-1">🔥</span>
                </p>
              </div>
              <div className="glass-card p-4 space-y-1">
                <p className="stat-label">Best</p>
                <p className="text-3xl font-bold text-foreground">{profile.longest_streak}</p>
              </div>
            </div>

            <div className="glass-elevated p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Total Trades</p>
                  <p className="text-2xl font-bold text-foreground">{profile.total_trades}</p>
                </div>
                <Zap className="w-8 h-8 text-accent opacity-40" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-bold text-profit">68.5%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P&L</p>
                  <p className="text-lg font-bold text-profit">+$2,450</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {user && (
        <QuickLogModal
          isOpen={showQuickLog}
          onClose={() => setShowQuickLog(false)}
          userId={user.id}
          onSuccess={handleQuickLogSuccess}
        />
      )}
    </div>
  );
}
