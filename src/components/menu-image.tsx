"use client";

import { useState, type ReactNode } from "react";
import { parseImageUrl } from "@/lib/menu";

export function MenuImage({ url, fallback }: { url: string | null; fallback: ReactNode }) {
  const [broken, setBroken] = useState(false);
  const src = parseImageUrl(url);
  if (!src || broken) return fallback;

  // The browser loads admin-supplied URLs directly. Next's image proxy is intentionally bypassed.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer"
    onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />;
}
