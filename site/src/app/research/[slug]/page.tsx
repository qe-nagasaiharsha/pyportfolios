import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { getArticle, ARTICLE_SLUGS } from "@/lib/articles";
import { ArticleLayout } from "@/components/article/ArticleLayout";

import BrownianMotion from "@/content/articles/brownian-motion";
import BlackScholesGreeks from "@/content/articles/black-scholes-greeks";
import BondDurationConvexity from "@/content/articles/bond-duration-convexity";
import HestonVsBlackScholes from "@/content/articles/heston-vs-black-scholes";
import SixtyFortyCorrelationFlip from "@/content/articles/sixty-forty-correlation-flip";
import GaussianVsTCopula from "@/content/articles/gaussian-vs-t-copula";
import GamestopMomentumModels from "@/content/articles/gamestop-momentum-models";
import AlphaDecayMomentum from "@/content/articles/alpha-decay-momentum";
import MvoEfficientFrontier from "@/content/articles/mvo-efficient-frontier";
import BlackLitterman from "@/content/articles/black-litterman";
import RiskParityFutures from "@/content/articles/risk-parity-futures";
import VarThreeWays from "@/content/articles/var-three-ways";
import CvarExpectedShortfall from "@/content/articles/cvar-expected-shortfall";
import CopulasTailDependence from "@/content/articles/copulas-tail-dependence";
import SmaCrossoverBacktest from "@/content/articles/sma-crossover-backtest";
import KalmanFilterHedgeRatios from "@/content/articles/kalman-filter-hedge-ratios";

/* Body registry — each article's prose lives in its own component so figures
   and code can be hand-crafted. Static import (only 8) keeps the export simple. */

const BODIES: Record<string, () => ReactElement> = {
  "brownian-motion": BrownianMotion,
  "black-scholes-greeks": BlackScholesGreeks,
  "bond-duration-convexity": BondDurationConvexity,
  "heston-vs-black-scholes": HestonVsBlackScholes,
  "sixty-forty-correlation-flip": SixtyFortyCorrelationFlip,
  "gaussian-vs-t-copula": GaussianVsTCopula,
  "gamestop-momentum-models": GamestopMomentumModels,
  "alpha-decay-momentum": AlphaDecayMomentum,
  "mvo-efficient-frontier": MvoEfficientFrontier,
  "black-litterman": BlackLitterman,
  "risk-parity-futures": RiskParityFutures,
  "var-three-ways": VarThreeWays,
  "cvar-expected-shortfall": CvarExpectedShortfall,
  "copulas-tail-dependence": CopulasTailDependence,
  "sma-crossover-backtest": SmaCrossoverBacktest,
  "kalman-filter-hedge-ratios": KalmanFilterHedgeRatios,
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
