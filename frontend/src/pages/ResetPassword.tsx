import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  resetPassword,
  storeAuthUser,
  type AuthUser,
} from "@/lib/auth"

type ResetPasswordPageProps = {
  token: string
  onAuthenticated?: (user: AuthUser) => void
  onBackToLogin?: () => void
}

const MIN_PASSWORD_LENGTH = 6

export default function ResetPasswordPage({
  token,
  onAuthenticated,
  onBackToLogin,
}: ResetPasswordPageProps) {
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [successMessage, setSuccessMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await resetPassword(token, password, confirmPassword)
      storeAuthUser(response.user)
      setSuccessMessage(response.message)
      onAuthenticated?.(response.user)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset your password."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <Card className="w-full overflow-hidden rounded-[30px] border border-[#ece4d6] bg-[linear-gradient(135deg,#fffdf8_0%,#fff8ea_40%,#f4fbf6_100%)] py-0 shadow-[0_24px_60px_rgba(78,62,31,0.10)]">
          <CardHeader className="border-b border-[#efe5d5] px-6 pt-6">
            <CardTitle>Choose a new password</CardTitle>
            <CardDescription className="text-[#7d6d52]">
              Enter your new password below to finish resetting your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6 pt-6">
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {successMessage ? (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                ) : null}
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="password">New password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                    className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    Confirm password
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                    className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                  />
                  <FieldDescription className="pt-2 text-xs text-[#7d6d52]">
                    Use at least 6 characters.
                  </FieldDescription>
                </Field>
                <Field>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-[#1B4D3E] text-base font-semibold text-white hover:bg-[#163d32]"
                    disabled={isSubmitting || !token}
                  >
                    {isSubmitting ? "Resetting password..." : "Reset password"}
                  </Button>
                </Field>
                <FieldDescription className="text-center text-sm">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Back to login
                  </button>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
