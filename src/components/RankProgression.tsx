import { motion } from "framer-motion";
import { Shield, Zap, Target, Crown, Gem } from "lucide-react";
import { useProfile, getRankInfo } from "@/hooks/use-profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ranks = [
  { name: "Novice Operator", icon: Shield, xpRequired: 0, tier: "novice" as const, description: "Every operator starts here. Log trades, build habits." },
  { name: "Advanced Tech", icon: Zap, xpRequired: 1000, tier: "advanced" as const, description: "Consistent execution. Your edge is sharpening." },
  { name: "Elite Executor", icon: Target, xpRequired: 5000, tier: "elite" as const, description: "Discipline is second nature. The market respects you." },
  { name: "Master Operative", icon: Crown, xpRequired: 15000, tier: "master" as const, description: "Obsidian-level control. You are the edge." },
  { name: "Legendary Architect", icon: Gem, xpRequired: 50000, tier: "legendary" as const, description: "Beyond mastery. You shape the game itself." },
];

function RankCard({ rank, index, isCurrentRank, isUnlocked, currentXP }: {
  rank: (typeof ranks)[0]; index: number; isCurrentRank: boolean; isUnlocked: boolean; currentXP: number;
}) {
  const Icon = rank.icon;
  const tierStyles: Record<string, string> = {
    novice: "border-border bg-card",
    advanced: "border-primary/20 bg-card/80 backdrop-blur-sm",
    elite: "border-primary/40 bg-card/90 backdrop-blur-md shadow-[0_0_24px_-8px_hsl(var(--emerald-glow)/0.2)]",
    master: "border-transparent bg-[hsl(222_22%_3%)] shadow-[0_0_32px_-8px_hsl(var(--emerald-glow)/0.3)] ai-shimmer",
    legendary: "border-transparent bg-[hsl(222_22%_2%)] shadow-[0_4px_40px_-8px_hsl(var(--amber)/0.25),0_0_32px_-8px_hsl(var(--emerald-glow)/0.2)] ai-shimmer",
  };
  const iconStyles: Record<string, string> = {
    novice: "text-muted-foreground",
    advanced: "text-primary/70",
    elite: "text-primary drop-shadow-[0_0_8px_hsl(var(--emerald-glow)/0.5)]",
    master: "text-primary drop-shadow-[0_0_12px_hsl(var(--emerald-glow)/0.6)]",
    legendary: "text-[hsl(var(--amber))] drop-shadow-[0_0_12px_hsl(var(--amber)/0.6)]",
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }} className="flex items-start gap-4">
      <div className="flex flex-col items-center pt-1">
        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${isCurrentRank ? "border-primary bg-primary shadow-[0_0_10px_hsl(var(--emerald-glow)/0.5)]" : isUnlocked ? "border-primary/50 bg-primary/30" : "border-border bg-muted"}`} />
        {index < ranks.length - 1 && <div className={`w-px flex-1 min-h-[3rem] ${isUnlocked ? "bg-primary/30" : "bg-border"}`} />}
      </div>
      <motion.div
        whileHover={rank.tier === "elite" || rank.tier === "master" || rank.tier === "legendary" ? { scale: 1.02 } : undefined}
        className={`flex-1 rounded-lg border p-4 mb-3 transition-all duration-300 ${tierStyles[rank.tier]} ${!isUnlocked ? "opacity-40" : ""} ${isCurrentRank ? "ring-1 ring-primary/30" : ""}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`h-5 w-5 shrink-0 ${iconStyles[rank.tier]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${rank.tier === "legendary" ? "text-[hsl(var(--amber))]" : rank.tier === "master" ? "text-primary" : "text-foreground"}`}>{rank.name}</span>
              {isCurrentRank && <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">Current</span>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{rank.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {rank.xpRequired === 0 ? "Starting Rank" : `${rank.xpRequired.toLocaleString()} XP Required`}
          </span>
          {isCurrentRank && (
            <span className="text-[10px] text-primary font-medium">{currentXP} / {ranks[index + 1]?.xpRequired ?? "∞"} XP</span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RankProgression({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { rankInfo } = useProfile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Rank Progression</DialogTitle>
          <DialogDescription className="text-muted-foreground">Earn XP through disciplined trading to unlock higher ranks.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {ranks.map((rank, i) => (
            <RankCard
              key={rank.tier}
              rank={rank}
              index={i}
              isCurrentRank={i === rankInfo.rankIndex}
              isUnlocked={i <= rankInfo.rankIndex}
              currentXP={rankInfo.xp}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
