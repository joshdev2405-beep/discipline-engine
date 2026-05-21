import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, ExternalLink, X } from "lucide-react";

interface MobileAppModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileAppModal({ open, onClose }: MobileAppModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-card-elevated w-full max-w-sm mx-4 relative overflow-hidden"
          >
            {/* subtle sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Smartphone className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Install the Discipline Engine mobile app
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Take your discipline anywhere.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <a
                  href="https://discipline-engine-mobile.lovable.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Mobile App
                </a>

                <div className="glass-card !p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    How to install
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Open the link on your phone, then tap{" "}
                    <span className="text-foreground font-medium">Share → Add to Home Screen</span>{" "}
                    on iPhone, or{" "}
                    <span className="text-foreground font-medium">Install App</span>{" "}
                    on Android.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
