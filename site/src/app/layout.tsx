import type { Metadata } from "next";
import { Lora, Courier_Prime } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

/**
 * Type system (per brand guidelines, Edition III):
 *  - Lora          serif  — headings, firm content, slogans
 *  - Switzer       sans   — display + body (self-hosted woff2 from Fontshare)
 *  - Courier Prime mono   — code, data, labels
 */
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const courierPrime = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const switzer = localFont({
  variable: "--font-switzer",
  display: "swap",
  src: [
    { path: "../fonts/switzer/Switzer-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/switzer/Switzer-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/switzer/Switzer-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/switzer/Switzer-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/switzer/Switzer-Black.woff2", weight: "900", style: "normal" },
  ],
});

const TITLE = "pyportfolios.com — where finance theory, coding & markets converge";
const DESCRIPTION =
  "An educational platform that bridges advanced quantitative finance and practical Python implementation — blending technical rigor, real-world application and visual clarity.";

export const metadata: Metadata = {
  metadataBase: new URL("https://pyportfolios.com"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://pyportfolios.com",
    siteName: "pyportfolios",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "pyportfolios — quant finance in runnable Python" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/* Privacy-friendly analytics — inert unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set
   at build time (e.g. "pyportfolios.com"). No cookies, no consent banner needed. */
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${switzer.variable} ${courierPrime.variable} antialiased`}
    >
      <body>
        {PLAUSIBLE_DOMAIN ? (
          <script defer data-domain={PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" />
        ) : null}
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
