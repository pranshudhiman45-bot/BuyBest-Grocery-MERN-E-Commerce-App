import { useMemo, useState } from "react"
import { CheckCircle2, Tag, TicketPercent } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  formatCouponDiscount,
  getCouponRequirementLabel,
  type CouponDefinition,
} from "@/lib/offers"
import { formatPrice } from "@/lib/storefront"

type CouponSectionProps = {
  cartTotal: number
  couponCode: string
  appliedCoupon: CouponDefinition | null
  couponFeedback: string
  coupons: CouponDefinition[]
  showCatalog?: boolean
  previewCount?: number
  onCouponCodeChange: (value: string) => void
  onApplyCoupon: (code?: string) => void
  onRemoveCoupon: () => void
}

export function CouponSection({
  cartTotal,
  couponCode,
  appliedCoupon,
  couponFeedback,
  coupons,
  showCatalog = true,
  previewCount = 3,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
}: CouponSectionProps) {
  const [showAllCoupons, setShowAllCoupons] = useState(false)
  const visibleCoupons = useMemo(
    () => (showAllCoupons ? coupons : coupons.slice(0, previewCount)),
    [coupons, previewCount, showAllCoupons]
  )

  return (
    <Card className="overflow-hidden rounded-[28px] border border-[#d9e7de] bg-white py-0 shadow-[0_18px_40px_rgba(19,59,48,0.08)]">
      <CardHeader className="border-b border-[#edf3ef] bg-[linear-gradient(135deg,#fbfdfc_0%,#f3f8f5_100%)] px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7ee] text-[#0d7a45]">
            <TicketPercent className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-[#123b30] sm:text-2xl">Apply Coupon</CardTitle>
            <p className="mt-1 text-sm text-[#678278]">
              Enter a coupon directly, then reveal the offer list only when you need it.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={couponCode}
            onChange={(event) => onCouponCodeChange(event.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="h-11 rounded-2xl border-[#d7eadf] bg-[#f8fcfa] uppercase text-[#123b30] placeholder:text-[#8ba097]"
          />
          {appliedCoupon ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-[#cfe7dc] text-[#1B4D3E] hover:bg-[#f3fbf7]"
              onClick={onRemoveCoupon}
            >
              Remove
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 rounded-2xl bg-[#0d7a45] px-6 text-base font-semibold hover:bg-[#0a6539]"
              onClick={() => onApplyCoupon()}
            >
              Apply
            </Button>
          )}
        </div>

        {couponFeedback ? (
          <div className="rounded-[20px] border border-[#d8ebe1] bg-[#f3fbf7] px-4 py-3 text-sm text-[#275346]">
            {couponFeedback}
          </div>
        ) : null}

        {showCatalog ? (
          <div className="space-y-3">
            {visibleCoupons.map((coupon) => {
              const isEligible = cartTotal >= coupon.minimumOrderValue
              const isActive = appliedCoupon?.code === coupon.code

              return (
                <div
                  key={coupon.id}
                  className={`rounded-[24px] border px-4 py-4 transition ${
                    isActive
                      ? "border-[#7bc79a] bg-[linear-gradient(135deg,#effaf3_0%,#f8fdf9_100%)] shadow-[0_12px_24px_rgba(13,122,69,0.08)]"
                      : "border-[#e3efe8] bg-[#fbfdfc] hover:border-[#cfe2d8]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f7ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d7a45]">
                          <Tag className="h-3.5 w-3.5" />
                          {coupon.code}
                        </span>
                        <span className="text-sm font-semibold text-[#123b30]">
                          {formatCouponDiscount(coupon)}
                        </span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0d7a45] ring-1 ring-[#cfe7dc]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Applied
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-[#567267]">{coupon.description}</p>
                      <p className="text-xs font-medium text-[#789287]">
                        {getCouponRequirementLabel(coupon)}
                      </p>
                      {!isEligible ? (
                        <p className="text-xs font-medium text-[#c0583b]">
                          Add {formatPrice(coupon.minimumOrderValue - cartTotal)} more to unlock this coupon.
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant={isActive ? "outline" : "secondary"}
                      className={`rounded-full ${
                        isActive
                          ? "border-[#cfe7dc] text-[#1B4D3E] hover:bg-white"
                          : "bg-[#eef6f1] text-[#123b30] hover:bg-[#e2f0e8]"
                      }`}
                      disabled={!isEligible && !isActive}
                      onClick={() => (isActive ? onRemoveCoupon() : onApplyCoupon(coupon.code))}
                    >
                      {isActive ? "Remove" : isEligible ? "Use coupon" : "Locked"}
                    </Button>
                  </div>
                </div>
              )
            })}

            {coupons.length > previewCount ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto rounded-full px-0 text-sm font-semibold text-[#0d7a45] hover:bg-transparent hover:text-[#0a6539]"
                onClick={() => setShowAllCoupons((value) => !value)}
              >
                {showAllCoupons ? "Show fewer coupons" : `Show all ${coupons.length} coupons`}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[#d8e9e0] bg-[#fbfdfc] px-4 py-4 text-sm text-[#678278]">
            Proceed to payment to reveal available coupons and pick from the offer list.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
