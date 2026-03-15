import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/splash-logo.png";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {phase < 4 && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <motion.img
            src={splashLogo}
            alt="Trade Tracker Logo"
            className="absolute w-24 h-24 object-contain"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              phase < 3
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, y: -800, scale: 0.6 }
            }
            transition={
              phase < 3
                ? { duration: 0.8, ease: "easeOut" }
                : { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
            }
            onAnimationComplete={() => {
              if (phase === 0) setPhase(1);
              if (phase === 3) setPhase(4);
            }}
          />

          {/* Text */}
          {phase >= 1 && phase < 3 && (
            <div className="absolute flex gap-3 mt-36 text-2xl font-bold tracking-tight">
              <motion.span
                className="text-foreground"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
                onAnimationComplete={() => {
                  if (phase === 1) setPhase(2);
                }}
              >
                Track Progress
              </motion.span>
              <motion.span
                className="text-primary"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                onAnimationComplete={() => {
                  if (phase === 2) {
                    setTimeout(() => setPhase(3), 600);
                  }
                }}
              >
                Not Profit
              </motion.span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
