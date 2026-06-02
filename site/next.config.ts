import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export → served by nginx as plain files (no Node process).
  // `next dev` still works for development; this only affects `next build`.
  output: "export",
};

export default nextConfig;
