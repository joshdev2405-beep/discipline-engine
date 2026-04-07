import { motion } from "framer-motion";
import { Zap, Calendar, BookOpen, Target, Flame, Info } from "lucide-react";
import { useProfile, getStreakMultiplier } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const XP_RULES = [
  { icon: Calendar, label: "Daily Login", base: 10, description: "Log in each day" },
  { icon: BookOpen, label: "Journal Entry", base: 50, description: "Log a new trade" },
  { icon: Target, label: "Result Entry", base: 25, description: "Close a trade with result" },
  { icon: Flame, label: "Daily Target Achieved", base: 40, description: "Hit your Daily Avg Points target" },
];

const STREAK_TIERS = [
  { days: 3, multiplier: "1.2x", description: "3+ day streak" },
  { days: 7, multiplier: "1.5x", description: "7+ day streak" },
  { days: 14, multiplier: "2.0x", description: "14+ day streak" },
];

export default function XPSystemInfo({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { profile } = useProfile();
  const { user } = useAuth();

  const { data: recentXP = [] } = useQuery({
    queryKey: ["xp_events_recent", user?.id],
    queryFn: async () => {
      const sb = supabase as any;
      const { data, error } = await sb.from("xp_events").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data as Array<{ id: string; event_type: string; xp_amount: number; multiplier: number; created_at: string }>;
    },
    enabled: !!user && open,
  });

  if (!open) return null;

  const currentMultiplier = getStreakMultiplier(profile?.current_streak || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl"
      onClick={() => onOpenChange(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-4 glass-card-elevated rounded-xl max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">XP Economy</h2>
          </div>

          <div className="space-y-3">
            <span className="stat-label text-primary">XP Sources</span>
            {XP_RULES.map((rule) => (
              <div key={rule.label} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/30">
                <rule.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{rule.label}</p>
                  <p className="text-[10px] text-muted-foreground">{rule.description}</p>
                </div>
                <span className="text-sm font-bold text-primary">+{rule.base}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" />
              <span className="stat-label text-accent">Streak Multipliers</span>
            </div>
            <div className="flex gap-2">
              {STREAK_TIERS.map((tier) => (
                <div
                  key={tier.days}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    (profile?.current_streak || 0) >= tier.days
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <p className="text-lg font-bold text-primary">{tier.multiplier}</p>
                  <p className="text-[10px] text-muted-foreground">{tier.description}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] text-primary">
                Current multiplier: <strong>{currentMultiplier}x</strong> ({profile?.current_streak || 0} day streak)
              </span>
            </div>
          </div>

          {recentXP.length > 0 && (
            <div className="space-y-2">
              <span className="stat-label">Recent XP</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {recentXP.map((xp) => (
                  <div key={xp.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground capitalize">{xp.event_type.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      {xp.multiplier > 1 && <span className="text-[9px] text-accent">{xp.multiplier}x</span>}
                      <span className="text-primary font-semibold">+{xp.xp_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
