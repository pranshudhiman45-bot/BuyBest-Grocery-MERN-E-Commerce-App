const crypto = require('crypto')
const http = require('http')
const mongoose = require('mongoose')

require('../src/config/passport.js')

const connectDB = require('../src/config/db.js')
const app = require('../src/app.js')
const userModel = require('../src/models/user.model.js')
const addressModel = require('../src/models/address.model.js')
const cartModel = require('../src/models/cart.model.js')
const orderModel = require('../src/models/order.model.js')
const productModel = require('../src/models/product.model.js')

if (!process.argv.includes('--run')) {
  console.log('This check creates temporary database records. Re-run with --run to execute it.')
  process.exit(0)
}

const run = async () => {
  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`
  const testEmail = `buybest.e2e.${Date.now()}@example.com`
  const testPassword = `E2e-${crypto.randomBytes(12).toString('hex')}`
  let testUser = null
  let accessToken = ''

  const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers
      }
    })
    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${body.message || 'Unknown error'}`)
    }

    return body
  }

  try {
    testUser = await userModel.create({
      name: 'Buy Best Flow Check',
      email: testEmail,
      password: testPassword,
      isVerified: true
    })

    const catalogResponse = await request('/api/products')
    const product = catalogResponse.products.find((entry) => entry.stock >= 2 && entry.publish !== false)
    if (!product) {
      throw new Error('No catalog product has enough stock for the flow check')
    }

    const initialProduct = await productModel.findOne({ slug: product.id }).lean()

    const loginResponse = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword })
    })
    accessToken = loginResponse.accessToken
    if (!accessToken) {
      throw new Error('Login response did not include an access token')
    }

    const meResponse = await request('/api/auth/me')
    if (meResponse.user.email !== testEmail) {
      throw new Error('Authenticated account does not match the temporary flow-check user')
    }

    const addressResponse = await request('/api/addresses', {
      method: 'POST',
      body: JSON.stringify({
        addressLine: 'Temporary flow-check address',
        street: 'Phase 1',
        city: 'Mohali',
        state: 'Punjab',
        postalCode: '160055',
        mobile: '9876543210',
        country: 'India',
        setAsDefault: true
      })
    })
    const addressId = addressResponse.selectedAddressId
    if (!addressId) {
      throw new Error('Address creation did not select the saved address')
    }

    await request('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity: 1 })
    })
    const updatedCart = await request(`/api/cart/items/${product.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 2 })
    })
    if (updatedCart.summary.itemCount !== 2) {
      throw new Error('Cart quantity update was not persisted')
    }

    const checkoutResponse = await request('/api/cart/checkout', {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'cash_on_delivery',
        addressId
      })
    })
    if (!checkoutResponse.orderId) {
      throw new Error('COD checkout did not return a stored order ID')
    }

    const ordersResponse = await request('/api/orders')
    const storedOrder = ordersResponse.orders.find((order) => order.orderId === checkoutResponse.orderId)
    if (!storedOrder || storedOrder.orderStatus !== 'placed' || storedOrder.items[0]?.quantity !== 2) {
      throw new Error('Placed order was not returned correctly from order history')
    }

    const detailResponse = await request(`/api/orders/${checkoutResponse.orderId}`)
    if (detailResponse.order.deliveryAddress?.postalCode !== '160055') {
      throw new Error('Order detail did not retain the selected delivery address')
    }

    const cancelledResponse = await request(`/api/orders/${checkoutResponse.orderId}/cancel`, {
      method: 'PATCH'
    })
    if (cancelledResponse.order.orderStatus !== 'cancelled') {
      throw new Error('Order cancellation was not persisted')
    }

    const finalProduct = await productModel.findOne({ slug: product.id }).lean()
    if (finalProduct.stock !== initialProduct.stock) {
      throw new Error('Inventory was not restored after cancelling the temporary order')
    }

    console.log(JSON.stringify({
      status: 'passed',
      checks: [
        'catalog',
        'login',
        'authenticated account',
        'address creation and selection',
        'cart add and quantity update',
        'server-priced COD checkout',
        'order history and detail',
        'stored cancellation status',
        'inventory restoration'
      ]
    }, null, 2))
  } finally {
    if (testUser?._id) {
      const uncancelledOrders = await orderModel.find({
        userId: testUser._id,
        orderStatus: { $ne: 'cancelled' }
      }).lean()

      for (const order of uncancelledOrders) {
        const inventoryWasReserved =
          order.paymentMethod === 'cash_on_delivery' || order.paymentStatus === 'completed'
        if (inventoryWasReserved) {
          const items = order.items?.length
            ? order.items
            : [{ productId: order.productId, quantity: order.quantity }]
          await Promise.all(items.filter((item) => item.productId).map((item) =>
            productModel.updateOne(
              { _id: item.productId },
              { $inc: { stock: Math.max(1, Number(item.quantity) || 1) } }
            )
          ))
        }
      }

      await Promise.all([
        orderModel.deleteMany({ userId: testUser._id }),
        cartModel.deleteMany({ userId: testUser._id }),
        addressModel.deleteMany({ user: testUser._id }),
        userModel.deleteOne({ _id: testUser._id })
      ])
    }

    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
