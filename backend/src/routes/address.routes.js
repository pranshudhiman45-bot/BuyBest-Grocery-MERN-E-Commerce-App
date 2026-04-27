const express = require('express')
const addressController = require('../controllers/address.controller.js')
const { authMiddleware } = require('../middlewares/auth.middleware.js')

const router = express.Router()

router.use(authMiddleware)

router.get('/', addressController.getAddresses)
router.post('/', addressController.createAddress)
router.put('/:addressId', addressController.updateAddress)
router.delete('/:addressId', addressController.deleteAddress)
router.patch('/:addressId/select', addressController.selectAddress)

module.exports = router
