import { motion } from "framer-motion";
import { Settings as SettingsIcon, RotateCcw, Target, Zap, Camera, TrendingDown } from "lucide-react";
import { useSettings } from "@/lib/settings";

function SettingField({ label, value, onChange, min = 0, max = 100, step = 1, icon: Icon, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; icon?: any; hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon className="h-4 w-4 text-primary/60 shrink-0" />}
        <div>
          <p className="text-sm font-mono text-foreground">{label}</p>
          {hint && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 accent-primary h-1"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 bg-muted border border-border rounded-lg px-2 py-1 text-sm font-mono text-foreground text-center focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Rule Configuration</h1>
            <p className="text-xs font-mono text-muted-foreground">Customize your discipline engine parameters</p>
          </div>
        </div>
        <button
          onClick={resetSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Defaults
        </button>
      </motion.div>

      {/* Trade Targets */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-accent" />
          <span className="stat-label text-accent">Trade Targets</span>
        </div>
        <SettingField label="Monthly Trade Target" value={settings.monthlyTradeTarget} onChange={(v) => updateSettings({ monthlyTradeTarget: v })} min={1} max={200} icon={Target} hint="Total trades you aim to take per month" />
        <SettingField label="Daily Cap" value={settings.dailyCap} onChange={(v) => updateSettings({ dailyCap: v })} min={1} max={10} icon={Target} hint="Maximum trades allowed per day" />
      </motion.div>

      {/* Point Allocation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <span className="stat-label text-primary">Point Allocation</span>
        </div>
        <SettingField label="Recording a Trade" value={settings.pointsRecording} onChange={(v) => updateSettings({ pointsRecording: v })} min={0} max={10} icon={Zap} hint="Points for logging the trade" />
        <SettingField label="Following Rules" value={settings.pointsFollowingRules} onChange={(v) => updateSettings({ pointsFollowingRules: v })} min={0} max={10} icon={Zap} hint="Points for adhering to your rules" />
        <SettingField label="Journaling Notes" value={settings.pointsJournaling} onChange={(v) => updateSettings({ pointsJournaling: v })} min={0} max={10} icon={Zap} hint="Points for writing intent/review notes" />
      </motion.div>

      {/* Point Decay */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-4 w-4 text-accent" />
          <span className="stat-label text-accent">Point Decay by Trade #</span>
        </div>
        <SettingField label="Trade #1 Multiplier" value={settings.pointDecayTrade1} onChange={(v) => updateSettings({ pointDecayTrade1: v })} min={0} max={2} step={0.1} icon={TrendingDown} hint="Full value for your first trade" />
        <SettingField label="Trade #2 Multiplier" value={settings.pointDecayTrade2} onChange={(v) => updateSettings({ pointDecayTrade2: v })} min={0} max={2} step={0.1} icon={TrendingDown} hint="Reduced value for second trade" />
        <SettingField label="Trade #3 Multiplier" value={settings.pointDecayTrade3} onChange={(v) => updateSettings({ pointDecayTrade3: v })} min={0} max={2} step={0.1} icon={TrendingDown} hint="Lowest value for third trade" />
      </motion.div>

      {/* Photo Quota */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-4 w-4 text-primary" />
          <span className="stat-label text-primary">Audit Photo Quota</span>
        </div>
        <SettingField label="Monthly Photo Target" value={settings.monthlyPhotoQuota} onChange={(v) => updateSettings({ monthlyPhotoQuota: v })} min={0} max={100} icon={Camera} hint="Required before/after screenshot audits per month" />
      </motion.div>
    </div>
  );
}
