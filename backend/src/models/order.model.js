const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'user'
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true
    },
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: 'product'
    },
    productSlug: {
      type: String,
      default: null
    },

    productDetails: {
      _id: String,
      name: String,
      image: Array
    },
    quantity: {
      type: Number,
      default: 1
    },
    paymentId: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    },
    couponCode: {
      type: String,
      default: null
    },
    deliveryAddress: {
      type: mongoose.Schema.ObjectId,
      ref: 'address'
    },
    subToatl: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    invoice: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
)

const orderModel = mongoose.model('order', orderSchema)

module.exports = orderModel
