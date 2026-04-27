const express = require('express')
const authController = require('../controllers/auth.controller.js')
const { authMiddleware } = require('../middlewares/auth.middleware.js')
const { avatarUpload } = require('../middlewares/upload.middleware.js')
const env = require('../config/env.js')

const router = express.Router()
const passport = require('passport')

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
router.post('/register', authController.registerUser)
router.get('/me', authMiddleware, authController.getCurrentUser)
router.post('/verify-otp', authController.verifyRegistrationOtp)
router.post('/resend-otp', authController.resendRegistrationOtp)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password/:token', authController.resetPassword)
router.post('/login', authController.loginUser)
router.post('/refresh-token', authController.refreshAccessToken)
router.post('/logout', authController.logoutUser)
router.post('/avatar', authMiddleware,avatarUpload.single('avatar'),authController.uploadAvatar)
router.put("/update-user", authMiddleware, authController.updateUserProfile);
router.post("/verify-new-email", authMiddleware, authController.verifyNewEmail);
module.exports = router
