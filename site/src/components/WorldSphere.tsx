"use client";

/* ============================================================================
   World Sphere — a slowly rotating dot-matrix globe of the world. The
   continents are rendered as ~3k pearl points (Natural Earth 110m, sampled on
   a fibonacci sphere); the major financial centres sit on it at their true
   latitude/longitude, each flagged and clocked. The single charged accent
   (aqua) signals the ONE state worth showing: is this market trading now?
   Open centres glow steadily; the rest stays neutral so the map reads clean.

   City labels (flag + name + live time) are driven ONLY by rotation: each eases
   in as it turns onto the front face and eases out at the far limb — a stable
   priority resolves overlaps, so nothing ever pops or flickers at random.

   Why hand-rolled canvas, not WebGL: the site is a dependency-light static
   export and the brand is precise/minimal. A dotted land globe with one accent
   is lighter AND more on-brand than a Three.js earth.

   • Auto-rotates the moment the page loads ("intelligent motion graphics").
   • prefers-reduced-motion → a gentler, slower drift (it still rotates,
     by design — the globe is the hook).
   • Live time is client-only; SSR renders an empty canvas + an sr-only list
     (accessibility + crawlable), filled in after mount.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { LAND_LONLAT } from "@/lib/landDots";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Market {
  city: string;
  country: string;
  cc: string; // ISO-3166 alpha-2 → /flags/<cc>.svg
  index: string;
  tz: string;
  lat: number; // degrees, +N
  lon: number; // degrees, +E
  open: number; // local session open, minutes from midnight
  close: number; // local session close
}

/* The major exchanges, ordered west → east (keeps the trading-ring arcs tidy).
   Sessions are regular local hours; the glow is an at-a-glance cue, not a
   trading signal (holidays / half-days not modelled). */
