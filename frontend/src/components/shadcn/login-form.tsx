import * as React from "react"

import { cn } from "@/lib/utils"
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
  forgotPassword,
  getApiUrl,
  loginUser,
  registerUser,
  resendRegistrationOtp,
  storeAuthUser,
  verifyRegistrationOtp,
  type AuthUser,
} from "@/lib/auth"

type LoginFormProps = React.ComponentProps<"div"> & {
  initialError?: string
  initialMessage?: string
  onAuthenticated?: (user: AuthUser) => void
  onCancel?: () => void
}

export function LoginForm({
  className,
  initialError = "",
  initialMessage = "",
  onAuthenticated,
  onCancel,
  ...props
}: LoginFormProps) {
  const [mode, setMode] = React.useState<
    "login" | "signup" | "forgot-password" | "verify-otp"
  >("login")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState(initialError)
  const [successMessage, setSuccessMessage] = React.useState(initialMessage)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isResendingOtp, setIsResendingOtp] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      if (mode === "forgot-password") {
        const response = await forgotPassword(email)
        setSuccessMessage(response.message)
      } else if (mode === "verify-otp") {
        const response = await verifyRegistrationOtp(email, otp)
        storeAuthUser(response.user)
        onAuthenticated?.(response.user)
      } else if (mode === "signup") {
        const response = await registerUser(
          name,
          email,
          password,
          confirmPassword
        )
        setSuccessMessage(response.message)
        setMode("verify-otp")
        setOtp("")
        setPassword("")
        setConfirmPassword("")
      } else {
        const response = await loginUser(email, password)
        storeAuthUser(response.user)
        onAuthenticated?.(response.user)
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "forgot-password"
            ? "Unable to process forgot password request."
            : mode === "verify-otp"
              ? "Unable to verify OTP."
            : mode === "signup"
              ? "Unable to create your account."
              : "Login failed. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    const googleLoginUrl = new URL(getApiUrl("/api/auth/google"))
    googleLoginUrl.searchParams.set("returnTo", window.location.href)
    window.location.href = googleLoginUrl.toString()
  }

  const switchToForgotPassword = () => {
    setMode("forgot-password")
    setOtp("")
    setPassword("")
    setConfirmPassword("")
    setError("")
    setSuccessMessage("")
  }

  const switchToLogin = () => {
    setMode("login")
    setOtp("")
    setError("")
    setSuccessMessage("")
  }

  const switchToSignup = () => {
    setMode("signup")
    setOtp("")
    setPassword("")
    setConfirmPassword("")
    setError("")
    setSuccessMessage("")
  }

  const switchToVerifyOtp = () => {
    setMode("verify-otp")
    setError("")
    setSuccessMessage("")
  }

  const handleResendOtp = async () => {
    if (!email) {
      setError("Enter your email first so we know where to resend the OTP.")
      return
    }

    setError("")
    setSuccessMessage("")
    setIsResendingOtp(true)

    try {
      const response = await resendRegistrationOtp(email)
      setMode("verify-otp")
      setSuccessMessage(response.message)
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Unable to resend OTP."
      )
    } finally {
      setIsResendingOtp(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-[30px] border border-[#ece4d6] bg-[linear-gradient(135deg,#fffdf8_0%,#fff8ea_40%,#f4fbf6_100%)] py-0 shadow-[0_24px_60px_rgba(78,62,31,0.10)]">
        <CardHeader className="border-b border-[#efe5d5] px-6 pt-6">
          <CardTitle>
            {mode === "forgot-password"
              ? "Forgot your password?"
              : mode === "verify-otp"
                ? "Verify your email"
              : mode === "signup"
                ? "Create your account"
                : "Login to your account"}
          </CardTitle>
          <CardDescription className="text-[#7d6d52]">
            {mode === "forgot-password"
              ? "Enter your email and we will send you a reset link if the account exists."
              : mode === "verify-otp"
                ? "Enter the OTP sent to your email to complete signup and unlock your account."
              : mode === "signup"
                ? "Sign up with your details to receive an email verification OTP."
                : "Enter your email below to login to your account"}
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
              {mode === "signup" ? (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    disabled={isSubmitting}
                    required
                    className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                  className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                />
              </Field>
              {mode === "verify-otp" ? (
                <Field>
                  <FieldLabel htmlFor="otp">OTP</FieldLabel>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    autoComplete="one-time-code"
                    disabled={isSubmitting}
                    required
                    className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                  />
                  <FieldDescription className="pt-2 text-xs text-[#7d6d52]">
                    Check your inbox for the verification code sent during signup.
                  </FieldDescription>
                </Field>
              ) : null}
              {mode !== "forgot-password" && mode !== "verify-otp" ? (
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    disabled={isSubmitting}
                    required
                  className="h-12 rounded-2xl border-[#e6dcc9] bg-[#fbf8f2] text-[#2c2417]"
                />
              </Field>
              ) : null}
              {mode === "signup" ? (
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
              </Field>
              ) : null}
              <Field>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-[#1B4D3E] text-base font-semibold text-white hover:bg-[#163d32]"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? mode === "forgot-password"
                      ? "Sending reset link..."
                      : mode === "verify-otp"
                        ? "Verifying OTP..."
                      : mode === "signup"
                        ? "Creating account..."
                        : "Logging in..."
                    : mode === "forgot-password"
                      ? "Send reset link"
                      : mode === "verify-otp"
                        ? "Verify OTP"
                      : mode === "signup"
                        ? "Create account"
                        : "Login"}
                </Button>
              </Field>
              {mode === "login" ? (
                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl border-[#e6dcc9] bg-white/85 text-[#2c2417] hover:bg-[#faf4e8]"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                  >
                    Continue with Google
                  </Button>
                </Field>
              ) : null}
              <FieldDescription className="space-y-3 text-center">
                {mode === "login" ? (
                  <>
                    <button
                      type="button"
                      onClick={switchToForgotPassword}
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                    <div className="text-sm">
                      Do not have an account?{" "}
                      <button
                        type="button"
                        onClick={switchToSignup}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Sign up
                      </button>
                    </div>
                    <div className="text-sm">
                      Already have an OTP?{" "}
                      <button
                        type="button"
                        onClick={switchToVerifyOtp}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Verify email
                      </button>
                    </div>
                  </>
                ) : mode === "verify-otp" ? (
                  <>
                    <div className="text-sm">
                      Did not receive the code?{" "}
                      <button
                        type="button"
                        onClick={() => void handleResendOtp()}
                        disabled={isResendingOtp || isSubmitting}
                        className="text-primary underline-offset-4 hover:underline disabled:opacity-60"
                      >
                        {isResendingOtp ? "Resending..." : "Resend OTP"}
                      </button>
                    </div>
                    <div className="text-sm">
                      Need to create the account again?{" "}
                      <button
                        type="button"
                        onClick={switchToSignup}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Back to signup
                      </button>
                    </div>
                    <div className="text-sm">
                      Already verified?{" "}
                      <button
                        type="button"
                        onClick={switchToLogin}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Go to login
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm">
                    Back to{" "}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      login
                    </button>
                  </div>
                )}
                {onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Back to store
                  </button>
                ) : null}
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
