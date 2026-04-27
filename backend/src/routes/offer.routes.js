const express = require('express')
const offerController = require('../controllers/offer.controller.js')

const router = express.Router()

router.get('/banks', offerController.getBankOffers)

module.exports = router
