import { useEffect, useState } from "react"
import { Check, Copy, Sparkles, Tag } from "lucide-react"

import {
  formatCouponDiscount,
  getCouponRequirementLabel,
  type CouponDefinition,
} from "@/lib/offers"
import { fetchBankOffers, fetchCoupons } from "@/lib/store-api"

const Offer = () => {
  const [copied, setCopied] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<CouponDefinition[]>([])

  useEffect(() => {
    const loadOfferData = async () => {
      try {
        const [nextCoupons] = await Promise.all([
          fetchCoupons(),
          fetchBankOffers(),
        ])
        setCoupons(nextCoupons)
      } catch {
        setCoupons([])
      }
    }

    void loadOfferData()
  }, [])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-full bg-[#f7f4ee] text-[#262118]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-3 pb-12 pt-4 md:px-5">
        <section className="overflow-hidden rounded-[30px] border border-[#ece4d6] bg-[linear-gradient(135deg,#fffdf9_0%,#f8f4ea_48%,#eef8ee_100%)] shadow-[0_18px_40px_rgba(78,62,31,0.08)]">
          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-7 lg:py-8">
            <div className="relative">
              <div className="absolute -left-8 top-0 h-36 w-36 rounded-full bg-[#ffd96a]/35 blur-3xl" />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#af9452]">
                  Savings Hub
                </p>
                <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-[0.96] text-[#2a2217] sm:text-5xl">
                  Seasonal offers designed to feel like part of the storefront.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#7d6d52] sm:text-base">
                  Every coupon now follows the same warm marketplace styling as the home page,
                  with mellow neutrals, produce-inspired greens, and rounded cards throughout.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-[#efe4d1] bg-white/80 p-4 shadow-sm">
                <Sparkles className="h-5 w-5 text-[#a78410]" />
                <p className="mt-3 text-sm font-semibold text-[#2d2518]">Curated deals</p>
                <p className="mt-1 text-sm text-[#7d6d52]">
                  Offers presented like featured produce sections.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dceadf] bg-white/80 p-4 shadow-sm">
                <Tag className="h-5 w-5 text-[#0d7a45]" />
                <p className="mt-3 text-sm font-semibold text-[#173b31]">Quick apply</p>
                <p className="mt-1 text-sm text-[#678278]">
                  Codes are easier to scan, copy, and use during checkout.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#efe4d1] bg-white/80 p-4 shadow-sm">
                <Check className="h-5 w-5 text-[#0d7a45]" />
                <p className="mt-3 text-sm font-semibold text-[#173b31]">Clear rules</p>
                <p className="mt-1 text-sm text-[#678278]">
                  Each offer explains savings and minimum order value at a glance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#ece4d6] bg-white px-5 py-5 shadow-[0_12px_28px_rgba(78,62,31,0.06)] sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b39b69]">
                Available Coupons
              </p>
              <h2 className="mt-1 text-3xl font-bold text-[#2c2417]">
                Fresh savings for this week
              </h2>
            </div>
            <div className="rounded-full bg-[#edf8f1] px-4 py-2 text-sm font-medium text-[#0d7a45] ring-1 ring-[#d5e9dc]">
              {coupons.length} live offer{coupons.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {coupons.map((coupon) => (
              <article
                key={coupon.id}
                className="overflow-hidden rounded-[26px] border border-[#e8dfcf] bg-[linear-gradient(135deg,#fffdf8_0%,#fff7e6_38%,#f4fbf6_100%)] shadow-[0_10px_24px_rgba(78,62,31,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(78,62,31,0.10)]"
              >
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="inline-flex items-center rounded-full bg-[#ffd24a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#624c11]">
                      {coupon.code}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-[#2a2217]">
                      {formatCouponDiscount(coupon)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#7d6d52]">
                      {coupon.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f8a7f]">
                      {getCouponRequirementLabel(coupon)}
                      {coupon.maxDiscount && coupon.discountType === "percentage" ? (
                        <span className="text-[#af9452]"> · Max discount Rs.{coupon.maxDiscount}</span>
                      ) : null}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      copied === coupon.code
                        ? "bg-[#0d7a45] text-white"
                        : "bg-[#173b31] text-white hover:bg-[#103227]"
                    }`}
                  >
                    {copied === coupon.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === coupon.code ? "Copied" : "Copy"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Offer
