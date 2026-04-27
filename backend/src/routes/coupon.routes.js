const express = require('express')
const couponController = require('../controllers/coupon.controller.js')
const {
  authMiddleware,
  requireRole
} = require('../middlewares/auth.middleware.js')
const { USER_ROLES } = require('../constants/auth.constants.js')

const router = express.Router()

router.get('/', couponController.listCoupons)
router.get(
  '/admin',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  couponController.listAdminCoupons
)
router.post(
  '/',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  couponController.createCoupon
)
router.put(
  '/:couponId',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  couponController.updateCoupon
)
router.delete(
  '/:couponId',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  couponController.deleteCoupon
)

module.exports = router
