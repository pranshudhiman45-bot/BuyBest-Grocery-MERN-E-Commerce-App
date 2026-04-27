const asyncHandler = require('../utils/async-handler.js')
const { listBankOffers } = require('../services/offer.service.js')

const getBankOffers = asyncHandler(async (_req, res) => {
  const offers = await listBankOffers()
  res.status(200).json({ offers })
})

module.exports = {
  getBankOffers
}
