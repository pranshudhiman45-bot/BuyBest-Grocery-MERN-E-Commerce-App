const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'Address must belong to a user']
    },
    addresLine: {
      type: String,
      default: null,
      required: [true, 'Please provide address line']
    },
    street: {
      type: String,
      default: null
    },
    city: {
      type: String,
      default: null,
      required: [true, 'Please provide city']
    },
    state: {
      type: String,
      required: [true, 'Please provide state'],
      default: null
    },
    postalCode: {
      type: String,
      default: null,
      required: [true, 'Please provide postal code']
    },
    mobile: {
      type: Number,
      default: null,
      required: [true, 'Please provide mobile number']
    },
    country: {
      default: null,
      type: String
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

const addressModel = mongoose.model('address', addressSchema)

module.exports = addressModel
