import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/logo-new.jpeg";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  // Phase 0: Logo fades in
  // Phase 1: Text reveals
  // Phase 2: Text fully shown, wait
  // Phase 3: Lines extend from arrows to corners + zoom in
  // Phase 4: Exit

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {phase < 4 && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >

          {/* Logo + zoom container */}
          <motion.div
            className="absolute flex flex-col items-center"
            animate={
              phase >= 3
                ? { scale: 15, opacity: 0 }
                : { scale: 1, opacity: 1 }
            }
            transition={
              phase >= 3
                ? { duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }
                : { duration: 0.8 }
            }
            onAnimationComplete={() => {
              if (phase === 3) setPhase(4);
            }}
          >
            <motion.img
              src={splashLogo}
              alt="Trade Tracker Logo"
              className="w-24 h-24 object-contain"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              onAnimationComplete={() => {
                if (phase === 0) setPhase(1);
              }}
            />
          </motion.div>

          {/* Text */}
          {phase >= 1 && phase < 3 && (
            <div className="absolute flex gap-3 mt-36 text-2xl font-bold tracking-tight">
              <motion.span
                className="text-foreground"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
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
