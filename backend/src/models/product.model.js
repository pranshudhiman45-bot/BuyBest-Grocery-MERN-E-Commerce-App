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
    subcategory: {
      type: String,
      default: '',
      trim: true
    },
    size: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 0.01
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
    imageFit: {
      type: String,
      enum: ['cover', 'contain'],
      default: 'cover'
    },
    description: {
      type: String,
      default: ''
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number'
      }
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
    featured: {
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

productSchema.index({ category: 1, publish: 1 })
productSchema.index({ name: 'text', brand: 'text', categoryLabel: 'text', subcategory: 'text', tags: 'text' })

const productModel = mongoose.model('product', productSchema)

module.exports = productModel
