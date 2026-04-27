type CartItemImageProps = {
  label: string
  accent: string
  src?: string | null
  className?: string
}

export function CartItemImage({
  label,
  accent,
  src,
  className,
}: CartItemImageProps) {
  return (
    <div
      className={[
        "flex h-28 w-full items-center justify-center rounded-[20px] border border-white/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent}28, #ffffff 70%)`,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={label}
          className="h-full w-full rounded-[20px] object-cover"
        />
      ) : (
        <div
          className="rounded-full border border-dashed px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#1d4b3d]"
          style={{ borderColor: accent }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
