import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { useSyncExternalStore } from "react"

export type AppView =
  | "shop"
  | "offers"
  | "product"
  | "cart"
  | "checkout"
  | "checkout"
  | "admin"
  | "login"
  | "support"
  | "support-panel"

type AppShellState = {
  activeView: AppView
  previousView: AppView
  selectedProductId: string | null
  selectedCategory: string
  loginMessage: string
  loginError: string
  loginRedirectView: AppView | null
}

type PublicAppShellState = AppShellState

const DEFAULT_STATE: AppShellState = {
  activeView: "shop",
  previousView: "shop",
  selectedProductId: null,
  selectedCategory: "all",
  loginMessage: "",
  loginError: "",
  loginRedirectView: null,
}

const mapPathToView = (pathname: string): Pick<
  AppShellState,
  "activeView" | "selectedProductId"
> => {
  if (pathname === "/offers") {
    return { activeView: "offers", selectedProductId: null }
  }

  if (pathname === "/cart") {
    return { activeView: "cart", selectedProductId: null }
  }

  if (pathname === "/checkout") {
    return { activeView: "checkout", selectedProductId: null }
  }

  if (pathname === "/admin") {
    return { activeView: "admin", selectedProductId: null }
  }

  if (pathname === "/login") {
    return { activeView: "login", selectedProductId: null }
  }

  if (pathname === "/support") {
    return { activeView: "support", selectedProductId: null }
  }

  if (pathname === "/support-panel") {
    return { activeView: "support-panel", selectedProductId: null }
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/)

  if (productMatch) {
    return {
      activeView: "product",
      selectedProductId: decodeURIComponent(productMatch[1]),
    }
  }

  return { activeView: "shop", selectedProductId: null }
}

const mapRedirectToView = (redirect: string | null): AppView | null => {
  switch (redirect) {
    case "/offers":
      return "offers"
    case "/cart":
      return "cart"
    case "/checkout":
      return "checkout"
    case "/admin":
      return "admin"
    case "/support":
      return "support"
    case "/support-panel":
      return "support-panel"
    default:
      return redirect ? "shop" : null
  }
}

const getInitialState = (): AppShellState => {
  if (typeof window === "undefined") {
    return DEFAULT_STATE
  }

  const url = new URL(window.location.href)
  const { activeView, selectedProductId } = mapPathToView(url.pathname)

  return {
    activeView,
    previousView: activeView === "login" ? "shop" : "shop",
    selectedProductId,
    selectedCategory: url.searchParams.get("category") || "all",
    loginMessage: url.searchParams.get("message") || "",
    loginError: url.searchParams.get("error") || "",
    loginRedirectView: mapRedirectToView(url.searchParams.get("redirect")),
  }
}

const getRedirectPath = (view: AppView | null) => {
  switch (view) {
    case "offers":
      return "/offers"
    case "cart":
      return "/cart"
    case "checkout":
      return "/checkout"
    case "admin":
      return "/admin"
    case "support":
      return "/support"
    case "support-panel":
      return "/support-panel"
    case "product":
    case "login":
    case "shop":
    default:
      return "/"
  }
}

export const getAppShellStateFromLocation = (): AppShellState => getInitialState()

export const getAppShellUrl = (state: PublicAppShellState) => {
  const searchParams = new URLSearchParams()

  if (state.activeView === "shop") {
    if (state.selectedCategory && state.selectedCategory !== "all") {
      searchParams.set("category", state.selectedCategory)
    }

    const query = searchParams.toString()
    return query ? `/?${query}` : "/"
  }

  if (state.activeView === "offers") {
    return "/offers"
  }

  if (state.activeView === "product" && state.selectedProductId) {
    return `/products/${encodeURIComponent(state.selectedProductId)}`
  }

  if (state.activeView === "cart") {
    return "/cart"
  }

  if (state.activeView === "checkout") {
    return "/checkout"
  }

  if (state.activeView === "admin") {
    return "/admin"
  }

  if (state.activeView === "support") {
    return "/support"
  }

  if (state.activeView === "support-panel") {
    return "/support-panel"
  }

  if (state.activeView === "login") {
    if (state.loginMessage) {
      searchParams.set("message", state.loginMessage)
    }

    if (state.loginError) {
      searchParams.set("error", state.loginError)
    }

    if (state.loginRedirectView) {
      searchParams.set("redirect", getRedirectPath(state.loginRedirectView))
    }

    const query = searchParams.toString()
    return query ? `/login?${query}` : "/login"
  }

  return "/"
}

