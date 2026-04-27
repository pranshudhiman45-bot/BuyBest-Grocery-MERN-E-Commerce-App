const express = require('express')
const productController = require('../controllers/product.controller.js')
const { imageUpload } = require('../middlewares/upload.middleware.js')
const {
  authMiddleware,
  requireRole
} = require('../middlewares/auth.middleware.js')
const { USER_ROLES } = require('../constants/auth.constants.js')

const router = express.Router()

router.get('/', productController.listProducts)
router.get('/search', productController.searchProducts)
router.get(
  '/admin/inventory-alerts',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  productController.getInventoryAlerts
)
router.post(
  '/upload-image',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  imageUpload.single('image'),
  productController.uploadProductImageAsset
)
router.post('/', authMiddleware, requireRole(USER_ROLES.ADMIN), productController.createProduct)
router.put('/:productId', authMiddleware, requireRole(USER_ROLES.ADMIN), productController.updateProduct)
router.delete('/:productId', authMiddleware, requireRole(USER_ROLES.ADMIN), productController.deleteProduct)
router.get('/:productId', productController.getProductById)

module.exports = router
