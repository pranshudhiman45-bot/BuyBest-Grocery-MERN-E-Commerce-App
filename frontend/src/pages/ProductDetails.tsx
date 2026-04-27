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
  src,
}: {
  label: string
  accent: string
  className?: string
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
      <img src={src} alt={label} className="h-full w-full rounded-[24px] object-cover" />
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

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-2 pb-12 pt-2 md:px-4">
      {cartActionError ? (
        <Alert variant="destructive">
          <AlertTitle>Purchase limit reached</AlertTitle>
          <AlertDescription>{cartActionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            dispatch(appShellActions.setSelectedCategory(product.category))
            dispatch(appShellActions.openShop({ category: product.category }))
          }}
          className="h-auto w-fit rounded-full px-0 text-sm font-medium text-[#205447] hover:bg-transparent hover:text-[#10392f]"
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

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-[30px] border border-white/60 bg-white/85 py-0 shadow-[0_24px_60px_rgba(17,74,52,0.08)]">
            <CardContent className="p-3 sm:p-4">
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#1e473b_0%,#122c25_100%)] p-3">
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {(product.tags ?? []).map((tag) => (
                    <div
                      key={tag}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                        tag.toLowerCase().includes("fresh")
                          ? "bg-[#ffd438] text-[#5a4a00]"
                          : "bg-[#ccffcf] text-[#26613a]"
                      }`}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
                <ImagePlaceholder
                  label={activeImage?.label ?? product.imageLabel}
                  accent={activeImage?.accent ?? product.accent}
                  src={activeImage?.imageUrl || product.images?.[0]}
                  className="h-[360px] w-full border-[#47a1ff] bg-transparent text-white sm:h-[440px]"
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
                      ? "border-[#2c8fff] bg-white shadow-md"
                      : "border-white/60 bg-white/70 hover:border-[#8fd6ab]"
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ba195]">
              {product.brand}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-[1.02] text-[#10382e] sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e8f8de] px-3 py-1.5 text-sm font-medium text-[#3f7c29]">
              <span className="text-base">★</span>
              4.9 (128 reviews)
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="text-5xl font-black text-[#0e3b2f]">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice ? (
              <div className="pb-1 text-lg text-[#8aa097] line-through">
                {formatPrice(product.originalPrice)}
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="pb-1 text-sm font-bold text-[#ff6a3d]">{discount}% OFF</div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-[24px] border-none bg-white/90 py-0 shadow-[0_18px_40px_rgba(18,75,53,0.08)]">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#89a092]">
                  Estimated Arrival
                </p>
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold text-[#123f33]">
                  <Clock3 className="size-5 text-[#1b9858]" />
                  10 - 16 Mins
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-none bg-white/90 py-0 shadow-[0_18px_40px_rgba(18,75,53,0.08)]">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#89a092]">
                  Product Promise
                </p>
                <div className="mt-3 text-lg font-semibold text-[#123f33]">
                  Freshly packed and quality checked
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[28px] border-none bg-white/92 py-0 shadow-[0_20px_48px_rgba(18,75,53,0.1)]">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 rounded-2xl bg-[#dff8e6] px-3 py-2">
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

              <Button
                onClick={() => void handleCartAction(() => addToCart(product.id, 1))}
                disabled={isOutOfStock || isAtStockLimit}
                className="h-12 rounded-2xl bg-[#0d7a45] px-8 text-base font-semibold text-white hover:bg-[#0a6539]"
              >
                {isOutOfStock
                  ? "Out of Stock"
                  : isAtStockLimit
                    ? maxPerOrder
                      ? "Per-Order Limit Reached"
                      : "Stock Limit Reached"
                    : "Add to Cart"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-[24px] border-none bg-[#ddf7e4] py-0 text-[#153f34] shadow-sm">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="size-5 text-[#0d7a45]" />
                  Pesticide Free
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 text-sm leading-6 text-[#5f7d71]">
                Grown using only natural fertilizers and organic methods.
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-none bg-[#ddf7e4] py-0 text-[#153f34] shadow-sm">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 text-[#0d7a45]" />
                  High Lycopene
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 text-sm leading-6 text-[#5f7d71]">
                Rich in antioxidants and essential vitamins for everyday health.
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[28px] border-none bg-white/88 py-0 shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-2xl text-[#11392f]">Product Description</CardTitle>
              <CardDescription className="text-base leading-7 text-[#607c72]">
                {product.description}
              </CardDescription>
            </CardHeader>
            <Separator className="bg-[#e4f0e8]" />
            <CardContent className="space-y-4 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-[#123d31]">Why you'll like it</h3>
                <div className="mt-3 space-y-2">
                  {(product.benefits ?? []).map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-2 text-sm leading-6 text-[#648176]"
                    >
                      <Check className="mt-1 size-4 text-[#0f7a46]" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#123d31]">Storage Instructions</h3>
                <p className="mt-2 text-sm leading-6 text-[#648176]">{product.storage}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[#113a2f]">Frequently Bought Together</h2>
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

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
                  className="rounded-[26px] border border-white/70 bg-white/90 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]"
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
                        className="h-40 w-full rounded-[20px]"
                      />
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#91a599]">
                        {item.brand}
                      </p>
                      <h3 className="mt-2 min-h-[56px] text-xl font-semibold leading-7 text-[#173b31]">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#70897f]">{item.size}</p>
                    </button>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black text-[#10392f]">
                          {formatPrice(item.price)}
                        </div>
                        <div className="mt-1 text-xs font-medium text-[#6f877d]">
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
  )
}

export default ProductDetails
