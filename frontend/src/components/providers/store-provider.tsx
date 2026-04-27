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

import {
  addCartItem as addCartItemApi,
  checkoutCart as checkoutCartApi,
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
import type { Product } from "@/lib/storefront"

const GUEST_CART_STORAGE_KEY = "guest_cart_items"
const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 300

type GuestCartEntry = {
  productId: string
  quantity: number
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
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  searchProducts: (query: string) => Promise<Product[]>
  checkoutCart: (paymentMethod: string) => Promise<CheckoutResponse>
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
  const storedCart = window.localStorage.getItem(GUEST_CART_STORAGE_KEY)

  if (!storedCart) {
    return [] as GuestCartEntry[]
  }

  try {
    const parsedCart = JSON.parse(storedCart) as GuestCartEntry[]

    if (!Array.isArray(parsedCart)) {
      return []
    }

    return parsedCart.filter(
      (entry) =>
        typeof entry?.productId === "string" &&
        entry.productId.length > 0 &&
        typeof entry.quantity === "number" &&
        entry.quantity > 0
    )
  } catch {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY)
    return []
  }
}

const writeGuestCartEntries = (entries: GuestCartEntry[]) => {
  if (entries.length === 0) {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(entries))
}

const buildGuestSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee =
    subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const tax = Number((subtotal * 0.05).toFixed(2))
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

const buildGuestCartState = async (entries: GuestCartEntry[]) => {
  if (entries.length === 0) {
    return {
      items: [] as CartItem[],
      summary: emptySummary,
    }
  }

  const products = await fetchProducts()
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
    summary: buildGuestSummary(items),
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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartSummary, setCartSummary] = useState<CartSummary>(emptySummary)
  const [isCartLoading, setIsCartLoading] = useState(true)
  const [isFreeDeliveryPopupOpen, setIsFreeDeliveryPopupOpen] = useState(false)
  const previousSubtotalRef = useRef(0)
  const hasHydratedCartRef = useRef(false)

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

    const product = await fetchProductById(productId)
    const availableStock = Math.max(0, product.stock ?? 0)
    const maxPerOrder = normalizeMaxPerOrder(product.maxPerOrder)
    const effectiveLimit =
      maxPerOrder === null ? availableStock : Math.min(availableStock, maxPerOrder)

    if (effectiveLimit <= 0 || requestedQuantity > effectiveLimit) {
      throw new Error(getProductLimitErrorMessage(product.name, maxPerOrder))
    }
  }, [])

  const refreshCart = useCallback(async () => {
    setIsCartLoading(true)
    try {
      const data = currentUser
        ? await fetchCart()
        : await buildGuestCartState(readGuestCartEntries())
      syncCartState(data)
    } finally {
      setIsCartLoading(false)
    }
  }, [currentUser, syncCartState])

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
    const guestCartState = await buildGuestCartState(nextEntries)
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
  }, [assertWithinProductLimit, cartItems, currentUser, syncCartState])

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
    const guestCartState = await buildGuestCartState(nextEntries)
    syncCartState(guestCartState)

    if (quantity > 0) {
      const cartItem = guestCartState.items.find((item) => item.productId === productId)
      const actualQuantity = cartItem?.quantity ?? 0

      if (actualQuantity < quantity) {
        throw new Error(buildGuestQuantityLimitMessage(cartItem))
      }
    }
  }, [assertWithinProductLimit, currentUser, syncCartState])

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
    syncCartState(await buildGuestCartState(nextEntries))
  }, [currentUser, syncCartState])

  const searchProducts = useCallback(async (query: string) => searchProductsApi(query), [])

  const checkoutCart = useCallback(async (paymentMethod: string) => {
    const response = await checkoutCartApi(paymentMethod)

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
