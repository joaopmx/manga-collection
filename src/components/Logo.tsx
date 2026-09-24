/**
 * Brand mark: an open book with a bookmark ribbon and a trail of manga-style
 * speed lines flicking off the top-right page — ties the "collection of
 * books" idea to the "manga" energy in one shape. Renders in `currentColor`
 * so it always matches the surrounding text color/theme.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M32,14 C22,9 12,10 9,13 L9,46 C12,43 22,42 32,47 C42,42 52,43 55,46 L55,13 C52,10 42,9 32,14 Z"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />
      <path d="M32,14 L32,47" stroke="currentColor" strokeWidth="2" />
      <path d="M27,9 L27,24 L32,20 L37,24 L37,9 Z" fill="currentColor" />
      <path
        d="M46,8 L55,0 M50,13 L59,6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName = "w-9 h-9",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none -space-y-0.5">
        <span className="font-display italic font-black text-2xl tracking-wide">Mangá</span>
        <span className="font-display font-bold text-[10px] tracking-[0.3em] opacity-75">
          COLLECTION
        </span>
      </span>
    </span>
  );
}
