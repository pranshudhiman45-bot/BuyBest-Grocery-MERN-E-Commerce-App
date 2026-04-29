import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react"

import { useStore } from "@/components/providers/store-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CouponSection } from "@/features/cart/components/CouponSection"
import { OrderSummaryCard } from "@/features/cart/components/OrderSummaryCard"
import { PaymentMethodSelector } from "@/features/cart/components/PaymentMethodSelector"
import { useCartCheckout } from "@/features/cart/hooks/use-cart-checkout"
import type { AuthUser } from "@/lib/auth"
import {
  getCouponDiscountAmount,
  isCouponEligible,
  type CouponDefinition,
} from "@/lib/offers"
import {
  createStripeCheckoutSession,
  fetchCoupons,
  fetchStripeCheckoutStatus,
} from "@/lib/store-api"
import { formatPrice } from "@/lib/storefront"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"

type CheckoutPageProps = {
  currentUser?: AuthUser | null
}

const CheckoutPage = ({ currentUser = null }: CheckoutPageProps) => {
  const dispatch = useAppShellDispatch()
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponFeedback, setCouponFeedback] = useState("")
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<CouponDefinition[]>([])
  const {
    cartItems,
    cartSummary,
    checkoutCart,
    isCartLoading,
    refreshCart,
  } = useStore()
  const cartTotalBeforeDiscount = cartSummary.total
  const appliedCoupon = useMemo(
    () =>
      appliedCouponCode
        ? coupons.find((coupon) => coupon.code === appliedCouponCode) ?? null
        : null,
    [appliedCouponCode, coupons]
  )
  const couponDiscount = appliedCoupon
    ? getCouponDiscountAmount(appliedCoupon, cartTotalBeforeDiscount)
    : 0
  const payableTotal = Math.max(cartTotalBeforeDiscount - couponDiscount, 0)

  const {
    checkoutMessage,
    setCheckoutMessage,
    handleCheckout,
    isCheckingOut,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  } = useCartCheckout({
    checkoutCart,
    createOnlineCheckoutSession: createStripeCheckoutSession,
    onBeforeCheckout: () => {
      if (currentUser) {
        return true
      }

      setIsLoginAlertOpen(true)
      return false
    },
    getSuccessMessage: (response) => {
      const payableLabel = formatPrice(payableTotal)

      if (appliedCoupon) {
        return `${response.message} Coupon ${appliedCoupon.code} applied. Total payable: ${payableLabel}`
      }

      return `${response.message} Total payable: ${payableLabel}`
    },
  })

  useEffect(() => {
    const url = new URL(window.location.href)
    const stripeStatus = url.searchParams.get("stripe")
    const sessionId = url.searchParams.get("session_id")

    if (stripeStatus === "cancelled") {
      setCheckoutMessage("Stripe checkout was cancelled. Your cart is still waiting for you.")
      window.history.replaceState({}, "", "/checkout")
      return
    }

    if (stripeStatus !== "success" || !sessionId || !currentUser) {
      return
    }

    const verifyStripeCheckout = async () => {
      try {
        const status = await fetchStripeCheckoutStatus(sessionId)

        if (status.paymentStatus === "paid") {
          await refreshCart()
          setCheckoutMessage("Payment confirmed and your order has been placed successfully.")
        } else {
          setCheckoutMessage("Stripe returned you to checkout, but payment is still processing.")
        }
      } catch (error) {
        setCheckoutMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your Stripe payment right now."
        )
      } finally {
        window.history.replaceState({}, "", "/checkout")
      }
    }

    void verifyStripeCheckout()
  }, [currentUser, refreshCart, setCheckoutMessage])

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const nextCoupons = await fetchCoupons()
        setCoupons(nextCoupons)
      } catch {
        setCoupons([])
      }
    }

    void loadCoupons()
  }, [])

  useEffect(() => {
    if (!isLoginAlertOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLoginAlertOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isLoginAlertOpen])

  useEffect(() => {
    if (!appliedCoupon) {
      return
    }

    if (isCouponEligible(appliedCoupon, cartTotalBeforeDiscount)) {
      return
    }

    setAppliedCouponCode(null)
    setCouponFeedback(
      `${appliedCoupon.code} was removed because your cart total dropped below ${formatPrice(
        appliedCoupon.minimumOrderValue
      )}.`
    )
  }, [appliedCoupon, cartTotalBeforeDiscount])

  const handleLoginRedirect = () => {
    dispatch(
      appShellActions.openLogin({
        message: "Please log in to place your order.",
        redirectView: "checkout",
      })
    )
  }

  const applyCoupon = (selectedCode?: string) => {
    const normalizedCode = (selectedCode ?? couponCode).trim().toUpperCase()

    if (!normalizedCode) {
      setCouponFeedback("Enter a coupon code to unlock a discount.")
      return
    }

    const matchingCoupon = coupons.find((coupon) => coupon.code === normalizedCode)

    if (!matchingCoupon) {
      setCouponFeedback("That coupon is not available in the current offers list.")
      return
    }

    if (!isCouponEligible(matchingCoupon, cartTotalBeforeDiscount)) {
      setCouponFeedback(
        `${matchingCoupon.code} unlocks only when the cart total reaches ${formatPrice(
          matchingCoupon.minimumOrderValue
        )} or more.`
      )
      setCouponCode(normalizedCode)
      return
    }

    const discountAmount = getCouponDiscountAmount(matchingCoupon, cartTotalBeforeDiscount)

    setAppliedCouponCode(matchingCoupon.code)
    setCouponCode(matchingCoupon.code)
    setCouponFeedback(
      `${matchingCoupon.code} applied successfully. You saved ${formatPrice(discountAmount)} on this order.${
        matchingCoupon.discountType === "percentage" && matchingCoupon.maxDiscount
          ? ` (Max discount ${formatPrice(matchingCoupon.maxDiscount)})`
          : ""
      }`
    )
  }

  const removeCoupon = () => {
    if (!appliedCoupon) {
      return
    }

    setAppliedCouponCode(null)
    setCouponFeedback(`${appliedCoupon.code} was removed from this order.`)
  }

  if (isCartLoading) {
    return (
      <div className="mx-auto max-w-5xl rounded-[28px] bg-white/70 p-6 text-center text-[#42675c] sm:p-8">
        Preparing your checkout...
      </div>
    )
  }

  if (cartItems.length === 0 && checkoutMessage) {
    return (
      <div className="mx-auto max-w-4xl rounded-[30px] bg-white/80 p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#123c31] sm:text-3xl">Order update</h1>
        <p className="mt-3 text-[#648176]">{checkoutMessage}</p>
        <Button
          type="button"
          className="mt-6 rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539]"
          onClick={() => dispatch(appShellActions.openShop())}
        >
          Continue shopping
        </Button>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl rounded-[30px] bg-white/75 p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#123c31] sm:text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-[#648176]">
          Add a few fresh picks before moving to the payment section.
        </p>
        <Button
          type="button"
          className="mt-6 rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539]"
          onClick={() => dispatch(appShellActions.openCart())}
        >
          Back to Cart
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(194,241,210,0.4),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,252,248,0.9),_transparent_30%),linear-gradient(180deg,_#f8fbf9_0%,_#edf5f0_55%,_#e8f1ec_100%)]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-3 pb-12 pt-3 sm:px-4 md:px-6">
          <section className="overflow-hidden rounded-[34px] border border-[#dce9e2] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9f7_45%,#edf7f0_100%)] shadow-[0_30px_80px_rgba(18,59,48,0.10)]">
            <div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8">
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto rounded-full border border-[#dce9e2] bg-white/80 px-4 py-2 text-sm text-[#174638] shadow-sm hover:bg-white sm:text-base"
                  onClick={() => dispatch(appShellActions.openCart())}
                >
                  <ArrowLeft className="size-4" />
                  Back to Cart
                </Button>

                <div className="mt-6 max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#6f8d80]">
                    Dedicated checkout
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold leading-[0.96] text-[#11392f] sm:text-5xl">
                    Payment and coupons, section.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#658177] sm:text-base">
                    This screen is focused only on payment method, coupon selection, and final order confirmation. Cart items stay back on the bag page.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 self-start">
                <div className="rounded-[28px] bg-[#123c31] p-5 text-white shadow-[0_18px_36px_rgba(18,59,48,0.18)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                    Ready to confirm
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{formatPrice(payableTotal)}</p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Your final payable amount updates here as soon as you apply a valid coupon.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#dce9e2] bg-white/80 p-4 shadow-sm">
                  <CreditCard className="h-5 w-5 text-[#0d7a45]" />
                  <p className="mt-3 text-sm font-semibold text-[#123b30]">Focused checkout flow</p>
                  <p className="mt-1 text-sm text-[#6a8579]">No cart clutter here, just payment, coupons, and confirmation.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] xl:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
            <div className="space-y-5">
              <PaymentMethodSelector
                selectedPaymentMethod={selectedPaymentMethod}
                onSelect={setSelectedPaymentMethod}
              />
              <CouponSection
                cartTotal={cartTotalBeforeDiscount}
                couponCode={couponCode}
                appliedCoupon={appliedCoupon}
                couponFeedback={couponFeedback}
                coupons={coupons}
                showCatalog
                previewCount={3}
                onCouponCodeChange={setCouponCode}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
              />
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <OrderSummaryCard
                cartSummary={cartSummary}
                cartItems={cartItems}
                checkoutMessage={checkoutMessage}
                isCheckingOut={isCheckingOut}
                appliedCouponCode={appliedCoupon?.code}
                couponDiscount={couponDiscount}
                payableTotal={payableTotal}
                checkoutLabel="Place Order"
                showItemDetails={false}
                onCheckout={() => handleCheckout(appliedCoupon?.code)}
              />
            </aside>
          </div>
        </div>
      </div>

      {isLoginAlertOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123c31]/35 px-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsLoginAlertOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#cfe7dc] bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#e9f7ef] via-[#f4fbf7] to-[#fff6df] px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1B4D3E] shadow-sm ring-1 ring-[#dbeee5]">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-[#123c31]">Login required to place your order</h2>
                  <p className="text-sm text-[#4E7C6B]">
                    Your cart is saved, but you need to sign in before we can finish the payment step.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Alert className="border-[#d9ebe3] bg-[#f8fcfa] text-[#123c31]">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Good news</AlertTitle>
                <AlertDescription>
                  Your selected items and coupon choices will still be waiting after login.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-[#cfe7dc] text-[#1B4D3E] hover:bg-[#f3fbf7]"
                  onClick={() => setIsLoginAlertOpen(false)}
                >
                  Keep browsing
                </Button>
                <Button
                  type="button"
                  className="rounded-full bg-[#1B4D3E] text-white hover:bg-[#163d32]"
                  onClick={handleLoginRedirect}
                >
                  Login to continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default CheckoutPage
