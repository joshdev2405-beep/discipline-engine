import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/lib/types";
import { Bell, Shield, LogOut, ChevronRight } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="mobile-screen pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mobile-screen pb-28">
      <div className="px-4 pt-4 space-y-2">
        <h1 className="text-2xl font-bold text-foreground mb-4">Settings</h1>

        <div className="space-y-1">
          <button className="w-full glass-elevated p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-medium text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">Daily reminders, alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full glass-elevated p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">Privacy & Security</p>
                <p className="text-xs text-muted-foreground">Account, permissions</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="stat-label px-2 py-2">Account</p>

          <div className="glass-card p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-foreground font-medium break-all">{profile?.email || user?.email}</p>
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="text-foreground font-medium">{profile?.username || "Not set"}</p>
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-foreground font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="stat-label px-2 py-2">App Info</p>

          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-sm font-medium text-foreground">1.0.0</p>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="text-xs font-mono text-muted-foreground">Active</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
