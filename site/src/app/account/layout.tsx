import type { Metadata } from "next";

/* The page itself is a client component; metadata lives on the segment layout. */
export const metadata: Metadata = {
  title: "Account — pyportfolios",
  description: "Sign in, manage your subscription, and download every runnable notebook and bundle.",
  robots: { index: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
