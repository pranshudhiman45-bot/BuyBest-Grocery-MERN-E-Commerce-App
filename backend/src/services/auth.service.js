const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model.js')
const emailService = require('./email.service.js')
const env = require('../config/env.js')
const { AUTH_PROVIDERS } = require('../constants/auth.constants.js')
const AppError = require('../utils/app-error.js')
const {
  uploadImageToCloudinary,
  deleteImageFromCloudinary
} = require('../utils/cloudinaryImage.js')
const {
  generateOtp,
  hashOtp,
  generateResetToken,
  hashResetToken,
  hashToken,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  buildUserResponse,
  buildAuthResponse
} = require('../utils/auth.util.js')
const {
  validateRegisterPayload,
  validateLoginPayload,
  validateOtpPayload,
  validateEmailPayload,
  validateResetPasswordPayload
} = require('../validators/auth.validator.js')

const issueAuthTokens = async (user, res) => {
  const accessToken = createAccessToken(user._id)
  const refreshToken = createRefreshToken(user._id)

  user.refreshToken = hashToken(refreshToken)
  await user.save()

  setAuthCookies(res, { accessToken, refreshToken })
}

const sendOtpForUser = async (user) => {
  const otp = generateOtp()
  user.otpCode = hashOtp(otp)
  user.otpExpiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000)

  await user.save()
  await emailService.sendVerificationOtpEmail(
    user.email,
    user.name,
    otp,
    env.otpExpiryMinutes
  )
}

const registerUser = async (body) => {
  const { name, email, password } = validateRegisterPayload(body)
  const existingUser = await userModel.findOne({ email })

  if (existingUser && existingUser.isVerified !== false) {
    throw new AppError('Email already exists', 422)
  }

  let user = existingUser

  if (user) {
    user.name = name
    user.password = password
    user.authProvider = AUTH_PROVIDERS.LOCAL
    user.googleId = null
    user.isVerified = false
  } else {
    user = new userModel({
      name,
      email,
      password,
      authProvider: AUTH_PROVIDERS.LOCAL,
      isVerified: false
    })
  }

  await sendOtpForUser(user)

  return {
    statusCode: 201,
    body: {
      message: 'OTP sent to your email. Please verify to access the website.',
      email: user.email
    }
  }
}

const getCurrentUser = async (user) => ({
  statusCode: 200,
  body: {
    user: buildUserResponse(user)
  }
})

const verifyRegistrationOtp = async (body, res) => {
  const { email, otp } = validateOtpPayload(body)
  const user = await userModel.findOne({ email }).select('+password +otpCode')

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.isVerified !== false) {
    await issueAuthTokens(user, res)

    return {
      statusCode: 200,
      body: {
        message: 'User already verified',
        ...buildAuthResponse(user)
      }
    }
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    throw new AppError('OTP not requested for this user', 400)
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError('OTP has expired. Please request a new one.', 400)
  }

  if (user.otpCode !== hashOtp(otp)) {
    throw new AppError('Invalid OTP', 401)
  }

  user.isVerified = true
  user.otpCode = null
  user.otpExpiresAt = null
  await user.save()

  let welcomeEmailSent = true

  try {
    await emailService.sendWelcomeEmail(user.email, user.name)
  } catch (emailError) {
    welcomeEmailSent = false
    console.error('Welcome email failed:', emailError)
  }

  await issueAuthTokens(user, res)

  return {
    statusCode: 200,
    body: {
      message: 'Email verified successfully',
      ...buildAuthResponse(user),
      welcomeEmailSent
    }
  }
}

const resendRegistrationOtp = async (body) => {
  const { email } = validateEmailPayload(body)
  const user = await userModel.findOne({ email })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.isVerified !== false) {
    throw new AppError('User is already verified', 400)
  }

  await sendOtpForUser(user)

  return {
    statusCode: 200,
    body: {
      message: 'A new OTP has been sent to your email',
      email: user.email
    }
  }
}

