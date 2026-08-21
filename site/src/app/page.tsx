/* Temporary "coming soon" holding page (coming-soon branch).
   Point Vercel's Production Branch here to show this; switch back to 11.0 to
   restore the full site. No nav/links, so nothing deeper is reachable from here. */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "pyportfolios.com — coming soon",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center text-pearl">
      <h1 className="t-display">
        pyportfolios<span className="text-aqua">.</span>com
      </h1>
      <p className="mt-6 t-mono text-sm uppercase tracking-[0.28em] text-mist">
        Coming soon
      </p>
    </main>
  );
}
