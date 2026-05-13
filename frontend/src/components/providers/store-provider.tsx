/* eslint-disable react-refresh/only-export-components */

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Check, ShoppingCart, X } from "lucide-react"

import {
  addCartItem as addCartItemApi,
  checkoutCart as checkoutCartApi,
  fetchAppSettings,
  fetchCart,
  fetchProductById,
  fetchProducts,
  removeCartItem as removeCartItemApi,
  searchProducts as searchProductsApi,
  updateCartItem as updateCartItemApi,
  type CartItem,
  type CartSummary,
  type CheckoutResponse,
} from "@/lib/store-api"
import type { AuthUser } from "@/lib/auth"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"
import { formatPrice, type Product } from "@/lib/storefront"

const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 300
const DEFAULT_TAX_PERCENTAGE = 5
const STORE_CACHE_TTL_MS = 60 * 1000
let guestCartEntries: GuestCartEntry[] = []
let cachedProducts: { value: Product[]; expiresAt: number } | null = null
let cachedSettings: { value: { taxPercentage: number }; expiresAt: number } | null = null

type GuestCartEntry = {
  productId: string
  quantity: number
}

type CartToastState = {
  productName: string
  imageUrl?: string | null
  quantity: number
  itemCount: number
  price?: number | null
}

type StoreProviderProps = {
  children: ReactNode
  currentUser: AuthUser | null
}

type StoreContextValue = {
  cartItems: CartItem[]
  cartSummary: CartSummary
  cartQuantities: Record<string, number>
  isCartLoading: boolean
  refreshCart: () => Promise<void>
  clearCartState: () => void
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  searchProducts: (query: string) => Promise<Product[]>
  checkoutCart: (
    paymentMethod: string,
    couponCode?: string,
    idempotencyKey?: string
  ) => Promise<CheckoutResponse>
}

const emptySummary: CartSummary = {
  subtotal: 0,
  deliveryFee: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
}

const StoreContext = createContext<StoreContextValue | null>(null)

const isUnauthorizedError = (error: unknown) =>
  error instanceof Error &&
  /unauthorized|login|log in|sign in|session/i.test(error.message)

const normalizeMaxPerOrder = (value?: number | null) => {
  if (value == null) {
    return null
  }

  const parsed = Math.floor(Number(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const readGuestCartEntries = () => {
  return guestCartEntries
}

const writeGuestCartEntries = (entries: GuestCartEntry[]) => {
  guestCartEntries = entries.filter(
    (entry) =>
      typeof entry?.productId === "string" &&
      entry.productId.length > 0 &&
      typeof entry.quantity === "number" &&
      entry.quantity > 0
  )
}

const fetchCachedProducts = async () => {
  if (cachedProducts && cachedProducts.expiresAt > Date.now()) {
    return cachedProducts.value
  }

  const products = await fetchProducts()
  cachedProducts = {
    value: products,
    expiresAt: Date.now() + STORE_CACHE_TTL_MS,
  }
  return products
}

const fetchCachedAppSettings = async () => {
  if (cachedSettings && cachedSettings.expiresAt > Date.now()) {
    return cachedSettings.value
  }

  const settings = await fetchAppSettings().catch(() => ({
    taxPercentage: DEFAULT_TAX_PERCENTAGE,
  }))
  cachedSettings = {
    value: settings,
    expiresAt: Date.now() + STORE_CACHE_TTL_MS,
  }
  return settings
}

const buildGuestSummary = (items: CartItem[], taxPercentage: number): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee =
    subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const normalizedTaxRate = Math.max(0, Number(taxPercentage) || 0) / 100
  const tax = Number((subtotal * normalizedTaxRate).toFixed(2))
  const total = subtotal + deliveryFee + tax
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    subtotal,
    deliveryFee,
    tax,
    total,
    itemCount,
  }
}

const buildGuestCartState = async (entries: GuestCartEntry[], taxPercentage: number) => {
  if (entries.length === 0) {
    return {
      items: [] as CartItem[],
      summary: emptySummary,
    }
  }

  const products = await fetchCachedProducts()
  const productMap = new Map(products.map((product) => [product.id, product]))

  const items = entries.flatMap((entry) => {
    const product = productMap.get(entry.productId)

    if (!product) {
      return []
    }

    const maxPerOrder =
      product.maxPerOrder && product.maxPerOrder > 0 ? Math.floor(product.maxPerOrder) : null
    const effectiveLimit =
      maxPerOrder === null
        ? Math.max(product.stock ?? entry.quantity, 0)
        : Math.min(Math.max(product.stock ?? entry.quantity, 0), maxPerOrder)
    const quantity = Math.min(entry.quantity, effectiveLimit)

    if (quantity <= 0) {
      return []
    }

    return [
      {
        id: `guest-${product.id}`,
        productId: product.id,
        name: product.name,
        brand: product.brand ?? null,
        category: product.category ?? null,
        size: product.size ?? null,
        imageLabel: product.imageLabel ?? null,
        imageUrl: product.images?.[0] ?? null,
        accent: product.accent ?? null,
        quantity,
        price: product.price,
        totalPrice: product.price * quantity,
        stock: product.stock ?? quantity,
        maxPerOrder,
      } satisfies CartItem,
    ]
  })

  const normalizedEntries = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }))
  writeGuestCartEntries(normalizedEntries)

  return {
    items,
    summary: buildGuestSummary(items, taxPercentage),
  }
}

