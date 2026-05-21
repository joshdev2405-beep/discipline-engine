import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, X, Calendar, Hash, Loader2 } from "lucide-react";
import { useTrades, Trade } from "@/hooks/use-trades";
import { SignedImage } from "@/components/SignedImage";

interface VaultPhoto {
  tradeId: string;
  symbol: string;
  date: string;
  type: "before" | "after";
  url: string;
}

function getVaultPhotos(trades: Trade[]): VaultPhoto[] {
  const photos: VaultPhoto[] = [];
  for (const trade of trades) {
    if (trade.before_screenshot_url) {
      photos.push({
        tradeId: trade.id,
        symbol: trade.symbol,
        date: trade.date,
        type: "before",
        url: trade.before_screenshot_url,
      });
    }
    if (trade.after_screenshot_url) {
      photos.push({
        tradeId: trade.id,
        symbol: trade.symbol,
        date: trade.date,
        type: "after",
        url: trade.after_screenshot_url,
      });
    }
  }
  return photos;
}

function Lightbox({ photo, onClose }: { photo: VaultPhoto; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-4xl max-h-[85vh] w-full mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        <SignedImage
          storedUrl={photo.url}
          alt={`${photo.type} screenshot for ${photo.symbol}`}
          className="w-full h-full object-contain rounded-xl border border-border/50"
        />
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            {photo.symbol}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {photo.date}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            photo.type === "before"
              ? "border-accent/40 text-accent"
              : "border-primary/40 text-primary"
          }`}>
            {photo.type === "before" ? "BEFORE" : "AFTER"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Vault() {
  const { trades, isLoading } = useTrades();
  const photos = getVaultPhotos(trades);
  const [selectedPhoto, setSelectedPhoto] = useState<VaultPhoto | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Image className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">The Vault</h1>
          <p className="text-xs text-muted-foreground">Before & After audit screenshots</p>
        </div>
      </div>

      {photos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated text-center py-16"
        >
          <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-1">No audit photos yet</p>
          <p className="text-xs text-muted-foreground/60">
            Upload Before & After screenshots in the Journal to populate this gallery.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <motion.button
              key={`${photo.tradeId}-${photo.type}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedPhoto(photo)}
              className="glass-card group relative overflow-hidden aspect-[4/3] flex flex-col items-center justify-center hover:border-primary/30 transition-all cursor-pointer p-0"
            >
              <SignedImage
                storedUrl={photo.url}
                alt={`${photo.type} — ${photo.symbol}`}
                className="absolute inset-0 w-full h-full object-cover rounded-[inherit] opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-[inherit]" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold text-foreground">{photo.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">{photo.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                    photo.type === "before"
                      ? "border-accent/40 text-accent bg-accent/10"
                      : "border-primary/40 text-primary bg-primary/10"
                  }`}>
                    {photo.type === "before" ? "BEFORE" : "AFTER"}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
