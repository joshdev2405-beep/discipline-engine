import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "trade-screenshots";

/** Extract storage path from either a stored path or a legacy public URL. */
export function extractStoragePath(stored: string): string {
  const marker = `/storage/v1/object/`;
  const idx = stored.indexOf(marker);
  if (idx === -1) return stored;
  const rest = stored.slice(idx + marker.length); // e.g. public/trade-screenshots/uid/file.png
  const parts = rest.split("/");
  // drop "public" | "sign" and bucket name
  return parts.slice(2).join("/").split("?")[0];
}

export async function getSignedScreenshotUrl(stored: string): Promise<string | null> {
  const path = extractStoragePath(stored);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }
  return data.signedUrl;
}

interface SignedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storedUrl: string | null | undefined;
  fallback?: React.ReactNode;
}

export function SignedImage({ storedUrl, fallback = null, ...imgProps }: SignedImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storedUrl) {
      setSrc(null);
      return;
    }
    getSignedScreenshotUrl(storedUrl).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [storedUrl]);

  if (!src) return <>{fallback}</>;
  return <img src={src} {...imgProps} />;
}