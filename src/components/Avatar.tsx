export function Avatar({
  src,
  name,
  className = "w-32 h-32",
  framed = true,
  initialClassName = "text-5xl",
}: {
  src: string | null;
  name: string;
  className?: string;
  /** Wooden picture frame (profile page) vs. a plain round avatar (comments, lists). */
  framed?: boolean;
  initialClassName?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const picture = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Foto de perfil de ${name}`} className="w-full h-full object-cover" />
  ) : (
    <span
      className={`font-display font-black italic text-accent ${initialClassName}`}
      aria-hidden
    >
      {initial}
    </span>
  );

  if (!framed) {
    return (
      <div
        className={`${className} shrink-0 rounded-full overflow-hidden bg-card border border-card-border flex items-center justify-center`}
      >
        {picture}
      </div>
    );
  }

  return (
    <div className="wood-panel inline-block rounded-lg p-1.5 shadow-md border border-shelf-wood-dark">
      <div
        className={`${className} rounded-md overflow-hidden bg-card flex items-center justify-center shadow-inner`}
      >
        {picture}
      </div>
    </div>
  );
}
