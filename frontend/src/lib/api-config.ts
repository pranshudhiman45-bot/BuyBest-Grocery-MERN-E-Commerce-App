const rawApiBaseUrl = import.meta.env.VITE_API_URL || ""

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "")

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (!API_BASE_URL) {
    return normalizedPath
  }

  return `${API_BASE_URL}${normalizedPath}`
}
