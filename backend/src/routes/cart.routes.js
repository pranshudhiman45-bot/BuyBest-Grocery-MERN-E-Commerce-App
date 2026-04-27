const express = require('express')
const cartController = require('../controllers/cart.controller.js')
const { authMiddleware } = require('../middlewares/auth.middleware.js')

const router = express.Router()

router.use(authMiddleware)

router.get('/', cartController.getCart)
router.get('/count', cartController.getCartCount)
router.post('/items', cartController.addCartItem)
router.patch('/items/:productId', cartController.updateCartItem)
router.delete('/items/:productId', cartController.removeCartItem)
router.post('/checkout', cartController.checkoutCart)

module.exports = router