const forgotPassword = async (body) => {
  const { email } = validateEmailPayload(body)
  const user = await userModel.findOne({ email }).select('+password +resetPasswordToken')

  if (!user) {
    return {
      statusCode: 200,
      body: {
        message: 'If an account with that email exists, a reset link has been sent.'
      }
    }
  }

  if (user.authProvider === AUTH_PROVIDERS.GOOGLE && !user.password) {
    throw new AppError(
      'This account uses Google login. Please continue with Google OAuth.',
      400
    )
  }

  const resetToken = generateResetToken()
  user.resetPasswordToken = hashResetToken(resetToken)
  user.resetPasswordExpiresAt = new Date(
    Date.now() + env.resetPasswordExpiryMinutes * 60 * 1000
  )
  await user.save()

  const resetLink = `${env.resetPasswordUrl}?token=${resetToken}`

  try {
    await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetLink,
      env.resetPasswordExpiryMinutes
    )
  } catch (emailError) {
    user.resetPasswordToken = null
    user.resetPasswordExpiresAt = null
    await user.save()
    throw emailError
  }

  return {
    statusCode: 200,
    body: {
      message: 'If an account with that email exists, a reset link has been sent.'
    }
  }
}

const resetPassword = async (token, body, res) => {
  const { password } = validateResetPasswordPayload(body)

  if (!token) {
    throw new AppError('Reset token is required', 400)
  }

  const hashedToken = hashResetToken(token)
  const user = await userModel
    .findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() }
    })
    .select('+password +resetPasswordToken')

  if (!user) {
    throw new AppError('Reset link is invalid or has expired', 400)
  }

  user.password = password
  user.authProvider = user.googleId ? user.authProvider : AUTH_PROVIDERS.LOCAL
  user.resetPasswordToken = null
  user.resetPasswordExpiresAt = null
  await user.save()

  await issueAuthTokens(user, res)

  return {
    statusCode: 200,
    body: {
      message: 'Password reset successfully',
      ...buildAuthResponse(user)
    }
  }
}

const googleAuthCallback = async (googleUser, res) => {
  if (!googleUser || !googleUser.email) {
    throw new AppError('Google authentication failed', 400)
  }

  const { email, name, googleId } = googleUser
  let user = await userModel.findOne({ email })
  let welcomeEmailSent = false

  if (!user) {
    user = await userModel.create({
      name,
      email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      googleId,
      isVerified: true
    })

    try {
      await emailService.sendWelcomeEmail(user.email, user.name)
      welcomeEmailSent = true
    } catch (emailError) {
      console.error('Welcome email failed for Google user:', emailError)
    }
  } else {
    let shouldSave = false

    if (user.authProvider !== AUTH_PROVIDERS.GOOGLE) {
      user.authProvider = AUTH_PROVIDERS.GOOGLE
      shouldSave = true
    }

    if (user.googleId !== googleId) {
      user.googleId = googleId
      shouldSave = true
    }

    if (name && user.name !== name) {
      user.name = name
      shouldSave = true
    }

    if (user.isVerified === false) {
      user.isVerified = true
      user.otpCode = null
      user.otpExpiresAt = null
      shouldSave = true
    }

    if (shouldSave) {
      await user.save()
    }
  }

  await issueAuthTokens(user, res)

  return {
    statusCode: 200,
    body: {
      message: 'Google login successful',
      ...buildAuthResponse(user),
      authProvider: AUTH_PROVIDERS.GOOGLE,
      welcomeEmailSent
    }
  }
}

const loginUser = async (body, res) => {
  const { email, password } = validateLoginPayload(body)
  const user = await userModel.findOne({ email }).select('+password')

  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  if (user.isVerified === false) {
    throw new AppError('Please verify your email with OTP before logging in', 403)
  }

  if (user.authProvider === AUTH_PROVIDERS.GOOGLE && !user.password) {
    throw new AppError(
      'This account uses Google login. Please continue with Google OAuth.',
      400
    )
  }

  const isMatch = await user.comparePassword(password)

  if (!isMatch) {
    throw new AppError('Invalid credentials', 401)
  }

  await issueAuthTokens(user, res)

  return {
    statusCode: 200,
    body: buildAuthResponse(user)
  }
}