const MARKETS: Market[] = [
  { city: "Mexico City", country: "Mexico", cc: "mx", index: "S&P/BMV IPC", tz: "America/Mexico_City", lat: 19.43, lon: -99.13, open: 510, close: 900 },
  { city: "Toronto", country: "Canada", cc: "ca", index: "S&P/TSX", tz: "America/Toronto", lat: 43.65, lon: -79.38, open: 570, close: 960 },
  { city: "New York", country: "United States", cc: "us", index: "S&P 500", tz: "America/New_York", lat: 40.71, lon: -74.01, open: 570, close: 960 },
  { city: "Buenos Aires", country: "Argentina", cc: "ar", index: "S&P Merval", tz: "America/Argentina/Buenos_Aires", lat: -34.6, lon: -58.38, open: 660, close: 1020 },
  { city: "São Paulo", country: "Brazil", cc: "br", index: "Ibovespa", tz: "America/Sao_Paulo", lat: -23.55, lon: -46.63, open: 600, close: 1020 },
  { city: "Madrid", country: "Spain", cc: "es", index: "IBEX 35", tz: "Europe/Madrid", lat: 40.42, lon: -3.7, open: 540, close: 1050 },
  { city: "London", country: "United Kingdom", cc: "gb", index: "FTSE 100", tz: "Europe/London", lat: 51.51, lon: -0.13, open: 480, close: 990 },
  { city: "Paris", country: "France", cc: "fr", index: "CAC 40", tz: "Europe/Paris", lat: 48.86, lon: 2.35, open: 540, close: 1050 },
  { city: "Amsterdam", country: "Netherlands", cc: "nl", index: "AEX", tz: "Europe/Amsterdam", lat: 52.37, lon: 4.9, open: 540, close: 1050 },
  { city: "Zurich", country: "Switzerland", cc: "ch", index: "SMI", tz: "Europe/Zurich", lat: 47.37, lon: 8.54, open: 540, close: 1050 },
  { city: "Frankfurt", country: "Germany", cc: "de", index: "DAX", tz: "Europe/Berlin", lat: 50.11, lon: 8.68, open: 540, close: 1050 },
  { city: "Milan", country: "Italy", cc: "it", index: "FTSE MIB", tz: "Europe/Rome", lat: 45.46, lon: 9.19, open: 540, close: 1050 },
  { city: "Stockholm", country: "Sweden", cc: "se", index: "OMXS30", tz: "Europe/Stockholm", lat: 59.33, lon: 18.07, open: 540, close: 1050 },
  { city: "Johannesburg", country: "South Africa", cc: "za", index: "JSE Top 40", tz: "Africa/Johannesburg", lat: -26.2, lon: 28.04, open: 540, close: 1020 },
  { city: "Istanbul", country: "Türkiye", cc: "tr", index: "BIST 100", tz: "Europe/Istanbul", lat: 41.01, lon: 28.98, open: 600, close: 1080 },
  { city: "Dubai", country: "United Arab Emirates", cc: "ae", index: "DFM General", tz: "Asia/Dubai", lat: 25.2, lon: 55.27, open: 600, close: 900 },
  { city: "Mumbai", country: "India", cc: "in", index: "NIFTY 50", tz: "Asia/Kolkata", lat: 19.08, lon: 72.88, open: 555, close: 930 },
  { city: "Bangkok", country: "Thailand", cc: "th", index: "SET", tz: "Asia/Bangkok", lat: 13.76, lon: 100.5, open: 600, close: 990 },
  { city: "Kuala Lumpur", country: "Malaysia", cc: "my", index: "KLCI", tz: "Asia/Kuala_Lumpur", lat: 3.14, lon: 101.69, open: 540, close: 1020 },
  { city: "Singapore", country: "Singapore", cc: "sg", index: "STI", tz: "Asia/Singapore", lat: 1.35, lon: 103.82, open: 540, close: 1020 },
  { city: "Jakarta", country: "Indonesia", cc: "id", index: "IDX Composite", tz: "Asia/Jakarta", lat: -6.21, lon: 106.85, open: 540, close: 950 },
  { city: "Hong Kong", country: "Hong Kong", cc: "hk", index: "Hang Seng", tz: "Asia/Hong_Kong", lat: 22.32, lon: 114.17, open: 570, close: 960 },
  { city: "Shanghai", country: "China", cc: "cn", index: "SSE Comp", tz: "Asia/Shanghai", lat: 31.23, lon: 121.47, open: 570, close: 900 },
  { city: "Taipei", country: "Taiwan", cc: "tw", index: "TAIEX", tz: "Asia/Taipei", lat: 25.03, lon: 121.57, open: 540, close: 810 },
  { city: "Seoul", country: "South Korea", cc: "kr", index: "KOSPI", tz: "Asia/Seoul", lat: 37.57, lon: 126.98, open: 540, close: 930 },
  { city: "Tokyo", country: "Japan", cc: "jp", index: "Nikkei 225", tz: "Asia/Tokyo", lat: 35.68, lon: 139.65, open: 540, close: 900 },
  { city: "Sydney", country: "Australia", cc: "au", index: "ASX 200", tz: "Australia/Sydney", lat: -33.87, lon: 151.21, open: 600, close: 960 },
  { city: "Wellington", country: "New Zealand", cc: "nz", index: "NZX 50", tz: "Pacific/Auckland", lat: -41.29, lon: 174.78, open: 600, close: 1005 },
];

/* Brand tokens, in sync with globals.css @theme (rgb triples for canvas). */
const C = {
  pearl: "238,238,238",
  aqua: "31,255,255",
  mist: "152,161,180",
  steel: "92,100,124",
};

const DEG = Math.PI / 180;
const TILT = 0.42; // axial tilt toward viewer — shows the northern centres
const SPIN = (2 * Math.PI) / 10; // rad/s — one revolution every 10s (lively, clearly moving)
const SPIN_REDUCED = (2 * Math.PI) / 45; // gentler drift under reduced motion

