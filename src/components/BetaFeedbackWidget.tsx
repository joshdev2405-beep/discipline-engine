import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const APP_VERSION = "beta-0.1";

export default function BetaFeedbackWidget() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!message.trim()) {
      toast.error("Please share a thought before submitting.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      category,
      message: message.trim(),
      app_version: APP_VERSION,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send feedback. Try again.");
      return;
    }
    toast.success("Feedback received. Thank you for shaping the build.");
    setMessage("");
    setCategory("General");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="glass-card-elevated relative overflow-hidden"
        >
          {/* subtle gradient sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />

          <div className="relative flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="stat-label text-primary">Beta Feedback</span>
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-primary/30 text-primary/70">
                v{APP_VERSION}
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="relative text-[11px] text-muted-foreground mb-3">
            Help us refine the engine. Every signal goes straight to the operator.
          </p>

          <div className="relative space-y-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, bugs, or ideas..."
              rows={3}
              className="w-full resize-none rounded-md bg-background/40 border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-background/60 transition-colors"
            />

            <div className="flex items-center gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs bg-background/40 border-border/60 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">🐛 Bug</SelectItem>
                  <SelectItem value="Feature Request">✨ Feature Request</SelectItem>
                  <SelectItem value="General">💬 General</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                className="ml-auto inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submit
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
