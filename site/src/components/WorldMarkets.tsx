"use client";

/* ============================================================================
   World Markets ticker — the major financial centres, their flagship index,
   and live local time. The single charged accent (aqua) is reserved for the
   ONE state worth signalling: is this market trading right now? An open market
   breathes; a closed one rests. Motion = meaning, not decoration.

   • Auto-scrolls, but pauses on hover/focus so a reader can actually read it.
   • prefers-reduced-motion → no drift, no pulse: a static, scrollable row.
   • Live time is client-only; SSR renders a stable placeholder (no hydration
     mismatch), filled in after mount.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import { FlashValue } from "@/components/motion/FlashValue";

interface Market {
  city: string;
  country: string; // for the flag alt text
  cc: string; // ISO-3166 alpha-2 → /flags/<cc>.svg
  index: string;
  tz: string;
  open: number; // local session open, minutes from midnight
  close: number; // local session close
}

/* Ordered west → east so the band reads like the trading day moving round the
   globe. Largest centres by market cap. Sessions are regular hours (holidays
   not modelled — the dot is an at-a-glance cue, not a trading signal). */
const MARKETS: Market[] = [
  { city: "São Paulo", country: "Brazil", cc: "br", index: "Ibovespa", tz: "America/Sao_Paulo", open: 600, close: 1020 },
  { city: "New York", country: "United States", cc: "us", index: "S&P 500", tz: "America/New_York", open: 570, close: 960 },
  { city: "Toronto", country: "Canada", cc: "ca", index: "S&P/TSX", tz: "America/Toronto", open: 570, close: 960 },
  { city: "London", country: "United Kingdom", cc: "gb", index: "FTSE 100", tz: "Europe/London", open: 480, close: 990 },
  { city: "Frankfurt", country: "Germany", cc: "de", index: "DAX", tz: "Europe/Berlin", open: 540, close: 1050 },
  { city: "Paris", country: "France", cc: "fr", index: "CAC 40", tz: "Europe/Paris", open: 540, close: 1050 },
  { city: "Zurich", country: "Switzerland", cc: "ch", index: "SMI", tz: "Europe/Zurich", open: 540, close: 1050 },
  { city: "Mumbai", country: "India", cc: "in", index: "NIFTY 50", tz: "Asia/Kolkata", open: 555, close: 930 },
  { city: "Singapore", country: "Singapore", cc: "sg", index: "STI", tz: "Asia/Singapore", open: 540, close: 1020 },
  { city: "Hong Kong", country: "Hong Kong", cc: "hk", index: "Hang Seng", tz: "Asia/Hong_Kong", open: 570, close: 960 },
  { city: "Shanghai", country: "China", cc: "cn", index: "SSE Comp", tz: "Asia/Shanghai", open: 570, close: 900 },
  { city: "Seoul", country: "South Korea", cc: "kr", index: "KOSPI", tz: "Asia/Seoul", open: 540, close: 930 },
  { city: "Tokyo", country: "Japan", cc: "jp", index: "Nikkei 225", tz: "Asia/Tokyo", open: 540, close: 900 },
  { city: "Sydney", country: "Australia", cc: "au", index: "ASX 200", tz: "Australia/Sydney", open: 600, close: 960 },
];

const PLACEHOLDER = "--:--";

function Cell({ m, now, fmt }: { m: Market; now: Date | null; fmt: Intl.DateTimeFormat }) {
  let time = PLACEHOLDER;
  let isOpen = false;

  if (now) {
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    time = `${parts.hour}:${parts.minute}`;
    const minutes = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
    const weekday = parts.weekday;
    const isWeekday = weekday !== "Sat" && weekday !== "Sun";
    isOpen = isWeekday && minutes >= m.open && minutes < m.close;
  }

  return (
    <span className="flex shrink-0 items-center gap-3 px-7">
      <span
        className={
          isOpen
            ? "live-dot inline-block h-1.5 w-1.5 rounded-full bg-aqua"
            : "inline-block h-1.5 w-1.5 rounded-full bg-steel/40"
        }
        aria-hidden="true"
      />
      {/* eslint-disable-next-line @next/next/no-img-element — tiny static flag, plain img avoids next/image export config */}
      <img
        src={`/flags/${m.cc}.svg`}
        alt={`${m.country} flag`}
        width={20}
        height={14}
        loading="lazy"
        className="h-3.5 w-5 shrink-0 rounded-[1px] object-cover ring-1 ring-pearl/15"
      />
      <span className="text-sm text-pearl">{m.city}</span>
      <span className="t-mono text-[0.68rem] uppercase tracking-[0.12em] text-aqua/70">{m.index}</span>
      <span className="tnum t-mono text-xs text-mist">{time}</span>
      <span className="ml-4 h-3 w-px bg-pearl/10" aria-hidden="true" />
    </span>
  );
}

export function WorldMarkets() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // one formatter per timezone, built once
  const formatters = useMemo(() => {
    const map: Record<string, Intl.DateTimeFormat> = {};
    for (const m of MARKETS) {
      map[m.tz] = new Intl.DateTimeFormat("en-GB", {
        timeZone: m.tz,
        hourCycle: "h23",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return map;
  }, []);

  const openCount = useMemo(() => {
    if (!now) return 0;
    return MARKETS.reduce((acc, m) => {
      const parts = Object.fromEntries(formatters[m.tz].formatToParts(now).map((p) => [p.type, p.value]));
      const minutes = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
      const isWeekday = parts.weekday !== "Sat" && parts.weekday !== "Sun";
      return acc + (isWeekday && minutes >= m.open && minutes < m.close ? 1 : 0);
    }, 0);
  }, [now, formatters]);

  return (
    <div
      className="relative overflow-hidden border-y border-pearl/10 bg-navy-sunken/60 py-3"
      aria-label="World markets — live local time and trading status"
    >
      {/* fixed label anchors the tape over the fading edge */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center gap-2 bg-navy-sunken/95 pl-6 pr-8 [mask-image:linear-gradient(to_right,#000_70%,transparent)]">
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
        <span className="t-mono text-[0.6rem] uppercase tracking-[0.22em] text-mist">
          {openCount > 0 ? (
            <>
              <FlashValue value={openCount} /> open
            </>
          ) : (
            "Markets"
          )}
        </span>
      </div>

      <div className="ticker-mask">
        <div className="marquee items-center" style={{ animationDuration: "90s" }}>
          {[0, 1].map((dup) => (
            <span key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {MARKETS.map((m) => (
                <Cell key={`${dup}-${m.city}`} m={m} now={now} fmt={formatters[m.tz]} />
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
