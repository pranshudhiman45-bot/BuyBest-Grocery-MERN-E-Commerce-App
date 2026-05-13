import { useRef, useState } from "react"

import { formatPrice } from "@/lib/storefront"

type UseCartCheckoutOptions = {
  checkoutCart: (paymentMethod: string, couponCode?: string, idempotencyKey?: string) => Promise<{
    message: string
    summary: {
      total: number
    }
  }>
  createOnlineCheckoutSession: (paymentMethod: string, couponCode?: string, idempotencyKey?: string) => Promise<{
    sessionId: string
    url: string | null
  }>
  onBeforeCheckout?: () => boolean | Promise<boolean>
  getSuccessMessage?: (response: {
    message: string
    summary: {
      total: number
    }
  }) => string
  onCheckoutSuccess?: (response: any) => void
}

export function useCartCheckout({
  checkoutCart,
  createOnlineCheckoutSession,
  onBeforeCheckout,
  getSuccessMessage,
  onCheckoutSuccess,
}: UseCartCheckoutOptions) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("credit_card")
  const [checkoutMessage, setCheckoutMessage] = useState("")
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const checkoutIdempotencyKeyRef = useRef<string | null>(null)

  const createCheckoutIdempotencyKey = () => {
    const randomValue =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    return `checkout-${randomValue}`
  }

  const handleCheckout = async (couponCode?: string) => {
    const idempotencyKey =
      checkoutIdempotencyKeyRef.current || createCheckoutIdempotencyKey()
    checkoutIdempotencyKeyRef.current = idempotencyKey

    if (onBeforeCheckout) {
      const shouldContinue = await onBeforeCheckout()

      if (!shouldContinue) {
        checkoutIdempotencyKeyRef.current = null
        return
      }
    }

    setIsCheckingOut(true)

    try {
      if (selectedPaymentMethod === "cash_on_delivery") {
        const response = await checkoutCart(selectedPaymentMethod, couponCode, idempotencyKey)
        setCheckoutMessage(
          getSuccessMessage
            ? getSuccessMessage(response)
            : `${response.message} Total payable: ${formatPrice(response.summary.total)}`
        )
        if (onCheckoutSuccess) {
          onCheckoutSuccess(response)
        }
        checkoutIdempotencyKeyRef.current = null
        return
      }

      const session = await createOnlineCheckoutSession(selectedPaymentMethod, couponCode, idempotencyKey)
      if (!session.url) {
        throw new Error("Stripe checkout session was created without a redirect URL.")
      }

      setCheckoutMessage("Redirecting to Stripe checkout...")
      window.location.assign(session.url)
    } catch (error) {
      checkoutIdempotencyKeyRef.current = null
      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete checkout right now."
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  return {
    checkoutMessage,
    setCheckoutMessage,
    handleCheckout,
    isCheckingOut,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  }
}
