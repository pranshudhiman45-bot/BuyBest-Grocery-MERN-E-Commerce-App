import { useState, type ImgHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export const PRODUCT_IMAGE_FALLBACK = "/products/fallback/product-image-fallback.avif"

type ProductImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "height" | "loading" | "src" | "width"
> & {
  alt: string
  src?: string | null
  width?: number
  height?: number
  fit?: "cover" | "contain"
  eager?: boolean
}

export function ProductImage({
  alt,
  src,
  width = 800,
  height = 800,
  fit = "contain",
  eager = false,
  className,
  ...imageProps
}: ProductImageProps) {
  const requestedSource = src?.trim() || PRODUCT_IMAGE_FALLBACK
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const resolvedSource = failedSource === requestedSource
    ? PRODUCT_IMAGE_FALLBACK
    : requestedSource

  return (
    <img
      {...imageProps}
      src={resolvedSource}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      onError={() => {
        if (requestedSource !== PRODUCT_IMAGE_FALLBACK) {
          setFailedSource(requestedSource)
        }
      }}
      className={cn(
        "block h-full w-full object-center",
        fit === "cover" ? "object-cover" : "object-contain",
        className,
      )}
    />
  )
}
