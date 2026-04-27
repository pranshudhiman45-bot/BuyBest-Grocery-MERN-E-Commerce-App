import axios, { type InternalAxiosRequestConfig } from "axios"

import {
  clearStoredAuthUser,
  refreshSession,
} from "@/lib/auth"
import type { CouponDefinition } from "@/lib/offers"
import type { Category, Product } from "@/lib/storefront"

export type CartItem = {
  id: string
  productId: string
  name: string
  brand: string | null
  category: string | null
  size: string | null
  imageLabel: string | null
  imageUrl?: string | null
  accent: string | null
  quantity: number
  price: number
  totalPrice: number
  stock: number
  maxPerOrder?: number | null
}

export type CartSummary = {
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  itemCount: number
}

export type CartResponse = {
  items: CartItem[]
  summary: CartSummary
}

export type CheckoutResponse = {
  message: string
  paymentMethod: string
  address?: Address | null
  summary: CartSummary
  items: CartItem[]
}

export type Address = {
  id: string
  addressLine: string
  street?: string | null
  city: string
  state: string
  postalCode: string
  mobile: string
  country?: string | null
  isDefault: boolean
}

export type AddressResponse = {
  addresses: Address[]
  selectedAddressId: string | null
}

export type CreateAddressPayload = {
  addressLine: string
  street?: string
  city: string
  state: string
  postalCode: string
  mobile: string
  country?: string
  setAsDefault?: boolean
}

export type ProductFormData = {
  name: string
  slug?: string
  brand: string
  category: string
  categoryLabel: string
  size: string
  price: number
  originalPrice?: number | null
  offer?: string
  accent?: string
  imageLabel?: string
  images?: string[] | string
  description?: string
  stock?: number
  maxPerOrder?: number | null
  expirationDate?: string | null
  benefits?: string[] | string
  storage?: string
  tags?: string[] | string
  relatedIds?: string[] | string
  isBestSeller?: boolean
  isNewArrival?: boolean
  publish?: boolean
}

export type CategoryFormData = {
  name: string
  image?: string
}

export type InventoryAlertItem = {
  id: string
  name: string
  stock: number
  categoryLabel: string
  expirationDate?: string | null
}

export type InventoryAlertsResponse = {
  alerts: {
    lowStockProducts: InventoryAlertItem[]
    outOfStockProducts: InventoryAlertItem[]
    expiringSoonProducts: InventoryAlertItem[]
  }
  summary: {
    lowStockCount: number
    outOfStockCount: number
    expiringSoonCount: number
  }
}

export type BankOffer = {
  id: number
  bank: string
  offer: string
}

const normalizeInventoryAlertsResponse = (
  data: Partial<InventoryAlertsResponse> | undefined
): InventoryAlertsResponse => {
  const lowStockProducts = Array.isArray(data?.alerts?.lowStockProducts)
    ? data.alerts.lowStockProducts
    : []
  const outOfStockProducts = Array.isArray(data?.alerts?.outOfStockProducts)
    ? data.alerts.outOfStockProducts
    : []
  const expiringSoonProducts = Array.isArray(data?.alerts?.expiringSoonProducts)
    ? data.alerts.expiringSoonProducts
    : []

  return {
    alerts: {
      lowStockProducts,
      outOfStockProducts,
      expiringSoonProducts,
    },
    summary: {
      lowStockCount:
        typeof data?.summary?.lowStockCount === "number"
          ? data.summary.lowStockCount
          : lowStockProducts.length,
      outOfStockCount:
        typeof data?.summary?.outOfStockCount === "number"
          ? data.summary.outOfStockCount
          : outOfStockProducts.length,
      expiringSoonCount:
        typeof data?.summary?.expiringSoonCount === "number"
          ? data.summary.expiringSoonCount
          : expiringSoonProducts.length,
    },
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type ApiErrorResponse = {
  message?: string
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "")

const storeApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallbackMessage
  }

  return fallbackMessage
}

storeApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined
    const requestUrl = originalRequest?.url || ""
    const shouldSkipRefresh =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/refresh-token") ||
      requestUrl.includes("/api/auth/logout")

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await refreshSession()
      return storeApi(originalRequest)
    } catch (refreshError) {
      clearStoredAuthUser()
      return Promise.reject(refreshError)
    }
  }
)

export async function searchProducts(query: string) {
  try {
    const response = await storeApi.get<{ products: Product[] }>("/api/products/search", {
      params: { q: query, limit: 6 },
    })

    return response.data.products
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to search products."))
  }
}

export async function fetchProducts(category?: string) {
  try {
    const response = await storeApi.get<{ products: Product[] }>("/api/products", {
      params: category ? { category } : undefined,
    })

    return response.data.products
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load products."))
  }
}

export async function fetchCatagories() {
  try {
    const response = await storeApi.get<{ catagories: Category[] }>("/api/catagories")
    return response.data.catagories
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load categories."))
  }
}

