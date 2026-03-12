import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockTrades, mockTradeTags } from "@/lib/mock-data";
import { MOOD_LABELS, AVAILABLE_TAGS, Trade } from "@/lib/types";
import { BookOpen, Plus, X, Check, Image, ChevronDown, ChevronUp } from "lucide-react";

const MoodDot = ({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) => {
  const colors: Record<number, string> = {
    1: "bg-loss",
    2: "bg-accent",
    3: "bg-muted-foreground",
    4: "bg-primary/70",
    5: "bg-primary",
  };
  const s = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  return <div className={`${s} rounded-full ${colors[score] ?? "bg-muted"}`} title={MOOD_LABELS[score]} />;
};

function TradeRow({ trade }: { trade: Trade }) {
  const [expanded, setExpanded] = useState(false);
  const tags = mockTradeTags.filter((t) => t.trade_id === trade.id);
  const isOpen = trade.status === "open";

  return (
    <motion.div layout className="terminal-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left"
      >
        {/* Status */}
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            isOpen
              ? "border-accent/40 text-accent bg-accent/5"
              : "border-primary/30 text-primary bg-primary/5"
          }`}
        >
          {isOpen ? "INTENT" : "CLOSED"}
        </span>

        {/* Date + Number */}
        <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{trade.date}</span>
        <span className="text-[10px] font-mono text-muted-foreground">#{trade.trade_number}</span>

        {/* Symbol */}
        <span className="text-sm font-mono font-bold text-foreground w-16">{trade.symbol}</span>

        {/* Strategy */}
        <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{trade.strategy}</span>

        {/* Mood */}
        <MoodDot score={trade.mood_score} />

        {/* Rules */}
        {trade.followed_rules ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <X className="h-3.5 w-3.5 text-loss" />
        )}

        {/* Result */}
        <span
          className={`text-xs font-mono font-semibold w-12 text-right ${
            trade.result_r == null
              ? "text-muted-foreground"
              : (trade.result_r ?? 0) >= 0
              ? "text-profit"
              : "text-loss"
          }`}
        >
          {trade.result_r != null ? `${trade.result_r > 0 ? "+" : ""}${trade.result_r}R` : "—"}
        </span>

        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="stat-label">Entry</span>
                    <p className="text-sm font-mono text-foreground">
                      {trade.entry_price != null ? `$${trade.entry_price}` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="stat-label">Stop</span>
                    <p className="text-sm font-mono text-loss">
                      {trade.stop_price != null ? `$${trade.stop_price}` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="stat-label">Target</span>
                    <p className="text-sm font-mono text-profit">
                      {trade.target_price != null ? `$${trade.target_price}` : "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="stat-label">Mood</span>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((m) => (
                      <div
                        key={m}
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-mono border ${
                          m === trade.mood_score
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                    <span className="text-xs font-mono text-muted-foreground ml-2">
                      {MOOD_LABELS[trade.mood_score]}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="stat-label">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="tag-chip border-primary/30 text-primary"
                      >
                        {tag.tag}
                      </span>
                    ))}
                    {tags.length === 0 && (
                      <span className="text-xs font-mono text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Notes + Screenshots */}
              <div className="space-y-3">
                <div>
                  <span className="stat-label">Intent / Notes</span>
                  <p className="text-xs font-mono text-secondary-foreground mt-1 leading-relaxed">
                    {trade.intent_notes || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-dashed border-border rounded-md h-24 flex flex-col items-center justify-center">
                    <Image className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-[10px] font-mono text-muted-foreground">Before (Setup)</span>
                  </div>
                  <div className="border border-dashed border-border rounded-md h-24 flex flex-col items-center justify-center">
                    <Image className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-[10px] font-mono text-muted-foreground">After (Result)</span>
                  </div>
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodScore, setMoodScore] = useState(3);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="terminal-card border-primary/30 glow-teal space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="stat-label text-primary">New Trade Entry</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="stat-label">Symbol</label>
          <input className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary" placeholder="AAPL" />
        </div>
        <div>
          <label className="stat-label">Strategy</label>
          <input className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary" placeholder="Breakout Long" />
        </div>
        <div>
          <label className="stat-label">Trade #</label>
          <select className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
        <div>
          <label className="stat-label">Result (R)</label>
          <input className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary" placeholder="+1.5" type="number" step="0.1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="stat-label">Entry Price</label>
          <input className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
        </div>
        <div>
          <label className="stat-label">Stop Price</label>
          <input className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
        </div>
        <div>
          <label className="stat-label">Target Price</label>
          <input className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary" placeholder="0.00" type="number" step="0.01" />
        </div>
      </div>

      {/* Mood Scale */}
      <div>
        <label className="stat-label">Mood Scale</label>
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((m) => (
            <button
              key={m}
              onClick={() => setMoodScore(m)}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-mono border transition-colors ${
                m === moodScore
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
          <span className="text-xs font-mono text-muted-foreground ml-2">
            {MOOD_LABELS[moodScore]}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="stat-label">Tags</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`tag-chip transition-colors ${
                selectedTags.includes(tag)
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Followed Rules */}
      <div className="flex items-center gap-3">
        <label className="stat-label">Followed Rules?</label>
        <button className="h-5 w-9 rounded-full bg-primary/20 border border-primary/40 relative">
          <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-primary transition-all" />
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="stat-label">Intent / Notes</label>
        <textarea
          className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary resize-none"
          rows={3}
          placeholder="What's the setup? What's your plan?"
        />
      </div>

      {/* Screenshot placeholders */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-dashed border-border rounded-md h-20 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors">
          <Image className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-[10px] font-mono text-muted-foreground">Upload Before Screenshot</span>
        </div>
        <div className="border border-dashed border-border rounded-md h-20 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors">
          <Image className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-[10px] font-mono text-muted-foreground">Upload After Screenshot</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border rounded hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button className="px-4 py-1.5 text-xs font-mono bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          Log Trade
        </button>
      </div>
    </motion.div>
  );
}

export default function Journal() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const filtered = mockTrades.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Trade Journal</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Entry
        </button>
      </div>

      {/* Entry Form */}
      <AnimatePresence>
        {showForm && <TradeEntryForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-1">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              filter === f
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {f === "all" ? "All" : f === "open" ? "Open (Intent)" : "Closed (Audited)"}
          </button>
        ))}
      </div>

      {/* Trade List */}
      <div className="space-y-2">
        {filtered.map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
        {filtered.length === 0 && (
          <div className="terminal-card text-center py-12">
            <p className="text-sm font-mono text-muted-foreground">No trades found</p>
          </div>
        )}
      </div>
    </div>
  );
}
