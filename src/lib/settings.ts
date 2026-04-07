import { create } from "zustand";

export interface TradeRowMetric {
  id: string;
  name: string;
  points: number;
}

export interface TradeRowConfig {
  tradeNumber: number;
  metrics: TradeRowMetric[];
  decayMultiplier: number;
}

export type MandatoryField = "mood" | "rules" | "notes" | "before_photo" | "after_photo" | "tags";

export const MANDATORY_FIELD_LABELS: Record<MandatoryField, string> = {
  mood: "Mood Score",
  rules: "Rule Check",
  notes: "Intent / Notes",
  before_photo: "Before Screenshot",
  after_photo: "After Screenshot",
  tags: "Tags",
};

export interface AppSettings {
  monthlyTradeTarget: number;
  dailyCap: number;
  monthlyPhotoQuota: number;
  tradeRows: TradeRowConfig[];
  mandatoryFields: MandatoryField[];
  monthlyPointTarget: number;
  dailyPointAvg: number;
  excludeWeekends: boolean;
  retrospectiveRules: boolean;
  xpDailyCap: number; // max trades that award XP per day
}

const DEFAULT_METRICS: TradeRowMetric[] = [
  { id: "recording", name: "Recording", points: 1 },
  { id: "rules", name: "Rule Following", points: 2 },
  { id: "journaling", name: "Journaling", points: 1 },
];

function buildDefaultTradeRows(cap: number): TradeRowConfig[] {
  const decays = [1.0, 0.8, 0.5, 0.3, 0.2];
  return Array.from({ length: cap }, (_, i) => ({
    tradeNumber: i + 1,
    metrics: DEFAULT_METRICS.map((m) => ({ ...m })),
    decayMultiplier: decays[i] ?? 0.1,
  }));
}

/** Get trading days in the current month */
export function getTradingDaysInMonth(excludeWeekends: boolean): number {
  if (!excludeWeekends) return 30; // approx
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let weekdays = 0;
  for (let d = 1; d <= lastDay; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) weekdays++;
  }
  return weekdays;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const DEFAULT_SETTINGS: AppSettings = {
  monthlyTradeTarget: 40,
  dailyCap: 3,
  monthlyPhotoQuota: 20,
  tradeRows: buildDefaultTradeRows(3),
  mandatoryFields: ["mood", "rules", "notes"],
  monthlyPointTarget: 90,
  dailyPointAvg: 3,
  excludeWeekends: true,
  retrospectiveRules: false,
  xpDailyCap: 2,
};

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setDailyCap: (cap: number) => void;
  updateTradeRow: (tradeNumber: number, row: Partial<TradeRowConfig>) => void;
  updateMetric: (tradeNumber: number, metricId: string, updates: Partial<TradeRowMetric>) => void;
  addMetric: (tradeNumber: number, metric: TradeRowMetric) => void;
  removeMetric: (tradeNumber: number, metricId: string) => void;
  toggleMandatoryField: (field: MandatoryField) => void;
  resetSettings: () => void;
  syncTargets: (changed: "daily" | "monthly", value: number) => void;
}

