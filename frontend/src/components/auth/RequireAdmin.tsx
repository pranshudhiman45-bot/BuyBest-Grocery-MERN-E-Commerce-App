import { ShieldAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"

type RequireAdminProps = {
  currentUser?: AuthUser | null
}

export default function RequireAdmin({ currentUser = null }: RequireAdminProps) {
  const dispatch = useAppShellDispatch()

  return (
    <div className="mx-auto max-w-2xl rounded-[28px] bg-white/85 p-8 shadow-sm">
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>Admin access only</AlertTitle>
        <AlertDescription>
          {currentUser
            ? "Your account is logged in, but it does not have permission to open the admin panel."
            : "Please log in with an admin account to open the admin panel."}
        </AlertDescription>
      </Alert>
      <Button
        type="button"
        className="mt-6 rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539]"
        onClick={() => {
          if (currentUser) {
            dispatch(appShellActions.openShop(undefined))
            return
          }

          dispatch(
            appShellActions.openLogin({
              redirectView: "admin",
              message: "Please log in with an admin account.",
            })
          )
        }}
      >
        {currentUser ? "Back to store" : "Login"}
      </Button>
    </div>
  )
}
