const Stripe = require('stripe')

const env = require('../config/env.js')
const AppError = require('../utils/app-error.js')
const cartModel = require('../models/cart.model.js')
const productModel = require('../models/product.model.js')
const orderModel = require('../models/order.model.js')
const userModel = require('../models/user.model.js')
const addressModel = require('../models/address.model.js')
const couponModel = require('../models/coupon.model.js')
const { mapProductToStorefront } = require('./product.service.js')
const {
  getOrCreateSettings,
  DEFAULT_TAX_PERCENTAGE
} = require('../controllers/settings.controller.js')

const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 300
const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null

const normalizeStock = (stock) => {
  const parsedStock = Number(stock)

  if (!Number.isFinite(parsedStock)) {
    return 0
  }

  return Math.max(0, parsedStock)
}

const normalizeMaxPerOrder = (maxPerOrder) => {
  const parsedLimit = Number(maxPerOrder)

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return null
  }

  return Math.floor(parsedLimit)
}

const assertQuantityAvailable = (product, requestedQuantity) => {
  const availableStock = normalizeStock(product?.stock)
  const maxPerOrder = normalizeMaxPerOrder(product?.maxPerOrder)

  if (availableStock <= 0) {
    throw new AppError('This item is out of stock', 409)
  }

  if (requestedQuantity > availableStock) {
    throw new AppError(`Only ${availableStock} item(s) available in stock`, 409)
  }

  if (maxPerOrder !== null && requestedQuantity > maxPerOrder) {
    throw new AppError(`You can buy up to ${maxPerOrder} item(s) of this product per order`, 409)
  }

  return availableStock
}

const getTaxRate = async () => {
  const settings = await getOrCreateSettings()
  const taxPercentage = Number(settings.taxPercentage ?? DEFAULT_TAX_PERCENTAGE)

  if (!Number.isFinite(taxPercentage) || taxPercentage < 0) {
    return DEFAULT_TAX_PERCENTAGE / 100
  }

  return taxPercentage / 100
}

const calculateCartSummary = async (items) => {
  const taxRate = await getTaxRate()
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee =
    subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const tax = Number((subtotal * taxRate).toFixed(2))
  const total = Number((subtotal + deliveryFee + tax).toFixed(2))
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee,
    tax,
    total,
    itemCount
  }
}

const mapCartItem = (item, stock = 0, maxPerOrder = null) => ({
  id: item._id,
  productId: item.productSlug,
  name: item.name,
  brand: item.brand,
  category: item.category,
  size: item.sizeLabel,
  imageLabel: item.imageLabel,
  imageUrl: item.imageUrl,
  accent: item.accent,
  quantity: item.quantity,
  price: item.price,
  totalPrice: item.totalPrice,
  stock,
  maxPerOrder
})

const formatAddressResponse = (address) => ({
  id: address._id.toString(),
  addressLine: address.addresLine,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  mobile: address.mobile != null ? String(address.mobile) : '',
  country: address.country
})

const buildOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`

const toPaise = (amount) => Math.max(0, Math.round(Number(amount || 0) * 100))

const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new AppError('Stripe is not configured on the server', 500)
  }

  return stripe
}

const resolveSelectedAddress = async (user, addressId) => {
  const resolvedAddressId = addressId || user.addresDetails

  if (!resolvedAddressId) {
    throw new AppError('Please add a delivery address before placing your order', 400)
  }

  const selectedAddress = await addressModel.findOne({
    _id: resolvedAddressId,
    user: user._id
  })

  if (!selectedAddress) {
    throw new AppError('Selected delivery address was not found', 404)
  }

  return selectedAddress
}

const resolveAppliedCoupon = async (couponCode, cartTotal) => {
  const normalizedCouponCode = String(couponCode || '').trim().toUpperCase()

  if (!normalizedCouponCode) {
    return {
      coupon: null,
      couponDiscount: 0
    }
  }

  const coupon = await couponModel.findOne({
    code: normalizedCouponCode,
    isActive: true
  })

  if (!coupon) {
    throw new AppError('That coupon is not available right now', 400)
  }

  if (cartTotal < coupon.minimumOrderValue) {
    throw new AppError(
      `Coupon ${coupon.code} requires a minimum order of Rs. ${coupon.minimumOrderValue}`,
      400
    )
  }

  let couponDiscount = 0

  if (coupon.discountType === 'percentage') {
    const percentageDiscount = (cartTotal * coupon.value) / 100
    couponDiscount =
      typeof coupon.maxDiscount === 'number'
        ? Math.min(percentageDiscount, coupon.maxDiscount)
        : percentageDiscount
  } else {
    couponDiscount = Math.min(coupon.value, cartTotal)
  }

  return {
    coupon,
    couponDiscount: Number(couponDiscount.toFixed(2))
  }
}

const buildCheckoutContext = async (user, { addressId, couponCode } = {}) => {
  const cartItems = await cartModel.find({ userId: user._id }).sort({ createdAt: -1 })

  if (cartItems.length === 0) {
    throw new AppError('Your cart is empty', 400)
  }

  const selectedAddress = await resolveSelectedAddress(user, addressId)
  const checkoutItems = []

  for (const cartItem of cartItems) {
    const productDocument = await productModel.findOne({ slug: cartItem.productSlug })
    const product = productDocument ? mapProductToStorefront(productDocument) : null

    if (!product || !productDocument) {
      throw new AppError(`Product ${cartItem.productSlug} is no longer available`, 404)
    }

    assertQuantityAvailable(product, cartItem.quantity)

    checkoutItems.push({
      cartItem,
      productDocument,
      snapshot: mapCartItem(
        cartItem,
        normalizeStock(product.stock),
        normalizeMaxPerOrder(product.maxPerOrder)
      )
    })
  }

  const purchasedItems = checkoutItems.map((item) => item.snapshot)
  const summary = await calculateCartSummary(purchasedItems)
  const { coupon, couponDiscount } = await resolveAppliedCoupon(couponCode, summary.total)
  const payableTotal = Number(Math.max(summary.total - couponDiscount, 0).toFixed(2))

  return {
    cartItems,
    checkoutItems,
    purchasedItems,
    selectedAddress,
    summary,
    coupon,
    couponDiscount,
    payableTotal
  }
}

const createOrderRecords = async ({
  userId,
  selectedAddress,
  checkoutItems,
  paymentId = null,
  paymentMethod,
  paymentStatus,
  couponCode = null
}) => {
  const orders = []

  for (const item of checkoutItems) {
    const orderRecord = await orderModel.create({
      userId,
      orderId: buildOrderId(),
      productId: item.productDocument._id,
      productSlug: item.productDocument.slug,
      productDetails: {
        _id: item.productDocument._id.toString(),
        name: item.productDocument.name,
        image: item.productDocument.images || []
      },
      quantity: item.cartItem.quantity,
      paymentId,
      paymentMethod,
      paymentStatus,
      couponCode,
      deliveryAddress: selectedAddress._id,
      subToatl: Number((item.cartItem.price * item.cartItem.quantity).toFixed(2)),
      total: item.cartItem.totalPrice
    })

    orders.push(orderRecord)
  }

  return orders
}

const attachOrdersToUserHistory = async (userId, orders) => {
  if (!orders.length) {
    return
  }

  const userDoc = await userModel.findById(userId)

  if (!userDoc) {
    return
  }

  const existingOrderIds = new Set(
    (userDoc.orderHistory || []).map((entry) => entry.toString())
  )
  const nextOrders = orders.filter(
    (order) => !existingOrderIds.has(order._id.toString())
  )

  if (nextOrders.length === 0) {
    return
  }

  userDoc.orderHistory = [
    ...(userDoc.orderHistory || []),
    ...nextOrders.map((order) => order._id)
  ]
  await userDoc.save()
}

const placeCashOnDeliveryOrder = async (user, { addressId, couponCode, paymentMethod }) => {
  const context = await buildCheckoutContext(user, { addressId, couponCode })

  for (const item of context.checkoutItems) {
    item.productDocument.stock =
      normalizeStock(item.productDocument.stock) - item.cartItem.quantity
    await item.productDocument.save()
  }

  const orders = await createOrderRecords({
    userId: user._id,
    selectedAddress: context.selectedAddress,
    checkoutItems: context.checkoutItems,
    paymentMethod,
    paymentStatus: 'pending',
    couponCode: context.coupon?.code || null
  })

  await attachOrdersToUserHistory(user._id, orders)
  await cartModel.deleteMany({ userId: user._id })

  return {
    message: 'Order placed successfully',
    paymentMethod,
    address: formatAddressResponse(context.selectedAddress),
    summary: {
      ...context.summary,
      total: context.payableTotal
    },
    couponCode: context.coupon?.code || null,
    couponDiscount: context.couponDiscount,
    items: context.purchasedItems
  }
}

const buildStripeLineItems = ({ purchasedItems, summary, payableTotal, coupon, couponDiscount }) => {
  if (couponDiscount > 0) {
    const description = `${summary.itemCount} item(s)${coupon ? ` - Coupon ${coupon.code}` : ''}`

    return [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Fresh Mart Order',
            description
          },
          unit_amount: toPaise(payableTotal)
        },
        quantity: 1
      }
    ]
  }

  const lineItems = purchasedItems.map((item) => ({
    price_data: {
      currency: 'inr',
      product_data: {
        name: item.name
      },
      unit_amount: toPaise(item.price)
    },
    quantity: item.quantity
  }))

  if (summary.deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'inr',
        product_data: {
          name: 'Delivery Fee'
        },
        unit_amount: toPaise(summary.deliveryFee)
      },
      quantity: 1
    })
  }

  if (summary.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'inr',
        product_data: {
          name: 'Tax'
        },
        unit_amount: toPaise(summary.tax)
      },
      quantity: 1
    })
  }

  return lineItems
}

const createStripeCheckoutSession = async (
  user,
  { addressId, couponCode, paymentMethod = 'credit_card' } = {}
) => {
  const stripeClient = ensureStripeConfigured()
  const context = await buildCheckoutContext(user, { addressId, couponCode })

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: paymentMethod === 'upi' ? ['upi'] : ['card'],
    line_items: buildStripeLineItems(context),
    success_url: `${env.frontendUrl.replace(/\/$/, '')}/checkout?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl.replace(/\/$/, '')}/checkout?stripe=cancelled`,
    customer_email: user.email,
    metadata: {
      userId: user._id.toString(),
      addressId: context.selectedAddress._id.toString(),
      paymentMethod,
      couponCode: context.coupon?.code || '',
      payableTotal: context.payableTotal.toFixed(2)
    }
  })

  await createOrderRecords({
    userId: user._id,
    selectedAddress: context.selectedAddress,
    checkoutItems: context.checkoutItems,
    paymentId: session.id,
    paymentMethod,
    paymentStatus: 'pending',
    couponCode: context.coupon?.code || null
  })

  return {
    sessionId: session.id,
    url: session.url
  }
}

const finalizeStripeSessionOrders = async (sessionId) => {
  const orders = await orderModel.find({ paymentId: sessionId }).sort({ createdAt: 1 })

  if (orders.length === 0) {
    throw new AppError('No pending order found for this Stripe session', 404)
  }

  const pendingOrders = orders.filter((order) => order.paymentStatus !== 'completed')

  if (pendingOrders.length === 0) {
    return orders
  }

  for (const order of pendingOrders) {
    const quantity = Math.max(1, Number(order.quantity) || 1)
    const productDocument = await productModel.findById(order.productId)

    if (!productDocument) {
      order.paymentStatus = 'failed'
      await order.save()
      throw new AppError(`Product for order ${order.orderId} is no longer available`, 409)
    }

    const availableStock = normalizeStock(productDocument.stock)

    if (availableStock < quantity) {
      order.paymentStatus = 'failed'
      await order.save()
      throw new AppError(`Not enough stock available to finalize order ${order.orderId}`, 409)
    }

    productDocument.stock = availableStock - quantity
    await productDocument.save()

    order.paymentStatus = 'completed'
    await order.save()
  }

  await attachOrdersToUserHistory(orders[0].userId, orders)

  const productSlugs = orders
    .map((order) => order.productSlug)
    .filter(Boolean)

  if (productSlugs.length > 0) {
    await cartModel.deleteMany({
      userId: orders[0].userId,
      productSlug: { $in: productSlugs }
    })
  }

  return orderModel.find({ paymentId: sessionId }).sort({ createdAt: 1 })
}

const markStripeSessionOrdersFailed = async (sessionId) => {
  await orderModel.updateMany(
    {
      paymentId: sessionId,
      paymentStatus: 'pending'
    },
    {
      paymentStatus: 'failed'
    }
  )
}

const getStripeSessionStatus = async (sessionId) => {
  const stripeClient = ensureStripeConfigured()
  return stripeClient.checkout.sessions.retrieve(sessionId)
}

module.exports = {
  stripe,
  ensureStripeConfigured,
  normalizeStock,
  normalizeMaxPerOrder,
  assertQuantityAvailable,
  calculateCartSummary,
  mapCartItem,
  buildCheckoutContext,
  formatAddressResponse,
  placeCashOnDeliveryOrder,
  createStripeCheckoutSession,
  finalizeStripeSessionOrders,
  markStripeSessionOrdersFailed,
  getStripeSessionStatus
}
