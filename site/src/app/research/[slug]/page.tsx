import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { getArticle, ARTICLE_SLUGS } from "@/lib/articles";
import { ArticleLayout } from "@/components/article/ArticleLayout";

import BrownianMotion from "@/content/articles/brownian-motion";
import BlackScholesGreeks from "@/content/articles/black-scholes-greeks";
import TimeValueOfMoney from "@/content/articles/time-value-of-money";
import BondDurationConvexity from "@/content/articles/bond-duration-convexity";
import MvoEfficientFrontier from "@/content/articles/mvo-efficient-frontier";
import BlackLitterman from "@/content/articles/black-litterman";
import RiskParityFutures from "@/content/articles/risk-parity-futures";
import LedoitWolf from "@/content/articles/ledoit-wolf-shrinkage";
import HierarchicalRiskParity from "@/content/articles/hierarchical-risk-parity";
import EvtTCopulaVar from "@/content/articles/evt-t-copula-var";
import VarCvarThreeWays from "@/content/articles/var-cvar-three-ways";
import CrossSectionalMomentum from "@/content/articles/cross-sectional-momentum";
import PairsTrading from "@/content/articles/pairs-trading-cointegration";
import BlackScholes from "@/content/articles/black-scholes-from-first-principles";
import VarThreeWays from "@/content/articles/var-three-ways";
import CvarExpectedShortfall from "@/content/articles/cvar-expected-shortfall";
import CopulasTailDependence from "@/content/articles/copulas-tail-dependence";
import SmaCrossoverBacktest from "@/content/articles/sma-crossover-backtest";
import KalmanFilterHedgeRatios from "@/content/articles/kalman-filter-hedge-ratios";
import KellyCriterion from "@/content/articles/kelly-criterion-position-sizing";
import GamestopShortSqueeze from "@/content/articles/gamestop-short-squeeze";
import GoldWarAndInflation from "@/content/articles/gold-war-and-inflation";

/* Body registry — each article's prose lives in its own component so figures
   and code can be hand-crafted. Static import (only 8) keeps the export simple. */

const BODIES: Record<string, () => ReactElement> = {
  "brownian-motion": BrownianMotion,
  "black-scholes-greeks": BlackScholesGreeks,
  "time-value-of-money": TimeValueOfMoney,
  "bond-duration-convexity": BondDurationConvexity,
  "mvo-efficient-frontier": MvoEfficientFrontier,
  "black-litterman": BlackLitterman,
  "risk-parity-futures": RiskParityFutures,
  "ledoit-wolf-shrinkage": LedoitWolf,
  "hierarchical-risk-parity": HierarchicalRiskParity,
  "evt-t-copula-var": EvtTCopulaVar,
  "var-cvar-three-ways": VarCvarThreeWays,
  "cross-sectional-momentum": CrossSectionalMomentum,
  "pairs-trading-cointegration": PairsTrading,
  "black-scholes-from-first-principles": BlackScholes,
  "var-three-ways": VarThreeWays,
  "cvar-expected-shortfall": CvarExpectedShortfall,
  "copulas-tail-dependence": CopulasTailDependence,
  "sma-crossover-backtest": SmaCrossoverBacktest,
  "kalman-filter-hedge-ratios": KalmanFilterHedgeRatios,
  "kelly-criterion-position-sizing": KellyCriterion,
  "gamestop-short-squeeze": GamestopShortSqueeze,
  "gold-war-and-inflation": GoldWarAndInflation,
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
