import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/lib/types";
import { getRankProgress } from "@/lib/xp-math";
import { Zap } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">No profile found</div>
      </div>
    );
  }

  const rankProgress = getRankProgress(profile.total_xp);

  return (
    <div className="mobile-screen pb-20">
      <div className="px-4 pt-4 space-y-4">
        <div className="glass-elevated p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Current Rank</p>
              <p className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>{rankProgress.current.emoji}</span>
                {rankProgress.current.name}
              </p>
            </div>
            <div className="text-right">
              <p className="stat-label">Total XP</p>
              <p className="text-2xl font-bold text-primary">{profile.total_xp}</p>
            </div>
          </div>

          {rankProgress.next && (
            <div className="space-y-2">
              <p className="stat-label">Progress to {rankProgress.next.name}</p>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${rankProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {rankProgress.xpNeeded} XP needed
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3">
            <p className="stat-label">Streak</p>
            <p className="text-2xl font-bold text-accent flex items-center gap-1">
              <span className="text-lg">🔥</span>
              {profile.current_streak}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="stat-label">Best Streak</p>
            <p className="text-2xl font-bold text-foreground">{profile.best_streak}</p>
          </div>
          <div className="glass-card p-3">
            <p className="stat-label">Total Trades</p>
            <p className="text-2xl font-bold text-foreground">{profile.total_trades}</p>
          </div>
          <div className="glass-card p-3">
            <p className="stat-label">Win Rate</p>
            <p className="text-2xl font-bold text-profit">{profile.win_rate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="glass-elevated p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total P&L</p>
              <p
                className={`text-2xl font-bold ${
                  profile.total_pnl >= 0 ? "text-profit" : "text-loss"
                }`}
              >
                ${profile.total_pnl.toFixed(2)}
              </p>
            </div>
            <Zap className="w-8 h-8 text-accent opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
