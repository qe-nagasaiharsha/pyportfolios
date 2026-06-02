import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StyleTile from "@/components/StyleTile";
import EditorialTile from "@/components/EditorialTile";
import { VARIANTS, VARIANT_IDS } from "@/lib/variants";

export const dynamicParams = false;

export function generateStaticParams() {
  return VARIANT_IDS.map((version) => ({ version }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  const v = VARIANTS[version];
  if (!v) return {};
  return {
    title: "pyportfolios.com — where finance theory, coding & markets converge",
    description:
      "An educational platform bridging advanced quantitative finance and practical Python implementation.",
  };
}

export default async function VersionPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;
  const variant = VARIANTS[version];
  if (!variant) notFound();
  // v11 is a distinct classic-editorial layout; v0–v5 share the parametrized tile.
  if (version === "v11") return <EditorialTile />;
  return <StyleTile variant={variant} />;
}
