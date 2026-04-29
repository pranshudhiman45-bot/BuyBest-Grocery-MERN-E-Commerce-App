import { Globe, Mail } from "lucide-react"

import type { AuthUser } from "@/lib/auth"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"

const footerLinks = [
  { label: "About", action: "about" },
  { label: "Offers", action: "offers" },
  { label: "Support", action: "support" },
] as const

type FooterProps = {
  currentUser?: AuthUser | null
}

const Footer = ({ currentUser = null }: FooterProps) => {
  const dispatch = useAppShellDispatch()

  const handleFooterAction = (action: (typeof footerLinks)[number]["action"]) => {
    if (action === "about") {
      dispatch(appShellActions.openAbout())
      return
    }

    if (action === "offers") {
      dispatch(appShellActions.openOffers())
      return
    }

    if (currentUser?.role === "support") {
      dispatch(appShellActions.openSupportPanel())
      return
    }

    if (currentUser) {
      dispatch(appShellActions.openSupport())
      return
    }

    dispatch(
      appShellActions.openLogin({
        message: "Please log in to open support.",
        redirectView: "support",
      }),
    )
  }

  return (
    <footer className="border-t border-[#ece4d6] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-base text-[#6b5e4a]">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <span className="font-semibold text-lg text-[#2c2417]">Buy Best</span>
          <span>© {new Date().getFullYear()} All rights reserved</span>
        </div>

        <div className="flex gap-6">
          {footerLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleFooterAction(item.action)}
              className="cursor-pointer hover:text-black transition"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="Email support"
            onClick={() => {
              window.location.href = "mailto:support@buybest.com"
            }}
            className="cursor-pointer hover:text-black transition"
          >
            <Mail className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Go to home"
            onClick={() => dispatch(appShellActions.openShop(undefined))}
            className="cursor-pointer hover:text-black transition"
          >
            <Globe className="h-5 w-5" />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
