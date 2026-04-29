import * as React from "react"

import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import { StoreProvider } from "@/components/providers/store-provider"
import { Skeleton } from "@/components/ui/skeleton"
import RequireAdmin from "@/components/auth/RequireAdmin"
import {
  appShellActions,
  getAppShellStateFromLocation,
  getAppShellUrl,
  useAppShellDispatch,
  useAppShellSelector,
} from "@/store/app-shell"
import {
  clearStoredAuthUser,
  fetchCurrentUser,
  getStoredAuthUser,
  logoutUser,
  storeAuthUser,
  type AuthUser,
} from "@/lib/auth"

const LoginForm = React.lazy(() =>
  import("@/components/shadcn/login-form").then((module) => ({
    default: module.LoginForm,
  }))
)
const Home = React.lazy(() => import("@/pages/Home"))
const About = React.lazy(() => import("./pages/About"))
const Offer = React.lazy(() => import("@/pages/Offer"))
const ProductDetails = React.lazy(() => import("@/pages/ProductDetails"))
const CartPage = React.lazy(() => import("@/pages/CartPage"))
const CheckoutPage = React.lazy(() => import("@/pages/CheckoutPage"))
const AdminPanel = React.lazy(() => import("@/pages/AdminPanel"))
const UserSupport = React.lazy(() => import("@/pages/UserSupport"))
const SupportPanel = React.lazy(() => import("@/pages/SupportPanel"))
const ResetPasswordPage = React.lazy(() => import("@/pages/ResetPassword"))

const getPageMetadata = (activeView: string) => {
  switch (activeView) {
    case "about":
      return {
        title: "About Buy Best",
        description:
          "Learn more about Buy Best and our fresh grocery delivery experience.",
      }
    case "offers":
      return {
        title: "Offers",
        description:
          "Browse the latest grocery deals, discounts, and seasonal offers at Buy Best.",
      }
    case "product":
      return {
        title: "Product Details",
        description:
          "View pricing, freshness details, and product information before adding to cart.",
      }
    case "cart":
      return {
        title: "Your Cart",
        description:
          "Review your selected grocery items, delivery address, and order summary.",
      }
    case "checkout":
      return {
        title: "Checkout",
        description:
          "Complete your grocery order with payment, coupons, and final confirmation.",
      }
    case "admin":
      return {
        title: "Admin Panel",
        description:
          "Manage products, inventory, and store operations from the Buy Best admin dashboard.",
      }
    case "support":
      return {
        title: "Support",
        description:
          "Contact Buy Best support for help with orders, accounts, or delivery issues.",
      }
    case "support-panel":
      return {
        title: "Support Dashboard",
        description:
          "Respond to customer issues and manage support requests from the Buy Best support panel.",
      }
    case "login":
      return {
        title: "Login",
        description:
          "Sign in to Buy Best to manage your cart, checkout, and account settings.",
      }
    case "reset-password":
      return {
        title: "Reset Password",
        description:
          "Choose a new password to regain access to your Buy Best account.",
      }
    case "shop":
    default:
      return {
        title: "Fresh Grocery Delivery",
        description:
          "Shop fresh groceries, daily essentials, and fast delivery with Buy Best.",
      }
  }
}

