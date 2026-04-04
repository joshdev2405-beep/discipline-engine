import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Globe, Pencil, Check, X, LogOut, Camera, Loader2, Shield } from "lucide-react";
import { useProfile, getRankInfo } from "@/hooks/use-profile";
import { useAuth } from "@/components/AuthProvider";
import { useOperatorMode } from "@/lib/operator-mode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CONTINENTS = ["Global", "North America", "South America", "Europe", "Asia", "Africa", "Oceania"];

export default function ProfileDropdown() {
  const { profile, updateProfile, rankInfo } = useProfile();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [continent, setContinent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Outside-click handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!profile) return null;

  const handleEdit = () => {
    setUsername(profile.username);
    setContinent(profile.continent);
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(
      { username: username.trim() || profile.username, continent },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          setEditing(false);
        },
      }
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      updateProfile.mutate(
        { avatar_url: `${publicUrl}?t=${Date.now()}` },
        { onSuccess: () => toast.success("Avatar updated") }
      );
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} className="h-7 w-7 rounded-full object-cover border border-border" alt="" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
        <span className="text-xs font-medium text-foreground hidden md:block">{profile.username}</span>
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-72 glass-card-elevated rounded-xl shadow-2xl"
          >
            <div className="p-4 space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                <div className="relative group">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="h-12 w-12 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Camera className="h-4 w-4 text-primary" />}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-semibold text-foreground truncate">{profile.username}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-2.5 w-2.5" /> {user?.email}
                  </p>
                </div>
                {!editing ? (
                  <button onClick={handleEdit} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={handleSave} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Rank */}
              <div className="glass-card !p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Rank</span>
                  <span className="text-[10px] text-primary font-medium">{rankInfo.xp} XP</span>
                </div>
                <p className="text-xs font-semibold text-primary">⬡ {rankInfo.rank.name}</p>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${rankInfo.progress}%`, boxShadow: "0 0 8px hsl(var(--emerald-glow) / 0.4)" }}
                  />
                </div>
              </div>

              {/* Region */}
              {editing ? (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Region</label>
                  <select
                    value={continent}
                    onChange={(e) => setContinent(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    {CONTINENTS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{profile.continent}</span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
