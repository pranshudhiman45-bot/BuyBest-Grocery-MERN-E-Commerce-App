import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { paymentOptions } from "@/features/cart/constants/payment-options"

type PaymentMethodSelectorProps = {
  selectedPaymentMethod: string
  onSelect: (paymentMethod: string) => void
}

export function PaymentMethodSelector({
  selectedPaymentMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  if (!selectedPaymentMethod && paymentOptions.length > 0) {
    onSelect(paymentOptions[0].id)
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-[#d9e7de] bg-white py-0 shadow-[0_18px_40px_rgba(19,59,48,0.08)]">
      <CardHeader className="border-b border-[#edf3ef] bg-[linear-gradient(135deg,#fbfdfc_0%,#f3f8f5_100%)] px-5 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-xl font-semibold text-[#123b30] sm:text-[26px]">
          Payment Options
        </CardTitle>
        <CardDescription className="text-[#6c867b]">
          Choose the checkout method that feels fastest for you.
        </CardDescription>
      </CardHeader>
      <CardContent
        role="radiogroup"
        aria-label="Payment Methods"
        className="grid gap-3 px-5 pb-5 pt-5 sm:px-6 sm:pb-6 md:grid-cols-2 xl:grid-cols-1"
      >
        {paymentOptions.map((option) => {
          const Icon = option.icon
          const isActive = selectedPaymentMethod === option.id

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(option.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelect(option.id)
                }
              }}
              tabIndex={0}
              className={`group relative overflow-hidden flex min-h-26 w-full items-start gap-3 rounded-[24px] border px-4 py-4 text-left transition-all duration-200 active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ec49a] sm:min-h-28 ${
                isActive
                  ? "border-[#7fc89b] bg-[linear-gradient(135deg,#edf9f1_0%,#e5f5eb_40%,#f7fcf8_100%)] shadow-[0_12px_28px_rgba(13,122,69,0.10)] scale-[1.01]"
                  : "border-[#e3efe8] bg-[#fbfdfc] hover:border-[#b8dcc7] hover:shadow-sm"
              }`}
              aria-pressed={isActive}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(115,210,144,0.16),transparent_35%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div
                className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:size-12 ${
                  isActive ? "bg-white text-[#157248]" : "bg-[#f1f6f3] text-[#146545]"
                }`}
              >
                <Icon className="size-5" />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-[#123b30]">{option.label}</div>
                    {option.tag ? (
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0d7a45] ring-1 ring-[#d6e8dd]">
                        {option.tag}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      isActive
                        ? "border-[#1b7a4f] bg-[#1b7a4f]"
                        : "border-[#c7dbcf] bg-white"
                    }`}
                  >
                    <div
                      className={`size-2 rounded-full transition-all duration-200 ${
                        isActive ? "bg-white scale-100" : "bg-transparent scale-0"
                      }`}
                    />
                  </div>
                </div>
                <div className="mt-1 flex flex-col gap-0.5 text-sm leading-5 text-[#6c867b]">
                  <span>{option.description}</span>

                  {option.cashback ? (
                    <span className="text-xs font-semibold text-green-700">
                      {option.cashback}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
