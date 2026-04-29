const mongoose = require('mongoose')

const appSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default'
    },
    taxPercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
)

const appSettingsModel = mongoose.model('appSettings', appSettingsSchema)

module.exports = appSettingsModel
