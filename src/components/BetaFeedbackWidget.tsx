import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Loader2, Send, ImagePlus } from "lucide-react";
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
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!message.trim()) {
      toast.error("Please share a thought before submitting.");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        category,
        message: message.trim(),
        app_version: APP_VERSION,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setSubmitting(false);
      toast.error("Could not send feedback. Try again.");
      return;
    }

    // Optional image upload
    if (image) {
      const ext = image.name.split(".").pop() || "png";
      const path = `${user.id}/${inserted.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("feedback-images")
        .upload(path, image, { upsert: true, contentType: image.type });
      if (upErr) {
        console.error("Image upload failed:", upErr);
        toast.error("Feedback saved, but image upload failed.");
      } else {
        await supabase.from("feedback").update({ image_url: path }).eq("id", inserted.id);
      }
    }

    // Fire confirmation email (silent on failure)
    supabase.functions.invoke("send-feedback-email", { body: { feedback_id: inserted.id } })
      .catch((e) => console.error("Email invoke failed:", e));

    setSubmitting(false);
    toast.success("Feedback received. Thank you for shaping the build.");
    setMessage("");
    setCategory("General");
    clearImage();
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

            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="max-h-24 rounded-md border border-border/60"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Remove image"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
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
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium bg-background/40 text-muted-foreground border border-border/60 hover:text-foreground hover:border-primary/40 transition-colors"
                title="Attach screenshot (optional)"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {image ? "Change" : "Attach"}
              </button>

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
