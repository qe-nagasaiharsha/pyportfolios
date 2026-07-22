import fs from "node:fs";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  TableOfContents, PageBreak, PageNumber, Header, Footer,
} from "docx";

/* ---------- palette ---------- */
const NAVY = "0A0C14", AQUA = "0A8A8A", TEAL = "0A8A8A";
const CODE_BG = "F3F4F6", PLAIN_BG = "E6FAFA", NOTE_BG = "F5F3EA", TH_BG = "D9E2EC";
const GREY = "55606E";
const CONTENT_W = 9360;

/* ---------- helpers ---------- */
const t = (text, opts = {}) => new TextRun({ text, ...opts });
const P = (children, opts = {}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [t(children)], spacing: { after: 120, line: 276 }, ...opts });

const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(text)] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [t(text)] });

const bullet = (children) =>
  new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 60, line: 270 },
    children: Array.isArray(children) ? children : [t(children)] });

/* single-cell shaded box (used for code / callouts / notes) */
function box(paras, fill, { left } = {}) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      borders: left
        ? { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            left: { style: BorderStyle.SINGLE, size: 18, color: left } }
        : undefined,
      children: paras,
    })] })],
  });
}

const code = (lines) =>
  box(lines.map((ln) => new Paragraph({ spacing: { after: 0, line: 252 },
    children: [t(ln === "" ? " " : ln, { font: "Consolas", size: 18, color: "1F2937" })] })), CODE_BG);

const plain = (text) =>
  box([
    new Paragraph({ spacing: { after: 40 }, children: [t("IN PLAIN ENGLISH", { bold: true, color: TEAL, size: 16 })] }),
    new Paragraph({ spacing: { after: 0, line: 276 }, children: [t(text, { italics: true, color: "1F2937" })] }),
  ], PLAIN_BG, { left: TEAL });

const note = (runs) =>
  box([new Paragraph({ spacing: { after: 0, line: 276 }, children: Array.isArray(runs) ? runs : [t(runs)] })], NOTE_BG, { left: "B8A95E" });

function table(headers, rows, widths) {
  const mk = (text, header) => new TableCell({
    width: { size: widths[0], type: WidthType.DXA },
    shading: header ? { fill: TH_BG, type: ShadingType.CLEAR } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({ spacing: { after: 0, line: 264 },
      children: [t(text, { bold: !!header, size: header ? 16 : 19, color: header ? "33415A" : "1F2937", font: text && text.__mono ? "Consolas" : undefined })] })],
  });
  const cell = (val, i, header = false) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: header ? { fill: TH_BG, type: ShadingType.CLEAR } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({ spacing: { after: 0, line: 264 }, children: renderCell(val, header) })],
  });
  const headRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) });
  const bodyRows = rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i)) }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
}
/* a cell value can be a string, or {code:"..."} for monospace, or array of runs */
function renderCell(val, header) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object" && "code" in val)
    return [t(val.code, { font: "Consolas", size: 17, color: "0B5563" })];
  return [t(String(val), { bold: !!header, size: header ? 16 : 19, color: header ? "33415A" : "1F2937" })];
}
const mono = (code) => ({ code });

/* ---------- document body ---------- */
const body = [];
const push = (...x) => body.push(...x);

