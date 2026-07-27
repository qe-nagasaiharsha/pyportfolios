import type { Metadata } from "next";

/* The page itself is a client component; metadata lives on the segment layout. */
export const metadata: Metadata = {
  title: "Checkout — pyportfolios",
  description: "Upgrade to Pro or Lifetime — every runnable notebook and bundle, current and future.",
  robots: { index: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
