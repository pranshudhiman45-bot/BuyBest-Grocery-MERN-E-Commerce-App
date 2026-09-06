import { ProductImage } from "@/components/catalog/ProductImage"

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
      <ProductImage
        src={src}
        alt={label}
        width={240}
        height={240}
        sizes="(max-width: 640px) 100vw, 240px"
        className="rounded-[inherit] p-2"
      />
    </div>
  )
}