const buildGuestQuantityLimitMessage = (item: CartItem | undefined) => {
  if (!item) {
    return "You have reached the purchase limit for this product."
  }

  if (item.maxPerOrder && item.maxPerOrder > 0) {
    return `You can buy up to ${item.maxPerOrder} unit(s) of this product in a single order.`
  }

  return "This product is currently unavailable in the requested quantity."
}

const getProductLimitErrorMessage = (
  productName: string,
  maxPerOrder: number | null
) => {
  if (maxPerOrder !== null) {
    return `You can buy up to ${maxPerOrder} unit(s) of ${productName} in a single order.`
  }

  return `${productName} is currently unavailable in the requested quantity.`
}

export function StoreProvider({ children, currentUser }: StoreProviderProps) {
  const dispatch = useAppShellDispatch()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartSummary, setCartSummary] = useState<CartSummary>(emptySummary)
  const [taxPercentage, setTaxPercentage] = useState(DEFAULT_TAX_PERCENTAGE)
  const [isCartLoading, setIsCartLoading] = useState(true)
  const [isFreeDeliveryPopupOpen, setIsFreeDeliveryPopupOpen] = useState(false)
  const [cartToast, setCartToast] = useState<CartToastState | null>(null)
  const previousSubtotalRef = useRef(0)
  const hasHydratedCartRef = useRef(false)
  const cartToastTimeoutRef = useRef<number | null>(null)

  const hideCartToast = useCallback(() => {
    setCartToast(null)

    if (cartToastTimeoutRef.current) {
      window.clearTimeout(cartToastTimeoutRef.current)
      cartToastTimeoutRef.current = null
    }
  }, [])

  const showCartToast = useCallback((item: CartItem | undefined, itemCount: number) => {
    if (cartToastTimeoutRef.current) {
      window.clearTimeout(cartToastTimeoutRef.current)
    }

    setCartToast({
      productName: item?.name || "Item",
      imageUrl: item?.imageUrl,
      quantity: item?.quantity || 1,
      itemCount,
      price: item?.price ?? null,
    })

    cartToastTimeoutRef.current = window.setTimeout(() => {
      setCartToast(null)
      cartToastTimeoutRef.current = null
    }, 3600)
  }, [])

  const handleViewCartFromToast = useCallback(() => {
    hideCartToast()
    dispatch(appShellActions.openCart())
  }, [dispatch, hideCartToast])

  useEffect(() => {
    return () => {
      if (cartToastTimeoutRef.current) {
        window.clearTimeout(cartToastTimeoutRef.current)
      }
    }
  }, [])

  const syncCartState = useCallback((data: { items: CartItem[]; summary: CartSummary }) => {
    const previousSubtotal = previousSubtotalRef.current
    const nextSubtotal = data.summary.subtotal

    if (
      hasHydratedCartRef.current &&
      previousSubtotal < FREE_DELIVERY_THRESHOLD &&
      nextSubtotal >= FREE_DELIVERY_THRESHOLD &&
      data.summary.itemCount > 0
    ) {
      setIsFreeDeliveryPopupOpen(true)
    }

    setCartItems(data.items)
    setCartSummary(data.summary)
    previousSubtotalRef.current = nextSubtotal
    hasHydratedCartRef.current = true
  }, [])

  const assertWithinProductLimit = useCallback(async (productId: string, requestedQuantity: number) => {
    if (requestedQuantity <= 0) {
      return
    }

    const cartItem = cartItems.find((item) => item.productId === productId)

    if (cartItem) {
      const availableStock = Math.max(0, cartItem.stock ?? 0)
      const maxPerOrder = normalizeMaxPerOrder(cartItem.maxPerOrder)
      const effectiveLimit =
        maxPerOrder === null ? availableStock : Math.min(availableStock, maxPerOrder)

      if (effectiveLimit <= 0 || requestedQuantity > effectiveLimit) {
        throw new Error(getProductLimitErrorMessage(cartItem.name, maxPerOrder))
      }

      return
    }

    const product = await fetchProductById(productId)
    const availableStock = Math.max(0, product.stock ?? 0)
    const maxPerOrder = normalizeMaxPerOrder(product.maxPerOrder)
    const effectiveLimit =
      maxPerOrder === null ? availableStock : Math.min(availableStock, maxPerOrder)

    if (effectiveLimit <= 0 || requestedQuantity > effectiveLimit) {
      throw new Error(getProductLimitErrorMessage(product.name, maxPerOrder))
    }
  }, [cartItems])

  const refreshCart = useCallback(async () => {
    setIsCartLoading(true)
    try {
      const [settings, userCartData] = await Promise.all([
        fetchCachedAppSettings(),
        currentUser ? fetchCart() : Promise.resolve(null),
      ])
      setTaxPercentage(settings.taxPercentage)
      const data =
        userCartData || (await buildGuestCartState(readGuestCartEntries(), settings.taxPercentage))
      syncCartState(data)
    } finally {
      setIsCartLoading(false)
    }
  }, [currentUser, syncCartState])

  const clearCartState = useCallback(() => {
    writeGuestCartEntries([])
    syncCartState({ items: [], summary: emptySummary })
  }, [syncCartState])

  useEffect(() => {
    void refreshCart()
  }, [refreshCart])

  useEffect(() => {
    const syncGuestCartAfterLogin = async () => {
      if (!currentUser) {
        return
      }

      const guestEntries = readGuestCartEntries()

      if (guestEntries.length === 0) {
        return
      }

      try {
        for (const entry of guestEntries) {
          await addCartItemApi(entry.productId, entry.quantity)
        }
        writeGuestCartEntries([])
        await refreshCart()
      } catch {
        // Keep guest cart data when sync fails so customers do not lose selections.
      }
    }

    void syncGuestCartAfterLogin()
  }, [currentUser, refreshCart])

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    const currentQuantity =
      cartItems.find((item) => item.productId === productId)?.quantity ?? 0
    const requestedQuantity = currentQuantity + quantity
    await assertWithinProductLimit(productId, requestedQuantity)

    if (currentUser) {
      try {
        const data = await addCartItemApi(productId, quantity)
        syncCartState(data)
        showCartToast(
          data.items.find((item) => item.productId === productId),
          data.summary.itemCount
        )
        return
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          throw error
        }
      }
    }

    const currentEntries = readGuestCartEntries()
    const nextEntries = [...currentEntries]
    const existingEntry = nextEntries.find((entry) => entry.productId === productId)

    if (existingEntry) {
      existingEntry.quantity += quantity
    } else {
      nextEntries.push({ productId, quantity })
    }

    writeGuestCartEntries(nextEntries)
    const guestCartState = await buildGuestCartState(nextEntries, taxPercentage)
    syncCartState(guestCartState)

    const requestedGuestQuantity = Math.max(
      0,
      nextEntries.find((entry) => entry.productId === productId)?.quantity ?? 0
    )
    const cartItem = guestCartState.items.find((item) => item.productId === productId)
    const actualQuantity = cartItem?.quantity ?? 0

    if (actualQuantity < requestedGuestQuantity) {
      throw new Error(buildGuestQuantityLimitMessage(cartItem))
    }
    showCartToast(cartItem, guestCartState.summary.itemCount)
  }, [assertWithinProductLimit, cartItems, currentUser, showCartToast, syncCartState, taxPercentage])

  const updateCartQuantity = useCallback(async (productId: string, quantity: number) => {
    await assertWithinProductLimit(productId, quantity)

    if (currentUser) {
      try {
        const data = await updateCartItemApi(productId, quantity)
        syncCartState(data)
        return
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          throw error
        }
      }
    }

    const currentEntries = readGuestCartEntries()
    const nextEntries =
      quantity <= 0
        ? currentEntries.filter((entry) => entry.productId !== productId)
        : currentEntries.some((entry) => entry.productId === productId)
          ? currentEntries.map((entry) =>
              entry.productId === productId ? { ...entry, quantity } : entry
            )
          : [...currentEntries, { productId, quantity }]

    writeGuestCartEntries(nextEntries)
    const guestCartState = await buildGuestCartState(nextEntries, taxPercentage)
    syncCartState(guestCartState)

    if (quantity > 0) {
      const cartItem = guestCartState.items.find((item) => item.productId === productId)
      const actualQuantity = cartItem?.quantity ?? 0

      if (actualQuantity < quantity) {
        throw new Error(buildGuestQuantityLimitMessage(cartItem))
      }
    }
  }, [assertWithinProductLimit, currentUser, syncCartState, taxPercentage])

  const removeFromCart = useCallback(async (productId: string) => {
    if (currentUser) {
      try {
        const data = await removeCartItemApi(productId)
        syncCartState(data)
        return
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          throw error
        }
      }
    }

    const nextEntries = readGuestCartEntries().filter((entry) => entry.productId !== productId)
    writeGuestCartEntries(nextEntries)
    syncCartState(await buildGuestCartState(nextEntries, taxPercentage))
  }, [currentUser, syncCartState, taxPercentage])

  const searchProducts = useCallback(async (query: string) => searchProductsApi(query), [])

  const checkoutCart = useCallback(async (
    paymentMethod: string,
    couponCode?: string,
    idempotencyKey?: string
  ) => {
    const response = await checkoutCartApi(paymentMethod, couponCode, idempotencyKey)

    if (currentUser) {
      await refreshCart()
    } else {
      writeGuestCartEntries([])
      syncCartState({ items: [], summary: emptySummary })
    }

    return response
  }, [currentUser, refreshCart, syncCartState])

  const cartQuantities = useMemo(
    () =>
      cartItems.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.productId] = item.quantity
        return accumulator
      }, {}),
    [cartItems]
  )

  const value = useMemo(
    () => ({
      cartItems,
      cartSummary,
      cartQuantities,
      isCartLoading,
      refreshCart,
      clearCartState,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      searchProducts,
      checkoutCart,
    }),
    [
      addToCart,
      cartItems,
      cartQuantities,
      cartSummary,
      clearCartState,
      checkoutCart,
      isCartLoading,
      refreshCart,
      removeFromCart,
      searchProducts,
      updateCartQuantity,
    ]
  )

  return (
    <StoreContext.Provider value={value}>
      {children}
      {cartToast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[130] flex justify-center px-3 sm:bottom-7">
          <div className="pointer-events-auto w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 overflow-hidden rounded-[18px] border border-[#d7eadf] bg-white shadow-[0_18px_48px_rgba(27,77,62,0.22)]">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[#edf3e7] bg-[#f8fcf6]">
                {cartToast.imageUrl ? (
                  <img
                    src={cartToast.imageUrl}
                    alt={cartToast.productName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ShoppingCart className="h-6 w-6 text-[#1B4D3E]" />
                )}
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1B4D3E] px-1 text-[10px] font-bold text-white">
                  {cartToast.quantity}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#16813c]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#16813c] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  Added to cart
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-[#241d13]">
                  {cartToast.productName}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#7d6d52]">
                  {cartToast.price ? `${formatPrice(cartToast.price)} · ` : ""}
                  {cartToast.itemCount} item{cartToast.itemCount === 1 ? "" : "s"} in cart
                </p>
              </div>

              <button
                type="button"
                onClick={hideCartToast}
                aria-label="Dismiss cart popup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8b7c63] transition hover:bg-[#f7f1e7] hover:text-[#2c2417]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[#edf0e7] bg-[#fbfff9] px-3 py-2.5">
              <span className="truncate text-xs font-semibold text-[#52715b]">
                Ready for checkout when you are.
              </span>
              <button
                type="button"
                onClick={handleViewCartFromToast}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1B4D3E] px-4 text-xs font-bold text-white transition hover:bg-[#163d32]"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                View cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isFreeDeliveryPopupOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#2c2417]/35 px-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsFreeDeliveryPopupOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-[#d7eadf] bg-white shadow-2xl">
            <div className="bg-[linear-gradient(135deg,#f2faf6_0%,#fff8ea_100%)] px-6 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1B4D3E] shadow-sm">
                <span className="text-2xl font-bold">₹</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#2c2417]">
                Free delivery unlocked
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#7d6d52]">
                Your cart has reached ₹300 or more, so delivery is now free on this order.
              </p>
              <button
                type="button"
                className="mt-5 rounded-full bg-[#1B4D3E] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#163d32]"
                onClick={() => setIsFreeDeliveryPopupOpen(false)}
              >
                Nice
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider.")
  }

  return context
}
