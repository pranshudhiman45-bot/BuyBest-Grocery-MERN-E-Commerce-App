const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const appSettingsModel = require('../models/app-settings.model.js')

const DEFAULT_TAX_PERCENTAGE = 5

const getOrCreateSettings = async () => {
  let settings = await appSettingsModel.findOne({ key: 'default' })

  if (!settings) {
    settings = await appSettingsModel.create({
      key: 'default',
      taxPercentage: DEFAULT_TAX_PERCENTAGE
    })
  }

  return settings
}

const normalizeSettingsResponse = (settings) => ({
  taxPercentage: Number(settings.taxPercentage ?? DEFAULT_TAX_PERCENTAGE)
})

const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreateSettings()
  res.status(200).json(normalizeSettingsResponse(settings))
})

const updateSettings = asyncHandler(async (req, res) => {
  const nextTaxPercentage = Number(req.body.taxPercentage)

  if (!Number.isFinite(nextTaxPercentage) || nextTaxPercentage < 0 || nextTaxPercentage > 100) {
    throw new AppError('Tax percentage must be a number between 0 and 100', 400)
  }

  const settings = await getOrCreateSettings()
  settings.taxPercentage = Number(nextTaxPercentage.toFixed(2))
  await settings.save()

  res.status(200).json({
    message: 'Store settings updated successfully',
    settings: normalizeSettingsResponse(settings)
  })
})

module.exports = {
  DEFAULT_TAX_PERCENTAGE,
  getOrCreateSettings,
  normalizeSettingsResponse,
  getPublicSettings,
  updateSettings
}
