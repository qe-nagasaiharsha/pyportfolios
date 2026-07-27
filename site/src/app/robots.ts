import type { MetadataRoute } from "next";

/* Static-export robots — generated at build time into out/robots.txt.
   /account and /checkout are user-specific flows; keep crawlers out. */

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/checkout", "/api/"],
    },
    sitemap: "https://pyportfolios.com/sitemap.xml",
  };
}
