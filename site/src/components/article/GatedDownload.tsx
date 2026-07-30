"use client";

/* Gated notebook/bundle download — the client side of the paywall.
   Notebooks and bundles no longer ship in the static export (they live in
   vault/, served by the platform API). Resolution happens at CLICK time, not
   mount, so article pages stay static-fast with zero API chatter:
     click → entitlements?  pro/lifetime → blob download via /api
                            signed-out   → /account
                            free tier    → /checkout (Pro)  */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, saveBlob } from "@/lib/api";

type Kind = "bundle" | "notebook";

async function resolveAndDownload(slug: string, kind: Kind, router: ReturnType<typeof useRouter>): Promise<string | null> {
  try {
    const blob = kind === "bundle" ? await api.bundle(slug) : await api.notebook(slug);
    saveBlob(blob, kind === "bundle" ? `${slug}.zip` : `${slug}.ipynb`);
    return null;
  } catch (ex) {
    if (ex instanceof ApiError && ex.status === 401) {
      router.push("/account");
      return null;
    }
    if (ex instanceof ApiError && ex.status === 402) {
      router.push("/checkout?plan=pro-monthly");
      return null;
    }
    return ex instanceof ApiError ? ex.message : "The platform API is unreachable.";
  }
}

export function GatedBadge({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await resolveAndDownload(slug, "bundle", router);
        setBusy(false);
      }}
      className="group inline-flex items-center gap-1.5 rounded-sm border border-teal/40 px-2.5 py-1 t-mono text-[0.66rem] uppercase tracking-[0.12em] text-teal transition-colors hover:bg-teal hover:text-paper disabled:opacity-60"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-teal group-hover:bg-paper" aria-hidden="true" />
      {busy ? "…" : "Notebook"}
      <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">↓</span>
    </button>
  );
}

export function GatedCta({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const go = async (kind: Kind) => {
    setBusy(kind);
    setErr(null);
    setErr(await resolveAndDownload(slug, kind, router));
    setBusy(null);
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => go("bundle")}
        className="group inline-flex shrink-0 items-center gap-2 rounded-sm bg-anthracite px-6 py-3 text-sm font-semibold text-sisal transition-colors duration-300 hover:bg-teal disabled:opacity-60"
      >
        {busy === "bundle" ? "Preparing…" : "Download bundle"}
        <span className="t-mono text-xs opacity-70">.zip</span>
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => go("notebook")}
        className="t-mono text-[0.68rem] uppercase tracking-[0.14em] text-graphite underline-offset-4 hover:text-teal hover:underline disabled:opacity-60"
      >
        {busy === "notebook" ? "…" : "or just the .ipynb ↓"}
      </button>
      <p className="t-mono text-[0.62rem] uppercase tracking-[0.1em] text-graphite/70">
        Members · Pro &amp; Lifetime
      </p>
      {err ? <p className="text-xs text-red-700">{err}</p> : null}
    </div>
  );
}
