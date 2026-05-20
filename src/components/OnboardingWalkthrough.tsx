import { useEffect, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Step = {
  selector: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    selector: '[data-onboarding="discipline"]',
    title: "Dashboard",
    body: "Your discipline score ring tracks how consistently you follow your process — not your P&L.",
  },
  {
    selector: '[data-onboarding="nav-journal"]',
    title: "Journal",
    body: "Log every trade here. Following your rules earns XP and builds your operator rank.",
  },
  {
    selector: '[data-onboarding="nav-settings"]',
    title: "Config",
    body: "Configure your point system, rules, and how discipline is scored.",
  },
  {
    selector: '[data-onboarding="nav-vault"]',
    title: "The Vault",
    body: "Attach before/after screenshots to each trade for a visual audit trail.",
  },
];

const PADDING = 8;

export default function OnboardingWalkthrough() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Trigger when profile loaded & not completed
  useEffect(() => {
    if (!profile) return;
    if ((profile as any).has_completed_onboarding === false) {
      setStepIdx(0);
      setActive(true);
    }
  }, [profile?.id, (profile as any)?.has_completed_onboarding]);

  // Listen for replay event
  useEffect(() => {
    const handler = () => {
      setStepIdx(0);
      setActive(true);
    };
    window.addEventListener("replay-onboarding", handler);
    return () => window.removeEventListener("replay-onboarding", handler);
  }, []);

  const step = STEPS[stepIdx];

  useLayoutEffect(() => {
    if (!active || !step) return;
    const update = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    update();
    const id = window.setInterval(update, 250);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, stepIdx, step?.selector]);

  const complete = async () => {
    setActive(false);
    if (!user) return;
    const sb = supabase as any;
    await sb.from("profiles").update({ has_completed_onboarding: true, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const next = () => {
    if (stepIdx >= STEPS.length - 1) {
      complete();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  if (!active || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = rect ?? new DOMRect(vw / 2 - 100, vh / 2 - 50, 200, 100);
  const top = Math.max(0, r.top - PADDING);
  const left = Math.max(0, r.left - PADDING);
  const width = r.width + PADDING * 2;
  const height = r.height + PADDING * 2;

  // Tooltip placement
  const tooltipWidth = 320;
  const placeBelow = r.bottom + 16 + 160 < vh;
  const tooltipTop = placeBelow ? r.bottom + 16 : Math.max(16, r.top - 180);
  const tooltipLeft = Math.min(Math.max(8, r.left), vw - tooltipWidth - 8);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={stepIdx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-auto"
      >
        {/* Dim overlay using box-shadow cut-out */}
        <div
          onClick={complete}
          className="absolute rounded-xl transition-all duration-300"
          style={{
            top,
            left,
            width,
            height,
            boxShadow: "0 0 0 9999px hsl(0 0% 0% / 0.75), 0 0 0 2px hsl(var(--primary) / 0.7), 0 0 24px 4px hsl(var(--primary) / 0.35)",
          }}
        />
        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute glass-card-elevated rounded-xl p-4 shadow-2xl"
          style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
              Step {stepIdx + 1} / {STEPS.length}
            </span>
            <button onClick={complete} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">{step.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.body}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-4 rounded-full transition-colors ${i === stepIdx ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="px-3 py-1.5 text-[11px] font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              {stepIdx >= STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}