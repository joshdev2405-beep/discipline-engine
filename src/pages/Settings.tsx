import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, RotateCcw, Target, Plus, Trash2, BookOpen, ListChecks, Calendar, History, Database, Loader2, Info, Save, X } from "lucide-react";
import { useSettings, MANDATORY_FIELD_LABELS, type MandatoryField, type TradeRowMetric, type TradeRowConfig, getTradingDaysInMonth } from "@/lib/settings";
import { useConditions, type Condition } from "@/lib/conditions";
import { useAuth } from "@/components/AuthProvider";
import { useOperatorMode } from "@/lib/operator-mode";
import { injectMockTrades } from "@/lib/mock-data";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { settings, updateSettings, setDailyCap, updateTradeRow, updateMetric, addMetric, removeMetric, toggleMandatoryField, resetSettings, syncTargets } = useSettings();
  const { conditions } = useConditions();
  const { user } = useAuth();
  const { operatorMode } = useOperatorMode(user?.id);
  const queryClient = useQueryClient();
  const [injecting, setInjecting] = useState(false);
  // Last-saved snapshot from profiles.config_settings — used as the baseline for Targets & Point Allocation widgets.
  const [savedTargets, setSavedTargets] = useState<TargetsDraft | null>(null);
  const [savedTradeRows, setSavedTradeRows] = useState<TradeRowConfig[] | null>(null);

  // Hydrate from profiles.config_settings on mount + subscribe to realtime changes.
  useEffect(() => {
    if (!user) return;
    const sb = supabase as any;
    let active = true;

    const applyConfig = (config: any) => {
      if (!config || typeof config !== "object") return;
      if (config.targets) {
        const t = config.targets as TargetsDraft;
        setSavedTargets(t);
        updateSettings({
          monthlyTradeTarget: t.monthlyTradeTarget,
          monthlyPhotoQuota: t.monthlyPhotoQuota,
          monthlyPointTarget: t.monthlyPointTarget,
          dailyPointAvg: t.dailyPointAvg,
          excludeWeekends: t.excludeWeekends,
        });
        // setDailyCap also resizes tradeRows, so apply before tradeRows hydration below.
        if (typeof t.dailyCap === "number") setDailyCap(t.dailyCap);
      }
      if (Array.isArray(config.tradeRows)) {
        setSavedTradeRows(config.tradeRows);
        updateSettings({ tradeRows: config.tradeRows });
      }
    };

    (async () => {
      const { data } = await sb.from("profiles").select("config_settings").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      applyConfig(data?.config_settings);
    })();

    const channel = sb
      .channel(`profile-config-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          applyConfig(payload.new?.config_settings);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const persistConfig = useCallback(
    async (patch: { targets?: TargetsDraft; tradeRows?: TradeRowConfig[] }) => {
      if (!user) throw new Error("Not authenticated");
      const sb = supabase as any;
      const { data: current } = await sb
        .from("profiles")
        .select("config_settings")
        .eq("user_id", user.id)
        .maybeSingle();
      const next = { ...(current?.config_settings ?? {}), ...patch };
      const { error } = await sb.from("profiles").update({ config_settings: next, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      if (error) throw error;
      return next;
    },
    [user?.id],
  );

  // Mock data inputs
  const [mockStartDate, setMockStartDate] = useState<Date | undefined>(undefined);
  const [mockEndDate, setMockEndDate] = useState<Date | undefined>(undefined);
  const [mockTradeCount, setMockTradeCount] = useState(30);
  const [mockWinRate, setMockWinRate] = useState(80);

  const allMandatoryOptions: { key: string; label: string }[] = [
    ...(Object.keys(MANDATORY_FIELD_LABELS) as MandatoryField[]).map((f) => ({ key: f, label: MANDATORY_FIELD_LABELS[f] })),
    ...conditions.map((c) => ({ key: `condition_${c.id}`, label: c.name })),
  ];

  const handleRetrospectiveToggle = (checked: boolean) => {
    updateSettings({ retrospectiveRules: checked });
    toast.success(checked ? "Historical data will be recalculated on point changes" : "Changes apply to future trades only");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Rule Configuration</h1>
            <p className="text-xs text-muted-foreground">Customize your discipline engine parameters</p>
          </div>
        </div>
        <button onClick={resetSettings} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-secondary/50 transition-colors">
          <RotateCcw className="h-3 w-3" />
          Reset Defaults
        </button>
      </motion.div>

      <TargetsWidget
        savedTargets={savedTargets ?? {
          monthlyTradeTarget: settings.monthlyTradeTarget,
          monthlyPhotoQuota: settings.monthlyPhotoQuota,
          monthlyPointTarget: settings.monthlyPointTarget,
          dailyPointAvg: settings.dailyPointAvg,
          dailyCap: settings.dailyCap,
          excludeWeekends: settings.excludeWeekends,
        }}
        onSave={async (draft) => {
          await persistConfig({ targets: draft });
          updateSettings({
            monthlyTradeTarget: draft.monthlyTradeTarget,
            monthlyPhotoQuota: draft.monthlyPhotoQuota,
            monthlyPointTarget: draft.monthlyPointTarget,
            dailyPointAvg: draft.dailyPointAvg,
            excludeWeekends: draft.excludeWeekends,
          });
          setDailyCap(draft.dailyCap);
          setSavedTargets(draft);
        }}
      />

      {/* Retrospective Rules Toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-accent" />
            <div>
              <span className="stat-label text-accent">Retrospective Rules</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">When ON, point allocation changes recalculate all historical Discipline Scores</p>
            </div>
          </div>
          <Switch checked={settings.retrospectiveRules} onCheckedChange={handleRetrospectiveToggle} />
        </div>
      </motion.div>

      <PointAllocationGridWidget
        savedRows={savedTradeRows ?? settings.tradeRows}
        dailyCap={settings.dailyCap}
        conditions={conditions}
        onSave={async (rows) => {
          await persistConfig({ tradeRows: rows });
          updateSettings({ tradeRows: rows });
          setSavedTradeRows(rows);
        }}
      />

      {/* Mandatory Journal Fields */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-accent" />
          <span className="stat-label text-accent">Mandatory Journal Fields</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Fields marked as mandatory will show an amber asterisk and prevent submission if empty.
        </p>
        <div className="flex flex-wrap gap-2">
          {allMandatoryOptions.map(({ key, label }) => {
            const active = settings.mandatoryFields.includes(key as any);
            return (
              <button
                key={key}
                onClick={() => toggleMandatoryField(key as MandatoryField)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Mock Data Injection (Operator Mode Only) */}
      {operatorMode && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-elevated border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-amber-500" />
            <span className="stat-label text-amber-500">Mock Data Injection</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-4">Generate mock trades with completed journal entries and discipline points.</p>

          <div className="flex items-end gap-3 flex-wrap mb-4">
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground text-left">
                    {mockStartDate ? format(mockStartDate, "yyyy-MM-dd") : "Pick date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={mockStartDate} onSelect={setMockStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground text-left">
                    {mockEndDate ? format(mockEndDate, "yyyy-MM-dd") : "Pick date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={mockEndDate} onSelect={setMockEndDate} />
                </PopoverContent>
              </Popover>
            </div>
            <InlineField label="Trade Count" value={mockTradeCount} onChange={setMockTradeCount} min={1} max={200} />
            <InlineField label="Win Rate %" value={mockWinRate} onChange={setMockWinRate} min={0} max={100} />
          </div>

          <button
            onClick={async () => {
              if (!user) return;
              if (!mockStartDate || !mockEndDate) {
                toast.error("Select both start and end dates");
                return;
              }
              setInjecting(true);
              const result = await injectMockTrades(user.id, {
                startDate: mockStartDate,
                endDate: mockEndDate,
                tradeCount: mockTradeCount,
                winRate: mockWinRate,
                excludeWeekends: settings.excludeWeekends,
              });
              setInjecting(false);
              if (result.error) {
                toast.error("Injection failed", { description: result.error });
              } else {
                toast.success(`Injected ${result.inserted} mock trades`);
                queryClient.invalidateQueries({ queryKey: ["trades"] });
              }
            }}
            disabled={injecting}
            className="px-4 py-2 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {injecting && <Loader2 className="h-3 w-3 animate-spin" />}
            Generate & Inject
          </button>
        </motion.div>
      )}
    </div>
  );
}

function InlineField({ label, value, onChange, min = 0, max = 100, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex-1 min-w-0">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

function TradeRowEditor({ row, conditions, onUpdateDecay, onUpdateMetric, onAddMetric, onRemoveMetric }: {
  row: { tradeNumber: number; metrics: TradeRowMetric[]; decayMultiplier: number };
  conditions: Condition[];
  onUpdateDecay: (d: number) => void;
  onUpdateMetric: (metricId: string, updates: Partial<TradeRowMetric>) => void;
  onAddMetric: (m: TradeRowMetric) => void;
  onRemoveMetric: (id: string) => void;
}) {
  const [showWheel, setShowWheel] = useState(false);
  const [newMetricName, setNewMetricName] = useState("");

  const existingIds = row.metrics.map((m) => m.id);
  const builtInFields = [
    { id: "recording", name: "Recording" },
    { id: "rules", name: "Rule Following" },
    { id: "journaling", name: "Journaling" },
    { id: "before_photo", name: "Before Screenshot" },
    { id: "after_photo", name: "After Screenshot" },
  ];
  const conditionFields = conditions.map((c) => ({ id: `cond_${c.id}`, name: c.name }));
  const allFields = [...builtInFields, ...conditionFields].filter((f) => !existingIds.includes(f.id));

  const handleAddFromWheel = (field: { id: string; name: string }) => {
    onAddMetric({ id: field.id, name: field.name, points: 1 });
    toast.success(`Linked "${field.name}" to Trade #${row.tradeNumber}`);
    setShowWheel(false);
  };

  const handleAddCustom = () => {
    if (!newMetricName.trim()) return;
    const id = newMetricName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    onAddMetric({ id, name: newMetricName.trim(), points: 1 });
    setNewMetricName("");
    toast.success(`Added "${newMetricName.trim()}" metric`);
  };

  return (
    <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Trade #{row.tradeNumber}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Decay</span>
          <input
            type="number" min={0} max={2} step={0.1}
            value={row.decayMultiplier}
            onChange={(e) => onUpdateDecay(Number(e.target.value))}
            className="w-16 bg-muted border border-border rounded-lg px-2 py-1 text-xs text-foreground text-center focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        {row.metrics.map((metric) => (
          <div key={metric.id} className="flex items-center gap-2">
            <input
              value={metric.name}
              onChange={(e) => onUpdateMetric(metric.id, { name: e.target.value })}
              className="flex-1 bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="number" min={0} max={10}
              value={metric.points}
              onChange={(e) => onUpdateMetric(metric.id, { points: Number(e.target.value) })}
              className="w-14 bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs text-foreground text-center focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-muted-foreground">pts</span>
            <button onClick={() => onRemoveMetric(metric.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setShowWheel(!showWheel)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <ListChecks className="h-3 w-3" />
          Link Field
        </button>
        <div className="flex-1 flex items-center gap-2">
          <input
            value={newMetricName}
            onChange={(e) => setNewMetricName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            placeholder="Custom metric..."
            className="flex-1 bg-muted/20 border border-dashed border-border/50 rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
          <button onClick={handleAddCustom} className="p-1 text-muted-foreground hover:text-primary transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showWheel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm divide-y divide-border/20">
              {allFields.length === 0 ? (
                <p className="px-3 py-2 text-[10px] text-muted-foreground">All fields already linked</p>
              ) : (
                allFields.map((field) => (
                  <button
                    key={field.id}
                    onClick={() => handleAddFromWheel(field)}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {field.name}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Targets widget (with draft state + Save/Cancel + Supabase persistence)
// ============================================================================

type TargetsDraft = {
  monthlyTradeTarget: number;
  monthlyPhotoQuota: number;
  monthlyPointTarget: number;
  dailyPointAvg: number;
  dailyCap: number;
  excludeWeekends: boolean;
};

function targetsEqual(a: TargetsDraft, b: TargetsDraft) {
  return (
    a.monthlyTradeTarget === b.monthlyTradeTarget &&
    a.monthlyPhotoQuota === b.monthlyPhotoQuota &&
    a.monthlyPointTarget === b.monthlyPointTarget &&
    a.dailyPointAvg === b.dailyPointAvg &&
    a.dailyCap === b.dailyCap &&
    a.excludeWeekends === b.excludeWeekends
  );
}

function TargetsWidget({
  savedTargets,
  onSave,
}: {
  savedTargets: TargetsDraft;
  onSave: (draft: TargetsDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TargetsDraft>(savedTargets);
  const [saving, setSaving] = useState(false);

  // Re-sync draft whenever the saved baseline changes (load / realtime / after save).
  useEffect(() => {
    setDraft(savedTargets);
  }, [savedTargets]);

  const dirty = !targetsEqual(draft, savedTargets);
  const tradingDays = getTradingDaysInMonth(draft.excludeWeekends);

  const patch = (p: Partial<TargetsDraft>) => setDraft((d) => ({ ...d, ...p }));

  const syncFromDaily = (daily: number) => {
    const monthly = Math.round(daily * tradingDays * 10) / 10;
    patch({ dailyPointAvg: daily, monthlyPointTarget: monthly });
  };
  const syncFromMonthly = (monthly: number) => {
    const daily = Math.round((monthly / tradingDays) * 10) / 10;
    patch({ monthlyPointTarget: monthly, dailyPointAvg: daily });
  };
  const handleWeekendToggle = (checked: boolean) => {
    const newDays = getTradingDaysInMonth(checked);
    patch({
      excludeWeekends: checked,
      dailyPointAvg: Math.round((draft.monthlyPointTarget / newDays) * 10) / 10,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      toast.success("Targets saved");
    } catch (e: any) {
      toast.error("Failed to save targets", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card-elevated">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <span className="stat-label text-accent">Targets</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Excl. Weekends</span>
            <Switch checked={draft.excludeWeekends} onCheckedChange={handleWeekendToggle} className="scale-75" />
          </div>
          <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">{tradingDays} trading days</span>
        </div>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <InlineField label="Daily Avg Points" value={draft.dailyPointAvg} onChange={syncFromDaily} min={0.5} max={50} step={0.5} />
        <InlineField label="Monthly Points Target" value={draft.monthlyPointTarget} onChange={syncFromMonthly} min={1} max={500} />
        <InlineField label="Monthly Trade Target" value={draft.monthlyTradeTarget} onChange={(v) => patch({ monthlyTradeTarget: v })} min={1} max={200} />
        <InlineField label="Photo Quota" value={draft.monthlyPhotoQuota} onChange={(v) => patch({ monthlyPhotoQuota: v })} min={0} max={100} />
        <InlineField label="Daily Cap" value={draft.dailyCap} onChange={(v) => patch({ dailyCap: v })} min={1} max={10} />
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/30"
          >
            <button
              onClick={() => setDraft(savedTargets)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Point Allocation Grid widget (with draft state + Save/Cancel)
// ============================================================================

function PointAllocationGridWidget({
  savedRows,
  dailyCap,
  conditions,
  onSave,
}: {
  savedRows: TradeRowConfig[];
  dailyCap: number;
  conditions: Condition[];
  onSave: (rows: TradeRowConfig[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TradeRowConfig[]>(savedRows);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(savedRows);
  }, [savedRows]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedRows), [draft, savedRows]);

  const updateRow = (tradeNumber: number, updates: Partial<TradeRowConfig>) => {
    setDraft((rows) => rows.map((r) => (r.tradeNumber === tradeNumber ? { ...r, ...updates } : r)));
  };
  const updateRowMetric = (tradeNumber: number, metricId: string, updates: Partial<TradeRowMetric>) => {
    setDraft((rows) =>
      rows.map((r) =>
        r.tradeNumber === tradeNumber
          ? { ...r, metrics: r.metrics.map((m) => (m.id === metricId ? { ...m, ...updates } : m)) }
          : r,
      ),
    );
  };
  const addRowMetric = (tradeNumber: number, metric: TradeRowMetric) => {
    setDraft((rows) =>
      rows.map((r) => (r.tradeNumber === tradeNumber ? { ...r, metrics: [...r.metrics, metric] } : r)),
    );
  };
  const removeRowMetric = (tradeNumber: number, metricId: string) => {
    setDraft((rows) =>
      rows.map((r) =>
        r.tradeNumber === tradeNumber ? { ...r, metrics: r.metrics.filter((m) => m.id !== metricId) } : r,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      toast.success("Point allocation saved");
    } catch (e: any) {
      toast.error("Failed to save", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-elevated">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="stat-label text-primary">Point Allocation Grid</span>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-lg bg-popover border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Each trade's points are multiplied by its decay factor before contributing to your daily discipline score. For example, Trade #2 with a 0.8× decay contributes only 80% of its raw points.
              </p>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
            </div>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{dailyCap} trade rows</span>
      </div>

      <div className="space-y-4">
        {draft.map((row) => (
          <TradeRowEditor
            key={row.tradeNumber}
            row={row}
            conditions={conditions}
            onUpdateDecay={(d) => updateRow(row.tradeNumber, { decayMultiplier: d })}
            onUpdateMetric={(metricId, updates) => updateRowMetric(row.tradeNumber, metricId, updates)}
            onAddMetric={(m) => addRowMetric(row.tradeNumber, m)}
            onRemoveMetric={(id) => removeRowMetric(row.tradeNumber, id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/30"
          >
            <button
              onClick={() => setDraft(savedRows)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
