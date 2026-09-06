import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, Circle, Clock3, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductImage } from "@/components/catalog/ProductImage"
import { Skeleton } from "@/components/ui/skeleton"
import type { AuthUser } from "@/lib/auth"
import {
  cancelOrder,
  fetchOrder,
  fetchOrders,
  type StoreOrder,
} from "@/lib/store-api"
import { formatPrice } from "@/lib/storefront"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"

const STATUS_STEPS: StoreOrder["orderStatus"][] = [
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
]

const statusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())

const formatDate = (value?: string) => {
  if (!value) return "Date unavailable"
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

type OrdersPageProps = {
  currentUser: AuthUser | null
  selectedOrderId?: string | null
}

const OrderTimeline = ({ order }: { order: StoreOrder }) => {
  if (order.orderStatus === "cancelled") {
    return (
      <div className="rounded-2xl border border-[#f0d5d0] bg-[#fff7f5] px-4 py-3 text-sm font-medium text-[#a43e30]">
        This order is cancelled. No delivery progress is shown.
      </div>
    )
  }

  const activeIndex = STATUS_STEPS.indexOf(order.orderStatus)
  return (
    <ol className="grid gap-3 sm:grid-cols-5" aria-label="Order progress">
      {STATUS_STEPS.map((step, index) => {
        const complete = index <= activeIndex
        return (
          <li key={step} className="relative flex items-center gap-2 sm:flex-col sm:items-start">
            <span
              className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full border ${
                complete
                  ? "border-[#16834a] bg-[#16834a] text-white"
                  : "border-[#d8ded9] bg-white text-[#a4ada7]"
              }`}
            >
              {complete ? <Check className="size-4" /> : <Circle className="size-3" />}
            </span>
            <span className={`text-xs font-semibold ${complete ? "text-[#174638]" : "text-[#88938c]"}`}>
              {statusLabel(step)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const OrdersPage = ({ currentUser, selectedOrderId = null }: OrdersPageProps) => {
  const dispatch = useAppShellDispatch()
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  const loadOrders = useCallback(async () => {
    if (!currentUser) return
    setIsLoading(true)
    setError("")
    try {
      if (selectedOrderId) {
        setSelectedOrder(await fetchOrder(selectedOrderId))
      } else {
        setOrders(await fetchOrders())
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.")
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, selectedOrderId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOrders(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadOrders])

  const order = selectedOrderId ? selectedOrder : null
  const orderCountLabel = useMemo(
    () => `${orders.length} order${orders.length === 1 ? "" : "s"}`,
    [orders.length]
  )

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto size-10 text-[#16834a]" />
        <h1 className="mt-4 text-3xl font-bold text-[#21352b]">Sign in to view your orders</h1>
        <p className="mt-2 text-[#718078]">Order history is private and linked to your Buy Best account.</p>
        <Button className="mt-6 rounded-full bg-[#16834a] hover:bg-[#116d3d]" onClick={() => dispatch(appShellActions.openLogin({ redirectView: "orders" }))}>
          Sign in
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-[28px]" />
        <Skeleton className="h-48 w-full rounded-[28px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#21352b]">Orders could not be loaded</h1>
        <p className="mt-2 text-[#a43e30]">{error}</p>
        <Button className="mt-6 rounded-full" onClick={() => void loadOrders()}>Try again</Button>
      </div>
    )
  }

  if (selectedOrderId && order) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 px-3 pb-24 pt-5 sm:px-6">
        <Button variant="ghost" className="rounded-full" onClick={() => dispatch(appShellActions.openOrders())}>
          <ArrowLeft className="size-4" /> All orders
        </Button>
        <section className="rounded-[28px] border border-[#e5dfd3] bg-white p-5 shadow-[0_16px_36px_rgba(44,36,23,0.07)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-[#eee8dc] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728579]">Order</p>
              <h1 className="mt-1 break-all text-2xl font-bold text-[#21352b]">{order.orderId}</h1>
              <p className="mt-2 text-sm text-[#718078]">Placed {formatDate(order.createdAt)}</p>
            </div>
            <span className="w-fit rounded-full bg-[#edf8f1] px-4 py-2 text-sm font-semibold text-[#176942]">
              {statusLabel(order.orderStatus)}
            </span>
          </div>

          <div className="py-6"><OrderTimeline order={order} /></div>

          <div className="space-y-3 border-t border-[#eee8dc] pt-5">
            {order.items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl bg-[#faf8f3] p-3">
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-white">
                  <ProductImage src={item.image} alt={item.name} width={128} height={128} sizes="64px" className="p-1" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#21352b]">{item.name}</p>
                  <p className="text-sm text-[#718078]">{item.size} · Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-[#21352b]">{formatPrice(item.lineTotal)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 border-t border-[#eee8dc] pt-5 md:grid-cols-2">
            <div>
              <h2 className="font-semibold text-[#21352b]">Delivery address</h2>
              {order.deliveryAddress ? (
                <p className="mt-2 text-sm leading-6 text-[#718078]">
                  {[order.deliveryAddress.addressLine, order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.postalCode].filter(Boolean).join(", ")}
                </p>
              ) : <p className="mt-2 text-sm text-[#718078]">Saved address is no longer available.</p>}
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-[#718078]">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 ? <div className="flex justify-between text-[#176942]"><dt>Discount</dt><dd>-{formatPrice(order.discount)}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-[#718078]">Delivery</dt><dd>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Free"}</dd></div>
              <div className="flex justify-between"><dt className="text-[#718078]">Tax</dt><dd>{formatPrice(order.tax)}</dd></div>
              <div className="flex justify-between border-t border-[#eee8dc] pt-2 text-base font-bold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#718078]">Payment</dt><dd>{statusLabel(order.paymentMethod || "not recorded")} · {statusLabel(order.paymentStatus)}</dd></div>
            </dl>
          </div>

          {order.orderStatus === "placed" ? (
            <div className="mt-6 border-t border-[#eee8dc] pt-5">
              <Button
                variant="outline"
                className="rounded-full border-[#e7bdb5] text-[#a43e30] hover:bg-[#fff5f3]"
                disabled={isCancelling}
                onClick={async () => {
                  if (!window.confirm("Cancel this newly placed order?")) return
                  setIsCancelling(true)
                  try {
                    const response = await cancelOrder(order.orderId)
                    setSelectedOrder(response.order)
                  } catch (cancelError) {
                    setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel order.")
                  } finally {
                    setIsCancelling(false)
                  }
                }}
              >
                {isCancelling ? "Cancelling…" : "Cancel order"}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-3 pb-24 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#16834a]">Your account</p>
          <h1 className="mt-1 text-3xl font-bold text-[#21352b] sm:text-4xl">Orders</h1>
          <p className="mt-2 text-[#718078]">Real status from your saved order records.</p>
        </div>
        <span className="w-fit rounded-full border border-[#dfe7e1] bg-white px-4 py-2 text-sm font-semibold text-[#53675c]">{orderCountLabel}</span>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#d8dfda] bg-white p-10 text-center">
          <Clock3 className="mx-auto size-9 text-[#789083]" />
          <h2 className="mt-3 text-xl font-semibold text-[#21352b]">No orders yet</h2>
          <p className="mt-1 text-[#718078]">Your orders will appear here after checkout.</p>
          <Button className="mt-5 rounded-full bg-[#16834a] hover:bg-[#116d3d]" onClick={() => dispatch(appShellActions.openShop(undefined))}>Start shopping</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {orders.map((item) => (
            <button key={item.id} type="button" onClick={() => dispatch(appShellActions.openOrder(item.orderId))} className="rounded-[24px] border border-[#e5dfd3] bg-white p-4 text-left shadow-[0_10px_28px_rgba(44,36,23,0.05)] transition hover:-translate-y-0.5 hover:border-[#b8d3c1] hover:shadow-[0_16px_32px_rgba(44,36,23,0.08)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf8f1] text-[#16834a]"><ShoppingBag className="size-5" /></span>
                  <div>
                    <p className="break-all font-semibold text-[#21352b]">{item.orderId}</p>
                    <p className="mt-1 text-sm text-[#718078]">{formatDate(item.createdAt)} · {item.items.length} product{item.items.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold text-[#21352b]">{formatPrice(item.total)}</p>
                  <p className="mt-1 text-sm font-semibold text-[#176942]">{statusLabel(item.orderStatus)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersPage
