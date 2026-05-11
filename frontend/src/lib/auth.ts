import axios, { type InternalAxiosRequestConfig } from "axios"
import { API_BASE_URL } from "@/lib/api-config"

export type AuthUser = {
  id: string
  name: string
  email: string
  mobile?: string
  role?: string
  avatar?: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

type AuthSession = {
  auth?: AuthTokens
}

export type LoginResponse = {
  user: AuthUser
} & AuthSession

export type MessageResponse = {
  message: string
}

export type ProfileUpdateResponse = {
  message: string
  user: AuthUser
  success: boolean
}

export type VerifyNewEmailResponse = {
  message: string
  success: boolean
}

export type RegisterResponse = {
  message: string
  email: string
}

export type VerifyOtpResponse = LoginResponse & {
  message: string
  welcomeEmailSent?: boolean
}

export type ResetPasswordResponse = LoginResponse & {
  message: string
}

export type CurrentUserResponse = {
  user: AuthUser
} & AuthSession

type ApiErrorResponse = {
  message?: string
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

export const AUTH_USER_STORAGE_KEY = "auth_user"
export const AUTH_ACCESS_TOKEN_STORAGE_KEY = "auth_access_token"
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = "auth_refresh_token"

const authApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

const refreshApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

let refreshRequest: Promise<void> | null = null

const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallbackMessage
  }

  return fallbackMessage
}

export const getStoredAuthUser = () => {
  const storedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

export const storeAuthUser = (user: AuthUser) => {
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
}

export const getStoredAuthTokens = (): AuthTokens | null => {
  const accessToken = window.localStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)
  const refreshToken = window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY)

  if (!accessToken || !refreshToken) {
    return null
  }

  return { accessToken, refreshToken }
}

export const storeAuthTokens = (tokens?: AuthTokens) => {
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    return
  }

  window.localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken)
  window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
}

const persistAuthSession = <T extends AuthSession>(data: T) => {
  storeAuthTokens(data.auth)
  return data
}

export const clearStoredAuthUser = () => {
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY)
}

export async function refreshSession() {
  const tokens = getStoredAuthTokens()

  if (!getStoredAuthUser() && !tokens) {
    throw new Error("No active session")
  }

  if (!refreshRequest) {
    refreshRequest = refreshApi
      .post<CurrentUserResponse>("/api/auth/refresh-token", {
        refreshToken: tokens?.refreshToken,
      })
      .then((response) => {
        persistAuthSession(response.data)
      })
      .then(() => undefined)
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

authApi.interceptors.request.use((config) => {
  const tokens = getStoredAuthTokens()

  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`
  }

  return config
})

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined
    const requestUrl = originalRequest?.url || ""
    const shouldSkipRefresh =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/forgot-password") ||
      requestUrl.includes("/api/auth/reset-password") ||
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
      return authApi(originalRequest)
    } catch (refreshError) {
      clearStoredAuthUser()
      return Promise.reject(refreshError)
    }
  }
)

export async function loginUser(email: string, password: string) {
  try {
    const response = await authApi.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    })

    return persistAuthSession(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Login failed. Please try again."))
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  try {
    const response = await authApi.post<RegisterResponse>("/api/auth/register", {
      name,
      email,
      password,
      confirmPassword,
    })

    return response.data
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to create your account.")
    )
  }
}

export async function forgotPassword(email: string) {
  try {
    const response = await authApi.post<MessageResponse>(
      "/api/auth/forgot-password",
      { email }
    )

    return response.data
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Unable to process forgot password request."
      )
    )
  }
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
) {
  try {
    const response = await authApi.post<ResetPasswordResponse>(
      `/api/auth/reset-password/${encodeURIComponent(token)}`,
      {
        password,
        confirmPassword,
      }
    )

    return persistAuthSession(response.data)
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to reset your password.")
    )
  }
}

export async function verifyRegistrationOtp(email: string, otp: string) {
  try {
    const response = await authApi.post<VerifyOtpResponse>("/api/auth/verify-otp", {
      email,
      otp,
    })

    return persistAuthSession(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to verify OTP."))
  }
}

export async function resendRegistrationOtp(email: string) {
  try {
    const response = await authApi.post<RegisterResponse>("/api/auth/resend-otp", {
      email,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to resend OTP."))
  }
}

export async function fetchCurrentUser() {
  try {
    const response = await authApi.get<CurrentUserResponse>("/api/auth/me")

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load current user."))
  }
}

export async function logoutUser() {
  const tokens = getStoredAuthTokens()

  try {
    const response = await refreshApi.post<MessageResponse>("/api/auth/logout", {
      refreshToken: tokens?.refreshToken,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to log out."))
  } finally {
    clearStoredAuthUser()
  }
}

export async function updateUserProfile(payload: {
  name?: string
  email?: string
  password?: string
  mobile?: string
}) {
  try {
    const response = await authApi.put<ProfileUpdateResponse>("/api/auth/update-user", payload)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update your profile."))
  }
}

export async function uploadAvatar(file: File) {
  try {
    const formData = new FormData()
    formData.append("avatar", file)

    const response = await authApi.post<{ message: string; user: AuthUser }>("/api/auth/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to upload profile photo."))
  }
}

export async function verifyNewEmailOtp(otp: string) {
  try {
    const response = await authApi.post<VerifyNewEmailResponse>("/api/auth/verify-new-email", { otp })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to verify your new email."))
  }
}
