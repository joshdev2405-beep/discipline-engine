import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export default function QuickLogModal({ isOpen, onClose, userId, onSuccess }: QuickLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    symbol: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    tradeType: "long" as const,
    intentNotes: "",
    followedRules: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const entryPrice = parseFloat(formData.entryPrice);
      const exitPrice = parseFloat(formData.exitPrice);
      const quantity = parseFloat(formData.quantity);

      if (!entryPrice || !exitPrice || !quantity) {
        throw new Error("Please fill in all price fields");
      }

      const pnl = (exitPrice - entryPrice) * quantity;
      const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;

      const { error: insertError } = await supabase.from("trades").insert({
        user_id: userId,
        symbol: formData.symbol.toUpperCase(),
        entry_price: entryPrice,
        exit_price: exitPrice,
        quantity,
        trade_type: formData.tradeType,
        intent_notes: formData.intentNotes,
        followed_rules: formData.followedRules,
        tags: [],
        pnl,
        pnl_percent: pnlPercent,
        entry_date: new Date().toISOString(),
        exit_date: new Date().toISOString(),
        screenshots: [],
      });

      if (insertError) throw insertError;

      setFormData({
        symbol: "",
        entryPrice: "",
        exitPrice: "",
        quantity: "",
        tradeType: "long",
        intentNotes: "",
        followedRules: false,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log trade");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-card rounded-t-lg border-t border-border animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-4 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Quick Log Trade</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block stat-label mb-1">Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="AAPL"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block stat-label mb-1">Type</label>
                <select
                  value={formData.tradeType}
                  onChange={(e) => setFormData({ ...formData, tradeType: e.target.value as "long" | "short" })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block stat-label mb-1">Entry</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block stat-label mb-1">Exit</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.exitPrice}
                  onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block stat-label mb-1">Qty</label>
                <input
                  type="number"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block stat-label mb-1">Intent & Notes</label>
              <textarea
                value={formData.intentNotes}
                onChange={(e) => setFormData({ ...formData, intentNotes: e.target.value })}
                placeholder="Why did you take this trade?"
                rows={3}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <label className="flex items-center gap-3 p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
              <input
                type="checkbox"
                checked={formData.followedRules}
                onChange={(e) => setFormData({ ...formData, followedRules: e.target.checked })}
                className="w-5 h-5 rounded border-border"
              />
              <span className="text-sm text-foreground">Followed Trading Rules</span>
            </label>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Logging..." : "Log Trade"}
              </button>
            </div>
          </form>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
