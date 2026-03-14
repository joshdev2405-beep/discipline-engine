import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockTrades, mockTradeTags } from "@/lib/mock-data";
import { MOOD_LABELS, AVAILABLE_TAGS, Trade } from "@/lib/types";
import { useSettings } from "@/lib/settings";
import { BookOpen, Plus, X, Check, Image, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MoodDot = ({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) => {
  const colors: Record<number, string> = {
    1: "bg-loss",
    2: "bg-accent",
    3: "bg-muted-foreground",
    4: "bg-primary/70",
    5: "bg-primary",
  };
  const s = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return <div className={`${s} rounded-full ${colors[score] ?? "bg-muted"}`} title={MOOD_LABELS[score]} />;
};

function TradeRow({ trade, onEdit, onDelete }: { trade: Trade; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const tags = mockTradeTags.filter((t) => t.trade_id === trade.id);
  const isOpen = trade.status === "open";

  return (
    <motion.div layout className="glass-card group hover:border-primary/20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isOpen
                ? "border-accent/40 text-accent bg-accent/5"
                : "border-primary/30 text-primary bg-primary/5"
            }`}
          >
            {isOpen ? "INTENT" : "CLOSED"}
          </span>

          <span className="text-xs text-muted-foreground w-24 shrink-0">{trade.date}</span>
          <span className="text-[10px] text-muted-foreground">#{trade.trade_number}</span>
          <span className="text-sm font-bold text-foreground w-16">{trade.symbol}</span>
          <span className="text-xs text-muted-foreground flex-1 truncate">{trade.strategy}</span>
          <MoodDot score={trade.mood_score} />
          {trade.followed_rules ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <X className="h-3.5 w-3.5 text-loss" />
          )}
          <span
            className={`text-xs font-semibold w-12 text-right ${
              trade.result_r == null ? "text-muted-foreground" : (trade.result_r ?? 0) >= 0 ? "text-profit" : "text-loss"
            }`}
          >
            {trade.result_r != null ? `${trade.result_r > 0 ? "+" : ""}${trade.result_r}R` : "—"}
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
                <div>
                  <span className="stat-label">Mood</span>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((m) => (
                      <div key={m} className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] border ${m === trade.mood_score ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                        {m}
                      </div>
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

function TradeEntryForm({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodScore, setMoodScore] = useState(3);
  const [followedRules, setFollowedRules] = useState(true);
  const [notes, setNotes] = useState("");
  const [symbol, setSymbol] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const isMandatory = (field: string) => settings.mandatoryFields.includes(field as any);

  const handleSubmit = () => {
    const errors: string[] = [];
    if (isMandatory("notes") && !notes.trim()) errors.push("Intent/Notes");
    if (isMandatory("tags") && selectedTags.length === 0) errors.push("Tags");
    if (errors.length > 0) {
      toast.error("Missing mandatory fields", { description: errors.join(", ") });
      return;
    }
    toast.success("Trade logged!", { description: "Discipline score updated." });
    onClose();
  };

  const MandatoryMark = ({ field }: { field: string }) =>
    isMandatory(field) ? <span className="text-accent ml-0.5">*</span> : null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card-elevated neon-border-teal space-y-4">
      <div className="flex items-center justify-between">
        <span className="stat-label text-primary">New Trade Entry</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="stat-label">Symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="AAPL" />
        </div>
        <div>
          <label className="stat-label">Strategy</label>
          <input className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" placeholder="Breakout Long" />
        </div>
        <div>
          <label className="stat-label">Trade #</label>
          <select className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            {Array.from({ length: settings.dailyCap }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="stat-label">Result (R)</label>
          <input className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="+1.5" type="number" step="0.1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {["Entry Price", "Stop Price", "Target Price"].map((label) => (
          <div key={label}>
            <label className="stat-label">{label}</label>
            <input className="w-full mt-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
          </div>
        ))}
      </div>

      {/* Mood */}
      <div>
        <label className="stat-label">Mood Scale<MandatoryMark field="mood" /></label>
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((m) => (
            <button key={m} onClick={() => setMoodScore(m)} className={`h-9 w-9 rounded-full flex items-center justify-center text-xs border transition-all duration-200 ${m === moodScore ? "border-primary bg-primary/20 text-primary scale-110 shadow-lg shadow-primary/20" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
              {m}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">{MOOD_LABELS[moodScore]}</span>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="stat-label">Tags<MandatoryMark field="tags" /></label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)} className={`tag-chip transition-all duration-200 ${selectedTags.includes(tag) ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
              {tag}
            </button>
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
        <button onClick={handleSubmit} className="px-5 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Log Trade</button>
      </div>
    </motion.div>
  );
}

export default function Journal() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [trades, setTrades] = useState(mockTrades);

  const filtered = trades.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    return true;
  });

  const handleDelete = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    toast.success("Trade deleted", { description: "Discipline scores recalculated." });
  };

  const handleEdit = (id: string) => {
    toast.info("Edit mode", { description: `Editing trade ${id} — coming soon with database integration.` });
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
        {showForm && <TradeEntryForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      <div className="flex gap-1">
        {(["all", "open", "closed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${filter === f ? "bg-primary/10 text-primary neon-border-teal" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
            {f === "all" ? "All" : f === "open" ? "Open (Intent)" : "Closed (Audited)"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((trade) => (
          <TradeRow key={trade.id} trade={trade} onEdit={() => handleEdit(trade.id)} onDelete={() => handleDelete(trade.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="glass-card text-center py-12">
            <p className="text-sm text-muted-foreground">No trades found</p>
          </div>
        )}
      </div>
    </div>
  );
}
