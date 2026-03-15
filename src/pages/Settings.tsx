import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, RotateCcw, Target, Camera, Plus, Trash2, BookOpen } from "lucide-react";
import { useSettings, MANDATORY_FIELD_LABELS, type MandatoryField, type TradeRowMetric } from "@/lib/settings";
import { toast } from "sonner";

export default function Settings() {
  const { settings, updateSettings, setDailyCap, updateTradeRow, updateMetric, addMetric, removeMetric, toggleMandatoryField, resetSettings } = useSettings();

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

      {/* Trade Targets */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-accent" />
          <span className="stat-label text-accent">Trade Targets</span>
        </div>
        <div className="flex items-center gap-8">
          <SettingField label="Monthly Target" value={settings.monthlyTradeTarget} onChange={(v) => updateSettings({ monthlyTradeTarget: v })} min={1} max={200} />
          <SettingField label="Daily Cap" value={settings.dailyCap} onChange={(v) => setDailyCap(v)} min={1} max={10} hint="Syncs point matrix rows" />
          <SettingField label="Photo Quota" value={settings.monthlyPhotoQuota} onChange={(v) => updateSettings({ monthlyPhotoQuota: v })} min={0} max={100} />
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
          {(Object.keys(MANDATORY_FIELD_LABELS) as MandatoryField[]).map((field) => {
            const active = settings.mandatoryFields.includes(field);
            return (
              <button
                key={field}
                onClick={() => toggleMandatoryField(field)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {MANDATORY_FIELD_LABELS[field]}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function SettingField({ label, value, onChange, min = 0, max = 100, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; hint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function TradeRowEditor({ row, onUpdateDecay, onUpdateMetric, onAddMetric, onRemoveMetric }: {
  row: { tradeNumber: number; metrics: TradeRowMetric[]; decayMultiplier: number };
  onUpdateDecay: (d: number) => void;
  onUpdateMetric: (metricId: string, updates: Partial<TradeRowMetric>) => void;
  onAddMetric: (m: TradeRowMetric) => void;
  onRemoveMetric: (id: string) => void;
}) {
  const [newMetricName, setNewMetricName] = useState("");

  const handleAdd = () => {
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
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={row.decayMultiplier}
            onChange={(e) => onUpdateDecay(Number(e.target.value))}
            className="w-16 bg-muted border border-border rounded-lg px-2 py-1 text-xs text-foreground text-center focus:outline-none focus:border-primary"
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
              type="number"
              min={0}
              max={10}
              value={metric.points}
              onChange={(e) => onUpdateMetric(metric.id, { points: Number(e.target.value) })}
              className="w-14 bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs text-foreground text-center focus:outline-none focus:border-primary"
            />
            <span className="text-[10px] text-muted-foreground">pts</span>
            <button
              onClick={() => onRemoveMetric(metric.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          value={newMetricName}
          onChange={(e) => setNewMetricName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add metric..."
          className="flex-1 bg-muted/20 border border-dashed border-border/50 rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
        />
        <button onClick={handleAdd} className="p-1 text-muted-foreground hover:text-primary transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
