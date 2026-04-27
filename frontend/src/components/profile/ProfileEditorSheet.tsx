import * as React from "react"
import { Camera, CircleAlert, MailCheck, PartyPopper, UserRound } from "lucide-react"

import {
  fetchCurrentUser,
  storeAuthUser,
  updateUserProfile,
  uploadAvatar,
  verifyNewEmailOtp,
  type AuthUser,
} from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ProfileEditorSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUser
  onUserUpdate: (user: AuthUser) => void
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

export function ProfileEditorSheet({
  open,
  onOpenChange,
  user,
  onUserUpdate,
}: ProfileEditorSheetProps) {
  const [name, setName] = React.useState(user.name)
  const [email, setEmail] = React.useState(user.email)
  const [mobile, setMobile] = React.useState(user.mobile || "")
  const [password, setPassword] = React.useState("")
  const [emailOtp, setEmailOtp] = React.useState("")
  const [feedback, setFeedback] = React.useState("")
  const [error, setError] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = React.useState(false)
  const [isAwaitingEmailVerification, setIsAwaitingEmailVerification] = React.useState(false)
  const [popupState, setPopupState] = React.useState<{
    title: string
    message: string
    tone: "success" | "error"
  } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const refreshCurrentUser = React.useCallback(async () => {
    const response = await fetchCurrentUser()
    storeAuthUser(response.user)
    onUserUpdate(response.user)
    return response.user
  }, [onUserUpdate])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError("")
    setFeedback("")
    setPopupState(null)
    setIsUploadingAvatar(true)

    try {
      const response = await uploadAvatar(file)
      storeAuthUser(response.user)
      onUserUpdate(response.user)
      setFeedback(response.message)
      setPopupState({
        title: "Profile photo updated",
        message: response.message,
        tone: "success",
      })
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Unable to upload profile photo."
      setError(message)
      setPopupState({
        title: "Profile photo update failed",
        message,
        tone: "error",
      })
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError("")
    setFeedback("")
    setPopupState(null)

    try {
      const response = await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password: password.trim() || undefined,
      })

      storeAuthUser(response.user)
      onUserUpdate(response.user)
      setPassword("")
      const waitingForEmailOtp = response.message.toLowerCase().includes("verification otp sent")
      setIsAwaitingEmailVerification(waitingForEmailOtp)
      setFeedback(waitingForEmailOtp ? response.message : "")
      if (!waitingForEmailOtp) {
        setPopupState({
          title: "Profile updated",
          message: "Profile edited successfully.",
          tone: "success",
        })
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Unable to update your profile."
      setError(message)
      setPopupState({
        title: "Profile update failed",
        message,
        tone: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyNewEmail = async () => {
    setIsVerifyingEmail(true)
    setError("")
    setFeedback("")
    setPopupState(null)

    try {
      await verifyNewEmailOtp(emailOtp.trim())
      const refreshedUser = await refreshCurrentUser()
      setEmail(refreshedUser.email)
      setEmailOtp("")
      setIsAwaitingEmailVerification(false)
      setFeedback("")
      setPopupState({
        title: "Email updated",
        message: "Your email changed successfully.",
        tone: "success",
      })
    } catch (verifyError) {
      const message =
        verifyError instanceof Error ? verifyError.message : "Unable to verify your new email."
      setError(message)
      setPopupState({
        title: "Email update failed",
        message,
        tone: "error",
      })
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-[#ece4d6] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f5ee_100%)] p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="border-b border-[#ece4d6] px-6 py-5">
          <SheetTitle className="text-2xl text-[#2c2417]">Edit profile</SheetTitle>
          <SheetDescription className="text-[#7d6d52]">
            Update your basic details, profile photo, contact info, and password from one place.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-6">
          {feedback ? (
            <Alert className="border-[#e5d9c4] bg-[#fff8ed] text-[#624c11]">
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="rounded-[26px] border border-[#ece4d6] bg-white/90 py-0 shadow-[0_18px_44px_rgba(78,62,31,0.08)]">
            <CardHeader className="border-b border-[#efe4d1]">
              <CardTitle className="text-[#2c2417]">Profile photo</CardTitle>
              <CardDescription className="text-[#7d6d52]">
                Upload a profile image that will show in the navbar and account menu.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center">
              <Avatar size="lg" className="h-22 w-22 border border-[#ece4d6] bg-[#fff8ea]">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="text-lg font-semibold text-[#624c11]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <p className="text-sm text-[#7d6d52]">
                  Supported image uploads go through your existing backend avatar endpoint.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleAvatarUpload(event)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-[#e6dcc9] text-[#2c2417] hover:bg-[#faf4e8]"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-4 w-4" />
                  {isUploadingAvatar ? "Uploading..." : "Change photo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border border-[#ece4d6] bg-white/90 py-0 shadow-[0_18px_44px_rgba(78,62,31,0.08)]">
            <CardHeader className="border-b border-[#efe4d1]">
              <CardTitle className="text-[#2c2417]">Personal details</CardTitle>
              <CardDescription className="text-[#7d6d52]">
                Change your name, phone, email, or password. Email changes require OTP confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <form onSubmit={handleProfileSave}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                      required
                    />
                    <FieldDescription>
                      If you change this, the backend will send an OTP to the new email before final confirmation.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="profile-mobile">Mobile</FieldLabel>
                    <Input
                      id="profile-mobile"
                      type="tel"
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                      className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                      placeholder="Enter mobile number"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="profile-password">New password</FieldLabel>
                    <Input
                      id="profile-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                      placeholder="Leave blank to keep your current password"
                    />
                    <FieldDescription>
                      Use at least 6 characters if you want to replace your current password.
                    </FieldDescription>
                  </Field>

                  <Button
                    type="submit"
                    className="h-12 rounded-2xl bg-[#1B4D3E] text-white hover:bg-[#163d32]"
                    disabled={isSaving}
                  >
                    <UserRound className="h-4 w-4" />
                    {isSaving ? "Saving changes..." : "Save profile changes"}
                  </Button>

                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {isAwaitingEmailVerification ? (
            <Card className="rounded-[26px] border border-[#ece4d6] bg-white/90 py-0 shadow-[0_18px_44px_rgba(78,62,31,0.08)]">
              <CardHeader className="border-b border-[#efe4d1]">
                <CardTitle className="text-[#2c2417]">Verify new email</CardTitle>
                <CardDescription className="text-[#7d6d52]">
                  Enter the OTP sent to your new email address to finish the email update.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-6">
                <Field>
                  <FieldLabel htmlFor="email-otp">Email OTP</FieldLabel>
                  <Input
                    id="email-otp"
                    value={emailOtp}
                    onChange={(event) => setEmailOtp(event.target.value)}
                    className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                    placeholder="Enter OTP"
                  />
                </Field>
                <Button
                  type="button"
                  className="h-12 rounded-2xl bg-[#624c11] text-white hover:bg-[#4f3d0c]"
                  disabled={isVerifyingEmail}
                  onClick={() => void handleVerifyNewEmail()}
                >
                  <MailCheck className="h-4 w-4" />
                  {isVerifyingEmail ? "Verifying..." : "Verify new email"}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </SheetContent>

      {popupState ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2c2417]/35 px-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPopupState(null)}
          />
          <div
            className={`relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border bg-white shadow-2xl ${
              popupState.tone === "success" ? "border-[#d7eadf]" : "border-[#efd5d5]"
            }`}
          >
            <div
              className={`px-6 py-6 text-center ${
                popupState.tone === "success"
                  ? "bg-[linear-gradient(135deg,#f2faf6_0%,#fff8ea_100%)]"
                  : "bg-[linear-gradient(135deg,#fff4f4_0%,#fff8ea_100%)]"
              }`}
            >
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ${
                  popupState.tone === "success" ? "text-[#1B4D3E]" : "text-[#b42318]"
                }`}
              >
                {popupState.tone === "success" ? (
                  <PartyPopper className="h-6 w-6" />
                ) : (
                  <CircleAlert className="h-6 w-6" />
                )}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#2c2417]">{popupState.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#7d6d52]">
                {popupState.message}
              </p>
              <Button
                type="button"
                className={`mt-5 rounded-full px-6 text-white ${
                  popupState.tone === "success"
                    ? "bg-[#1B4D3E] hover:bg-[#163d32]"
                    : "bg-[#b42318] hover:bg-[#8f1c13]"
                }`}
                onClick={() => setPopupState(null)}
              >
                Okay
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Sheet>
  )
}
