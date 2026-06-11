import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Inbox, ArrowLeft, Loader2, Bug, Sparkles, MessageCircle, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useIsAdmin } from "@/lib/operator-mode";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";


type FeedbackRow = {
  id: string;
  user_id: string;
  category: string;
  message: string;
  app_version: string | null;
  image_url: string | null;
  created_at: string;
};

const CATEGORIES = ["All", "Bug", "Feature Request", "General"] as const;

function CategoryIcon({ c }: { c: string }) {
  if (c === "Bug") return <Bug className="h-3 w-3" />;
  if (c === "Feature Request") return <Sparkles className="h-3 w-3" />;
  return <MessageCircle className="h-3 w-3" />;
}

function categoryClass(c: string) {
  if (c === "Bug") return "bg-destructive/10 text-destructive border-destructive/30";
  if (c === "Feature Request") return "bg-primary/10 text-primary border-primary/30";
  return "bg-muted/40 text-muted-foreground border-border";
}

function FeedbackThumbnail({ path, onClick }: { path: string; onClick: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.storage
      .from("feedback-images")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) console.error("Signed URL error:", error);
          else if (data) setUrl(data.signedUrl);
        }
      });
    return () => { cancelled = true; };
  }, [path]);

  if (!url) return null;

  return (
    <button
      onClick={() => onClick(url)}
      className="relative mt-2 mb-1 group"
      aria-label="View attached image"
    >
      <img
        src={url}
        alt="Feedback attachment"
        className="h-16 w-auto rounded-md border border-border/60 object-cover transition-transform group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-black/5 group-hover:ring-primary/40 transition-colors" />
    </button>
  );
}

export default function FeedbackInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");

  const allowed = useIsAdmin(user?.id);

  useEffect(() => {
    if (!user) return;
    // Hard guard: bail out unless server confirms admin role — never query.
    if (!allowed) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setRows(data as FeedbackRow[]);
      setLoading(false);
    })();
  }, [user, allowed]);

  const filtered = useMemo(
    () => (filter === "All" ? rows : rows.filter((r) => r.category === filter)),
    [rows, filter]
  );

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-muted-foreground">Access denied.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-xs text-primary hover:underline">
          Return to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Inbox className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Feedback Inbox</h1>
            <p className="text-[11px] text-muted-foreground">
              {loading ? "Loading…" : `${filtered.length} of ${rows.length} submissions`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
              filter === c
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-background/40 text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card-elevated text-center py-16">
          <Inbox className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No feedback in this view.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card-elevated relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent" />
              <div className="relative flex items-start justify-between gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${categoryClass(
                    row.category
                  )}`}
                >
                  <CategoryIcon c={row.category} /> {row.category}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              </div>
              <p className="relative text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-3">
                {row.message}
              </p>
              <div className="relative flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                <span className="font-mono truncate" title={row.user_id}>
                  user: {row.user_id}
                </span>
                {row.app_version && (
                  <span className="uppercase tracking-widest">v{row.app_version}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
