import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useProfile, getRankInfo } from "@/hooks/use-profile";
import { Trophy, Globe, Flame, Loader2, Crown, Medal, Award } from "lucide-react";

const CONTINENTS = ["Global", "North America", "South America", "Europe", "Asia", "Africa", "Oceania"];

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  continent: string;
  total_xp: number;
  current_streak: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [continent, setContinent] = useState("Global");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["leaderboard", continent],
    queryFn: async () => {
      const sb = supabase as any;
      try {
        const { data, error } = await sb.rpc("get_leaderboard", {
          filter_continent: continent === "Global" ? null : continent,
        });
        if (error) throw error;
        return (data || []) as LeaderboardEntry[];
      } catch {
        let query = sb
          .from("profiles")
          .select("user_id, username, avatar_url, continent, total_xp, current_streak")
          .order("total_xp", { ascending: false })
          .limit(100);
        if (continent !== "Global") {
          query = query.eq("continent", continent);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as LeaderboardEntry[];
      }
    },
    enabled: !!user,
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-[hsl(var(--amber))]" />;
    if (index === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (index === 2) return <Award className="h-4 w-4 text-[hsl(38,60%,40%)]" />;
    return <span className="text-xs text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CONTINENTS.map((c) => (
          <button
            key={c}
            onClick={() => setContinent(c)}
            className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-all ${
              continent === c
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            {c === "Global" && <Globe className="h-3 w-3 inline mr-1" />}
            {c}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={continent}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="glass-card-elevated text-center py-12">
              <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No operators in this region yet</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const rank = getRankInfo(entry.total_xp);
              const isMe = entry.user_id === user?.id;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card flex items-center gap-4 ${isMe ? "neon-border-teal" : ""} ${i === 0 ? "glow-amber" : ""}`}
                >
                  <div className="w-6 flex justify-center">{getRankIcon(i)}</div>
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} className="h-8 w-8 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                      {entry.username.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>{entry.username}</span>
                      {isMe && <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">YOU</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">⬡ {rank.rank.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {entry.current_streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs text-accent font-medium">{entry.current_streak}d</span>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary">{entry.total_xp.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">XP</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