const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem("trade-tracker-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

const persist = (settings: AppSettings) => {
  localStorage.setItem("trade-tracker-settings", JSON.stringify(settings));
};

export const useSettings = create<SettingsStore>((set) => ({
  settings: loadSettings(),
  updateSettings: (partial) =>
    set((state) => {
      const next = { ...state.settings, ...partial };
      persist(next);
      return { settings: next };
    }),
  syncTargets: (changed, value) =>
    set((state) => {
      const days = getTradingDaysInMonth(state.settings.excludeWeekends);
      let next: AppSettings;
      if (changed === "daily") {
        next = { ...state.settings, dailyPointAvg: value, monthlyPointTarget: Math.round(value * days) };
      } else {
        next = { ...state.settings, monthlyPointTarget: value, dailyPointAvg: Math.round((value / days) * 10) / 10 };
      }
      persist(next);
      return { settings: next };
    }),
  setDailyCap: (cap) =>
    set((state) => {
      const current = state.settings.tradeRows;
      let rows: TradeRowConfig[];
      if (cap > current.length) {
        const decays = [1.0, 0.8, 0.5, 0.3, 0.2];
        const templateMetrics = current[0]?.metrics ?? DEFAULT_METRICS;
        rows = [
          ...current,
          ...Array.from({ length: cap - current.length }, (_, i) => ({
            tradeNumber: current.length + i + 1,
            metrics: templateMetrics.map((m) => ({ ...m })),
            decayMultiplier: decays[current.length + i] ?? 0.1,
          })),
        ];
      } else {
        rows = current.slice(0, cap);
      }
      const next = { ...state.settings, dailyCap: cap, tradeRows: rows };
      persist(next);
      return { settings: next };
    }),
  updateTradeRow: (tradeNumber, updates) =>
    set((state) => {
      const rows = state.settings.tradeRows.map((r) =>
        r.tradeNumber === tradeNumber ? { ...r, ...updates } : r
      );
      const next = { ...state.settings, tradeRows: rows };
      persist(next);
      return { settings: next };
    }),
  updateMetric: (tradeNumber, metricId, updates) =>
    set((state) => {
      const rows = state.settings.tradeRows.map((r) =>
        r.tradeNumber === tradeNumber
          ? { ...r, metrics: r.metrics.map((m) => (m.id === metricId ? { ...m, ...updates } : m)) }
          : r
      );
      const next = { ...state.settings, tradeRows: rows };
      persist(next);
      return { settings: next };
    }),
  addMetric: (tradeNumber, metric) =>
    set((state) => {
      const rows = state.settings.tradeRows.map((r) =>
        r.tradeNumber === tradeNumber ? { ...r, metrics: [...r.metrics, metric] } : r
      );
      const next = { ...state.settings, tradeRows: rows };
      persist(next);
      return { settings: next };
    }),
  removeMetric: (tradeNumber, metricId) =>
    set((state) => {
      const rows = state.settings.tradeRows.map((r) =>
        r.tradeNumber === tradeNumber
          ? { ...r, metrics: r.metrics.filter((m) => m.id !== metricId) }
          : r
      );
      const next = { ...state.settings, tradeRows: rows };
      persist(next);
      return { settings: next };
    }),
  toggleMandatoryField: (field) =>
    set((state) => {
      const fields = state.settings.mandatoryFields.includes(field)
        ? state.settings.mandatoryFields.filter((f) => f !== field)
        : [...state.settings.mandatoryFields, field];
      const next = { ...state.settings, mandatoryFields: fields };
      persist(next);
      return { settings: next };
    }),
  resetSettings: () =>
    set(() => {
      localStorage.removeItem("trade-tracker-settings");
      return { settings: DEFAULT_SETTINGS };
    }),
}));

export function computeMaxPossiblePoints(settings: AppSettings): number {
  let maxPerDay = 0;
  for (const row of settings.tradeRows) {
    const rowMax = row.metrics.reduce((s, m) => s + m.points, 0);
    maxPerDay += rowMax * row.decayMultiplier;
  }
  // Scale to 0-5 like computeDisciplineScore does per trade, but sum across all rows
  return maxPerDay > 0 ? Math.round(maxPerDay * 10) / 10 : 0;
}

export function computeDisciplineScore(
  trade: { followed_rules: boolean; intent_notes: string | null; before_screenshot_url: string | null; after_screenshot_url: string | null; trade_number: number },
  settings: AppSettings
): number {
  const row = settings.tradeRows.find((r) => r.tradeNumber === trade.trade_number);
  if (!row) return 0;

  let points = 0;
  let maxPoints = 0;

  for (const metric of row.metrics) {
    maxPoints += metric.points;
    if (metric.id === "recording") {
      points += metric.points;
    } else if (metric.id === "rules") {
      if (trade.followed_rules) points += metric.points;
    } else if (metric.id === "journaling") {
      if (trade.intent_notes && trade.intent_notes.trim().length > 0) points += metric.points;
    } else {
      points += metric.points;
    }
  }

  if (maxPoints === 0) return 0;
  return Math.round(((points * row.decayMultiplier) / maxPoints) * 5 * 10) / 10;
}

export function computeRuleStreak(
  trades: Array<{ followed_rules: boolean; date: string }>,
  excludeWeekends?: boolean
): number {
  const sorted = [...trades]
    .filter((t) => t.followed_rules !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const t of sorted) {
    // Skip weekends if configured
    if (excludeWeekends) {
      const d = new Date(t.date);
      if (isWeekend(d)) continue;
    }
    if (t.followed_rules) streak++;
    else break;
  }
  return streak;
}
