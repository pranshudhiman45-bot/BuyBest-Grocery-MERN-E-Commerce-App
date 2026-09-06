import { CreditCard, PackageCheck, Wallet, type LucideIcon } from "lucide-react"

export type PaymentOption = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  tag?: string
}

export const paymentOptions: PaymentOption[] = [
  {
    id: "credit_card",
    label: "Credit Card",
    description: "Pay online using your card",
    icon: CreditCard,
    tag: "Stripe",
  },
  {
    id: "upi",
    label: "UPI",
    description: "Instant transfer with UPI apps",
    icon: Wallet,
    tag: "Stripe",
  },
  {
    id: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: PackageCheck,
  },
]
