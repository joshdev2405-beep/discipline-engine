import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  continent: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  created_at: string;
  updated_at: string;
}

const RANKS = [
  { name: "Novice Operator", xpRequired: 0, tier: "novice" as const },
  { name: "Advanced Tech", xpRequired: 1000, tier: "advanced" as const },
  { name: "Elite Executor", xpRequired: 5000, tier: "elite" as const },
  { name: "Master Operative", xpRequired: 15000, tier: "master" as const },
  { name: "Legendary Architect", xpRequired: 50000, tier: "legendary" as const },
];

export function getRankInfo(xp: number) {
  let rankIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].xpRequired) {
      rankIndex = i;
      break;
    }
  }
  const current = RANKS[rankIndex];
  const next = RANKS[rankIndex + 1];
  const progress = next
    ? ((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100
    : 100;
  return { rank: current, rankIndex, nextRank: next, progress: Math.min(progress, 100), xp };
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      // Try to get profile
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!data && !error) {
        // Create profile if doesn't exist (e.g. user created before trigger)
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user!.id,
            username: `Operator-${Math.floor(Math.random() * 9000 + 100)}`,
          })
          .select()
          .single();
        if (insertError) throw insertError;
        data = newProfile;
      }
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  // Record daily login & award XP
  useEffect(() => {
    if (!user || !profile) return;
    recordDailyLogin();
  }, [user?.id, profile?.id]);

  const recordDailyLogin = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    if (profile?.last_login_date === today) return;

    try {
      // Insert daily login (ignore conflict)
      const { error: loginError } = await supabase
        .from("daily_logins")
        .insert({ user_id: user.id, login_date: today })
        .select()
        .single();
      
      if (loginError && !loginError.message.includes("duplicate")) throw loginError;
      if (loginError) return; // Already logged in today

      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      const newStreak = profile?.last_login_date === yesterdayStr
        ? (profile.current_streak || 0) + 1
        : 1;
      
      const multiplier = getStreakMultiplier(newStreak);
      const xpGain = Math.round(10 * multiplier);

      // Log XP event
      await supabase.from("xp_events").insert({
        user_id: user.id,
        event_type: "daily_login",
        xp_amount: xpGain,
        multiplier,
      });

      // Update profile
      await supabase
        .from("profiles")
        .update({
          last_login_date: today,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, profile?.longest_streak || 0),
          total_xp: (profile?.total_xp || 0) + xpGain,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      console.error("Login tracking error:", err);
    }
  };

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "username" | "avatar_url" | "continent">>) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const awardXP = async (eventType: string, baseXP: number) => {
    if (!user || !profile) return;
    const multiplier = getStreakMultiplier(profile.current_streak);
    const xpGain = Math.round(baseXP * multiplier);

    await supabase.from("xp_events").insert({
      user_id: user.id,
      event_type: eventType,
      xp_amount: xpGain,
      multiplier,
    });

    await supabase
      .from("profiles")
      .update({
        total_xp: profile.total_xp + xpGain,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    queryClient.invalidateQueries({ queryKey: ["profile"] });
    return xpGain;
  };

  const rankInfo = getRankInfo(profile?.total_xp || 0);

  return { profile, isLoading, updateProfile, awardXP, rankInfo };
}
