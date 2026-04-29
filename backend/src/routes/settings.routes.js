const express = require('express')

const settingsController = require('../controllers/settings.controller.js')
const {
  authMiddleware,
  requireRole
} = require('../middlewares/auth.middleware.js')
const { USER_ROLES } = require('../constants/auth.constants.js')

const router = express.Router()

router.get('/', settingsController.getPublicSettings)
router.put(
  '/',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  settingsController.updateSettings
)

module.exports = router
