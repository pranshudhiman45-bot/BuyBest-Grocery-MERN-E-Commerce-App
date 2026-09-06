const mongoose = require('mongoose')

const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const orderModel = require('../models/order.model.js')
const productModel = require('../models/product.model.js')

const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled'
]

const allowedTransitions = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
}

const getStoredOrderStatus = (order) => {
  if (order.orderStatus) {
    return order.orderStatus
  }

  if (order.paymentStatus === 'failed') {
    return 'cancelled'
  }

  return order.paymentStatus === 'completed' ? 'confirmed' : 'placed'
}

const getOrderItems = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item) => ({
      productId: item.productSlug || item.productId?.toString() || null,
      name: item.name || 'Product',
      brand: item.brand || '',
      size: item.size || '',
      image: item.image || null,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      lineTotal: Number(item.lineTotal) || 0
    }))
  }

  return [{
    productId: order.productSlug || order.productId?.toString() || null,
    name: order.productDetails?.name || 'Product',
    brand: order.productDetails?.brand || '',
    size: order.productDetails?.size || '',
    image: Array.isArray(order.productDetails?.image)
      ? order.productDetails.image[0] || null
      : null,
    quantity: Number(order.quantity) || 1,
    unitPrice: Number(order.productDetails?.price) || Number(order.subToatl) || 0,
    lineTotal: Number(order.total) || 0
  }]
}

const formatOrder = (order) => ({
  id: order._id.toString(),
  orderId: order.orderId,
  items: getOrderItems(order),
  subtotal: Number(order.subtotal ?? order.subToatl ?? order.total) || 0,
  discount: Number(order.discount) || 0,
  deliveryFee: Number(order.deliveryFee) || 0,
  tax: Number(order.tax) || 0,
  total: Number(order.total) || 0,
  couponCode: order.couponCode || null,
  paymentMethod: order.paymentMethod || null,
  paymentStatus: order.paymentStatus || 'pending',
  orderStatus: getStoredOrderStatus(order),
  deliveryAddress:
    order.deliveryAddress && typeof order.deliveryAddress === 'object'
      ? {
          addressLine: order.deliveryAddress.addresLine,
          street: order.deliveryAddress.street,
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
          postalCode: order.deliveryAddress.postalCode,
          mobile: order.deliveryAddress.mobile != null ? String(order.deliveryAddress.mobile) : ''
        }
      : null,
  customer:
    order.userId && typeof order.userId === 'object' && order.userId.email
      ? {
          id: order.userId._id.toString(),
          name: order.userId.name,
          email: order.userId.email
        }
      : undefined,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
})

const findOwnedOrder = async (orderId, userId) => {
  const identifierQuery = mongoose.isValidObjectId(orderId)
    ? { $or: [{ orderId }, { _id: orderId }] }
    : { orderId }

  return orderModel.findOne({
    ...identifierQuery,
    userId
  }).populate('deliveryAddress')
}

const restoreOrderInventory = async (order) => {
  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [{ productId: order.productId, quantity: order.quantity }]

  await Promise.all(items
    .filter((item) => item.productId)
    .map((item) => productModel.updateOne(
      { _id: item.productId },
      { $inc: { stock: Math.max(1, Number(item.quantity) || 1) } }
    )))
}

const claimStatusTransition = async (order, nextStatus) => {
  const currentStatus = getStoredOrderStatus(order)
  const updates = { orderStatus: nextStatus }

  if (nextStatus === 'cancelled' && order.paymentStatus === 'pending') {
    updates.paymentStatus = 'failed'
  }

  if (nextStatus === 'cancelled') {
    updates.inventoryReserved = false
  }

  return orderModel.findOneAndUpdate(
    { _id: order._id, orderStatus: currentStatus },
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  )
}

const listOrders = asyncHandler(async (req, res) => {
  const orders = await orderModel
    .find({
      userId: req.user._id,
      $or: [
        { paymentMethod: 'cash_on_delivery' },
        { paymentStatus: 'completed' }
      ]
    })
    .populate('deliveryAddress')
    .sort({ createdAt: -1 })
    .limit(100)

  res.status(200).json({ orders: orders.map(formatOrder) })
})

const getOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.orderId, req.user._id)

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  res.status(200).json({ order: formatOrder(order) })
})

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.orderId, req.user._id)

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  const status = getStoredOrderStatus(order)
  if (status !== 'placed') {
    throw new AppError('Only newly placed orders can be cancelled from your account', 409)
  }

  if (order.paymentMethod !== 'cash_on_delivery' && order.paymentStatus !== 'completed') {
    throw new AppError('Pending online checkout must be cancelled from the Stripe checkout screen', 409)
  }

  const claimedOrder = await claimStatusTransition(order, 'cancelled')
  if (!claimedOrder) {
    throw new AppError('This order status changed. Refresh the order and try again.', 409)
  }

  const inventoryWasReserved = Boolean(order.inventoryReserved)

  try {
    if (inventoryWasReserved) {
      await restoreOrderInventory(claimedOrder)
    }
  } catch (error) {
    await orderModel.updateOne(
      { _id: claimedOrder._id, orderStatus: 'cancelled' },
      {
        $set: {
          orderStatus: status,
          paymentStatus: order.paymentStatus,
          inventoryReserved: order.inventoryReserved
        }
      }
    )
    throw error
  }

  await claimedOrder.populate('deliveryAddress')

  res.status(200).json({
    message: 'Order cancelled',
    order: formatOrder(claimedOrder)
  })
})

const listAdminOrders = asyncHandler(async (req, res) => {
  const status = String(req.query.status || '').trim()
  const query = status && ORDER_STATUSES.includes(status) ? { orderStatus: status } : {}
  const orders = await orderModel
    .find(query)
    .populate('deliveryAddress')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(200)

  res.status(200).json({ orders: orders.map(formatOrder) })
})

const updateOrderStatus = asyncHandler(async (req, res) => {
  const nextStatus = String(req.body.orderStatus || '').trim()

  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw new AppError('Please provide a valid order status', 400)
  }

  const order = await orderModel.findOne({ orderId: req.params.orderId }).populate('deliveryAddress')
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  const currentStatus = getStoredOrderStatus(order)
  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(`Order cannot move from ${currentStatus} to ${nextStatus}`, 409)
  }

  const isPendingOnlineCheckout =
    order.paymentMethod !== 'cash_on_delivery' && order.paymentStatus !== 'completed'
  if (isPendingOnlineCheckout) {
    throw new AppError('Pending online checkouts are controlled by their verified Stripe session', 409)
  }

  const claimedOrder = await claimStatusTransition(order, nextStatus)
  if (!claimedOrder) {
    throw new AppError('This order status changed. Refresh the order and try again.', 409)
  }

  if (nextStatus === 'cancelled') {
    const inventoryWasReserved = Boolean(order.inventoryReserved)
    try {
      if (inventoryWasReserved) {
        await restoreOrderInventory(claimedOrder)
      }
    } catch (error) {
      await orderModel.updateOne(
        { _id: claimedOrder._id, orderStatus: 'cancelled' },
        {
          $set: {
            orderStatus: currentStatus,
            paymentStatus: order.paymentStatus,
            inventoryReserved: order.inventoryReserved
          }
        }
      )
      throw error
    }
  }

  await claimedOrder.populate('deliveryAddress')

  res.status(200).json({
    message: 'Order status updated',
    order: formatOrder(claimedOrder)
  })
})

module.exports = {
  listOrders,
  getOrder,
  cancelOrder,
  listAdminOrders,
  updateOrderStatus
}
