import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ArrowRight, ChevronDown, CreditCard, Landmark, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CartItem, CartSummary } from "@/lib/store-api"
import { formatPrice } from "@/lib/storefront"

const FREE_DELIVERY_THRESHOLD = 300

type OrderSummaryCardProps = {
  cartSummary: CartSummary
  cartItems: CartItem[]
  checkoutMessage: string
  isCheckingOut: boolean
  appliedCouponCode?: string | null
  couponDiscount?: number
  payableTotal?: number
  checkoutLabel?: string
  showItemDetails?: boolean
  onCheckout: () => Promise<void>
}

export function OrderSummaryCard({
  cartSummary,
  cartItems,
  checkoutMessage,
  isCheckingOut,
  appliedCouponCode,
  couponDiscount = 0,
  payableTotal = cartSummary.total,
  checkoutLabel = "Proceed to Payment",
  showItemDetails = true,
  onCheckout,
}: OrderSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className="overflow-hidden rounded-[22px] border border-[#ece4d6] bg-white py-0 shadow-[0_12px_28px_rgba(78,62,31,0.08)]">
      <CardHeader className="border-b border-[#efe4d1] bg-[linear-gradient(135deg,#ffffff_0%,#fff9ee_100%)] px-4 pt-4 sm:px-5 sm:pt-5">
        <CardTitle className="text-lg text-[#2c2417] sm:text-2xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="rounded-[18px] bg-[linear-gradient(135deg,#fff3d0_0%,#fff8e7_100%)] p-4 text-[#2c2417] shadow-[0_10px_22px_rgba(78,62,31,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b8a69]">
            Total Payable
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-3xl font-semibold leading-none">
                {formatPrice(payableTotal)}
              </div>
              <p className="mt-1.5 text-xs text-[#7d6d52] sm:text-sm">
                Inclusive of delivery, taxes, and applied savings.
              </p>
            </div>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5620] ring-1 ring-[#efe4bf]">
              {cartSummary.itemCount} items
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm font-semibold text-[#2c2417]">
            <span className="break-words">
              Items ({cartSummary.itemCount}) · {formatPrice(cartSummary.subtotal)}
            </span>
            {showItemDetails ? (
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-1 rounded-full bg-[#fff7dd] px-2.5 py-1 text-xs font-semibold text-[#6a5620] transition hover:bg-[#fff1c2]"
              >
                <span>{showDetails ? "Hide details" : "View details"}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}
          </div>

          {showItemDetails ? (
            <div
              className={`mt-2 overflow-hidden rounded-lg bg-[#fcf8ef] transition-all duration-300 ${
                showDetails ? "max-h-[500px] p-3" : "max-h-0 p-0"
              }`}
            >
              <div className="space-y-2 divide-y divide-[#e6f2ec]">
                {cartItems.map((item) => {
                  const detailedItem = item as CartItem & { originalPrice?: number }

                  return (
                    <div
                      key={item.productId}
                      className="flex flex-col gap-3 rounded-xl px-2 py-2 transition hover:bg-white/70 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#e8f5ee]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                          <span className="text-xs font-bold text-[#a78410]">
                              {item.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-sm font-medium text-[#2c2417]">
                            {item.name}
                          </span>
                          <span className="text-xs text-[#8f8168]">
                            {formatPrice(item.price)} × {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end">
                        <span className="text-sm font-semibold text-[#2c2417]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {detailedItem.originalPrice && detailedItem.originalPrice > item.price ? (
                          <span className="text-[10px] text-[#a78410]">
                            Saved {formatPrice((detailedItem.originalPrice - item.price) * item.quantity)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-4 text-sm text-[#7d6d52]">
          <span>Delivery Fee</span>
          <span className="shrink-0 font-medium">
            {cartSummary.deliveryFee === 0 && cartSummary.subtotal >= FREE_DELIVERY_THRESHOLD
              ? "FREE"
              : formatPrice(cartSummary.deliveryFee)}
          </span>
        </div>
        {cartSummary.subtotal < FREE_DELIVERY_THRESHOLD ? (
          <div className="rounded-[14px] bg-[#fcf8ef] px-4 py-3 text-sm leading-6 text-[#6a5620]">
            Add {formatPrice(FREE_DELIVERY_THRESHOLD - cartSummary.subtotal)} more to unlock free delivery.
          </div>
        ) : (
          <div className="rounded-[14px] bg-[#f2faf6] px-4 py-3 text-sm font-medium leading-6 text-[#1B4D3E]">
            You have unlocked free delivery on this order.
          </div>
        )}
        <div className="flex items-start justify-between gap-4 text-sm text-[#7d6d52]">
          <span>Tax</span>
          <span className="shrink-0">{formatPrice(cartSummary.tax)}</span>
        </div>
        {couponDiscount > 0 ? (
          <div className="flex items-start justify-between gap-4 text-sm font-semibold text-[#a78410]">
            <span className="break-words">{appliedCouponCode ? `Coupon (${appliedCouponCode})` : "Coupon Discount"}</span>
            <span className="shrink-0">-{formatPrice(couponDiscount)}</span>
          </div>
        ) : null}
        <Separator className="bg-[#efe4d1]" />
        <div className="flex items-start justify-between gap-4 text-base font-bold text-[#2c2417] sm:text-lg">
          <span>Total</span>
          <span className="shrink-0 transition-all duration-300">{formatPrice(payableTotal)}</span>
        </div>

        <Button
          onClick={() => void onCheckout()}
          disabled={isCheckingOut}
          className="mt-1 h-11 w-full rounded-[16px] bg-[#1B4D3E] text-sm font-semibold hover:bg-[#163d32] sm:text-base"
        >
          {isCheckingOut ? "Preparing Summary..." : checkoutLabel}
          {isCheckingOut ? null : <ArrowRight className="h-4 w-4" />}
        </Button>

        {checkoutMessage ? (
          <div className="rounded-[16px] bg-[#fcf8ef] px-4 py-3 text-sm leading-6 text-[#6a5620]">
            {checkoutMessage}
          </div>
        ) : null}

        <div className="border-t border-[#efe4d1] pt-5">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b8a69]">
            We accept
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-[#8f8168]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fcf8ef]">
              <CreditCard className="h-5 w-5" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fcf8ef]">
              <Wallet className="h-5 w-5" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fcf8ef]">
              <Landmark className="h-5 w-5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