const FORMATTERS: Record<string, Intl.DateTimeFormat> = {};
for (const m of MARKETS) {
  FORMATTERS[m.tz] = new Intl.DateTimeFormat("en-GB", {
    timeZone: m.tz,
    hourCycle: "h23",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sphere(lat: number, lon: number): Vec3 {
  const phi = lat * DEG;
  const lam = lon * DEG;
  return { x: Math.cos(phi) * Math.sin(lam), y: Math.sin(phi), z: Math.cos(phi) * Math.cos(lam) };
}

function project(p: Vec3, theta: number): Vec3 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const x = p.x * ct + p.z * st;
  const z0 = -p.x * st + p.z * ct;
  const ca = Math.cos(TILT);
  const sa = Math.sin(TILT);
  return { x, y: p.y * ca - z0 * sa, z: p.y * sa + z0 * ca };
}

/* the continents — base unit-sphere points, built once from the embedded data */
const LAND: Vec3[] = [];
for (let i = 0; i < LAND_LONLAT.length; i += 2) LAND.push(sphere(LAND_LONLAT[i + 1], LAND_LONLAT[i]));

/* three faint latitude rings — just enough structure to read as a globe */
const RINGS: Vec3[][] = [];
for (const lat of [-30, 0, 30]) {
  const ring: Vec3[] = [];
  for (let lon = 0; lon <= 360; lon += 6) ring.push(sphere(lat, lon));
  RINGS.push(ring);
}

const CITY_BASE = MARKETS.map((m) => ({ m, v: sphere(m.lat, m.lon) }));

/* Fixed label priority (≈ global prominence). When two labels would overlap the
   higher-priority city keeps its label and the other stays hidden — a STABLE
   rule, so co-located centres (e.g. Zurich vs Frankfurt) never flicker as the
   globe turns; label visibility changes only with rotation, never at random. */
const PRIORITY = [
  "New York", "London", "Tokyo", "Hong Kong", "Shanghai", "Frankfurt", "Paris", "Toronto",
  "Sydney", "Singapore", "Mumbai", "Seoul", "Taipei", "Amsterdam", "Zurich", "Milan",
  "Madrid", "São Paulo", "Mexico City", "Stockholm", "Istanbul", "Dubai", "Johannesburg",
  "Jakarta", "Bangkok", "Kuala Lumpur", "Buenos Aires", "Wellington",
];
const RANK: Record<string, number> = {};
PRIORITY.forEach((c, i) => (RANK[c] = i));

interface TimeInfo {
  time: string;
  isOpen: boolean;
}

function computeTimes(now: Date): { times: Record<string, TimeInfo>; openCount: number } {
  const times: Record<string, TimeInfo> = {};
  let openCount = 0;
  for (const m of MARKETS) {
    const parts = Object.fromEntries(FORMATTERS[m.tz].formatToParts(now).map((p) => [p.type, p.value]));
    const time = `${parts.hour}:${parts.minute}`;
    const minutes = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
    const isWeekday = parts.weekday !== "Sat" && parts.weekday !== "Sun";
    const isOpen = isWeekday && minutes >= m.open && minutes < m.close;
    if (isOpen) openCount += 1;
    times[m.city] = { time, isOpen };
  }
  return { times, openCount };
}

interface CityProj {
  m: Market;
  sx: number;
  sy: number;
  depth: number;
  info: TimeInfo;
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function WorldSphere() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [openCount, setOpenCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const st = {
      theta: 0.4,
      times: {} as Record<string, TimeInfo>,
      hover: false,
      reduced: mq.matches,
      labelOp: {} as Record<string, number>, // eased per-city label opacity → no popping
      lastTs: performance.now(),
    };
    const onMq = () => {
      st.reduced = mq.matches;
    };
    mq.addEventListener?.("change", onMq);

    // preload the flag images once (drawn onto the canvas next to each city)
    const flags: Record<string, HTMLImageElement> = {};
    for (const m of MARKETS) {
      const img = new Image();
      img.src = `/flags/${m.cc}.svg`;
      flags[m.cc] = img;
    }

    let R = 0;
    let cx = 0;
    let cy = 0;
    let w = 0;
    let h = 0;

    function resize() {
      const rect = wrap!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(w, h) * 0.4;
      cx = w / 2;
      cy = h / 2;
    }

    function draw(ts: number) {
      if (w === 0 || h === 0) return;
      const theta = st.theta;
      ctx!.clearRect(0, 0, w, h);

      // (1) atmosphere — soft aqua halo past the rim
      const halo = ctx!.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
      halo.addColorStop(0, `rgba(${C.aqua},0.05)`);
      halo.addColorStop(0.55, `rgba(${C.aqua},0.015)`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, w, h);

      // (2) sphere body — shaded disc, light from upper-left, reads solid
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.clip();
      const body = ctx!.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R * 1.15);
      body.addColorStop(0, "rgba(22,32,60,0.95)");
      body.addColorStop(0.55, "rgba(12,18,36,0.92)");
      body.addColorStop(1, "rgba(6,10,20,0.97)");
      ctx!.fillStyle = body;
      ctx!.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx!.restore();

      // (3) the continents — dot-matrix world map, depth-faded
      for (const p of LAND) {
        const q = project(p, theta);
        if (q.z < -0.78) continue; // cull the extreme far cap
        const depth = (q.z + 1) / 2;
        ctx!.beginPath();
        ctx!.arc(cx + q.x * R, cy - q.y * R, 0.8 + depth * 0.8, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${C.pearl},${0.05 + depth * 0.42})`;
        ctx!.fill();
      }

      // (4) faint latitude rings
      for (const ring of RINGS) {
        for (let i = 0; i < ring.length - 1; i += 1) {
          const q1 = project(ring[i], theta);
          const q2 = project(ring[i + 1], theta);
          const depth = ((q1.z + q2.z) / 2 + 1) / 2;
          if (depth < 0.04) continue;
          ctx!.strokeStyle = `rgba(${C.pearl},${0.02 + depth * 0.08})`;
          ctx!.lineWidth = 0.6;
          ctx!.beginPath();
          ctx!.moveTo(cx + q1.x * R, cy - q1.y * R);
          ctx!.lineTo(cx + q2.x * R, cy - q2.y * R);
          ctx!.stroke();
        }
      }

      // rim
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.strokeStyle = `rgba(${C.pearl},0.1)`;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // (5) city nodes — depth-sorted, a steady glow when open
      const proj: CityProj[] = CITY_BASE.map(({ m, v }) => {
        const q = project(v, theta);
        return { m, sx: cx + q.x * R, sy: cy - q.y * R, depth: (q.z + 1) / 2, info: st.times[m.city] ?? { time: "--:--", isOpen: false } };
      });
      for (const c of [...proj].sort((a, b) => a.depth - b.depth)) {
        const a = 0.25 + c.depth * 0.75;
        if (c.info.isOpen) {
          ctx!.shadowColor = `rgba(${C.aqua},0.95)`;
          ctx!.shadowBlur = 7 + c.depth * 11;
          ctx!.beginPath();
          ctx!.arc(c.sx, c.sy, 2.4 + c.depth * 1.4, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${C.aqua},${a})`;
          ctx!.fill();
          ctx!.shadowBlur = 0;
        } else {
          ctx!.beginPath();
          ctx!.arc(c.sx, c.sy, 1.6 + c.depth, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${C.mist},${a * 0.92})`;
          ctx!.fill();
        }
      }

      // (6) labels — flag + city + live time. Visibility is driven ONLY by
      //     rotation: a city eases in as it turns onto the front face and eases
      //     out at the far limb. A stable priority resolves overlaps, and every
      //     opacity is eased frame-to-frame, so nothing ever pops in/out.
      ctx!.textBaseline = "middle";
      ctx!.textAlign = "left";
      const FW = 18;
      const FH = 12;

      // measure a label box for each front-facing city
      const boxes = new Map<string, { box: { x: number; y: number; w: number; h: number }; bx: number; side: number }>();
      const front = proj.filter((c) => c.depth > 0.5);
      for (const c of front) {
        ctx!.font = '600 12px "Switzer", ui-sans-serif, system-ui, sans-serif';
        const cityW = ctx!.measureText(c.m.city).width;
        ctx!.font = '11px "Courier Prime", ui-monospace, monospace';
        const timeW = ctx!.measureText(c.info.time).width;
        const boxW = Math.max(FW + 6 + cityW, timeW) + 4;
        const boxH = 24;
        const side = c.sx > cx ? -1 : 1;
        const bx = side === 1 ? c.sx + 11 : c.sx - 11 - boxW;
        boxes.set(c.m.city, { box: { x: bx, y: c.sy - boxH / 2, w: boxW, h: boxH }, bx, side });
      }

      // choose visible labels in STABLE priority order (greedy, no overlap)
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const shown = new Set<string>();
      for (const c of [...front].sort((x, y) => (RANK[x.m.city] ?? 99) - (RANK[y.m.city] ?? 99))) {
        const b = boxes.get(c.m.city)!.box;
        if (placed.some((p) => overlaps(p, b))) continue;
        placed.push(b);
        shown.add(c.m.city);
      }

      // ease every label toward its target opacity, then draw front-most on top
      const dt = Math.min(Math.max(ts - st.lastTs, 0), 100) / 1000;
      st.lastTs = ts;
      const ease = Math.min(1, dt * 6);
      for (const c of [...proj].sort((a, b) => a.depth - b.depth)) {
        const depthFade = Math.min(1, (c.depth - 0.5) / 0.22);
        const target = shown.has(c.m.city) ? Math.max(0, depthFade) : 0;
        const prev = st.labelOp[c.m.city] ?? 0;
        const op = prev + (target - prev) * ease;
        st.labelOp[c.m.city] = op;
        if (op < 0.02 || !boxes.has(c.m.city)) continue;
        const meta = boxes.get(c.m.city)!;
        const bx = meta.bx;
        const side = meta.side;
        const fy = c.sy - 5;

        // leader line
        ctx!.strokeStyle = `rgba(${C.pearl},${0.16 * op})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(c.sx + side * 4, c.sy);
        ctx!.lineTo(side === 1 ? bx : bx + meta.box.w, c.sy);
        ctx!.stroke();

        // flag + city (upper line)
        const fl = flags[c.m.cc];
        if (fl && fl.complete && fl.naturalWidth > 0) {
          ctx!.globalAlpha = op;
          ctx!.drawImage(fl, bx, fy - FH / 2, FW, FH);
          ctx!.globalAlpha = 1;
          ctx!.strokeStyle = `rgba(${C.pearl},${0.2 * op})`;
          ctx!.lineWidth = 0.5;
          ctx!.strokeRect(bx, fy - FH / 2, FW, FH);
        }
        ctx!.font = '600 12px "Switzer", ui-sans-serif, system-ui, sans-serif';
        ctx!.fillStyle = `rgba(${C.pearl},${0.95 * op})`;
        ctx!.fillText(c.m.city, bx + FW + 6, fy);

        // live time (lower line)
        ctx!.font = '11px "Courier Prime", ui-monospace, monospace';
        ctx!.fillStyle = c.info.isOpen ? `rgba(${C.aqua},${0.95 * op})` : `rgba(${C.mist},${0.85 * op})`;
        ctx!.fillText(c.info.time, bx, c.sy + 8);
      }
    }

    function tick() {
      const r = computeTimes(new Date());
      st.times = r.times;
      setOpenCount(r.openCount);
    }

    const onEnter = () => {
      st.hover = true;
    };
    const onLeave = () => {
      st.hover = false;
    };
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    tick();
    const timeId = window.setInterval(tick, 1000);

    let raf = 0;
    let last = performance.now();
    function frame(ts: number) {
      const dt = Math.min(ts - last, 50) / 1000;
      last = ts;
      const base = st.reduced ? SPIN_REDUCED : SPIN;
      st.theta += dt * base * (st.hover ? 0.25 : 1); // slow on hover, never frozen
      draw(ts);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // redraw once webfonts + flags settle so canvas picks them up
    document.fonts?.ready.then(() => draw(performance.now()));

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timeId);
      ro.disconnect();
      mq.removeEventListener?.("change", onMq);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div ref={wrapRef} className="relative aspect-square w-full">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          role="img"
          aria-label={`Rotating globe of the world's major stock exchanges with live local times. ${openCount} of ${MARKETS.length} markets trading now.`}
        />
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
        <span className="t-mono text-[0.62rem] uppercase tracking-[0.2em] text-mist">
          {mounted ? openCount : 0} of {MARKETS.length} markets trading now
        </span>
      </div>

      {/* crawlable / screen-reader fallback */}
      <ul className="sr-only">
        {MARKETS.map((m) => (
          <li key={m.city}>
            {m.city}, {m.country} — {m.index}
          </li>
        ))}
      </ul>
    </div>
  );
}
