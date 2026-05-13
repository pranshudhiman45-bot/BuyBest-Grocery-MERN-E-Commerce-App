import axios, { type InternalAxiosRequestConfig } from "axios"

import { API_BASE_URL } from "@/lib/api-config"
import { clearStoredAuthUser, refreshSession } from "@/lib/auth"

type ApiErrorResponse = {
  message?: string
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

export const supportApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

supportApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await refreshSession()
      return supportApi(originalRequest)
    } catch (refreshError) {
      clearStoredAuthUser()
      return Promise.reject(refreshError)
    }
  }
)
