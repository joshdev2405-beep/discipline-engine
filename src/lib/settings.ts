import { create } from "zustand";

export interface AppSettings {
  monthlyTradeTarget: number;
  dailyCap: number;
  pointsRecording: number;
  pointsFollowingRules: number;
  pointsJournaling: number;
  pointDecayTrade1: number;
  pointDecayTrade2: number;
  pointDecayTrade3: number;
  monthlyPhotoQuota: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  monthlyTradeTarget: 40,
  dailyCap: 3,
  pointsRecording: 1,
  pointsFollowingRules: 2,
  pointsJournaling: 1,
  pointDecayTrade1: 1.0,
  pointDecayTrade2: 0.8,
  pointDecayTrade3: 0.5,
  monthlyPhotoQuota: 20,
};

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem("trade-tracker-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
};

export const useSettings = create<SettingsStore>((set) => ({
  settings: loadSettings(),
  updateSettings: (partial) =>
    set((state) => {
      const next = { ...state.settings, ...partial };
      localStorage.setItem("trade-tracker-settings", JSON.stringify(next));
      return { settings: next };
    }),
  resetSettings: () =>
    set(() => {
      localStorage.removeItem("trade-tracker-settings");
      return { settings: DEFAULT_SETTINGS };
    }),
}));

export function computeDisciplineScore(
  trade: { followed_rules: boolean; intent_notes: string | null; before_screenshot_url: string | null; after_screenshot_url: string | null; trade_number: 1 | 2 | 3 },
  settings: AppSettings
): number {
  let points = 0;
  const maxPoints = settings.pointsRecording + settings.pointsFollowingRules + settings.pointsJournaling;

  // Recording points
  points += settings.pointsRecording;

  // Following rules
  if (trade.followed_rules) points += settings.pointsFollowingRules;

  // Journaling (has notes)
  if (trade.intent_notes && trade.intent_notes.trim().length > 0) points += settings.pointsJournaling;

  // Apply trade number decay
  const decayMap: Record<number, number> = {
    1: settings.pointDecayTrade1,
    2: settings.pointDecayTrade2,
    3: settings.pointDecayTrade3,
  };
  const decay = decayMap[trade.trade_number] ?? 1;

  return Math.round(((points * decay) / maxPoints) * 5 * 10) / 10; // 0-5 scale
}

export function computeRuleStreak(trades: Array<{ followed_rules: boolean; date: string }>): number {
  const sorted = [...trades]
    .filter((t) => t.followed_rules !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const t of sorted) {
    if (t.followed_rules) streak++;
    else break;
  }
  return streak;
}
