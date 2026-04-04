import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { MOOD_LABELS, AVAILABLE_TAGS } from "@/lib/types";
import { useSettings } from "@/lib/settings";
import { useProfile } from "@/hooks/use-profile";
import { useConditions, CONDITION_TEMPLATES, type Condition, type ConditionType, type ConditionValue } from "@/lib/conditions";
import { useOperatorMode } from "@/lib/operator-mode";
import { BookOpen, Plus, X, Check, Image, ChevronDown, ChevronUp, Pencil, Trash2, Loader2, Calendar, AlertTriangle, Smile, Meh, Frown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type Trade = {
  id: string; user_id: string; date: string; start_date: string; end_date: string;
  trade_number: number; symbol: string;
  strategy: string; entry_price: number | null; stop_price: number | null;
  target_price: number | null; followed_rules: boolean; result_r: number | null;
  mood_score: number; intent_notes: string | null; status: string;
  before_screenshot_url: string | null; after_screenshot_url: string | null;
  created_at: string; updated_at: string;
};

type TradeTag = { id: string; trade_id: string; tag: string };

const MoodDot = ({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) => {
  const colors: Record<number, string> = { 1: "bg-loss", 2: "bg-accent", 3: "bg-muted-foreground", 4: "bg-primary/70", 5: "bg-primary" };
  const s = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return <div className={`${s} rounded-full ${colors[score] ?? "bg-muted"}`} title={MOOD_LABELS[score]} />;
};

function TradeRow({ trade, tags, onEdit, onDelete }: { trade: Trade; tags: TradeTag[]; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isOpen = trade.status === "open";

  return (
    <motion.div layout className="glass-card group hover:border-primary/20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 flex items-center gap-3 text-left">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isOpen ? "border-accent/40 text-accent bg-accent/5" : "border-primary/30 text-primary bg-primary/5"}`}>
            {isOpen ? "INTENT" : "CLOSED"}
          </span>
          <span className="text-xs text-muted-foreground w-24 shrink-0">{trade.end_date || trade.date}</span>
          <span className="text-[10px] text-muted-foreground">#{trade.trade_number}</span>
          <span className="text-sm font-bold text-foreground w-16">{trade.symbol}</span>
          <span className="text-xs text-muted-foreground flex-1 truncate">{trade.strategy}</span>
          <MoodDot score={trade.mood_score} />
          {trade.followed_rules ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-loss" />}
          <span className={`text-xs font-semibold w-12 text-right ${trade.result_r == null ? "text-muted-foreground" : (trade.result_r ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
            {trade.result_r != null ? `${trade.result_r > 0 ? "+" : ""}${trade.result_r}R` : "—"}
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-4 mt-4 border-t border-border/30 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><span className="stat-label">Entry</span><p className="text-sm text-foreground">{trade.entry_price != null ? `$${trade.entry_price}` : "—"}</p></div>
                  <div><span className="stat-label">Stop</span><p className="text-sm text-loss">{trade.stop_price != null ? `$${trade.stop_price}` : "—"}</p></div>
                  <div><span className="stat-label">Target</span><p className="text-sm text-profit">{trade.target_price != null ? `$${trade.target_price}` : "—"}</p></div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Start: {trade.start_date || trade.date}</span>
                  <span>End: {trade.end_date || trade.date}</span>
                </div>
                <div>
                  <span className="stat-label">Mood</span>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((m) => (
                      <div key={m} className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] border ${m === trade.mood_score ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>{m}</div>
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{MOOD_LABELS[trade.mood_score]}</span>
                  </div>
                </div>
                <div>
                  <span className="stat-label">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((tag) => (<span key={tag.id} className="tag-chip border-primary/30 text-primary">{tag.tag}</span>))}
                    {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="stat-label">Intent / Notes</span>
                  <p className="text-xs text-secondary-foreground mt-1 leading-relaxed">{trade.intent_notes || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Before (Setup)", "After (Result)"].map((lbl) => (
                    <div key={lbl} className="border border-dashed border-border/50 rounded-lg h-24 flex flex-col items-center justify-center bg-muted/20">
                      <Image className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground">{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SENTIMENT_OPTIONS = [
  { value: "fired_up", icon: "🚀", label: "Fired Up" },
  { value: "diamond", icon: "💎", label: "Diamond Hands" },
  { value: "neutral", icon: "😐", label: "Neutral" },
  { value: "bearish", icon: "📉", label: "Bearish" },
  { value: "tilted", icon: "😤", label: "Tilted" },
];

function ConditionsSection({ values, onChange }: { values: ConditionValue[]; onChange: (vals: ConditionValue[]) => void }) {
  const { conditions, addCondition, removeCondition } = useConditions();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ConditionType>("binary");
  const [scaleMax, setScaleMax] = useState(5);
  const [catOptions, setCatOptions] = useState("");

  const getValue = (id: string) => values.find((v) => v.conditionId === id);
  const setValue = (id: string, value: number | boolean | string) => {
    const existing = values.filter((v) => v.conditionId !== id);
    onChange([...existing, { conditionId: id, value }]);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const cond: Condition = { id, name: newName.trim(), type: newType };
    if (newType === "categorical") {
      cond.options = catOptions.split(",").map((o) => o.trim()).filter(Boolean);
      if (cond.options.length === 0) { toast.error("Add at least one option"); return; }
    }
    if (newType === "scale") cond.maxScale = scaleMax;
    addCondition(cond);
    setNewName("");
    setCatOptions("");
    setShowAdd(false);
    toast.success(`Condition "${newName.trim()}" added`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="stat-label">Conditions</label>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {conditions.length === 0 && !showAdd && (
        <p className="text-[10px] text-muted-foreground">No conditions yet. Add custom conditions to track.</p>
      )}

      <div className="space-y-2">
        {conditions.map((cond) => {
          const val = getValue(cond.id);
          return (
            <div key={cond.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border/30">
              <span className="text-xs text-foreground flex-1 min-w-0 truncate">{cond.name}</span>

              {/* Binary (Yes/No) */}
              {(cond.type === "binary" || cond.type === "boolean") && (
                <button
                  onClick={() => setValue(cond.id, !(val?.value as boolean))}
                  className={`h-6 w-10 rounded-full border relative transition-colors shrink-0 ${val?.value ? "bg-primary/20 border-primary/40" : "bg-muted border-border"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${val?.value ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
                </button>
              )}

              {/* Scale (1-N) */}
              {cond.type === "scale" && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: cond.maxScale || 5 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setValue(cond.id, n)}
                      className={`h-6 w-6 rounded text-[9px] border transition-all ${(val?.value as number) === n ? "border-primary bg-primary/20 text-primary" : "border-border/50 text-muted-foreground hover:border-muted-foreground"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {/* Categorical */}
              {cond.type === "categorical" && (
                <div className="flex items-center gap-1 flex-wrap">
                  {(cond.options || []).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setValue(cond.id, opt)}
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition-all ${val?.value === opt ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-muted-foreground"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Sentiment */}
              {cond.type === "sentiment" && (
                <div className="flex items-center gap-1">
                  {SENTIMENT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setValue(cond.id, s.value)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-sm border transition-all ${val?.value === s.value ? "border-primary bg-primary/10 scale-110" : "border-border/50 hover:border-muted-foreground"}`}
                      title={s.label}
                    >
                      {s.icon}
                    </button>
                  ))}
                </div>
              )}

              {/* Text */}
              {cond.type === "text" && (
                <input
                  value={(val?.value as string) || ""}
                  onChange={(e) => setValue(cond.id, e.target.value)}
                  className="flex-1 max-w-[200px] bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="Enter note..."
                />
              )}

              <button onClick={() => removeCondition(cond.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 p-3 bg-muted/20 rounded-lg border border-dashed border-border/50 space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Condition name..."
                className="w-full bg-muted/30 border border-border/50 rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {CONDITION_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.type}
                    onClick={() => setNewType(tmpl.type)}
                    className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${newType === tmpl.type ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60">
                {CONDITION_TEMPLATES.find((t) => t.type === newType)?.example}
              </p>

              {newType === "categorical" && (
                <input
                  value={catOptions}
                  onChange={(e) => setCatOptions(e.target.value)}
                  placeholder="Options (comma-separated): Trending, Ranging, Choppy"
                  className="w-full bg-muted/30 border border-border/50 rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              )}

              {newType === "scale" && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Max:</span>
                  {[5, 10].map((n) => (
                    <button key={n} onClick={() => setScaleMax(n)} className={`px-2 py-0.5 text-[10px] rounded border ${scaleMax === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      1-{n}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-1.5">
                <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-[10px] text-muted-foreground border border-border rounded-lg hover:bg-secondary/50">Cancel</button>
                <button onClick={handleAdd} className="px-3 py-1 text-[10px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Add Condition</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompactDatePicker({ label, value, onChange }: { label: string; value: Date; onChange: (d: Date) => void }) {
  return (
    <div className="flex-1">
      <label className="stat-label flex items-center gap-1 mb-1">
        <Calendar className="h-2.5 w-2.5" /> {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:border-primary/40 transition-colors backdrop-blur-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {format(value, "MMM d, yyyy")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
          <CalendarComponent
            mode="single"
            selected={value}
            onSelect={(d) => d && onChange(d)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TradeEntryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { awardXP } = useProfile();
  const { operatorMode } = useOperatorMode(user?.email);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodScore, setMoodScore] = useState(3);
  const [followedRules, setFollowedRules] = useState(true);
  const [notes, setNotes] = useState("");
  const [symbol, setSymbol] = useState("");
  const [strategy, setStrategy] = useState("");
  const [tradeNumber, setTradeNumber] = useState(1);
  const [resultR, setResultR] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [conditionValues, setConditionValues] = useState<ConditionValue[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const isMandatory = (field: string) => settings.mandatoryFields.includes(field as any);

  // Check if end date is more than 3 days ago
  const isDateTooOld = () => {
    if (operatorMode) return false;
    const now = new Date();
    const diffMs = now.getTime() - endDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  };

  const handleSubmit = async () => {
    if (!user) return;

    const errors: string[] = [];
    if (!symbol.trim()) errors.push("Symbol");
    if (isMandatory("notes") && !notes.trim()) errors.push("Intent/Notes");
    if (isMandatory("tags") && selectedTags.length === 0) errors.push("Tags");
    if (errors.length > 0) {
      toast.error("Missing mandatory fields", { description: errors.join(", ") });
      return;
    }

    const startISO = format(startDate, "yyyy-MM-dd");
    const endISO = format(endDate, "yyyy-MM-dd");

    setSubmitting(true);
    try {
      const { data: trade, error } = await supabase.from("trades").insert({
        user_id: user.id,
        date: endISO,
        start_date: startISO,
        end_date: endISO,
        symbol: symbol.trim().toUpperCase(),
        strategy: strategy.trim(),
        trade_number: tradeNumber,
        mood_score: moodScore,
        followed_rules: followedRules,
        intent_notes: notes.trim() || null,
        result_r: resultR ? parseFloat(resultR) : null,
        entry_price: entryPrice ? parseFloat(entryPrice) : null,
        stop_price: stopPrice ? parseFloat(stopPrice) : null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        status: resultR ? "closed" : "open",
      } as any).select().single();

      if (error) throw error;

      if (selectedTags.length > 0 && trade) {
        const { error: tagError } = await supabase.from("trade_tags").insert(
          selectedTags.map((tag) => ({ trade_id: (trade as any).id, tag }))
        );
        if (tagError) console.error("Tag insert error:", tagError);
      }

      // Award XP (no points if end date > 3 days old)
      if (!isDateTooOld()) {
        const baseXP = resultR ? 50 + 25 : 50;
        awardXP(resultR ? "trade_closed" : "journal_entry", baseXP);
      }

      toast.success("Trade logged!", { description: isDateTooOld() ? "No XP awarded — trade end date is older than 3 days." : "Discipline score updated." });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to log trade", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const MandatoryMark = ({ field }: { field: string }) =>
    isMandatory(field) ? <span className="text-accent ml-0.5">*</span> : null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card-elevated neon-border-teal space-y-4">
      <div className="flex items-center justify-between">
        <span className="stat-label text-primary">New Trade Entry</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
      </div>

      {/* Compact Start/End Date pickers */}
      <div className="flex items-start gap-3">
        <CompactDatePicker label="Start Date" value={startDate} onChange={setStartDate} />
        <CompactDatePicker label="End Date" value={endDate} onChange={setEndDate} />
      </div>
      {isDateTooOld() && (
        <div className="flex items-center gap-1.5 text-accent -mt-2">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-[10px]">End date is older than 3 days — no XP will be awarded</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="stat-label">Symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="AAPL" />
        </div>
        <div>
          <label className="stat-label">Strategy</label>
          <input value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="Breakout Long" />
        </div>
        <div>
          <label className="stat-label">Trade #</label>
          <select value={tradeNumber} onChange={(e) => setTradeNumber(Number(e.target.value))} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            {Array.from({ length: settings.dailyCap }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
          </select>
        </div>
        <div>
          <label className="stat-label">Result (R)</label>
          <input value={resultR} onChange={(e) => setResultR(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="+1.5" type="number" step="0.1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="stat-label">Entry Price</label>
          <input value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
        </div>
        <div>
          <label className="stat-label">Stop Price</label>
          <input value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
        </div>
        <div>
          <label className="stat-label">Target Price</label>
          <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
        </div>
      </div>

      {/* Mood */}
      <div>
        <label className="stat-label">Mood Scale<MandatoryMark field="mood" /></label>
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((m) => (
            <button key={m} onClick={() => setMoodScore(m)} className={`h-9 w-9 rounded-full flex items-center justify-center text-xs border transition-all duration-200 ${m === moodScore ? "border-primary bg-primary/20 text-primary scale-110 shadow-lg shadow-primary/20" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>{m}</button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">{MOOD_LABELS[moodScore]}</span>
        </div>
      </div>

      {/* Conditions */}
      <ConditionsSection values={conditionValues} onChange={setConditionValues} />

      {/* Tags */}
      <div>
        <label className="stat-label">Tags<MandatoryMark field="tags" /></label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)} className={`tag-chip transition-all duration-200 ${selectedTags.includes(tag) ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Rules toggle */}
      <div className="flex items-center gap-3">
        <label className="stat-label">Followed Rules?<MandatoryMark field="rules" /></label>
        <button onClick={() => setFollowedRules(!followedRules)} className={`h-6 w-10 rounded-full border relative transition-colors ${followedRules ? "bg-primary/20 border-primary/40" : "bg-muted border-border"}`}>
          <div className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${followedRules ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="stat-label">Intent / Notes<MandatoryMark field="notes" /></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none transition-colors" rows={3} placeholder="What's the setup? What's your plan?" />
      </div>

      {/* Screenshots */}
      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Before Screenshot", field: "before_photo" }, { label: "After Screenshot", field: "after_photo" }].map(({ label, field }) => (
          <div key={label} className="border border-dashed border-border/50 rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all">
            <Image className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-[10px] text-muted-foreground">{label}{isMandatory(field) && <span className="text-accent">*</span>}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-xs text-muted-foreground border border-border rounded-lg hover:bg-secondary/50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
          {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
          Log Trade
        </button>
      </div>
    </motion.div>
  );
}

export default function Journal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("date", { ascending: false }).order("trade_number", { ascending: true });
      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ["trade_tags", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trade_tags").select("*");
      if (error) throw error;
      return data as TradeTag[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trade_tags"] });
      toast.success("Trade deleted", { description: "Discipline scores recalculated." });
    },
    onError: (error: any) => {
      toast.error("Delete failed", { description: error.message });
    },
  });

  const filtered = trades.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    return true;
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    queryClient.invalidateQueries({ queryKey: ["trade_tags"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Trade Journal</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus className="h-3.5 w-3.5" />
          New Entry
        </button>
      </div>

      <AnimatePresence>
        {showForm && <TradeEntryForm onClose={() => setShowForm(false)} onSuccess={handleRefresh} />}
      </AnimatePresence>

      <div className="flex gap-1">
        {(["all", "open", "closed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${filter === f ? "bg-primary/10 text-primary neon-border-teal" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
            {f === "all" ? "All" : f === "open" ? "Open (Intent)" : "Closed (Audited)"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="glass-card text-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading trades...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              tags={allTags.filter((t) => t.trade_id === trade.id)}
              onEdit={() => toast.info("Edit mode", { description: "Coming soon." })}
              onDelete={() => deleteMutation.mutate(trade.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="glass-card text-center py-12">
              <p className="text-sm text-muted-foreground">No trades found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
