import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORY_ORDER } from "@/lib/articles";

/* Static-export sitemap — generated at build time into out/sitemap.xml. */

const BASE = "https://pyportfolios.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/research`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/course`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/literature`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/topics`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/content`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/requirements`, changeFrequency: "monthly", priority: 0.4 },
  ];
  const categories: MetadataRoute.Sitemap = CATEGORY_ORDER.map((c) => ({
    url: `${BASE}/research/${c}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const articles: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${BASE}/research/${a.slug}`,
    lastModified: a.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  return [...staticRoutes, ...categories, ...articles];
}
