import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Profile as ProfileType } from "@/lib/types";
import { LogOut } from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
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
      <div className="mobile-screen pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mobile-screen pb-20">
      <div className="px-4 pt-4 space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>

        {profile && (
          <>
            <div className="glass-elevated p-4 space-y-3">
              <div>
                <p className="stat-label">Email</p>
                <p className="text-foreground font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="stat-label">Username</p>
                <p className="text-foreground font-medium">{profile.username || "Not set"}</p>
              </div>
              <div>
                <p className="stat-label">Member Since</p>
                <p className="text-foreground font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="stat-label">Stats</p>
              <div className="glass-card p-3">
                <p className="text-sm text-muted-foreground mb-2">Current Streak</p>
                <p className="text-2xl font-bold text-accent">{profile.current_streak} days</p>
              </div>
              <div className="glass-card p-3">
                <p className="text-sm text-muted-foreground mb-2">Best Streak</p>
                <p className="text-2xl font-bold text-foreground">{profile.best_streak} days</p>
              </div>
              <div className="glass-card p-3">
                <p className="text-sm text-muted-foreground mb-2">Total Trades</p>
                <p className="text-2xl font-bold text-foreground">{profile.total_trades}</p>
              </div>
            </div>
          </>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-md font-medium hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
