const express = require('express')
const supportController = require('../controllers/support.controller.js')
const {
  authMiddleware,
  requireRole
} = require('../middlewares/auth.middleware.js')
const { USER_ROLES } = require('../constants/auth.constants.js')

const router = express.Router()

// User routes
router.post('/', authMiddleware, supportController.createTicket)
router.get('/my-tickets', authMiddleware, supportController.getUserTickets)

// Support Role routes
router.get('/all', authMiddleware, requireRole(USER_ROLES.SUPPORT), supportController.getAllTickets)
router.patch('/:id/close', authMiddleware, requireRole(USER_ROLES.SUPPORT), supportController.closeTicket)

// Get single ticket (User or Support)
router.get('/:id', authMiddleware, supportController.getTicket)

module.exports = router
