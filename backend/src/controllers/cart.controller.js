const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const cartModel = require('../models/cart.model.js')
const productModel = require('../models/product.model.js')
const {
  findProductBySlug,
  mapProductToStorefront
} = require('../services/product.service.js')
const {
  normalizeStock,
  normalizeMaxPerOrder,
  assertQuantityAvailable,
  calculateCartSummary,
  mapCartItem,
  placeCashOnDeliveryOrder
} = require('../services/checkout.service.js')

const getUserCartItems = async (userId) => {
  const items = await cartModel.find({ userId }).sort({ createdAt: -1 })
  const mappedItems = await Promise.all(
    items.map(async (item) => {
      const productDocument = await findProductBySlug(item.productSlug)
      const product = productDocument ? mapProductToStorefront(productDocument) : null

      return mapCartItem(item, normalizeStock(product?.stock), normalizeMaxPerOrder(product?.maxPerOrder))
    })
  )

  return {
    items: mappedItems,
    summary: await calculateCartSummary(mappedItems)
  }
}

const getCart = asyncHandler(async (req, res) => {
  const cart = await getUserCartItems(req.user._id)
  res.status(200).json(cart)
})

const getCartCount = asyncHandler(async (req, res) => {
  const cart = await getUserCartItems(req.user._id)
  res.status(200).json({ count: cart.summary.itemCount })
})

const addCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body
  const productDocument = await findProductBySlug(productId)
  const product = productDocument ? mapProductToStorefront(productDocument) : null

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  const nextQuantity = Math.max(1, Number(quantity) || 1)
  assertQuantityAvailable(product, nextQuantity)

  const existingItem = await cartModel.findOne({
    userId: req.user._id,
    productSlug: productId
  })

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + nextQuantity
    assertQuantityAvailable(product, updatedQuantity)

    existingItem.quantity = updatedQuantity
    existingItem.totalPrice = Number(
      (existingItem.quantity * existingItem.price).toFixed(2)
    )
    await existingItem.save()
  } else {
    await cartModel.create({
      userId: req.user._id,
      productSlug: product.id,
      name: product.name,
      brand: product.brand,
      category: product.categoryLabel || product.category,
      sizeLabel: product.size,
      imageLabel: product.imageLabel,
      imageUrl: product.images?.[0] || null,
      accent: product.accent,
      quantity: nextQuantity,
      price: product.price,
      totalPrice: Number((product.price * nextQuantity).toFixed(2))
    })
  }

  const cart = await getUserCartItems(req.user._id)
  res.status(200).json(cart)
})

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body
  const nextQuantity = Math.max(0, Number(quantity) || 0)

  const cartItem = await cartModel.findOne({
    userId: req.user._id,
    productSlug: req.params.productId
  })

  if (!cartItem) {
    throw new AppError('Cart item not found', 404)
  }

  if (nextQuantity === 0) {
    await cartItem.deleteOne()
  } else {
    const productDocument = await findProductBySlug(req.params.productId)
    const product = productDocument ? mapProductToStorefront(productDocument) : null

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    assertQuantityAvailable(product, nextQuantity)

    cartItem.quantity = nextQuantity
    cartItem.totalPrice = Number((cartItem.price * nextQuantity).toFixed(2))
    await cartItem.save()
  }

  const cart = await getUserCartItems(req.user._id)
  res.status(200).json(cart)
})

const removeCartItem = asyncHandler(async (req, res) => {
  await cartModel.findOneAndDelete({
    userId: req.user._id,
    productSlug: req.params.productId
  })

  const cart = await getUserCartItems(req.user._id)
  res.status(200).json(cart)
})

const checkoutCart = asyncHandler(async (req, res) => {
  const { paymentMethod = 'cash_on_delivery', addressId, couponCode } = req.body

  if (paymentMethod !== 'cash_on_delivery') {
    throw new AppError('Online payments must be completed through Stripe checkout', 400)
  }

  const response = await placeCashOnDeliveryOrder(req.user, {
    addressId,
    couponCode,
    paymentMethod
  })

  res.status(200).json(response)
})

module.exports = {
  getCart,
  getCartCount,
  addCartItem,
  updateCartItem,
  removeCartItem,
  checkoutCart
}
