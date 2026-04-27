import { useState } from "react"

import { formatPrice } from "@/lib/storefront"

type UseCartCheckoutOptions = {
  checkoutCart: (paymentMethod: string) => Promise<{
    message: string
    summary: {
      total: number
    }
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
  onBeforeCheckout,
  getSuccessMessage,
}: UseCartCheckoutOptions) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("credit_card")
  const [checkoutMessage, setCheckoutMessage] = useState("")
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleCheckout = async () => {
    if (onBeforeCheckout) {
      const shouldContinue = await onBeforeCheckout()

      if (!shouldContinue) {
        return
      }
    }

    setIsCheckingOut(true)

    try {
      const response = await checkoutCart(selectedPaymentMethod)
      setCheckoutMessage(
        getSuccessMessage
          ? getSuccessMessage(response)
          : `${response.message} Total payable: ${formatPrice(response.summary.total)}`
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  return {
    checkoutMessage,
    handleCheckout,
    isCheckingOut,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  }
}
