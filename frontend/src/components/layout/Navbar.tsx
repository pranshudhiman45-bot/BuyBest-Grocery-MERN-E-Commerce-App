import { useEffect, useRef, useState } from "react"
import { LayoutDashboard, LogOut, MapPin, Search, ShoppingCart, TriangleAlert, UserCog } from "lucide-react"

import Logo from "../../assests/image.png"
import { ProfileEditorSheet } from "@/components/profile/ProfileEditorSheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { AuthUser } from "@/lib/auth"
import { useStore } from "@/components/providers/store-provider"
import type { Product } from "@/lib/storefront"
import {
  appShellActions,
  useAppShellDispatch,
  useAppShellSelector,
} from "@/store/app-shell"

const SEARCH_PLACEHOLDERS = [
  { text: "Search for ", highlight: "fresh produce..." },
  { text: "Search for ", highlight: "fruits 🍎" },
  { text: "Search for ", highlight: "vegetables 🥦" },
  { text: "Search for ", highlight: "dairy 🥛" },
  { text: "Search for ", highlight: "snacks 🍪" },
]

type NavbarProps = {
  user: AuthUser | null
  onUserUpdate: (user: AuthUser) => void
  onLogout: () => Promise<void>
  isLoggingOut?: boolean
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

const navButtonClass = (isActive: boolean) =>
  `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-[#fff3d0] text-[#624c11]"
      : "text-[#7d6d52] hover:bg-[#faf4e8] hover:text-[#1B4D3E]"
  }`

const Navbar = ({ user, onUserUpdate, onLogout, isLoggingOut = false }: NavbarProps) => {
  const dispatch = useAppShellDispatch()
  const activeView = useAppShellSelector((state) => state.activeView)
  const { cartSummary, searchProducts } = useStore()

  const [index, setIndex] = useState(0)
  const [value, setValue] = useState("")
  const [typed, setTyped] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [filtered, setFiltered] = useState<Product[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [debounced, setDebounced] = useState("")
  const [loading, setLoading] = useState(false)
  const [locationName, setLocationName] = useState("Detect Location")
  const [isLocating, setIsLocating] = useState(false)
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false)
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 300)
    return () => clearTimeout(id)
  }, [value])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFiltered([])
        setActiveIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length)
    }, 3500)

    return () => clearTimeout(timeout)
  }, [index])

  useEffect(() => {
    const cursor = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursor)
  }, [])

  useEffect(() => {
    if (!isLogoutAlertOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setIsLogoutAlertOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isLogoutAlertOpen, isLoggingOut])

  useEffect(() => {
    if (value) {
      return
    }

    const full = SEARCH_PLACEHOLDERS[index].highlight
    let currentIndex = 0
    setTyped("")

    const id = setInterval(() => {
      setTyped(full.slice(0, currentIndex + 1))
      currentIndex++
      if (currentIndex >= full.length) {
        clearInterval(id)
      }
    }, 40)

    return () => clearInterval(id)
  }, [index, value])

  useEffect(() => {
    if (!debounced) {
      setFiltered([])
      setActiveIndex(-1)
      setLoading(false)
      return
    }

    setLoading(true)
    let isCancelled = false

    const loadProducts = async () => {
      try {
        const results = await searchProducts(debounced)
        if (!isCancelled) {
          setFiltered(results)
          setActiveIndex(-1)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      isCancelled = true
    }
  }, [debounced, searchProducts])

  const handleSelectProduct = (product: Product) => {
    setValue(product.name)
    setFiltered([])
    setActiveIndex(-1)
    dispatch(appShellActions.openProduct(product.id))
  }

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) {
      return
    }

    await onLogout()
    setIsLogoutAlertOpen(false)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-[#ece4d6] bg-[linear-gradient(180deg,rgba(255,252,246,0.96)_0%,rgba(250,247,241,0.94)_100%)] backdrop-blur">
        <div className="mx-auto flex h-15 w-full max-w-[1380px] items-center justify-between gap-3 px-3 md:px-5">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <button
              type="button"
              className="flex items-center"
              onClick={() => dispatch(appShellActions.openShop(undefined))}
            >
              <img
                src={Logo}
                alt="Tapree Logo"
                className="h-9 w-auto object-contain"
              />
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              {user?.role !== "support" ? (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch(appShellActions.openShop(undefined))}
                    className={navButtonClass(activeView === "shop" || activeView === "product")}
                  >
                    Shop
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(appShellActions.openOffers())}
                    className={navButtonClass(activeView === "offers")}
                  >
                    Offers
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(appShellActions.openCart())}
                    className={navButtonClass(activeView === "cart" || activeView === "checkout")}
                  >
                    Cart
                  </button>
                </>
              ) : null}
              {user?.role === "admin" ? (
                <button
                  type="button"
                  onClick={() => dispatch(appShellActions.openAdmin())}
                  className={navButtonClass(activeView === "admin")}
                >
                  Admin
                </button>
              ) : null}
              {user && user.role !== "support" ? (
                <button
                  type="button"
                  onClick={() => dispatch(appShellActions.openSupport())}
                  className={navButtonClass(activeView === "support")}
                >
                  Support
                </button>
              ) : null}
              {user?.role === "support" ? (
                <button
                  type="button"
                  onClick={() => dispatch(appShellActions.openSupportPanel())}
                  className={navButtonClass(activeView === "support-panel")}
                >
                  Dashboard
                </button>
              ) : null}
            </div>
          </div>

          <div ref={containerRef} className="relative hidden max-w-sm flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8d74]" />
            <Input
              type="search"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1))
                } else if (event.key === "ArrowUp") {
                  setActiveIndex((prev) => Math.max(prev - 1, 0))
                } else if (event.key === "Enter" && activeIndex >= 0) {
                  event.preventDefault()
                  const item = filtered[activeIndex]
                  if (item) {
                    handleSelectProduct(item)
                  }
                }
              }}
              placeholder=""
              className="relative z-10 h-10 w-full rounded-full border-[#e6dcc9] bg-white pl-10 text-sm text-[#2c2417] shadow-sm ring-0 placeholder:text-[#a3967d] focus-visible:ring-1 focus-visible:ring-[#c8aa45]"
            />

            {(loading || filtered.length > 0 || (value && !loading && filtered.length === 0)) && (
              <div className="absolute top-full z-30 mt-2 w-full rounded-2xl border border-[#ece4d6] bg-white shadow-[0_16px_34px_rgba(78,62,31,0.10)]">
                {loading ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-[#7d6d52]">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#d9ccb1] border-t-[#a78410]" />
                    Searching...
                  </div>
                ) : filtered.length > 0 ? (
                  <ul className="py-2 text-sm">
                    {filtered.map((item, itemIndex) => (
                      <li
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-2 px-4 py-2 transition ${
                          itemIndex === activeIndex ? "bg-[#faf4e8]" : "hover:bg-[#fcf8ef]"
                        }`}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => handleSelectProduct(item)}
                      >
                        <Search className="h-3 w-3 text-[#af9d7c]" />
                        <span className="flex flex-col">
                          <span>
                            {item.name.split(new RegExp(`(${value})`, "gi")).map((part, indexPart) =>
                              part.toLowerCase() === value.toLowerCase() ? (
                                <span key={indexPart} className="font-semibold text-[#1B4D3E]">
                                  {part}
                                </span>
                              ) : (
                                part
                              )
                            )}
                          </span>
                          <span className="text-xs text-[#8f8168]">
                            {item.categoryLabel} · {item.size}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-sm text-[#8f8168]">No results found</div>
                )}
              </div>
            )}

            {!value ? (
              <div className="pointer-events-none absolute left-10 top-1/2 z-20 h-5 -translate-y-1/2 overflow-hidden text-sm text-[#a3967d]">
                <div key={index} className="transform transition-all duration-700 ease-in-out">
                  <span>
                    {SEARCH_PLACEHOLDERS[index].text}
                    <span className="font-medium text-[#a78410]">
                      {typed}
                      <span className={`${showCursor ? "opacity-100" : "opacity-0"} ml-0.5`}>
                        |
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2.5">
            <Button
              variant="ghost"
              className="hidden h-10 items-center gap-2 rounded-full border border-[#ece4d6] bg-white px-3 text-[#7d6d52] hover:bg-[#faf4e8] md:flex"
              title="Delivery location"
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Geolocation is not supported by your browser")
                  return
                }

                setIsLocating(true)
                setLocationName("Detecting...")

                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const { latitude, longitude } = position.coords

                    try {
                      const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                      )
                      const data = await response.json()

                      const city =
                        data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        "Your Location"

                      setLocationName(city)
                    } catch {
                      setLocationName("Location found")
                    } finally {
                      setIsLocating(false)
                    }
                  },
                  () => {
                    alert("Permission denied. Please allow location access.")
                    setLocationName("Select Location")
                    setIsLocating(false)
                  }
                )
              }}
            >
              <MapPin className="h-4 w-4 text-[#a78410]" />
              <span className="max-w-28 truncate text-sm font-medium">
                {isLocating ? "Detecting..." : locationName}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full border border-[#ece4d6] bg-white text-[#624c11] hover:bg-[#faf4e8]"
              onClick={() => dispatch(appShellActions.openCart())}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ffd24a] px-1 text-[10px] font-bold text-black shadow-sm">
                {cartSummary.itemCount}
              </span>
            </Button>

            {!user ? (
              <Button
                variant="default"
                className="rounded-full bg-[#1B4D3E] px-4 text-white hover:bg-[#163d32]"
                onClick={() => dispatch(appShellActions.openLogin(undefined))}
              >
                Login
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 gap-2 rounded-full border border-[#ece4d6] bg-white px-2 py-1 text-left hover:bg-[#faf4e8]"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="hidden min-w-0 sm:block">
                      <p className="truncate text-sm font-semibold text-[#2c2417]">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-[#8f8168]">{user.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#ece4d6]">
                  <DropdownMenuLabel>
                    <div className="space-y-0.5">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "admin" ? (
                    <DropdownMenuItem onSelect={() => dispatch(appShellActions.openAdmin())}>
                      <LayoutDashboard />
                      Admin Panel
                    </DropdownMenuItem>
                  ) : null}
                  {user.role === "support" ? (
                    <DropdownMenuItem onSelect={() => dispatch(appShellActions.openSupportPanel())}>
                      <LayoutDashboard />
                      Support Panel
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      setIsProfileSheetOpen(true)
                    }}
                  >
                    <UserCog />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => {
                      event.preventDefault()
                      if (!isLoggingOut) {
                        setIsLogoutAlertOpen(true)
                      }
                    }}
                  >
                    <LogOut />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      {isLogoutAlertOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2417]/25 px-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isLoggingOut) {
                setIsLogoutAlertOpen(false)
              }
            }}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#ece4d6] bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#fff7e5] via-[#fffdf8] to-[#f3fbf5] px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#624c11] shadow-sm ring-1 ring-[#efe4d1]">
                  <TriangleAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-[#2c2417]">Log out of your account?</h2>
                  <p className="text-sm text-[#7d6d52]">
                    You will need to sign in again to access your cart and account details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Alert className="border-[#efe4d1] bg-[#fcf8ef] text-[#2c2417]">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Before you go</AlertTitle>
                <AlertDescription>
                  Make sure you are ready to leave this session on the current device.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-[#e6dcc9] text-[#7d6d52] hover:bg-[#faf4e8]"
                  onClick={() => setIsLogoutAlertOpen(false)}
                  disabled={isLoggingOut}
                >
                  Stay logged in
                </Button>
                <Button
                  type="button"
                  className="rounded-full bg-[#1B4D3E] text-white hover:bg-[#163d32]"
                  onClick={() => void handleLogoutConfirm()}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Logging out..." : "Yes, log me out"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {user ? (
        <ProfileEditorSheet
          key={`${user.id}-${isProfileSheetOpen ? "open" : "closed"}-${user.name}-${user.email}-${user.mobile ?? ""}-${user.avatar ?? ""}`}
          open={isProfileSheetOpen}
          onOpenChange={setIsProfileSheetOpen}
          user={user}
          onUserUpdate={onUserUpdate}
        />
      ) : null}
    </>
  )
}

export default Navbar
