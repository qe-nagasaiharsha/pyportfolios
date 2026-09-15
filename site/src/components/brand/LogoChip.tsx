/* One chip for every logo grid on the Markets page — stock exchanges,
   derivatives venues, index providers. Every chip is the same height, and every
   logo is drawn inside the same fixed box (h-8 × 72% of the chip) with
   object-contain: a tall crest fills the box's height, a wide wordmark fills
   its width, so the marks read as one set rather than a mix of big and small.
   Sizing the logo by max-height alone let the wide wordmarks sprawl and left
   the square marks looking tiny beside them. */

export function LogoChip({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="flex h-16 items-center justify-center rounded-sm border border-pearl/10 bg-white px-4 transition-transform duration-300 hover:-translate-y-0.5">
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={`${name} logo`}
          className="h-8 w-[72%] cursor-zoom-in object-contain"
          loading="lazy"
          data-zoom
          role="button"
          tabIndex={0}
          aria-label={`Enlarge ${name} logo`}
        />
      ) : (
        <span className="text-sm font-semibold tracking-tight text-anthracite">{name}</span>
      )}
    </div>
  );
}
