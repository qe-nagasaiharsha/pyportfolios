"use client";

/* World-markets ticker — a scrolling ribbon of the major financial centres with
   their live local times and an open/closed market dot. Mirrors the v5 slogan
   marquee, themed for data. Times are filled in after mount (so server and
   client agree), then tick every second. Pauses on hover and for reduced-motion
   (the .ticker-mask CSS handles the calm fallback). */

import { useEffect, useState } from "react";

interface Centre {
  city: string;
  flag: string; // /public/flags/<flag>.svg
  tz: string; // IANA timezone
  open?: string; // local "HH:MM" exchange open
  close?: string; // local "HH:MM" exchange close
  days?: number[]; // trading weekdays (0=Sun … 6=Sat); default Mon–Fri
}

// East → West, following the trading day around the globe.
const CENTRES: Centre[] = [
  { city: "Sydney", flag: "au", tz: "Australia/Sydney", open: "10:00", close: "16:00" },
  { city: "Tokyo", flag: "jp", tz: "Asia/Tokyo", open: "09:00", close: "15:00" },
  { city: "Seoul", flag: "kr", tz: "Asia/Seoul", open: "09:00", close: "15:30" },
  { city: "Shanghai", flag: "cn", tz: "Asia/Shanghai", open: "09:30", close: "15:00" },
  { city: "Hong Kong", flag: "hk", tz: "Asia/Hong_Kong", open: "09:30", close: "16:00" },
  { city: "Singapore", flag: "sg", tz: "Asia/Singapore", open: "09:00", close: "17:00" },
  { city: "Mumbai", flag: "in", tz: "Asia/Kolkata", open: "09:15", close: "15:30" },
  { city: "Dubai", flag: "ae", tz: "Asia/Dubai", open: "10:00", close: "15:00" },
  { city: "Moscow", flag: "ru", tz: "Europe/Moscow", open: "10:00", close: "18:45" },
  { city: "Tel Aviv", flag: "il", tz: "Asia/Jerusalem", open: "09:45", close: "17:15", days: [0, 1, 2, 3, 4] },
  { city: "Frankfurt", flag: "de", tz: "Europe/Berlin", open: "09:00", close: "17:30" },
  { city: "Paris", flag: "fr", tz: "Europe/Paris", open: "09:00", close: "17:30" },
  { city: "Milan", flag: "it", tz: "Europe/Rome", open: "09:00", close: "17:30" },
  { city: "Madrid", flag: "es", tz: "Europe/Madrid", open: "09:00", close: "17:30" },
  { city: "London", flag: "gb", tz: "Europe/London", open: "08:00", close: "16:30" },
  { city: "São Paulo", flag: "br", tz: "America/Sao_Paulo", open: "10:00", close: "17:00" },
  { city: "Mexico City", flag: "mx", tz: "America/Mexico_City", open: "08:30", close: "15:00" },
  { city: "New York", flag: "us", tz: "America/New_York", open: "09:30", close: "16:00" },
  { city: "Toronto", flag: "ca", tz: "America/Toronto", open: "09:30", close: "16:00" },
  { city: "Chicago", flag: "us", tz: "America/Chicago", open: "08:30", close: "15:00" },
  { city: "San Francisco", flag: "us", tz: "America/Los_Angeles" },
];

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function readClock(c: Centre, now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: c.tz,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hh = get("hour");
  const mm = get("minute");
  const time = `${hh}:${mm}`;

  let open: boolean | null = null;
  if (c.open && c.close) {
    const days = c.days ?? [1, 2, 3, 4, 5];
    const wd = WD[get("weekday")];
    const cur = Number(hh) * 60 + Number(mm);
    const [oh, om] = c.open.split(":").map(Number);
    const [ch, cm] = c.close.split(":").map(Number);
    open = days.includes(wd) && cur >= oh * 60 + om && cur < ch * 60 + cm;
  }
  return { time, open };
}

function Item({ c, now }: { c: Centre; now: Date | null }) {
  const { time, open } = now ? readClock(c, now) : { time: "--:--", open: null };
  return (
    <span className="flex shrink-0 items-center gap-2.5 px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/flags/${c.flag}.svg`} alt="" className="h-3 w-[1.15rem] shrink-0 rounded-[1px] object-cover opacity-90" />
      <span className="t-mono text-[0.7rem] uppercase leading-none tracking-[0.14em] text-pearl/70">{c.city}</span>
      <span className="tnum t-mono text-[0.78rem] leading-none text-pearl">{time}</span>
      {open !== null ? (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${open ? "live-dot bg-aqua" : "bg-steel/60"}`}
          title={open ? "Market open" : "Market closed"}
          aria-hidden="true"
        />
      ) : null}
      <span className="ml-1 text-aqua/25" aria-hidden="true">/</span>
    </span>
  );
}

// Minutes east of UTC for an IANA zone at a given instant (DST-aware).
function zoneOffset(tz: string, at: Date): number {
  const utc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(at.toLocaleString("en-US", { timeZone: tz }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

export function WorldClockBand() {
  const [now, setNow] = useState<Date | null>(null);
  // Ordered by current UTC offset (latest local time first) so the ticker reads
  // cleanly East→West; sorted on mount so DST is always respected.
  const [order, setOrder] = useState<Centre[]>(CENTRES);
  useEffect(() => {
    const n = new Date();
    setNow(n);
    setOrder([...CENTRES].sort((a, b) => zoneOffset(b.tz, n) - zoneOffset(a.tz, n)));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="world-clock"
      className="ticker-mask relative overflow-hidden border-t border-pearl/15 bg-navy-sunken/55 py-3 backdrop-blur-md"
      aria-label="Major financial centres and their local times"
    >
      <div className="marquee items-center">
        {[0, 1].map((dup) => (
          <span key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {order.map((c) => (
              <Item key={`${dup}-${c.city}`} c={c} now={now} />
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
