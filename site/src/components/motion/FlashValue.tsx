"use client";

/* FlashValue — briefly brightens to aqua when its value CHANGES. Purpose:
   feedback for live state change. The primitive that powers a price tick when
   real data lands; today it marks the world-markets open-count flipping as a
   session opens or closes. prefers-reduced-motion → silent value swap. */

import { useEffect, useRef, useState } from "react";

export function FlashValue({
  value,
  className = "",
}: {
  value: string | number;
  className?: string;
}) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 750);
    return () => clearTimeout(id);
  }, [value]);

  return <span className={`${className} ${flash ? "value-flash" : ""}`.trim()}>{value}</span>;
}
