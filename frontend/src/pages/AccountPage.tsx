import { useState } from "react"
import { LogOut, Mail, MapPin, Package, Phone, UserRound } from "lucide-react"

import { ProfileEditorSheet } from "@/components/profile/ProfileEditorSheet"
import { Button } from "@/components/ui/button"
import { AddressSection } from "@/features/cart/components/AddressSection"
import type { AuthUser } from "@/lib/auth"
import { appShellActions, useAppShellDispatch } from "@/store/app-shell"

type AccountPageProps = {
  currentUser: AuthUser | null
  onUserUpdate: (user: AuthUser) => void
  onLogout: () => Promise<void>
  isLoggingOut: boolean
}

const AccountPage = ({ currentUser, onUserUpdate, onLogout, isLoggingOut }: AccountPageProps) => {
  const dispatch = useAppShellDispatch()
  const [isEditing, setIsEditing] = useState(false)

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <UserRound className="mx-auto size-10 text-[#16834a]" />
        <h1 className="mt-4 text-3xl font-bold text-[#21352b]">Your Buy Best account</h1>
        <p className="mt-2 text-[#718078]">Sign in to manage your profile, saved addresses and orders.</p>
        <Button className="mt-6 rounded-full bg-[#16834a] hover:bg-[#116d3d]" onClick={() => dispatch(appShellActions.openLogin({ redirectView: "account" }))}>Sign in</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 pb-24 pt-6 sm:px-6">
      <section className="overflow-hidden rounded-[28px] border border-[#e4e3da] bg-[linear-gradient(135deg,#ffffff_0%,#f6fbf7_100%)] p-5 shadow-[0_16px_38px_rgba(33,53,43,0.07)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f5ed] text-xl font-bold text-[#176942]">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="h-full w-full object-cover" /> : currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#16834a]">Account</p>
              <h1 className="truncate text-2xl font-bold text-[#21352b] sm:text-3xl">{currentUser.name}</h1>
              <div className="mt-2 flex flex-col gap-1 text-sm text-[#718078] sm:flex-row sm:gap-4">
                <span className="inline-flex items-center gap-1.5"><Mail className="size-4" />{currentUser.email}</span>
                {currentUser.mobile ? <span className="inline-flex items-center gap-1.5"><Phone className="size-4" />{currentUser.mobile}</span> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setIsEditing(true)}><UserRound className="size-4" /> Edit profile</Button>
            <Button variant="outline" className="rounded-full" onClick={() => dispatch(appShellActions.openOrders())}><Package className="size-4" /> My orders</Button>
            <Button variant="outline" className="rounded-full border-[#e7bdb5] text-[#a43e30]" disabled={isLoggingOut} onClick={() => void onLogout()}><LogOut className="size-4" /> {isLoggingOut ? "Signing out…" : "Sign out"}</Button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 px-1 text-[#21352b]"><MapPin className="size-5 text-[#16834a]" /><h2 className="text-xl font-bold">Saved addresses</h2></div>
      <AddressSection isLoggedIn onSelectionChange={() => undefined} onRequireLogin={() => undefined} />

      <ProfileEditorSheet open={isEditing} onOpenChange={setIsEditing} user={currentUser} onUserUpdate={onUserUpdate} />
    </div>
  )
}

export default AccountPage
