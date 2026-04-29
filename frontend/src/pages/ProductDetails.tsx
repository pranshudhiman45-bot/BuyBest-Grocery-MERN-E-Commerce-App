import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Check,
  Clock3,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/components/providers/store-provider"
import { fetchProductById, fetchProducts } from "@/lib/store-api"
import { formatPrice, type Product } from "@/lib/storefront"
import {
  appShellActions,
  useAppShellDispatch,
  useAppShellSelector,
} from "@/store/app-shell"

const ImagePlaceholder = ({
  label,
  accent,
  className,
  imageClassName,
  fit = "cover",
  src,
}: {
  label: string
  accent: string
  className?: string
  imageClassName?: string
  fit?: "cover" | "contain"
  src?: string
}) => (
  <div
    className={[
      "flex items-center justify-center rounded-[24px] border border-white/50 text-center shadow-sm",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    style={{
      backgroundImage: `linear-gradient(135deg, ${accent}25, #ffffff 65%)`,
    }}
  >
    {src ? (
      <img
        src={src}
        alt={label}
        className={[
          fit === "contain"
            ? "h-full w-full rounded-[24px] object-contain"
            : "h-full w-full rounded-[24px] object-cover",
          imageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
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

const ProductDetails = () => {
  const dispatch = useAppShellDispatch()
  const productId = useAppShellSelector((state) => state.selectedProductId || "")
  const { addToCart, cartQuantities, updateCartQuantity } = useStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [selectedImage, setSelectedImage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [cartActionError, setCartActionError] = useState("")

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)

      try {
        const nextProduct = await fetchProductById(productId)
        setProduct(nextProduct)
        setSelectedImage(nextProduct.gallery?.[0]?.id ?? nextProduct.id)

        if (nextProduct.relatedIds?.length) {
          const allProducts = await fetchProducts()
          setRelatedProducts(
            allProducts.filter((item) => nextProduct.relatedIds?.includes(item.id))
          )
        } else {
          setRelatedProducts([])
        }
      } catch {
        setProduct(null)
        setRelatedProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadProduct()
  }, [productId])

  const gallery = product?.gallery ?? []
  const activeImage =
    gallery.find((item) => item.id === selectedImage) ?? gallery[0]

  const discount = useMemo(
    () =>
      product?.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) * 100
          )
        : 0,
    [product]
  )

  const updateQuantity = async (id: string, nextValue: number) => {
    if (nextValue <= 0) {
      await updateCartQuantity(id, 0)
      return
    }

    const currentQuantity = cartQuantities[id] ?? 0

    if (currentQuantity === 0) {
      await addToCart(id, nextValue)
      return
    }

    await updateCartQuantity(id, nextValue)
  }

  const handleCartAction = async (action: () => Promise<void>) => {
    try {
      setCartActionError("")
      await action()
    } catch (error) {
      setCartActionError(
        error instanceof Error
          ? error.message
          : "Unable to update cart quantity right now."
      )
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-[28px] bg-white/70 p-8 text-center shadow-sm">
        Loading product...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl rounded-[28px] bg-white/70 p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-[#173d31]">Product not found</h1>
        <p className="mt-3 text-[#648378]">
          This item does not exist in the current storefront data yet.
        </p>
        <Button
          onClick={() => dispatch(appShellActions.openShop(undefined))}
          className="mt-6 rounded-2xl bg-[#0f6c45] hover:bg-[#0c5939]"
        >
          Back to Home
        </Button>
      </div>
    )
  }

  const quantity = cartQuantities[product.id] ?? 0
  const availableStock = Math.max(0, product.stock ?? 0)
  const maxPerOrder =
    product.maxPerOrder && product.maxPerOrder > 0 ? Math.floor(product.maxPerOrder) : null
  const purchasableLimit =
    maxPerOrder === null ? availableStock : Math.min(availableStock, maxPerOrder)
  const isOutOfStock = availableStock === 0
  const isAtStockLimit = purchasableLimit > 0 && quantity >= purchasableLimit
  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0
  const detailChips = [
    product.size ? product.size : null,
  ].filter(Boolean) as string[]
  const featureCards = [
    {
      title: "Freshness promise",
      description: "Packed with quality checks before dispatch for a dependable everyday order.",
      icon: ShieldCheck,
      tone: "bg-[#eef8ec] text-[#184b35]",
    },
    {
      title: "Quick doorstep delivery",
      description: "Optimized for fast local fulfilment so essentials reach you right on time.",
      icon: Clock3,
      tone: "bg-[#eef5ff] text-[#1c4f73]",
    },
    {
      title: "Why you'll like it",
      description:
        product.benefits?.[0] ||
        product.description ||
        "A reliable grocery staple chosen for freshness, convenience, and everyday value.",
      icon: Sparkles,
      tone: "bg-[#fff5e7] text-[#7a4e16]",
    },
  ]

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,#f8f5ea_0%,#f4efe4_38%,#eef4ea_100%)]">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-6 px-3 pb-12 pt-4 md:px-5">
      {cartActionError ? (
        <Alert variant="destructive">
          <AlertTitle>Purchase limit reached</AlertTitle>
          <AlertDescription>{cartActionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-[24px] border border-[#ece4d6] bg-white/80 px-4 py-3 shadow-[0_10px_28px_rgba(78,62,31,0.05)] backdrop-blur">
        <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            dispatch(appShellActions.setSelectedCategory(product.category))
            dispatch(appShellActions.openShop({ category: product.category }))
          }}
          className="h-auto w-fit rounded-full px-0 text-sm font-semibold text-[#205447] hover:bg-transparent hover:text-[#10392f]"
        >
          <ArrowLeft className="size-4" />
          Back to {product.categoryLabel}
        </Button>

        <Breadcrumb>
          <BreadcrumbList className="text-[#6b8b7f]">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  dispatch(appShellActions.openShop(undefined))
                }}
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  dispatch(appShellActions.setSelectedCategory(product.category))
                  dispatch(appShellActions.openShop({ category: product.category }))
                }}
              >
                {product.categoryLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        </div>
      </div>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(340px,0.88fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-[30px] border border-[#e9e4d8] bg-white/90 py-0 shadow-[0_20px_48px_rgba(38,33,24,0.08)]">
            <CardContent className="p-3 sm:p-4">
              <div
                className="relative overflow-hidden rounded-[26px] border border-white/40 p-3 sm:p-4"
                style={{
                  backgroundImage: `radial-gradient(circle at top right, ${product.accent}25 0%, transparent 28%), linear-gradient(135deg, #1c4e3f 0%, #14392f 45%, #f4efe4 45%, #fbf8f2 100%)`,
                }}
              >
                <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-5 sm:top-5">
                  {product.offer ? (
                    <span className="rounded-full bg-[#ffd24a] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#624c11] shadow-sm">
                      {product.offer}
                    </span>
                  ) : null}
                  {discount > 0 ? (
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1c4e3f] shadow-sm">
                      Save {formatPrice(savings)}
                    </span>
                  ) : null}
                </div>

                <div className="absolute bottom-4 right-4 hidden rounded-full border border-white/40 bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1c4e3f] shadow-sm sm:block">
                  {product.categoryLabel}
                </div>

                <ImagePlaceholder
                  label={activeImage?.label ?? product.imageLabel}
                  accent={activeImage?.accent ?? product.accent}
                  src={activeImage?.imageUrl || product.images?.[0]}
                  className="h-[280px] w-full border-white/70 bg-white/95 sm:h-[360px]"
                  fit="contain"
                  imageClassName="mx-auto p-4 sm:p-5"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((item) => {
              const isActive = item.id === activeImage?.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedImage(item.id)}
                  className={`overflow-hidden rounded-[20px] border p-2 text-left transition-all ${
                    isActive
                      ? "border-[#c9aa45] bg-[#fffaf0] shadow-[0_10px_24px_rgba(78,62,31,0.08)]"
                      : "border-[#ebe3d3] bg-white/80 hover:border-[#d3c3a0] hover:bg-white"
                  }`}
                >
                  <ImagePlaceholder
                    label={item.label}
                    accent={item.accent}
                    src={item.imageUrl}
                    className="h-28 w-full rounded-[16px]"
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden rounded-[30px] border border-[#e9e4d8] bg-white/92 py-0 shadow-[0_20px_48px_rgba(38,33,24,0.08)]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f3efe4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6b4c]">
                  {product.brand || product.categoryLabel}
                </span>
                {product.isBestSeller ? (
                  <span className="rounded-full bg-[#ffe7a6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a4a00]">
                    Best Seller
                  </span>
                ) : null}
                {product.isNewArrival ? (
                  <span className="rounded-full bg-[#dff5e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f6a40]">
                    New Arrival
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 text-2xl font-bold leading-tight text-[#14382f] sm:text-[2.15rem]">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                {detailChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#e8deca] bg-[#fbf8f2] px-3 py-1.5 text-sm font-medium text-[#6d624d]"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <div className="text-3xl font-black tracking-tight text-[#10392f] sm:text-[2.45rem]">
                  {formatPrice(product.price)}
                </div>
                {product.originalPrice && product.originalPrice > product.price ? (
                  <div className="pb-1 text-lg text-[#96a08f] line-through">
                    {formatPrice(product.originalPrice)}
                  </div>
                ) : null}
                {discount > 0 ? (
                  <div className="rounded-full bg-[#fff1e8] px-3 py-1 text-sm font-bold text-[#ef6a3a]">
                    {discount}% OFF
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#e8efe9] bg-[linear-gradient(135deg,#f7fcf8_0%,#eef8f1_100%)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b9588]">
                    Estimated arrival
                  </p>
                  <div className="mt-2.5 flex items-center gap-3 text-lg font-semibold text-[#123f33]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1b9858] shadow-sm">
                      <Clock3 className="size-4" />
                    </span>
                    10 - 16 mins
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#eee3d2] bg-[linear-gradient(135deg,#fffaf3_0%,#f7f1e4_100%)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a8765]">
                    Product promise
                  </p>
                  <div className="mt-2.5 text-lg font-semibold leading-snug text-[#2f3f35]">
                    Freshly packed and quality checked
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-[#e6efdf] bg-[#f7fcf8] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3 rounded-[18px] bg-[#dff8e6] px-3 py-2">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    void handleCartAction(() => updateQuantity(product.id, quantity - 1))
                  }
                  className="rounded-xl bg-white text-[#1a5b43] hover:bg-[#f3fff6]"
                >
                  <Minus className="size-4" />
                </Button>
                    <span className="min-w-8 text-center text-xl font-bold text-[#123f33]">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        void handleCartAction(() => updateQuantity(product.id, quantity + 1))
                      }
                      disabled={isAtStockLimit || isOutOfStock}
                      className="rounded-xl bg-white text-[#1a5b43] hover:bg-[#f3fff6]"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  <div className="min-w-0 flex-1 lg:max-w-[280px]">
                    <Button
                      onClick={() => void handleCartAction(() => addToCart(product.id, 1))}
                      disabled={isOutOfStock || isAtStockLimit}
                      className="h-11 w-full rounded-2xl bg-[#0d7a45] px-6 text-sm font-semibold text-white hover:bg-[#0a6539]"
                    >
                      {isOutOfStock
                        ? "Out of Stock"
                        : isAtStockLimit
                          ? maxPerOrder
                            ? "Per-Order Limit Reached"
                            : "Stock Limit Reached"
                          : "Add to Cart"}
                    </Button>
                    <p className="mt-2 text-sm text-[#698175]">
                      {isOutOfStock
                        ? "This item is currently unavailable."
                        : "Available for quick add from this page."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => (
              <Card
                key={feature.title}
                className={`rounded-[26px] border-none py-0 shadow-sm ${feature.tone}`}
              >
                <CardHeader className="px-5 pt-5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <feature.icon className="size-5" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 text-sm leading-6 text-current/75">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
        <Card className="rounded-[32px] border border-[#e9e4d8] bg-white/92 py-0 shadow-[0_18px_46px_rgba(38,33,24,0.06)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-[#11392f]">Product story</CardTitle>
            <CardDescription className="text-base leading-7 text-[#607c72]">
              {product.description || "A dependable everyday grocery pick chosen for taste, freshness, and convenience."}
            </CardDescription>
          </CardHeader>
          <Separator className="bg-[#efe7d8]" />
          <CardContent className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-[#123d31]">Why you'll like it</h3>
              <div className="mt-4 space-y-3">
                {(product.benefits?.length ? product.benefits : ["Fresh quality you can trust every day."]).map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-[18px] bg-[#f8fcf9] px-4 py-3 text-sm leading-6 text-[#648176]"
                  >
                    <Check className="mt-1 size-4 shrink-0 text-[#0f7a46]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[20px] border border-[#e7efe8] bg-[#f9fcfa] p-4">
                <h3 className="text-base font-semibold text-[#123d31]">Storage instructions</h3>
                <p className="mt-2 text-sm leading-6 text-[#648176]">
                  {product.storage || "Store in a cool, clean place and follow pack instructions for best freshness."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-[#e9e4d8] bg-[linear-gradient(180deg,#fffaf1_0%,#fff 100%)] py-0 shadow-[0_18px_46px_rgba(38,33,24,0.06)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-[#11392f]">At a glance</CardTitle>
            <CardDescription className="text-base leading-7 text-[#607c72]">
              A quick snapshot before you place this item in your cart.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="rounded-[20px] border border-[#efe2c9] bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a08242]">
                Category
              </p>
              <p className="mt-2 text-base font-semibold text-[#2f3f35]">{product.categoryLabel}</p>
            </div>
            <div className="rounded-[20px] border border-[#e7eee9] bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d8b7f]">
                Gallery items
              </p>
              <p className="mt-2 text-base font-semibold text-[#2f3f35]}">{gallery.length || 1} views available</p>
            </div>
            <div className="rounded-[20px] border border-[#e7eee9] bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d8b7f]">
                Current cart quantity
              </p>
              <p className="mt-2 text-base font-semibold text-[#2f3f35]">{quantity} selected</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {relatedProducts.length ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#113a2f]">Frequently bought together</h2>
              <p className="mt-1 text-sm text-[#648176]">
                Customers also added these for the perfect bundle.
              </p>
            </div>
            <Button
              variant="ghost"
              className="rounded-full text-[#16704b] hover:bg-white/45"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((item) => {
              const itemQuantity = cartQuantities[item.id] ?? 0
              const itemStock = Math.max(0, item.stock ?? 0)
              const itemMaxPerOrder =
                item.maxPerOrder && item.maxPerOrder > 0 ? Math.floor(item.maxPerOrder) : null
              const itemPurchasableLimit =
                itemMaxPerOrder === null ? itemStock : Math.min(itemStock, itemMaxPerOrder)
              const itemAtStockLimit =
                itemPurchasableLimit > 0 && itemQuantity >= itemPurchasableLimit

              return (
                <Card
                  key={item.id}
                  className="rounded-[26px] border border-[#e9e4d8] bg-white/92 py-0 shadow-[0_18px_44px_rgba(38,33,24,0.06)]"
                >
                  <CardContent className="p-4">
                    <button
                      type="button"
                      onClick={() => dispatch(appShellActions.openProduct(item.id))}
                      className="block w-full text-left"
                    >
                      <ImagePlaceholder
                        label={item.imageLabel}
                        accent={item.accent}
                        src={item.images?.[0]}
                        className="h-28 w-full rounded-[16px] bg-[#fbf8f2] sm:h-40 sm:rounded-[20px]"
                      />
                      <p className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#91a599]">
                        {item.brand}
                      </p>
                      <h3 className="mt-1 sm:mt-2 min-h-[44px] sm:min-h-[56px] text-sm sm:text-lg font-semibold leading-5 sm:leading-6 text-[#173b31] line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[#70897f]">{item.size}</p>
                    </button>

                    <div className="mt-4 sm:mt-5 flex items-center justify-between gap-1 sm:gap-3">
                      <div>
                        <div className="text-base sm:text-xl font-black text-[#10392f]">
                          {formatPrice(item.price)}
                        </div>
                        <div className="mt-1 text-[10px] sm:text-xs font-medium text-[#6f877d]">
                          {itemMaxPerOrder ? "Purchase limit applies" : "Fresh store pick"}
                        </div>
                      </div>
                      <Button
                        size="icon-sm"
                        onClick={() =>
                          void handleCartAction(() =>
                            updateQuantity(item.id, itemQuantity + 1)
                          )
                        }
                        disabled={itemStock <= 0 || itemAtStockLimit}
                        className="rounded-xl bg-[#0d7a45] hover:bg-[#0a6539]"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  )
}

export default ProductDetails
