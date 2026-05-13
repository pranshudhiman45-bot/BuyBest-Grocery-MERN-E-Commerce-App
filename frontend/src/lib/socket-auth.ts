import { supportApi } from "@/lib/support-api"

type SocketTokenResponse = {
  token: string
}

export const getSocketAuthToken = async () => {
  const response = await supportApi.get<SocketTokenResponse>("/api/auth/socket-token")
  return response.data.token
}

export const provideSocketAuth = (
  callback: (auth: { token?: string }) => void
) => {
  void getSocketAuthToken()
    .then((token) => callback({ token }))
    .catch((error) => {
      console.error("Failed to fetch socket auth token", error)
      callback({})
    })
}
