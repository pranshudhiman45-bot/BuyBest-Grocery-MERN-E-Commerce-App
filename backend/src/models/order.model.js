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
      brand: String,
      size: String,
      price: Number,
      image: Array
    },
    items: [{
      productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product'
      },
      productSlug: String,
      name: String,
      brand: String,
      size: String,
      image: String,
      quantity: Number,
      unitPrice: Number,
      lineTotal: Number
    }],
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
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed'
    },
    inventoryReserved: {
      type: Boolean,
      default: false
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
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    tax: {
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

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1, createdAt: -1 })

const orderModel = mongoose.model('order', orderSchema)

module.exports = orderModel
