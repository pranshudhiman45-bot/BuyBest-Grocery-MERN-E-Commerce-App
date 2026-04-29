const express = require('express')
const authController = require('../controllers/auth.controller.js')
const { authMiddleware } = require('../middlewares/auth.middleware.js')
const { createRateLimit } = require('../middlewares/rate-limit.middleware.js')
const { avatarUpload } = require('../middlewares/upload.middleware.js')

const router = express.Router()
const authRateLimit = createRateLimit({
  keyPrefix: 'auth',
  maxRequests: 8,
  message: 'Too many authentication attempts. Please wait a few minutes and try again.'
})

router.get('/google', authController.startGoogleAuth)
router.get('/google/callback', authController.completeGoogleAuth, authController.googleAuthCallback)
router.get('/google/failure', authController.googleAuthFailure)
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
