import { RANK_TIERS } from "./types";

export function getXPMultiplier(streak: number): number {
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

export function calculateDailyXP(streak: number): number {
  const baseXP = 10;
  const multiplier = getXPMultiplier(streak);
  return Math.round(baseXP * multiplier);
}

export function getRank(totalXP: number) {
  let rank = RANK_TIERS[0];
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (totalXP >= RANK_TIERS[i].threshold) {
      rank = RANK_TIERS[i];
      break;
    }
  }
  return rank;
}

export function getRankProgress(totalXP: number) {
  const currentRank = getRank(totalXP);
  const currentIndex = RANK_TIERS.findIndex((r) => r.name === currentRank.name);
  const nextRank = RANK_TIERS[currentIndex + 1];

  if (!nextRank) {
    return { current: currentRank, next: null, progress: 100, xpNeeded: 0 };
  }

  const xpInCurrentTier = totalXP - currentRank.threshold;
  const xpNeededForNextTier = nextRank.threshold - currentRank.threshold;
  const progress = Math.round((xpInCurrentTier / xpNeededForNextTier) * 100);

  return {
    current: currentRank,
    next: nextRank,
    progress: Math.min(progress, 100),
    xpNeeded: Math.max(0, nextRank.threshold - totalXP),
  };
}
