const express = require('express')
const catagoryController = require('../controllers/catagory.controller.js')
const {
  authMiddleware,
  requireRole
} = require('../middlewares/auth.middleware.js')
const { USER_ROLES } = require('../constants/auth.constants.js')

const router = express.Router()

router.get('/', catagoryController.getCatagories)
router.post('/', authMiddleware, requireRole(USER_ROLES.ADMIN), catagoryController.createCatagory)
router.put('/:catagoryId', authMiddleware, requireRole(USER_ROLES.ADMIN), catagoryController.updateCatagory)
router.delete('/:catagoryId', authMiddleware, requireRole(USER_ROLES.ADMIN), catagoryController.deleteCatagory)

module.exports = router
