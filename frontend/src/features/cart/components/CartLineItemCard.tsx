import { Minus, Plus, ShieldCheck, Star, Trash2, Truck } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CartItem } from "@/lib/store-api"
import { formatPrice } from "@/lib/storefront"

import { CartItemImage } from "./CartItemImage"

type CartLineItemCardProps = {
  item: CartItem
  onDecrease: (productId: string, quantity: number) => Promise<void>
  onIncrease: (productId: string, quantity: number) => Promise<void>
  onRemove: (productId: string) => Promise<void>
}

export function CartLineItemCard({
  item,
  onDecrease,
  onIncrease,
  onRemove,
}: CartLineItemCardProps) {
  const extendedItem = item as CartItem & {
    deliveryTime?: string
    rating?: number
    reviewCount?: number
    originalPrice?: number
  }
  const [localQty, setLocalQty] = useState(item.quantity)
  const [loadingAction, setLoadingAction] = useState<"inc" | "dec" | "remove" | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [actionError, setActionError] = useState("")
  const maxPerOrder =
    item.maxPerOrder && item.maxPerOrder > 0 ? Math.floor(item.maxPerOrder) : null
  const purchasableLimit = maxPerOrder === null ? item.stock : Math.min(item.stock, maxPerOrder)
  const isAtStockLimit = purchasableLimit > 0 && localQty >= purchasableLimit

  useEffect(() => {
    setLocalQty(item.quantity)
  }, [item.quantity])

  return (
    <Card
      className={`overflow-hidden rounded-[22px] border border-[#ece4d6] bg-white py-0 shadow-[0_10px_24px_rgba(78,62,31,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(78,62,31,0.08)] ${
        isRemoving ? "scale-95 opacity-0" : "animate-[fadeIn_0.3s_ease]"
      }`}
    >
      <CardContent className="grid gap-3 bg-[linear-gradient(135deg,#ffffff_0%,#fffaf0_52%,#f7fbf6_100%)] p-3 sm:grid-cols-[104px_1fr] lg:grid-cols-[104px_1fr_auto] lg:p-4">
        <CartItemImage
          className="max-h-[104px] rounded-[16px] bg-[#fffaf0] p-2 shadow-[inset_0_0_0_1px_rgba(78,62,31,0.06)]"
          label={item.imageLabel || item.name}
          accent={item.accent || "#7ad39e"}
          src={item.imageUrl}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b9489]">
              {item.brand || item.category}
            </p>
            <span className="rounded-full bg-[#fff3d0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6a5620]">
              Fresh pick
            </span>
          </div>

          <h2 className="mt-1.5 text-base font-semibold text-[#2c2417] sm:text-[18px]">
            {item.name}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#7d6d52] sm:text-sm">
            <span>{item.size}</span>
            {maxPerOrder ? (
              <>
                <span className="h-1 w-1 rounded-full bg-[#b4c8bf]" />
                <span>Purchase limit applies</span>
              </>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-[#7d6d52]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 ring-1 ring-[#ece4d6]">
              <Truck className="h-3.5 w-3.5 text-[#a78410]" />
              {extendedItem.deliveryTime
                ? `Delivery in ${extendedItem.deliveryTime}`
                : "Delivery within 10-20 mins"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 ring-1 ring-[#ece4d6]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#a78410]" />
              Quality checked
            </span>
          </div>

          {extendedItem.rating ? (
            <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#b87410]">
              <Star className="h-4 w-4 fill-[#f59e0b] stroke-[#f59e0b]" />
              <span>{extendedItem.rating}</span>
              {extendedItem.reviewCount ? (
                <span className="text-[#80998e]">({extendedItem.reviewCount} reviews)</span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-3 rounded-xl border border-[#ece4d6] bg-white px-2.5 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={async () => {
                  if (loadingAction) return
                  setLoadingAction("dec")
                  setActionError("")

                  const newQty = Math.max(1, localQty - 1)
                  setLocalQty(newQty)

                  try {
                    await onDecrease(item.productId, newQty)
                  } catch (error) {
                    setLocalQty(item.quantity)
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Unable to update quantity right now."
                    )
                  } finally {
                    setLoadingAction(null)
                  }
                }}
                disabled={loadingAction !== null}
                className="rounded-full bg-[#faf4e8] p-1.5 text-[#624c11] transition hover:bg-[#f4e7c7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-semibold text-[#2c2417]">
                {loadingAction ? "..." : localQty}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (loadingAction) return
                  setLoadingAction("inc")
                  setActionError("")

                  const newQty = localQty + 1
                  setLocalQty(newQty)

                  try {
                    await onIncrease(item.productId, newQty)
                  } catch (error) {
                    setLocalQty(item.quantity)
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Unable to update quantity right now."
                    )
                  } finally {
                    setLoadingAction(null)
                  }
                }}
                disabled={loadingAction !== null || isAtStockLimit || item.stock <= 0}
                className="rounded-full bg-[#faf4e8] p-1.5 text-[#624c11] transition hover:bg-[#f4e7c7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
              </button>
            </div>

            {isAtStockLimit ? (
              <p className="text-xs font-medium text-[#b3671e]">
                {maxPerOrder
                  ? "You have reached the per-order purchase limit for this item."
                  : "You cannot add more of this item right now."}
              </p>
            ) : null}
            {actionError ? (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">{actionError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[#f0e6d7] pt-3 sm:col-span-2 lg:col-span-1 lg:min-w-[144px] lg:border-l lg:border-t-0 lg:border-[#f0e6d7] lg:pl-4 lg:pt-0">
          <div className="space-y-1.5 lg:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b9489]">
              Line Total
            </p>
            <div className="text-2xl font-semibold leading-none text-[#2c2417]">
              {formatPrice(item.totalPrice)}
            </div>
            <div className="text-xs text-[#8f8168] sm:text-sm">
              {formatPrice(item.price)} each
            </div>

            {extendedItem.originalPrice && extendedItem.originalPrice > item.price ? (
              <div className="text-xs font-semibold text-[#a78410]">
                Saved {formatPrice((extendedItem.originalPrice - item.price) * localQty)}
              </div>
            ) : null}
          </div>

          <Button
            variant="ghost"
            onClick={async () => {
              if (loadingAction) return
              setLoadingAction("remove")
              setIsRemoving(true)

              try {
                await onRemove(item.productId)
              } finally {
                setLoadingAction(null)
              }
            }}
            disabled={loadingAction !== null}
            className="justify-start rounded-xl border border-[#f1d8d8] bg-[#fff7f7] px-3 py-2 text-sm font-medium text-[#b85a5a] hover:bg-[#ffeaea] hover:text-[#943f3f] lg:justify-center"
          >
            <Trash2 className="h-4 w-4" />
            {loadingAction === "remove" ? "Removing..." : "Remove item"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