const App = () => {
  const dispatch = useAppShellDispatch()
  const activeView = useAppShellSelector((state) => state.activeView)
  const selectedCategory = useAppShellSelector((state) => state.selectedCategory)
  const selectedProductId = useAppShellSelector((state) => state.selectedProductId)
  const loginMessage = useAppShellSelector((state) => state.loginMessage)
  const loginError = useAppShellSelector((state) => state.loginError)
  const loginRedirectView = useAppShellSelector((state) => state.loginRedirectView)
  const resetPasswordToken = useAppShellSelector(
    (state) => state.resetPasswordToken
  )

  const hasMountedHistorySync = React.useRef(false)

  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(() =>
    getStoredAuthUser()
  )
  const [isBootstrappingAuth, setIsBootstrappingAuth] = React.useState(true)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  React.useEffect(() => {
    const syncCurrentUser = async () => {
      const url = new URL(window.location.href)
      const googleAuthStatus = url.searchParams.get("googleAuth")

      setIsBootstrappingAuth(true)

      try {
        const response = await fetchCurrentUser()
        setCurrentUser(response.user)
        storeAuthUser(response.user)

        if (googleAuthStatus === "success") {
          dispatch(appShellActions.completeLogin())
        }
      } catch {
        clearStoredAuthUser()
        setCurrentUser(null)

        if (googleAuthStatus === "success") {
          dispatch(
            appShellActions.openLogin({
              error: "Unable to complete Google login",
              redirectView: "shop",
            })
          )
        }
      } finally {
        setIsBootstrappingAuth(false)
      }
    }

    void syncCurrentUser()
  }, [dispatch])

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activeView])

  React.useEffect(() => {
    const { title, description } = getPageMetadata(activeView)
    document.title = `${title} | Buy Best`

    const descriptionMeta = document.querySelector('meta[name="description"]')
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description)
    }

    const ogTitleMeta = document.querySelector('meta[property="og:title"]')
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute("content", `${title} | Buy Best`)
    }

    const ogDescriptionMeta = document.querySelector(
      'meta[property="og:description"]'
    )
    if (ogDescriptionMeta) {
      ogDescriptionMeta.setAttribute("content", description)
    }
  }, [activeView])

  React.useEffect(() => {
    const handlePopState = () => {
      dispatch(appShellActions.hydrateFromLocation(getAppShellStateFromLocation()))
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [dispatch])

  React.useEffect(() => {
    if (isBootstrappingAuth) {
      return
    }

    const nextUrl = getAppShellUrl({
      activeView,
      previousView: activeView,
      selectedProductId,
      selectedCategory,
      loginMessage,
      loginError,
      loginRedirectView,
      resetPasswordToken,
    })
    const currentUrl = `${window.location.pathname}${window.location.search}`

    if (currentUrl === nextUrl) {
      hasMountedHistorySync.current = true
      return
    }

    if (!hasMountedHistorySync.current) {
      window.history.replaceState({}, "", nextUrl)
      hasMountedHistorySync.current = true
      return
    }

    if (activeView === "shop" && window.location.pathname === "/") {
      window.history.replaceState({}, "", nextUrl)
      return
    }

    window.history.pushState({}, "", nextUrl)
  }, [
    activeView,
    isBootstrappingAuth,
    loginError,
    loginMessage,
    loginRedirectView,
    resetPasswordToken,
    selectedCategory,
    selectedProductId,
  ])

  const handleAuthenticated = React.useCallback(
    (user: AuthUser) => {
      setCurrentUser(user)
      storeAuthUser(user)
      dispatch(appShellActions.completeLogin())
    },
    [dispatch]
  )

  const handleUserUpdate = React.useCallback((user: AuthUser) => {
    setCurrentUser(user)
    storeAuthUser(user)
  }, [])

  React.useEffect(() => {
    if (currentUser?.role === "support" && activeView !== "support-panel" && activeView !== "login") {
      dispatch(appShellActions.openSupportPanel())
    }
  }, [currentUser, activeView, dispatch])

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logoutUser()
    } catch (err) {
      console.error("Logout API failed, continuing with local cleanup", err)
    } finally {
      setCurrentUser(null)
      dispatch(appShellActions.openShop(undefined))
      setIsLoggingOut(false)
    }
  }

  if (isBootstrappingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <Skeleton className="h-5 w-25 rounded-full" />
      </div>
    )
  }

  const pageFallback = (
    <div className="min-h-[40vh] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-48 rounded-full" />
        <Skeleton className="h-56 w-full rounded-[28px]" />
        <Skeleton className="h-40 w-full rounded-[28px]" />
      </div>
    </div>
  )

  return (
      <StoreProvider currentUser={currentUser}>
      {activeView !== "login" && activeView !== "reset-password" ? (
        <Navbar
          user={currentUser}
          onUserUpdate={handleUserUpdate}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      ) : null}
      <main className="min-h-screen bg-[#f7f4ee]">
        <React.Suspense fallback={pageFallback}>
          {activeView === "shop" ? <Home /> : null}
          {activeView === "about" ? <About /> : null}
          {activeView === "offers" ? <Offer /> : null}
          {activeView === "product" ? <ProductDetails /> : null}
          {activeView === "cart" ? <CartPage currentUser={currentUser} /> : null}
          {activeView === "checkout" ? (
            <CheckoutPage currentUser={currentUser} />
          ) : null}
          {activeView === "admin" ? (
            currentUser?.role === "admin" ? (
              <AdminPanel />
            ) : (
              <RequireAdmin currentUser={currentUser} />
            )
          ) : null}
          {activeView === "support" ? <UserSupport currentUser={currentUser} /> : null}
          {activeView === "support-panel" ? (
            currentUser?.role === "support" ? (
              <SupportPanel currentUser={currentUser} />
            ) : (
              <div className="p-8 text-center bg-white shadow m-8 text-xl font-bold rounded">
                Access Denied: Requires Support Role
              </div>
            )
          ) : null}
          {activeView === "login" ? (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10">
              <div className="w-full max-w-md">
                <LoginForm
                  onAuthenticated={handleAuthenticated}
                  initialMessage={loginMessage}
                  initialError={loginError}
                  onCancel={() => dispatch(appShellActions.closeLogin())}
                />
              </div>
            </div>
          ) : null}
          {activeView === "reset-password" ? (
            <ResetPasswordPage
              token={resetPasswordToken}
              onAuthenticated={handleAuthenticated}
              onBackToLogin={() => dispatch(appShellActions.openLogin())}
            />
          ) : null}
        </React.Suspense>
      </main>
      {activeView !== "login" && activeView !== "reset-password" ? (
        <Footer currentUser={currentUser} />
      ) : null}
    </StoreProvider>
    
  )
}

export default App
