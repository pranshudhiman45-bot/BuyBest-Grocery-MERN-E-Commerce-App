import * as React from "react"

import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import { StoreProvider } from "@/components/providers/store-provider"
import { LoginForm } from "@/components/shadcn/login-form"
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
import AdminPanel from "@/pages/AdminPanel"
import CartPage from "@/pages/CartPage"
import CheckoutPage from "@/pages/CheckoutPage"
import Home from "@/pages/Home"
import Offer from "@/pages/Offer"
import ProductDetails from "@/pages/ProductDetails"
import SupportPanel from "@/pages/SupportPanel"
import UserSupport from "@/pages/UserSupport"

const App = () => {
  const dispatch = useAppShellDispatch()
  const activeView = useAppShellSelector((state) => state.activeView)
  const selectedCategory = useAppShellSelector((state) => state.selectedCategory)
  const selectedProductId = useAppShellSelector((state) => state.selectedProductId)
  const loginMessage = useAppShellSelector((state) => state.loginMessage)
  const loginError = useAppShellSelector((state) => state.loginError)
  const loginRedirectView = useAppShellSelector((state) => state.loginRedirectView)

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

  return (
    <StoreProvider currentUser={currentUser}>
      {activeView !== "login" ? (
        <Navbar
          user={currentUser}
          onUserUpdate={handleUserUpdate}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      ) : null}
      <main className="min-h-screen bg-[#f7f4ee]">
        {activeView === "shop" ? <Home /> : null}
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
      </main>
      {activeView !== "login" ? <Footer /> : null}
    </StoreProvider>
  )
}

export default App
