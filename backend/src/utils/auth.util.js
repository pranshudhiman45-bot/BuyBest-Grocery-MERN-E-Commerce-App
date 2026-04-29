const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const env = require('../config/env.js')
const {
  OTP_DIGITS,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS
} = require('../constants/auth.constants.js')

const generateOtp = () => {
  const min = 10 ** (OTP_DIGITS - 1)
  const max = 10 ** OTP_DIGITS - 1

  return Math.floor(min + Math.random() * (max - min + 1)).toString()
}

const hashOtp = otp => crypto.createHash('sha256').update(otp).digest('hex')

const generateResetToken = () => crypto.randomBytes(32).toString('hex')

const hashResetToken = token =>
  crypto.createHash('sha256').update(token).digest('hex')

const hashToken = token =>
  crypto.createHash('sha256').update(token).digest('hex')

const createAccessToken = userId =>
  jwt.sign({ userId }, env.accessTokenSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  })

const createRefreshToken = userId =>
  jwt.sign({ userId }, env.refreshTokenSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  })

const getCookieOptions = maxAge => ({
  httpOnly: true,
  sameSite: env.nodeEnv === 'production' ? 'none' : 'strict',
  secure: env.nodeEnv === 'production',
  ...(typeof maxAge === 'number' ? { maxAge } : {})
})

const setAccessTokenCookie = (res, token) => {
  res.cookie(
    ACCESS_TOKEN_COOKIE_NAME,
    token,
    getCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS)
  )
}

const setRefreshTokenCookie = (res, token) => {
  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    token,
    getCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS)
  )
}

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  setAccessTokenCookie(res, accessToken)
  setRefreshTokenCookie(res, refreshToken)
}

const clearAuthCookies = res => {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, getCookieOptions())

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getCookieOptions())
}

const buildUserResponse = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  avatar: user.avatar
})

const buildAuthResponse = (user) => ({
  user: buildUserResponse(user)
})

module.exports = {
  generateOtp,
  hashOtp,
  generateResetToken,
  hashResetToken,
  hashToken,
  createAccessToken,
  createRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setAuthCookies,
  clearAuthCookies,
  buildUserResponse,
  buildAuthResponse
}
