import { useState } from "react"

import { formatPrice } from "@/lib/storefront"

type UseCartCheckoutOptions = {
  checkoutCart: (paymentMethod: string, couponCode?: string) => Promise<{
    message: string
    summary: {
      total: number
    }
  }>
  createOnlineCheckoutSession: (paymentMethod: string, couponCode?: string) => Promise<{
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
}

export function useCartCheckout({
  checkoutCart,
  createOnlineCheckoutSession,
  onBeforeCheckout,
  getSuccessMessage,
}: UseCartCheckoutOptions) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("credit_card")
  const [checkoutMessage, setCheckoutMessage] = useState("")
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleCheckout = async (couponCode?: string) => {
    if (onBeforeCheckout) {
      const shouldContinue = await onBeforeCheckout()

      if (!shouldContinue) {
        return
      }
    }

    setIsCheckingOut(true)

    try {
      if (selectedPaymentMethod === "cash_on_delivery") {
        const response = await checkoutCart(selectedPaymentMethod, couponCode)
        setCheckoutMessage(
          getSuccessMessage
            ? getSuccessMessage(response)
            : `${response.message} Total payable: ${formatPrice(response.summary.total)}`
        )
        return
      }

      const session = await createOnlineCheckoutSession(selectedPaymentMethod, couponCode)
      if (!session.url) {
        throw new Error("Stripe checkout session was created without a redirect URL.")
      }

      setCheckoutMessage("Redirecting to Stripe checkout...")
      window.location.assign(session.url)
    } catch (error) {
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
