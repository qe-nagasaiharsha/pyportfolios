"use client";

/* TransitionLink — a drop-in next/link that wraps client navigation in the
   native View Transitions API. Purpose: spatial CONTINUITY for the signature
   dark→light rhythm (research index → article cross-dissolves instead of
   hard-cutting). Degrades perfectly: browsers without the API, modified clicks,
   and prefers-reduced-motion all fall back to ordinary instant navigation. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type StartViewTransition = (cb: () => void | Promise<void>) => unknown;

export function TransitionLink({
  href,
  onClick,
  ...rest
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof href !== "string") return;

    const start = (document as Document & { startViewTransition?: StartViewTransition })
      .startViewTransition;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!start || reduce) return; // let <Link> navigate normally

    e.preventDefault();
    start.call(
      document,
      () =>
        new Promise<void>((resolve) => {
          router.push(href);
          // give React two frames to commit the new route before the snapshot
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
