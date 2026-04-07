import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, RotateCcw, Target, Plus, Trash2, BookOpen, ListChecks, Calendar, History, Database, Loader2 } from "lucide-react";
import { useSettings, MANDATORY_FIELD_LABELS, type MandatoryField, type TradeRowMetric, getTradingDaysInMonth } from "@/lib/settings";
import { useConditions, type Condition } from "@/lib/conditions";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/operator-mode";
import { useOperatorMode } from "@/lib/operator-mode";
import { injectMockTrades } from "@/lib/mock-data";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function Settings() {
  const { settings, updateSettings, setDailyCap, updateTradeRow, updateMetric, addMetric, removeMetric, toggleMandatoryField, resetSettings, syncTargets } = useSettings();
  const { conditions } = useConditions();
  const { user } = useAuth();
  const { operatorMode } = useOperatorMode(user?.email);
  const queryClient = useQueryClient();
  const [injecting, setInjecting] = useState(false);

  // Mock data inputs
  const [mockStartDate, setMockStartDate] = useState<Date | undefined>(undefined);
  const [mockEndDate, setMockEndDate] = useState<Date | undefined>(undefined);
  const [mockTradeCount, setMockTradeCount] = useState(30);
  const [mockWinRate, setMockWinRate] = useState(80);

  const allMandatoryOptions: { key: string; label: string }[] = [
    ...(Object.keys(MANDATORY_FIELD_LABELS) as MandatoryField[]).map((f) => ({ key: f, label: MANDATORY_FIELD_LABELS[f] })),
    ...conditions.map((c) => ({ key: `condition_${c.id}`, label: c.name })),
  ];

  const tradingDays = getTradingDaysInMonth(settings.excludeWeekends);

  const handleWeekendToggle = (checked: boolean) => {
    updateSettings({ excludeWeekends: checked });
    const newDays = getTradingDaysInMonth(checked);
    // Re-sync: keep monthly target, recalculate daily
    updateSettings({ dailyPointAvg: Math.round((settings.monthlyPointTarget / newDays) * 10) / 10 });
    toast.success("Weekend setting updated", { description: `${newDays} trading days this month` });
  };

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

      {/* Trade Targets — Two-Way Linked */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card-elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            <span className="stat-label text-accent">Targets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Excl. Weekends</span>
            <Switch checked={settings.excludeWeekends} onCheckedChange={handleWeekendToggle} className="scale-75" />
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <InlineField
            label="Daily Avg Points"
            value={settings.dailyPointAvg}
            onChange={(v) => syncTargets("daily", v)}
            min={0.5}
            max={50}
            step={0.5}
          />
          <InlineField
            label="Monthly Points Target"
            value={settings.monthlyPointTarget}
            onChange={(v) => syncTargets("monthly", v)}
            min={1}
            max={500}
          />
          <div className="flex-shrink-0 pb-1">
            <span className="text-[10px] text-muted-foreground">{tradingDays} trading days</span>
          </div>
          <InlineField label="Monthly Trade Target" value={settings.monthlyTradeTarget} onChange={(v) => updateSettings({ monthlyTradeTarget: v })} min={1} max={200} />
          <InlineField label="Photo Quota" value={settings.monthlyPhotoQuota} onChange={(v) => updateSettings({ monthlyPhotoQuota: v })} min={0} max={100} />
          <InlineField label="Daily Cap" value={settings.dailyCap} onChange={(v) => setDailyCap(v)} min={1} max={10} />
        </div>
      </motion.div>

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

      {/* Dynamic Point Allocation Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="stat-label text-primary">Point Allocation Grid</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{settings.dailyCap} trade rows</span>
        </div>

        <div className="space-y-4">
          {settings.tradeRows.map((row) => (
            <TradeRowEditor
              key={row.tradeNumber}
              row={row}
              conditions={conditions}
              onUpdateDecay={(d) => updateTradeRow(row.tradeNumber, { decayMultiplier: d })}
              onUpdateMetric={(metricId, updates) => updateMetric(row.tradeNumber, metricId, updates)}
              onAddMetric={(m) => addMetric(row.tradeNumber, m)}
              onRemoveMetric={(id) => removeMetric(row.tradeNumber, id)}
            />
          ))}
        </div>
      </motion.div>

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