export async function fetchProductById(productId: string) {
  try {
    const response = await storeApi.get<{ product: Product }>(`/api/products/${productId}`)
    return response.data.product
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load product details."))
  }
}

export async function createProduct(payload: ProductFormData) {
  try {
    const response = await storeApi.post<{ message: string; product: Product }>("/api/products", payload)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create product."))
  }
}

export async function uploadProductImage(file: File) {
  try {
    const formData = new FormData()
    formData.append("image", file)

    const response = await storeApi.post<{ message: string; image: { url: string; publicId: string } }>(
      "/api/products/upload-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )

    return response.data.image
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to upload product image."))
  }
}

export async function updateProduct(productId: string, payload: ProductFormData) {
  try {
    const response = await storeApi.put<{ message: string; product: Product }>(
      `/api/products/${productId}`,
      payload
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update product."))
  }
}

export async function deleteProduct(productId: string) {
  try {
    const response = await storeApi.delete<{ message: string }>(`/api/products/${productId}`)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to delete product."))
  }
}

export async function createCatagory(payload: CategoryFormData) {
  try {
    const response = await storeApi.post<{ message: string; catagory: Category }>(
      "/api/catagories",
      payload
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create category."))
  }
}

export async function updateCatagory(catagoryId: string, payload: CategoryFormData) {
  try {
    const response = await storeApi.put<{ message: string; catagory: Category }>(
      `/api/catagories/${catagoryId}`,
      payload
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update category."))
  }
}

export async function deleteCatagory(catagoryId: string) {
  try {
    const response = await storeApi.delete<{ message: string }>(`/api/catagories/${catagoryId}`)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to delete category."))
  }
}

export async function fetchCart() {
  try {
    const response = await storeApi.get<CartResponse>("/api/cart")
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load cart."))
  }
}

export async function addCartItem(productId: string, quantity = 1) {
  try {
    const response = await storeApi.post<CartResponse>("/api/cart/items", {
      productId,
      quantity,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to add item to cart."))
  }
}

export async function updateCartItem(productId: string, quantity: number) {
  try {
    const response = await storeApi.patch<CartResponse>(`/api/cart/items/${productId}`, {
      quantity,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update cart item."))
  }
}

export async function removeCartItem(productId: string) {
  try {
    const response = await storeApi.delete<CartResponse>(`/api/cart/items/${productId}`)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to remove cart item."))
  }
}

export async function checkoutCart(paymentMethod: string) {
  try {
    const response = await storeApi.post<CheckoutResponse>("/api/cart/checkout", {
      paymentMethod,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create checkout summary."))
  }
}

export async function fetchAddresses() {
  try {
    const response = await storeApi.get<AddressResponse>("/api/addresses")
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load addresses."))
  }
}

export async function createAddress(payload: CreateAddressPayload) {
  try {
    const response = await storeApi.post<AddressResponse & { message: string }>("/api/addresses", payload)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to save address."))
  }
}

export async function updateAddress(addressId: string, payload: CreateAddressPayload) {
  try {
    const response = await storeApi.put<AddressResponse & { message: string }>(
      `/api/addresses/${addressId}`,
      payload
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update address."))
  }
}

export async function deleteAddress(addressId: string) {
  try {
    const response = await storeApi.delete<AddressResponse & { message: string }>(
      `/api/addresses/${addressId}`
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to delete address."))
  }
}

export async function selectAddress(addressId: string) {
  try {
    const response = await storeApi.patch<AddressResponse & { message: string }>(
      `/api/addresses/${addressId}/select`
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to select address."))
  }
}

export async function fetchCoupons() {
  try {
    const response = await storeApi.get<{ coupons: CouponDefinition[] }>("/api/coupons")
    return response.data.coupons
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load coupons."))
  }
}

export async function fetchAdminCoupons() {
  try {
    const response = await storeApi.get<{ coupons: CouponDefinition[] }>("/api/coupons/admin")
    return response.data.coupons
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load admin coupons."))
  }
}

export async function createCoupon(payload: CouponDefinition) {
  try {
    const response = await storeApi.post<{ message: string; coupon: CouponDefinition }>(
      "/api/coupons",
      payload
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create coupon."))
  }
}

export async function updateCoupon(couponId: string, payload: CouponDefinition) {
  try {
    const response = await storeApi.put<{ message: string; coupon: CouponDefinition }>(
      `/api/coupons/${couponId}`,
      payload
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update coupon."))
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    const response = await storeApi.delete<{ message: string }>(`/api/coupons/${couponId}`)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to delete coupon."))
  }
}

export async function fetchInventoryAlerts() {
  try {
    const response = await storeApi.get<InventoryAlertsResponse>("/api/products/admin/inventory-alerts")
    return normalizeInventoryAlertsResponse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load inventory alerts."))
  }
}

export async function fetchBankOffers() {
  try {
    const response = await storeApi.get<{ offers: BankOffer[] }>("/api/offers/banks")
    return response.data.offers
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load bank offers."))
  }
}
