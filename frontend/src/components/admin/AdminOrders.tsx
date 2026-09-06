import { useCallback, useEffect, useState } from "react"
import { PackageCheck, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  type StoreOrder,
} from "@/lib/store-api"
import { formatPrice } from "@/lib/storefront"

const statusOptions: Record<StoreOrder["orderStatus"], StoreOrder["orderStatus"][]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
}

const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())

export function AdminOrders() {
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      setOrders(await fetchAdminOrders())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOrders(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadOrders])

  return (
    <section className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-[0_16px_40px_rgba(18,75,53,0.07)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f8b5c]">Fulfilment</p>
          <h2 className="mt-1 text-2xl font-bold text-[#174638]">Customer orders</h2>
          <p className="mt-1 text-sm text-[#648176]">Status changes here are the same records customers see in My Orders.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-full" onClick={() => void loadOrders()} disabled={isLoading}>
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-[#fff4f2] p-3 text-sm text-[#a43e30]">{error}</p> : null}
      {isLoading ? <p className="mt-5 text-sm text-[#648176]">Loading stored orders…</p> : null}
      {!isLoading && orders.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-[#dce6df] p-5 text-sm text-[#648176]">No orders are stored yet.</p> : null}

      {orders.length > 0 ? (
        <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[20px] border border-[#e4ebe6] bg-[#fbfdfb] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><PackageCheck className="size-4 text-[#2f8b5c]" /><p className="break-all font-semibold text-[#174638]">{order.orderId}</p></div>
                  <p className="mt-1 text-sm text-[#648176]">{order.customer?.name || "Customer"} · {order.items.length} product{order.items.length === 1 ? "" : "s"} · {formatPrice(order.total)}</p>
                  {order.createdAt ? <p className="mt-1 text-xs text-[#84968c]">{new Date(order.createdAt).toLocaleString("en-IN")}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#edf8f1] px-3 py-1.5 text-xs font-semibold text-[#176942]">{label(order.orderStatus)}</span>
                  {statusOptions[order.orderStatus].length > 0 ? (
                    <select
                      aria-label={`Update ${order.orderId} status`}
                      defaultValue=""
                      disabled={updatingId === order.id}
                      onChange={async (event) => {
                        const nextStatus = event.target.value as StoreOrder["orderStatus"]
                        if (!nextStatus) return
                        setUpdatingId(order.id)
                        setError("")
                        try {
                          const response = await updateAdminOrderStatus(order.orderId, nextStatus)
                          setOrders((current) => current.map((entry) => entry.id === order.id ? response.order : entry))
                        } catch (updateError) {
                          setError(updateError instanceof Error ? updateError.message : "Unable to update status.")
                        } finally {
                          setUpdatingId(null)
                          event.target.value = ""
                        }
                      }}
                      className="h-9 rounded-xl border border-[#cfddd4] bg-white px-3 text-sm text-[#315344]"
                    >
                      <option value="">Update status…</option>
                      {statusOptions[order.orderStatus].map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </select>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
