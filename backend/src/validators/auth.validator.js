const AppError = require('../utils/app-error.js')

const normalizeEmail = (email = '') => email.toLowerCase().trim()

const validateRegisterPayload = ({ name, email, password, confirmPassword }) => {
  if (!name || !email || !password || !confirmPassword) {
    throw new AppError('Name, email, password, and confirm password are required', 400)
  }

  if (password !== confirmPassword) {
    throw new AppError('Password and confirm password must match', 400)
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400)
  }

  return {
    name: name.trim(),
    email: normalizeEmail(email),
    password
  }
}

const validateLoginPayload = ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  return {
    email: normalizeEmail(email),
    password
  }
}

const validateOtpPayload = ({ email, otp }) => {
  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400)
  }

  return {
    email: normalizeEmail(email),
    otp: String(otp).trim()
  }
}

const validateEmailPayload = ({ email }) => {
  if (!email) {
    throw new AppError('Email is required', 400)
  }

  return {
    email: normalizeEmail(email)
  }
}

const validateResetPasswordPayload = ({ password, confirmPassword }) => {
  if (!password || !confirmPassword) {
    throw new AppError('Password and confirm password are required', 400)
  }

  if (password !== confirmPassword) {
    throw new AppError('Password and confirm password must match', 400)
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400)
  }

  return { password, confirmPassword }
}

module.exports = {
  normalizeEmail,
  validateRegisterPayload,
  validateLoginPayload,
  validateOtpPayload,
  validateEmailPayload,
  validateResetPasswordPayload
}
