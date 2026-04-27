import { CreditCard, PackageCheck, Wallet, type LucideIcon } from "lucide-react"

export type PaymentOption = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  tag?: string
  cashback?: string
}

export const paymentOptions: PaymentOption[] = [
  {
    id: "credit_card",
    label: "Credit Card",
    description: "Pay online using your card",
    icon: CreditCard,
    tag: "Popular",
    cashback: "Eligible for select bank cashback offers",
  },
  {
    id: "upi",
    label: "UPI",
    description: "Instant transfer with UPI apps",
    icon: Wallet,
    tag: "Fastest",
    cashback: "Best for 1-tap checkout and quick verification",
  },
  {
    id: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: PackageCheck,
    cashback: "Available on eligible delivery addresses",
  },
]
