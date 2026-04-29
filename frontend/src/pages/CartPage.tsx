import { useCallback, useMemo, useState } from "react"
import { ArrowLeft, Leaf, ShieldCheck, Truck } from "lucide-react"

import { useStore } from "@/components/providers/store-provider"
import { Button } from "@/components/ui/button"
import { AddressSection } from "@/features/cart/components/AddressSection"
import { CartLineItemCard } from "@/features/cart/components/CartLineItemCard"
import { OrderSummaryCard } from "@/features/cart/components/OrderSummaryCard"
import type { AuthUser } from "@/lib/auth"
import type { Address } from "@/lib/store-api"
import { formatPrice } from "@/lib/storefront"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"

type CartPageProps = {
  currentUser?: AuthUser | null
}

const CartPage = ({ currentUser = null }: CartPageProps) => {
  const dispatch = useAppShellDispatch()
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [cartNotice, setCartNotice] = useState("")
  const {
    cartItems,
    cartSummary,
    isCartLoading,
    removeFromCart,
    updateCartQuantity,
  } = useStore()

  const uniqueProductCount = cartItems.length
  const isLoggedIn = Boolean(currentUser)
  const handleAddressSelection = useCallback((address: Address | null) => {
    setSelectedAddress(address)
    setCartNotice("")
  }, [])
  const headerHighlights = useMemo(
    () => [
      {
        label: "Cart value",
        value: formatPrice(cartSummary.subtotal),
      },
      {
        label: "Items",
        value: `${cartSummary.itemCount}`,
      },
      {
        label: "Products",
        value: `${uniqueProductCount}`,
      },
    ],
    [cartSummary.itemCount, cartSummary.subtotal, uniqueProductCount]
  )

  if (isCartLoading) {
    return (
      <div className="mx-auto max-w-5xl rounded-[28px] bg-white/70 p-6 text-center text-[#42675c] sm:p-8">
        Loading your cart...
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl rounded-[30px] bg-white/75 p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#123c31] sm:text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-[#648176]">
          Add a few fresh picks and they’ll appear here with totals and payment options.
        </p>
        <Button
          type="button"
          className="mt-6 rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539]"
          onClick={() => dispatch(appShellActions.openShop(undefined))}
        >
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f7f4ee] text-[#262118]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-3 pb-12 pt-3 sm:px-4 md:px-6">
        <section className="overflow-hidden rounded-[26px] border border-[#ece4d6] bg-[linear-gradient(135deg,#fffdf8_0%,#fff7e6_40%,#f6fbf5_100%)] shadow-[0_14px_30px_rgba(78,62,31,0.08)]">
          <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[1.2fr_0.8fr] lg:px-6 lg:py-6">
            <div className="relative">
              <div className="absolute -left-8 top-0 h-24 w-24 rounded-full bg-[#ffd96a]/25 blur-3xl" />
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-full border border-[#ece4d6] bg-white/85 px-3 text-sm text-[#624c11] shadow-sm hover:bg-[#faf4e8]"
                  onClick={() => dispatch(appShellActions.openShop(undefined))}
                >
                  <ArrowLeft className="size-4" />
                  Back to Shopping
                </Button>

                <div className="mt-4 max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#af9452]">
                    Curated bag
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold leading-tight text-[#2c2417] sm:text-3xl">
                    Review your bag before checkout.
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#7d6d52]">
                    Update quantities, remove anything you do not need, and continue to a dedicated payment section when you are ready.
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {headerHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[18px] border border-[#ece4d6] bg-white/80 px-3 py-3 shadow-sm"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b8a69]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#2c2417]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2 self-start">
              <div className="rounded-[22px] border border-[#ece4d6] bg-white/85 p-4 shadow-[0_14px_28px_rgba(78,62,31,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#af9452]">
                  Next step
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#2c2417]">Proceed to Payment</p>
                <p className="mt-1 text-sm leading-6 text-[#7d6d52]">
                  Payment methods, coupon selection, and final confirmation live in a separate checkout section.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[18px] border border-[#ece4d6] bg-white/80 p-3 shadow-sm">
                  <Truck className="h-5 w-5 text-[#a78410]" />
                  <p className="mt-2 text-sm font-semibold text-[#2c2417]">Express dispatch</p>
                  <p className="mt-1 text-sm text-[#7d6d52]">Faster route allocation for active orders.</p>
                </div>
                <div className="rounded-[18px] border border-[#ece4d6] bg-white/80 p-3 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#a78410]" />
                  <p className="mt-2 text-sm font-semibold text-[#2c2417]">Secure checkout</p>
                  <p className="mt-1 text-sm text-[#7d6d52]">Payment happens on a dedicated, focused screen.</p>
                </div>
                <div className="rounded-[18px] border border-[#ece4d6] bg-white/80 p-3 shadow-sm">
                  <Leaf className="h-5 w-5 text-[#a78410]" />
                  <p className="mt-2 text-sm font-semibold text-[#2c2417]">Fresh picks</p>
                  <p className="mt-1 text-sm text-[#7d6d52]">{uniqueProductCount} unique products ready for checkout.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="space-y-4">
            <div className="rounded-[22px] border border-[#ece4d6] bg-white/80 p-4 shadow-[0_12px_28px_rgba(78,62,31,0.05)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b8a69]">
                    Cart overview
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#2c2417]">Review your selections</h2>
                  <p className="mt-1 text-sm text-[#7d6d52]">
                    Adjust quantities, remove items, and fine-tune the order before payment.
                  </p>
                </div>
                <div className="rounded-full bg-[#fff7dd] px-4 py-2 text-sm font-medium text-[#6a5620] ring-1 ring-[#efe4bf]">
                  {cartSummary.itemCount} items across {uniqueProductCount} products
                </div>
              </div>
            </div>

            {cartItems.map((item) => (
              <CartLineItemCard
                key={item.id}
                item={item}
                onDecrease={updateCartQuantity}
                onIncrease={updateCartQuantity}
                onRemove={removeFromCart}
              />
            ))}

            <AddressSection
              isLoggedIn={isLoggedIn}
              onSelectionChange={handleAddressSelection}
              onRequireLogin={() =>
                dispatch(
                  appShellActions.openLogin({
                    message: "Please log in to save your delivery address.",
                    redirectView: "cart",
                  })
                )
              }
            />
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummaryCard
              cartSummary={cartSummary}
              cartItems={cartItems}
              checkoutMessage={cartNotice}
              isCheckingOut={false}
              payableTotal={cartSummary.total}
              checkoutLabel="Proceed to Payment"
              onCheckout={async () => {
                if (isLoggedIn && !selectedAddress) {
                  setCartNotice("Please select or add a delivery address before proceeding to payment.")
                  return
                }

                setCartNotice("")
                dispatch(appShellActions.openCheckout())
              }}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CartPage
