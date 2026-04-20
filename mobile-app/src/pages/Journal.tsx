import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Trade, TRADE_TAGS } from "@/lib/types";
import { Plus } from "lucide-react";

export default function Journal() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    entry_price: "",
    exit_price: "",
    quantity: "",
    trade_type: "long" as const,
    intent_notes: "",
    followed_rules: false,
    tags: [] as string[],
  });

  useEffect(() => {
    if (!user) return;

    const fetchTrades = async () => {
      try {
        const { data } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false });

        setTrades(data || []);
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const entryPrice = parseFloat(formData.entry_price);
    const exitPrice = parseFloat(formData.exit_price);
    const quantity = parseFloat(formData.quantity);

    const pnl = (exitPrice - entryPrice) * quantity;
    const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;

    try {
      await supabase.from("trades").insert({
        user_id: user.id,
        symbol: formData.symbol,
        entry_price: entryPrice,
        exit_price: exitPrice,
        quantity,
        trade_type: formData.trade_type,
        intent_notes: formData.intent_notes,
        followed_rules: formData.followed_rules,
        tags: formData.tags,
        pnl,
        pnl_percent: pnlPercent,
        entry_date: new Date().toISOString(),
        exit_date: new Date().toISOString(),
      });

      setFormData({
        symbol: "",
        entry_price: "",
        exit_price: "",
        quantity: "",
        trade_type: "long",
        intent_notes: "",
        followed_rules: false,
        tags: [],
      });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add trade:", err);
    }
  };

  if (loading) {
    return (
      <div className="mobile-screen pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mobile-screen pb-20">
      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Journal</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-elevated p-4 space-y-3">
            <input
              type="text"
              placeholder="Symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              required
            />
            <input
              type="number"
              placeholder="Entry Price"
              value={formData.entry_price}
              onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              required
            />
            <input
              type="number"
              placeholder="Exit Price"
              value={formData.exit_price}
              onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              required
            />
            <textarea
              placeholder="Intent & Notes"
              value={formData.intent_notes}
              onChange={(e) => setFormData({ ...formData, intent_notes: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              rows={3}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.followed_rules}
                onChange={(e) => setFormData({ ...formData, followed_rules: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Followed Rules</span>
            </label>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90"
            >
              Add Trade
            </button>
          </form>
        )}

        <div className="space-y-2">
          {trades.map((trade) => (
            <div key={trade.id} className="glass-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{trade.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {trade.entry_price} → {trade.exit_price}
                  </p>
                </div>
                <p
                  className={`font-bold ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}
                >
                  {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
