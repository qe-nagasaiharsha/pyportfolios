import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { getArticle, ARTICLE_SLUGS } from "@/lib/articles";
import { ArticleLayout } from "@/components/article/ArticleLayout";

/* Body registry — each article's prose lives in its own component so figures
   and code can be hand-crafted. Static import (only 8) keeps the export simple. */
import BlackScholes from "@/content/articles/black-scholes-from-first-principles";
import TimeValueOfMoney from "@/content/articles/time-value-of-money";
import LedoitWolf from "@/content/articles/ledoit-wolf-shrinkage";
import HierarchicalRiskParity from "@/content/articles/hierarchical-risk-parity";
import EvtTCopulaVar from "@/content/articles/evt-t-copula-var";
import VarCvarThreeWays from "@/content/articles/var-cvar-three-ways";
import CrossSectionalMomentum from "@/content/articles/cross-sectional-momentum";
import PairsTrading from "@/content/articles/pairs-trading-cointegration";

const BODIES: Record<string, () => ReactElement> = {
  "black-scholes-from-first-principles": BlackScholes,
  "time-value-of-money": TimeValueOfMoney,
  "ledoit-wolf-shrinkage": LedoitWolf,
  "hierarchical-risk-parity": HierarchicalRiskParity,
  "evt-t-copula-var": EvtTCopulaVar,
  "var-cvar-three-ways": VarCvarThreeWays,
  "cross-sectional-momentum": CrossSectionalMomentum,
  "pairs-trading-cointegration": PairsTrading,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — pyportfolios`,
    description: article.dek,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  const Body = BODIES[slug];
  if (!article || !Body) notFound();
  return (
    <ArticleLayout article={article}>
      <Body />
    </ArticleLayout>
  );
}
