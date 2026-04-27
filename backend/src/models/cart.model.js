const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
        default: null},
        productSlug: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            default: null
        },
        category: {
            type: String,
            default: null
        },
        sizeLabel: {
            type: String,
            default: null
        },
        imageLabel: {
            type: String,
            default: null
        },
        imageUrl: {
            type: String,
            default: null
        },
        accent: {
            type: String,
            default: null
        },
        quantity: {
            type: Number,
            default: 1
        },
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'user' },
        price: {
            type: Number,
            default: 0
        },
        totalPrice: {
            type: Number,
            default: 0
        }
}, {timestamps: true})

cartSchema.index({ userId: 1, productSlug: 1 }, { unique: true })

const cartModel = mongoose.model('cart', cartSchema)

module.exports = cartModel      
