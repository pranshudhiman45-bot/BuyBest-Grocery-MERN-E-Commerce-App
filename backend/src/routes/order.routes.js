const express = require('express')

const orderController = require('../controllers/order.controller.js')
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware.js')

const router = express.Router()

router.use(authMiddleware)
router.get('/admin', requireRole('admin'), orderController.listAdminOrders)
router.patch('/admin/:orderId/status', requireRole('admin'), orderController.updateOrderStatus)
router.get('/', orderController.listOrders)
router.get('/:orderId', orderController.getOrder)
router.patch('/:orderId/cancel', orderController.cancelOrder)

module.exports = router
