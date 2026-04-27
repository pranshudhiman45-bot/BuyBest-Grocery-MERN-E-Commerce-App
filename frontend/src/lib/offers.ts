import { formatPrice } from "@/lib/storefront"

export type CouponDefinition = {
  id: string
  code: string
  description: string
  discountType: "fixed" | "percentage"
  value: number
  minimumOrderValue: number
  maxDiscount?: number | null
  isActive?: boolean
}

export const formatCouponDiscount = (coupon: CouponDefinition) =>
  coupon.discountType === "percentage"
    ? `${coupon.value}% OFF`
    : `${formatPrice(coupon.value)} OFF`

export const isCouponEligible = (
  coupon: CouponDefinition,
  cartTotal: number
) => cartTotal >= coupon.minimumOrderValue

export const getCouponDiscountAmount = (
  coupon: CouponDefinition,
  cartTotal: number
) => {
  if (!isCouponEligible(coupon, cartTotal)) {
    return 0
  }

  if (coupon.discountType === "percentage") {
    const percentageDiscount = (cartTotal * coupon.value) / 100
    const cappedDiscount =
      typeof coupon.maxDiscount === "number"
        ? Math.min(percentageDiscount, coupon.maxDiscount)
        : percentageDiscount

    return Number(cappedDiscount.toFixed(2))
  }

  return Math.min(coupon.value, cartTotal)
}

export const getCouponRequirementLabel = (coupon: CouponDefinition) =>
  `Valid on totals of ${formatPrice(coupon.minimumOrderValue)} or more`
