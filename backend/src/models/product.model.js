const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    categoryLabel: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      default: null,
      min: 0
    },
    offer: {
      type: String,
      default: ''
    },
    badge: {
      type: String,
      default: ''
    },
    accent: {
      type: String,
      default: '#9CD56A'
    },
    imageLabel: {
      type: String,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      default: ''
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    maxPerOrder: {
      type: Number,
      default: null,
      min: 1
    },
    expirationDate: {
      type: Date,
      default: null
    },
    benefits: {
      type: [String],
      default: []
    },
    storage: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    relatedIds: {
      type: [String],
      default: []
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    publish: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)



const productModel = mongoose.model('product', productSchema)

module.exports = productModel