/* title page */
push(
  new Paragraph({ spacing: { before: 2600, after: 0 }, alignment: AlignmentType.CENTER,
    children: [t("pyportfolios", { bold: true, size: 60, color: NAVY }), t(".", { bold: true, size: 60, color: AQUA }), t("com", { bold: true, size: 60, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [t("CODEBASE DOCUMENTATION", { size: 22, color: GREY, allCaps: false })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [t("A comprehensive, plain-English + technical guide to the architecture and code", { italics: true, size: 20, color: GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
    children: [t("Next.js 16  ·  React 19  ·  TypeScript  ·  Tailwind v4  ·  Static export", { size: 18, color: GREY })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

/* TOC */
push(H1("Contents"),
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }));

/* ===== 1 Overview ===== */
push(H1("1. Overview"));
push(P("pyportfolios.com is an educational platform that bridges quantitative-finance theory with practical Python. The website is a marketing landing page plus a small content site: research articles, a course outline, and a literature canon."));
push(plain("Think of the whole project as a very fancy, fast-loading brochure plus a library. There is no server doing work when a visitor arrives — every page is pre-baked into plain HTML files ahead of time and simply handed over. That makes it cheap, fast, and hard to break."));
push(H2("The technology, in one glance"));
push(table(["Layer", "Tool", "Why it's here"], [
  ["Framework", mono("Next.js 16.2.6"), "Organizes pages, routing, and the build into static HTML"],
  ["UI library", mono("React 19.2.4"), "Builds the interface from reusable components"],
  ["Language", mono("TypeScript 5"), "JavaScript + type safety (catches mistakes before shipping)"],
  ["Styling", mono("Tailwind CSS v4"), "Utility classes + a CSS-first design-token system"],
  ["Smooth scroll", mono("Lenis 1.3.23"), "The buttery momentum scrolling feel"],
  ["Tests / shots", mono("Playwright"), "Automated version screenshots (dev only)"],
  ["Hosting", mono("nginx"), "Serves the pre-built out/ folder — no Node.js at runtime"],
], [1900, 2300, 5160]));
push(H2("The big picture"));
push(bullet([t("Pre-rendered: ", { bold: true }), t("everything is generated at build time into static HTML ("), t("output: \"export\"", { font: "Consolas", size: 18 }), t("). Visitors download files, not computed responses.")]));
push(bullet([t("Component-driven: ", { bold: true }), t("the UI is assembled from ~30 small React components that snap together.")]));
push(bullet([t("Data-driven: ", { bold: true }), t("all content lives in plain TypeScript files under src/lib/. No database, no CMS.")]));
push(H2("What lives where (top level)"));
push(code([
  "pyportfolios/",
  "|- site/              # the Next.js app (all the real code)",
  "|  |- src/app/        # pages & routes (App Router)",
  "|  |- src/components/ # React UI building blocks",
  "|  |- src/lib/        # content as data (articles, course, variants...)",
  "|  |- src/content/    # article prose (hand-written React)",
  "|  |- src/fonts/      # self-hosted Switzer font files",
  "|  |- public/         # images, logos, flags, notebooks",
  "|  '- next.config.ts  # build config (static export)",
  "|- deploy/            # nginx configs",
  "'- DOCUMENTATION.html # interactive tabbed version",
]));

/* ===== 2 Architecture ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("2. Architecture & Build"));
push(P("The site uses Next.js's App Router with static export. Three ideas explain nearly everything: static export, server vs. client components, and the data -> component -> page flow."));
push(H2("1. Static export (\"no server\")"));
push(code(["// next.config.ts", "const nextConfig = {", "  output: \"export\",   // build into plain HTML files (out/)", "};"]));
push(P("At build time, Next.js runs every page once, renders the HTML, and writes it to an out/ folder. nginx then serves those files directly."));
push(plain("Most websites cook each page fresh when you ask for it. This one cooks all the pages in advance and keeps them ready on a shelf. When you visit, you just grab the finished plate."));
push(H2("2. Server vs. Client components"));
push(P("Components are Server Components by default — rendered once at build time into HTML, shipping zero JavaScript. A component adds \"use client\" to become interactive: its JavaScript is sent to the browser and runs there."));
push(table(["Type", "Marker", "Runs", "Examples"], [
  ["Server (default)", "—", "Build time -> HTML", "StyleTile, Pricing, FAQ, logo rows, charts"],
  ["Client", mono("\"use client\""), "In the browser", "WorldSphere, WorldClockBand, Lightbox, PageTOC, EarlyAccess, SmoothScroll, ScrollReveal"],
], [2100, 1700, 1900, 3660]));
push(plain("Static parts (text, layout, logos) are printed once and need no brain. Only the genuinely live parts (the spinning globe, ticking clocks, click-to-zoom) carry a little JavaScript brain that wakes up in your browser."));
push(H2("3. The data -> component -> page flow"));
push(P("Content is never hard-coded inside pages. A page imports arrays/objects from src/lib/*, loops over them, and feeds each item into a presentational component. To add an article, course module, or book, you edit a data file — not the layout."));
push(note([t("Next.js 16 gotcha: ", { bold: true }), t("route params are now async. Pages do "), t("const { slug } = await params;", { font: "Consolas", size: 18 }), t(". The repo's AGENTS.md warns this version differs from older Next.js — check the bundled docs before editing routing.")]));

/* ===== 3 Routing ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("3. Routing & Pages"));
push(P("Next.js's App Router maps folders under src/app/ to URLs. A folder with page.tsx becomes a route; [brackets] mean a dynamic segment."));
push(H2("The full URL map"));
push(table(["URL", "File", "What it is"], [
  [mono("/"), mono("app/page.tsx"), "Home — renders the v0 landing"],
  [mono("/v0 ... /v6, /v11"), mono("app/[version]/page.tsx"), "Design variants (A/B versions)"],
  [mono("/research"), mono("app/research/page.tsx"), "Article index (8 articles, 4 categories)"],
  [mono("/research/<slug>"), mono("app/research/[slug]/page.tsx"), "One article (8 total)"],
  [mono("/course"), mono("app/course/page.tsx"), "Course outline (7 modules, 28 lessons)"],
  [mono("/literature"), mono("app/literature/page.tsx"), "Books & landmark papers canon"],
  [mono("/parked"), mono("app/parked/page.tsx"), "Staging for removed sections (no-index)"],
], [2400, 3360, 3600]));
push(H2("The root layout wraps everything"));
push(P("app/layout.tsx is the shell every page lives inside. It loads the three fonts, sets global metadata, and mounts <SmoothScroll/> (Lenis) so momentum scrolling applies site-wide."));
push(H2("Dynamic routes & pre-generation"));
push(P("Variant and article routes are dynamic, but the site is fully static — so Next.js needs every valid value up front via generateStaticParams(), paired with dynamicParams = false (anything not listed -> 404)."));
push(code([
  "// app/research/[slug]/page.tsx",
  "export const dynamicParams = false;            // only known slugs exist",
  "export function generateStaticParams(){",
  "  return ARTICLE_SLUGS.map(slug => ({ slug })); // build one page per article",
  "}",
  "export default async function ArticlePage({ params }){",
  "  const { slug } = await params;            // Next 16: params is async",
  "  const Body = BODIES[slug];               // the hand-written prose component",
  "  if(!article || !Body) notFound();",
  "  return <ArticleLayout article={article}><Body/></ArticleLayout>;",
  "}",
]));
push(plain("Because there's no live server, the site can't invent a page on demand. At build time it asks each section for its full list of items and prints one page for every one. Ask for a URL that wasn't on the list and you get a 404."));
push(H2("The variant system"));
push(P("Versions v0–v6 render the same StyleTile component with different feature flags toggled on; v11 (\"The Quarterly\") renders a separate EditorialTile layout. Flags decide whether extras like the crest, photography, or the live globe appear."));

/* ===== 4 Components ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("4. Components"));
push(P("Around 30 components, grouped by role. StyleTile is the conductor that arranges the landing page; everything else is an instrument it plays."));
push(H2("Core composition"));
push(table(["Component", "Role"], [
  [mono("StyleTile.tsx"), "The whole landing page. Renders, in order: Hero, World-clock ticker, Our Focus, Libraries, Markets, (Imagery), Geographies, Concepts, Pricing, FAQ, Early access, Footer. Holds data constants (NAV, PILLARS, MARKETS, MODELS) and helpers (SectionLabel, HeroCurve, FigureCovariance)."],
  [mono("EditorialTile.tsx"), "The alternate \"Quarterly\" magazine layout used by /v11."],
  [mono("VersionSwitcher.tsx"), "Client. The sticky V0–V11 toggle strip for browsing design variants."],
], [2500, 6860]));
push(H2("Brand components (src/components/brand)"));
push(table(["Component", "What it draws"], [
  [mono("Crest.tsx"), "Monoline shield-and-sword logo (pure SVG). CrestLockup = crest + wordmark."],
  [mono("PhotoBackdrop.tsx"), "Full-bleed background photo with readability gradients (hero & footer)."],
  [mono("PhotoPlate.tsx"), "Duotone SVG placeholder art (skyline / summit) until real photos drop in."],
  [mono("StackCards.tsx"), "White logo-chip grid of the Python quant stack (scikit-learn, PyTorch...)."],
  [mono("ExchangeRow.tsx"), "Exchange logos grouped by region (NYSE, LSE, JPX...)."],
  [mono("SectorsIndices.tsx"), "GICS sectors, country indices, and index-provider logos."],
  [mono("WorldMap.tsx"), "Dotted map highlighting the top-15 economies; also exports EXCHANGES_BY_REGION."],
  [mono("WorldClockBand.tsx"), "Client. Scrolling ticker of financial centres with live local times + market-open dots."],
], [2500, 6860]));
push(H2("Landing components (src/components/landing)"));
push(table(["Component", "Role"], [
  [mono("Pricing.tsx"), "Three-tier pricing cards (Starter / Pro / Enterprise); CTAs point to email capture."],
  [mono("FAQ.tsx"), "Accordion built on native <details> — zero custom JS."],
  [mono("EarlyAccess.tsx"), "Client. Email waitlist form with a state machine (idle -> loading -> done/error)."],
  [mono("PageTOC.tsx"), "Client. On-this-page table of contents with scroll-spy."],
  [mono("Lightbox.tsx"), "Client. Click-to-enlarge overlay for the map, logos, and SVG charts."],
  [mono("ParkedSections.tsx"), "Sections removed from the live page, kept on /parked for review."],
], [2500, 6860]));
push(H2("Motion, charts & article prose"));
push(table(["Component", "Role"], [
  [mono("motion/SmoothScroll.tsx"), "Client. Lenis momentum scrolling + routes #anchor clicks through an eased scroll."],
  [mono("motion/ScrollReveal.tsx"), "Client. Fades/animates elements in as they enter the viewport (IntersectionObserver)."],
  [mono("charts/ReturnsHistogram.tsx"), "SVG histogram of daily returns with the VaR loss-tail shaded."],
  [mono("WorldSphere.tsx"), "Client. The auto-rotating 3D globe (HTML canvas, hand-rolled projection — no Three.js)."],
  [mono("article/* (prose)"), "Section, P, Callout, CodeBlock, DataTable, Figure, References, wrapped by ArticleLayout."],
], [2500, 6860]));
push(plain("Picture a set of LEGO bricks. Brand bricks are logos and the crest; landing bricks are the pricing table and FAQ; motion bricks add movement; article bricks are paragraph and figure shapes for essays. StyleTile is the instruction booklet for the home page."));

/* ===== 5 Data ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("5. Data & Content"));
push(P("The site has no database. Every list of things — articles, course modules, books, design variants — is a typed array in src/lib/. Pages import these and render them. This is the single most important pattern for editing content."));
push(H2("The data files"));
push(table(["File", "Holds", "Key exports"], [
  [mono("lib/variants.ts"), "8 design versions + feature flags", "VARIANTS, VARIANT_IDS, VARIANT_LIST"],
  [mono("lib/articles.ts"), "8 research articles + 4 categories", "ARTICLES, getArticle(), articlesByCategory()"],
  [mono("lib/course.ts"), "7 modules, 28 lessons", "MODULES, MODULE_COUNT, LESSON_COUNT, TOTAL_MINUTES"],
  [mono("lib/literature.ts"), "Book groups + landmark papers", "BOOK_GROUPS, PAPERS, counts"],
], [2300, 3360, 3700]));
push(H2("Where article prose lives"));
push(P("Article metadata (title, date, reading time, stack, TOC) sits in lib/articles.ts. The article body is a hand-written React component in src/content/articles/<slug>.tsx — not Markdown — so figures and code can be crafted precisely. A registry wires slug -> component, and each article ships a runnable Jupyter notebook in public/notebooks/<slug>.ipynb."));
push(H2("The variant flags"));
push(table(["Version", "Adds", "Flag"], [
  ["v0", "Baseline \"Quant Research House\"", "all off"],
  ["v1", "Crest & wordmark", mono("crest")],
  ["v2", "Editorial photography", mono("photography")],
  ["v3", "Stack logo cards", mono("stackCards")],
  ["v4", "World map / market reach", mono("worldMap")],
  ["v5", "Slogan voice", mono("slogans")],
  ["v6", "Live rotating globe", mono("globe")],
  ["v11", "Separate magazine layout", "EditorialTile"],
], [1600, 4760, 3000]));
push(plain("Adding a new article is like adding a row to a spreadsheet: fill in its details in articles.ts, write its essay file, drop in its notebook — and the index page, the article page, and any cross-links appear automatically."));

/* ===== 6 Design ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("6. Design System"));
push(P("All visual decisions flow from a small set of design tokens declared once in src/app/globals.css using Tailwind v4's @theme block. Change a token, and it updates everywhere."));
push(H2("The colour palette"));
push(table(["Token", "Hex", "Use"], [
  [mono("navy"), "#0a0c14", "Primary dark canvas"],
  [mono("navy-elevated"), "#11141d", "Cards, raised surfaces"],
  [mono("navy-sunken"), "#07080e", "Footer, deepest layer"],
  [mono("pearl"), "#eeeeee", "Primary text on dark"],
  [mono("mist"), "#b4bcce", "Muted body text"],
  [mono("steel"), "#9ca4ba", "Captions, metadata"],
  [mono("aqua"), "#1fffff", "The single charged accent — used sparingly"],
  [mono("sisal"), "#f4f2e8", "Light reading canvas"],
  [mono("anthracite"), "#151515", "Near-black ink"],
], [2400, 1900, 5060]));
push(note([t("Hairlines and tints are derived with color-mix() (e.g. borders = pearl at 8–14% opacity), so opacities stay consistent without new variables.")]));
push(H2("Typography — three voices"));
push(table(["Role", "Font", "Loaded via", "Used by"], [
  ["Serif (headings)", "Lora", "next/font/google", "t-display, t-h1, t-h2, dropcap"],
  ["Sans (body/UI)", "Switzer", "self-hosted .woff2", "body, nav, t-eyebrow"],
  ["Mono (data/labels)", "Courier Prime", "next/font/google", "t-mono, code, ticker"],
], [2200, 1700, 2300, 3160]));
push(P("Headings use a fluid scale with clamp() so they grow with the viewport without breakpoints, e.g. --t-display: clamp(2.85rem, 6.4vw + 0.5rem, 6.75rem)."));
push(H2("Tailwind v4 — CSS-first"));
push(P("There is no tailwind.config.js. Tailwind v4 is configured inside the CSS itself:"));
push(code([
  "/* globals.css */",
  "@import \"tailwindcss\";",
  "@theme {",
  "  --color-navy: #0a0c14;",
  "  --color-aqua: #1fffff;",
  "  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);",
  "  /* tokens become utilities: bg-navy, text-aqua, etc. */",
  "}",
]));
push(plain("The whole look is controlled from one short settings block at the top of one CSS file. Designers can re-skin the site by editing a dozen lines instead of hunting through the code."));

/* ===== 7 Motion ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("7. Motion & Animation"));
push(P("Motion is deliberate and mostly CSS-driven. Two client components provide the engine (smooth scroll + reveal-on-scroll); the rest are CSS @keyframes in globals.css. Everything respects the user's reduce-motion setting."));
push(H2("The two motion engines"));
push(table(["Engine", "What it does"], [
  ["SmoothScroll (Lenis)", "Wraps native scrolling in eased momentum (duration 1.05s, ease-out-expo). Intercepts #anchor clicks and glides to them with an -80px offset to clear the sticky nav. Disabled on touch + reduced-motion."],
  ["ScrollReveal", "An IntersectionObserver adds an in-view class as elements (data-reveal) enter the viewport, triggering CSS fade/slide and chart draw-in animations. One-shot per element."],
], [2400, 6960]));
push(H2("Notable CSS animations"));
push(table(["Class", "Effect"], [
  [mono(".hero-in"), "Hero text fades + rises on load (staggered)"],
  [mono(".draw-line / .draw-path"), "SVG lines draw themselves via stroke-dashoffset"],
  [mono(".grow-bar"), "Histogram bars grow from the baseline when scrolled into view"],
  [mono(".marquee"), "The world-clock ticker scroll (48s loop; pauses on hover)"],
  [mono(".live-dot"), "Pulsing aqua ring on market-open indicators"],
  [mono(".aurora-* / .float-curve"), "Slow ambient drift of background light and the hero curve"],
  [mono(".lb-backdrop / .lb-panel"), "Lightbox fade + zoom-in"],
], [3000, 6360]));
push(H2("Accessibility: reduce-motion is honoured"));
push(code([
  "@media (prefers-reduced-motion: reduce){",
  "  .hero-in, .lb-panel { animation: none; }",
  "  .draw-path { stroke-dashoffset: 0; }   /* show final state */",
  "}",
]));
push(plain("The animations are like tasteful stage lighting — they guide your eye. But if a visitor has told their device to calm motion down, the site quietly turns the effects off and shows the finished result."));

/* ===== 8 Mechanisms ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("8. Key Mechanisms"));
const mech = (title, tech, lay) => { push(H3(title)); push(P([t("Technical: ", { bold: true }), t(tech)])); push(plain(lay)); };
mech("① The rotating globe — WorldSphere.tsx",
  "An HTML <canvas> with a hand-written 3D projection (no Three.js). City lat/long convert to points on a sphere, rotate each frame, project to 2D, depth-sort, and draw. Labels use a fixed priority list + greedy overlap check so they never flicker. The canvas scales to devicePixelRatio; the spin slows under reduce-motion.",
  "It's a tiny hand-built planetarium drawn dot-by-dot instead of pulling in a heavy 3D library. Lightweight and fully controlled.");
mech("② Live world clocks — WorldClockBand.tsx",
  "Times come from the browser's Intl.DateTimeFormat with each city's IANA timezone (e.g. Asia/Tokyo) — no manual timezone math. A 1-second interval re-renders; market-open dots compare now against open/close minutes and trading weekdays. It shows --:-- until mounted to avoid a server/browser mismatch.",
  "Each city's clock asks the browser what time it is there right now, and ticks every second, lighting a dot when that market is open.");
mech("③ Click-to-enlarge — Lightbox.tsx",
  "One delegated click listener on the document handles every image/figure tagged data-zoom — no per-image wiring. Photos open on a white panel at intrinsic resolution; SVG charts are cloned onto a dark panel (theme-correct, infinitely sharp). Esc / backdrop / close button dismiss it; focus is trapped and restored; background scroll locks.",
  "A single watcher notices any clickable image and pops a clean zoomed view over the page — keyboard-friendly and tidy on the way out.");
mech("④ On-this-page TOC — PageTOC.tsx",
  "An IntersectionObserver with a viewport-middle band (rootMargin: -45% 0 -50%) picks the current section and highlights its tab (scroll-spy). Clicks are plain #anchor links that fall through to the global Lenis handler for an eased jump.",
  "As you scroll, the menu automatically highlights whichever section you're reading — and clicking a menu item glides you there.");
mech("⑤ Drop-in images — build-time file checks",
  "Server components like StyleTile (focus photos) and SectorsIndices (provider logos) call fs.existsSync() at build time to detect whether an asset exists, choosing a real image or a graceful fallback. Drop a correctly-named file into public/ and it appears — no code change.",
  "The site checks its own image folders while building. Add a logo named the right way and it shows up automatically; leave it out and a neat placeholder stands in.");
mech("⑥ Charts are SVG, not images",
  "ReturnsHistogram and the covariance figure are drawn from hardcoded data arrays into deterministic SVG — crisp at any zoom, animatable, identical between server render and browser.",
  "The charts are drawn with math, not saved as picture files — so they're razor-sharp at any size and can animate.");

/* ===== 9 Build & Deploy ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("9. Build & Deploy"));
push(P("The workflow is: develop locally, build to static files, serve those files with nginx."));
push(H2("npm scripts"));
push(table(["Command", "Does"], [
  [mono("npm run dev"), "Local dev server with hot reload (next dev)"],
  [mono("npm run build"), "Builds the static site into site/out/"],
  [mono("npm run lint"), "Runs ESLint"],
  [mono("npm run start"), "Standard Next start — unused for static hosting"],
], [2600, 6760]));
push(H2("The build output"));
push(code([
  "site/out/",
  "|- index.html              # home (v0)",
  "|- v1/index.html ...       # each variant",
  "|- research/index.html     # article index",
  "|- research/<slug>/...     # each article",
  "|- course/  literature/  parked/",
  "|- _next/static/...        # CSS + JS bundles (hashed)",
  "'- flags/ logos/ notebooks/  # copied from public/",
]));
push(H2("Serving with nginx"));
push(P("nginx points its root at site/out and serves files directly. The repo's deploy/ holds isolated configs (e.g. an instance on port 1133) that run alongside any other site without touching port 80."));
push(note([t("Editing checklist: ", { bold: true }), t("change content in src/lib/* or src/content/* -> run npm run build -> the static out/ updates -> hard-refresh the browser (hashed assets cache aggressively).")]));

/* ===== 10 Glossary ===== */
push(new Paragraph({ children: [new PageBreak()] }), H1("10. Glossary"));
push(table(["Term", "Meaning"], [
  ["Static export", "Building the whole site into plain HTML files ahead of time, so no server computes pages on request."],
  ["Component", "A reusable, self-contained piece of UI. The site is built by composing these."],
  ["Server component", "Rendered once at build time into HTML; ships no JavaScript. The default here."],
  ["Client component", "Marked \"use client\"; runs JavaScript in the browser for interactivity."],
  ["Hydration", "When the browser wakes up a client component by attaching its JavaScript to rendered HTML."],
  ["App Router", "Next.js's system where folders under src/app/ become URLs."],
  ["Route / slug", "A URL path; a slug is the readable id in it (e.g. black-scholes... in /research/black-scholes...)."],
  ["generateStaticParams", "Lists every dynamic page to build (since there's no live server to invent them)."],
  ["Design token", "A named value (colour, size) defined once and reused everywhere."],
  ["Tailwind", "A styling system of small utility classes plus, in v4, a CSS-based token config."],
  ["IntersectionObserver", "A browser tool that notices when an element scrolls into view."],
  ["Lenis", "The library that gives the page its smooth momentum scrolling."],
  ["IANA timezone", "A standard timezone name like Asia/Tokyo; used to compute correct local times."],
  ["SVG", "Scalable Vector Graphics — images drawn with math; stay sharp at any size and can animate."],
  ["Canvas", "An HTML element you draw pixels onto with code — used for the rotating globe."],
  ["prefers-reduced-motion", "A device setting where users ask for fewer animations; the site honours it."],
  ["Variant / flag", "A design version (v0–v11); flags are on/off switches that add features."],
], [2500, 6860]));

/* ---------- assemble ---------- */
const doc = new Document({
  creator: "pyportfolios",
  title: "pyportfolios.com — Codebase Documentation",
  styles: {
    default: { document: { run: { font: "Calibri", size: 21, color: "1F2937" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, color: NAVY, font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "1B2436", font: "Calibri" },
        paragraph: { spacing: { before: 220, after: 110 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, color: "0B5563", font: "Calibri" },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: "bul", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1300, right: 1440, bottom: 1300, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [t("pyportfolios.com — Codebase Documentation   ·   ", { size: 16, color: "9AA3B2" }),
        t("Page ", { size: 16, color: "9AA3B2" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "9AA3B2" })] })] }) },
    children: body,
  }],
});

const OUT = "C:/Users/Yonishwari/Desktop/Projects/pyportfolios/pyportfolios-codebase-documentation.docx";
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buf);
console.log("WROTE", OUT, buf.length, "bytes");