const refreshAccessToken = async ({ cookies, body, headers }, res) => {
  const refreshToken = cookies.refreshToken

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401)
  }

  let decoded

  try {
    decoded = jwt.verify(refreshToken, env.refreshTokenSecret)
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const user = await userModel.findById(decoded.userId).select('+refreshToken')

  if (!user || !user.refreshToken) {
    throw new AppError('Refresh token is invalid', 401)
  }

  if (user.refreshToken !== hashToken(refreshToken)) {
    throw new AppError('Refresh token does not match', 401)
  }

  await issueAuthTokens(user, res)

  return {
    statusCode: 200,
    body: {
      message: 'Access token refreshed successfully',
      ...buildAuthResponse(user)
    }
  }
}

const logoutUser = async ({ cookies, body }, res) => {
  const refreshToken = cookies.refreshToken

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.refreshTokenSecret)
      const user = await userModel.findById(decoded.userId).select('+refreshToken')

      if (user) {
        user.refreshToken = null
        await user.save()
      }
    } catch (error) {
      // Clear cookies even when the refresh token is already invalid.
    }
  }

  clearAuthCookies(res)

  return {
    statusCode: 200,
    body: { message: 'Logged out successfully' }
  }
}

const uploadAvatar = async (currentUser, file) => {
  if (!currentUser?._id) {
    throw new AppError('Authenticated user not found', 401)
  }

  if (!file?.buffer) {
    throw new AppError('Avatar image is required', 400)
  }

  const user = await userModel.findById(currentUser._id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const uploadedAvatar = await uploadImageToCloudinary(file.buffer, {
    folder: 'final-project/avatars',
    publicId: `user-${user._id}-${Date.now()}`,
    overwrite: true,
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face'
      },
      {
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  })

  const previousAvatarPublicId = user.avatarPublicId

  user.avatar = uploadedAvatar.secure_url
  user.avatarPublicId = uploadedAvatar.public_id
  await user.save()

  if (
    previousAvatarPublicId &&
    previousAvatarPublicId !== uploadedAvatar.public_id
  ) {
    try {
      await deleteImageFromCloudinary(previousAvatarPublicId)
    } catch (error) {
      console.error('Previous avatar cleanup failed:', error)
    }
  }

  return {
    statusCode: 200,
    body: {
      message: 'Avatar uploaded successfully',
      user: buildUserResponse(user)
    }
  }
}


const updateUserProfile = async (user, body) => {
  try {
    if (!user) {
      return {
        statusCode: 404,
        body: {
          message: "User not found",
          success: false
        }
      };
    }

    const { name, email, password, mobile } = body;

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    if (password) user.password = password;
      if (email && email !== user.email) {
      const emailExists = await userModel.findOne({ email });
      if (emailExists) {
        return {
          statusCode: 422,
          body: {
            message: "Email already in use",
            success: false
          }
        };
      }
      user.pendingEmail = email;
      const otp = generateOtp();
      user.emailVerifyOtp = hashOtp(otp);
      user.emailVerifyOtpExpire = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
      await emailService.sendVerificationOtpEmail(
        email,
        user.name,
        otp,
        env.otpExpiryMinutes
      );
    }

    await user.save();

    return {
      statusCode: 200,
      body: {
        message: user.pendingEmail ? "Email verification OTP sent to your new email" : "Profile updated successfully",
        user: buildUserResponse(user),
        success: true
      }
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: "Failed to update profile",
        error: error.message,
        success: false
      }
    };
  }
};
const verifyNewEmail = async (user, body) => {
  const { otp } = body;

  if (!user || !user.pendingEmail) {
    return {
      statusCode: 400,
      body: {
        message: "No email change requested",
        success: false
      }
    };
  }

  if (
    user.emailVerifyOtp !== hashOtp(otp) ||
    user.emailVerifyOtpExpire < Date.now()
  ) {
    return {
      statusCode: 400,
      body: {
        message: "Invalid or expired OTP",
        success: false
      }
    };
  }

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailVerifyOtp = undefined;
  user.emailVerifyOtpExpire = undefined;

  await user.save();

  return {
    statusCode: 200,
    body: {
      message: "Email updated successfully",
      success: true
    }
  };
};

module.exports = {
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