const appShellSlice = createSlice({
  name: "appShell",
  initialState: getInitialState(),
  reducers: {
    openShop: (state, action: PayloadAction<{ category?: string } | undefined>) => {
      if (state.activeView !== "shop") {
        state.previousView = state.activeView
      }

      state.activeView = "shop"
      state.selectedProductId = null
      state.selectedCategory = action.payload?.category || "all"
    },
    openOffers: (state) => {
      if (state.activeView !== "offers") {
        state.previousView = state.activeView
      }

      state.activeView = "offers"
      state.selectedProductId = null
    },
    openCart: (state) => {
      if (state.activeView !== "cart") {
        state.previousView = state.activeView
      }

      state.activeView = "cart"
      state.selectedProductId = null
    },
    openCheckout: (state) => {
      if (state.activeView !== "checkout") {
        state.previousView = state.activeView
      }

      state.activeView = "checkout"
      state.selectedProductId = null
    },
    openAdmin: (state) => {
      if (state.activeView !== "admin") {
        state.previousView = state.activeView
      }

      state.activeView = "admin"
      state.selectedProductId = null
    },
    openSupport: (state) => {
      if (state.activeView !== "support") {
        state.previousView = state.activeView
      }

      state.activeView = "support"
      state.selectedProductId = null
    },
    openSupportPanel: (state) => {
      if (state.activeView !== "support-panel") {
        state.previousView = state.activeView
      }

      state.activeView = "support-panel"
      state.selectedProductId = null
    },
    openProduct: (state, action: PayloadAction<string>) => {
      if (state.activeView !== "product") {
        state.previousView = state.activeView
      }

      state.activeView = "product"
      state.selectedProductId = action.payload
    },
    openLogin: (
      state,
      action: PayloadAction<
        | {
            message?: string
            error?: string
            redirectView?: AppView | null
          }
        | undefined
      >
    ) => {
      if (state.activeView !== "login") {
        state.previousView = state.activeView
      }

      state.activeView = "login"
      state.loginMessage = action.payload?.message || ""
      state.loginError = action.payload?.error || ""
      state.loginRedirectView = action.payload?.redirectView ?? state.previousView
      state.selectedProductId = null
    },
    closeLogin: (state) => {
      state.activeView =
        state.previousView === "login" ? "shop" : state.previousView || "shop"
      state.loginMessage = ""
      state.loginError = ""
      state.loginRedirectView = null
    },
    completeLogin: (state) => {
      state.activeView =
        state.loginRedirectView && state.loginRedirectView !== "login"
          ? state.loginRedirectView
          : "shop"
      state.loginMessage = ""
      state.loginError = ""
      state.loginRedirectView = null
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload || "all"
    },
    clearTransientUrlState: (state) => {
      state.loginMessage = ""
      state.loginError = ""
    },
    hydrateFromLocation: (state, action: PayloadAction<AppShellState>) => {
      state.activeView = action.payload.activeView
      state.previousView = action.payload.previousView
      state.selectedProductId = action.payload.selectedProductId
      state.selectedCategory = action.payload.selectedCategory
      state.loginMessage = action.payload.loginMessage
      state.loginError = action.payload.loginError
      state.loginRedirectView = action.payload.loginRedirectView
    },
  },
})

export const appShellActions = appShellSlice.actions

export const appShellStore = configureStore({
  reducer: {
    appShell: appShellSlice.reducer,
  },
})

export type AppShellRootState = ReturnType<typeof appShellStore.getState>
export type AppShellDispatch = typeof appShellStore.dispatch

export const useAppShellDispatch = () => appShellStore.dispatch

export function useAppShellSelector<T>(
  selector: (state: AppShellState) => T
) {
  return useSyncExternalStore(
    appShellStore.subscribe,
    () => selector(appShellStore.getState().appShell),
    () => selector(appShellStore.getState().appShell)
  )
}
