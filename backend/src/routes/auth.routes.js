const express = require('express')
const authController = require('../controllers/auth.controller.js')
const { authMiddleware } = require('../middlewares/auth.middleware.js')
const { createRateLimit } = require('../middlewares/rate-limit.middleware.js')
const { avatarUpload } = require('../middlewares/upload.middleware.js')
const env = require('../config/env.js')

const router = express.Router()
const passport = require('passport')
const authRateLimit = createRateLimit({
  keyPrefix: 'auth',
  maxRequests: 8,
  message: 'Too many authentication attempts. Please wait a few minutes and try again.'
})

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.frontendUrl}/login?error=Google%20authentication%20failed`
  }),
  authController.googleAuthCallback
)
router.post('/register', authRateLimit, authController.registerUser)
router.get('/me', authMiddleware, authController.getCurrentUser)
router.post('/verify-otp', authRateLimit, authController.verifyRegistrationOtp)
router.post('/resend-otp', authRateLimit, authController.resendRegistrationOtp)
router.post('/forgot-password', authRateLimit, authController.forgotPassword)
router.post('/reset-password/:token', authRateLimit, authController.resetPassword)
router.post('/login', authRateLimit, authController.loginUser)
router.post('/refresh-token', authRateLimit, authController.refreshAccessToken)
router.post('/logout', authRateLimit, authController.logoutUser)
router.post('/avatar', authMiddleware,avatarUpload.single('avatar'),authController.uploadAvatar)
router.put("/update-user", authMiddleware, authController.updateUserProfile);
router.post("/verify-new-email", authMiddleware, authController.verifyNewEmail);
module.exports = router
