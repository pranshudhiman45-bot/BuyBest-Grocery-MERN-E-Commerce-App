const asyncHandler = require('../utils/async-handler.js')
const authService = require('../services/auth.service.js')
const env = require('../config/env.js')
const AppError = require('../utils/app-error.js')
const passport = require('passport')

const sendFrontendRedirect = (res, targetUrl) => {
  const safeUrl = JSON.stringify(targetUrl)

  return res
    .status(200)
    .set('Content-Type', 'text/html; charset=utf-8')
    .set('Cache-Control', 'no-store')
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${targetUrl}" />
    <title>Redirecting...</title>
  </head>
  <body>
    <script>
      window.location.replace(${safeUrl});
    </script>
    <p>Redirecting to the app...</p>
  </body>
</html>`)
}

const getAllowedFrontendOrigins = () =>
  Array.from(
    new Set(
      [env.frontendUrl, ...env.corsOrigins]
        .filter(Boolean)
        .map((value) => {
          try {
            return new URL(value).origin
          } catch {
            return null
          }
        })
        .filter(Boolean)
    )
  )

const resolveFrontendRedirectUrl = (returnTo) => {
  const fallbackUrl = new URL(env.frontendUrl)

  if (!returnTo) {
    return fallbackUrl
  }

  try {
    const requestedUrl = new URL(returnTo)

    if (!getAllowedFrontendOrigins().includes(requestedUrl.origin)) {
      return fallbackUrl
    }

    return requestedUrl
  } catch {
    return fallbackUrl
  }
}

const appendRedirectStatus = (returnTo, params) => {
  const targetUrl = resolveFrontendRedirectUrl(returnTo)

  for (const [key, value] of Object.entries(params)) {
    targetUrl.searchParams.set(key, value)
  }

  return targetUrl.toString()
}

const startGoogleAuth = (req, res, next) => {
  const returnTo =
    typeof req.query.returnTo === 'string' ? req.query.returnTo : ''

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: returnTo
  })(req, res, next)
}

const completeGoogleAuth = (req, res, next) => {
  return passport.authenticate(
    'google',
    { session: false },
    (error, user) => {
      if (error) {
        return next(error)
      }

      if (!user) {
        return next(new AppError('Google authentication failed', 401))
      }

      req.user = user
      return next()
    }
  )(req, res, next)
}

const registerUser = asyncHandler(async (req, res) => {
  const response = await authService.registerUser(req.body)
  res.status(response.statusCode).json(response.body)
})

const getCurrentUser = asyncHandler(async (req, res) => {
  const response = await authService.getCurrentUser(req.user)
  res.status(response.statusCode).json(response.body)
})

const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const response = await authService.verifyRegistrationOtp(req.body, res)
  res.status(response.statusCode).json(response.body)
})

const resendRegistrationOtp = asyncHandler(async (req, res) => {
  const response = await authService.resendRegistrationOtp(req.body)
  res.status(response.statusCode).json(response.body)
})

const forgotPassword = asyncHandler(async (req, res) => {
  const response = await authService.forgotPassword(req.body)
  res.status(response.statusCode).json(response.body)
})

const resetPassword = asyncHandler(async (req, res) => {
  const response = await authService.resetPassword(req.params.token, req.body, res)
  res.status(response.statusCode).json(response.body)
})

const googleAuthCallback = asyncHandler(async (req, res) => {
  await authService.googleAuthCallback(req.user, res)
  return sendFrontendRedirect(
    res,
    appendRedirectStatus(req.query.state, { googleAuth: 'success' })
  )
})

const googleAuthFailure = (req, res) => {
  return sendFrontendRedirect(
    res,
    appendRedirectStatus(req.query.state, {
      error: 'Google authentication failed'
    })
  )
}

const loginUser = asyncHandler(async (req, res) => {
  const response = await authService.loginUser(req.body, res)
  res.status(response.statusCode).json(response.body)
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const response = await authService.refreshAccessToken(req, res)
  res.status(response.statusCode).json(response.body)
})

const logoutUser = asyncHandler(async (req, res) => {
  const response = await authService.logoutUser(req, res)
  res.status(response.statusCode).json(response.body)
})

const uploadAvatar = asyncHandler(async (req, res) => {
  const response = await authService.uploadAvatar(req.user, req.file)
  res.status(response.statusCode).json(response.body)
})
const updateUserProfile = asyncHandler(async (req, res) => {
  const response = await authService.updateUserProfile(req.user, req.body)
  res.status(response.statusCode).json(response.body)
})
const verifyNewEmail = asyncHandler(async (req, res) => {
  const response = await authService.verifyNewEmail(req.user, req.body);
  res.status(response.statusCode).json(response.body);
});
module.exports = {
  startGoogleAuth,
  completeGoogleAuth,
  googleAuthFailure,
  registerUser,
  getCurrentUser,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  loginUser,
  refreshAccessToken,
  logoutUser,
  uploadAvatar,
  updateUserProfile,
  verifyNewEmail
}
