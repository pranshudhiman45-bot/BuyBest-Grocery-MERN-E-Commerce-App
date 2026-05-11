const mongoose = require('mongoose')

const env = require('../src/config/env.js')
const userModel = require('../src/models/user.model.js')
const addressModel = require('../src/models/address.model.js')
const productModel = require('../src/models/product.model.js')
const cartModel = require('../src/models/cart.model.js')
const orderModel = require('../src/models/order.model.js')
const { finalizeStripeSessionOrders } = require('../src/services/checkout.service.js')

const run = async () => {
  const runId = `stripe-flow-${Date.now()}`
  const sessionId = `cs_test_${runId}`
  const createdIds = {
    users: [],
    addresses: [],
    products: [],
    carts: [],
    orders: []
  }

  const cleanup = async () => {
    await Promise.all([
      userModel.deleteMany({ _id: { $in: createdIds.users } }),
      addressModel.deleteMany({ _id: { $in: createdIds.addresses } }),
      productModel.deleteMany({ _id: { $in: createdIds.products } }),
      cartModel.deleteMany({ _id: { $in: createdIds.carts } }),
      orderModel.deleteMany({ _id: { $in: createdIds.orders } })
    ])
  }

  try {
    await mongoose.connect(env.mongoUri)

    const user = await userModel.create({
      name: 'Stripe Flow Check',
      email: `${runId}@example.com`,
      authProvider: 'google',
      googleId: runId,
      isVerified: true
    })
    createdIds.users.push(user._id)

    const address = await addressModel.create({
      user: user._id,
      addresLine: 'Stripe test address',
      city: 'Test City',
      state: 'Test State',
      postalCode: '123456',
      mobile: 9999999999,
      country: 'India'
    })
    createdIds.addresses.push(address._id)

    const product = await productModel.create({
      slug: runId,
      name: 'Stripe Flow Test Product',
      category: 'test',
      categoryLabel: 'Test',
      price: 100,
      stock: 7
    })
    createdIds.products.push(product._id)

    const cart = await cartModel.create({
      productId: product._id,
      productSlug: product.slug,
      name: product.name,
      category: product.category,
      quantity: 2,
      userId: user._id,
      price: 100,
      totalPrice: 200
    })
    createdIds.carts.push(cart._id)

    const order = await orderModel.create({
      userId: user._id,
      orderId: `ORD-${runId}`,
      productId: product._id,
      productSlug: product.slug,
      productDetails: {
        _id: product._id.toString(),
        name: product.name,
        image: []
      },
      quantity: cart.quantity,
      paymentId: sessionId,
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      deliveryAddress: address._id,
      subToatl: 200,
      total: 200
    })
    createdIds.orders.push(order._id)

    await finalizeStripeSessionOrders(sessionId)

    const [updatedOrder, updatedProduct, remainingCartItems, updatedUser] =
      await Promise.all([
        orderModel.findById(order._id),
        productModel.findById(product._id),
        cartModel.find({ userId: user._id }),
        userModel.findById(user._id)
      ])

    const orderCompleted = updatedOrder?.paymentStatus === 'completed'
    const stockDecremented = updatedProduct?.stock === 5
    const cartCleared = remainingCartItems.length === 0
    const orderAttachedToUser = (updatedUser?.orderHistory || []).some(
      (orderId) => orderId.toString() === order._id.toString()
    )

    if (!orderCompleted || !stockDecremented || !cartCleared || !orderAttachedToUser) {
      throw new Error(
        [
          `orderCompleted=${orderCompleted}`,
          `stockDecremented=${stockDecremented}`,
          `cartCleared=${cartCleared}`,
          `orderAttachedToUser=${orderAttachedToUser}`
        ].join(', ')
      )
    }

    console.log('Stripe payment finalization flow is working.')
    console.log('Verified: order completed, stock updated, cart cleared, order history updated.')
  } finally {
    await cleanup()
    await mongoose.disconnect()
  }
}

run().catch((error) => {
  console.error(`Stripe payment finalization flow failed: ${error.message}`)
  process.exit(1)
})
