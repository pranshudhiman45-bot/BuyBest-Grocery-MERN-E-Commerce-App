const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const cartModel = require('../models/cart.model.js')
const productModel = require('../models/product.model.js')
const orderModel = require('../models/order.model.js')
const userModel = require('../models/user.model.js')
const addressModel = require('../models/address.model.js')
const {
  findProductBySlug,
  mapProductToStorefront
} = require('../services/product.service.js')

const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 300
const TAX_RATE = 0.05

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

const calculateCartSummary = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee =
    subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const tax = Number((subtotal * TAX_RATE).toFixed(2))
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
    summary: calculateCartSummary(mappedItems)
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
  const { paymentMethod = 'cash_on_delivery', addressId } = req.body
  const cartItems = await cartModel.find({ userId: req.user._id }).sort({ createdAt: -1 })

  if (cartItems.length === 0) {
    throw new AppError('Your cart is empty', 400)
  }

  const resolvedAddressId = addressId || req.user.addresDetails

  if (!resolvedAddressId) {
    throw new AppError('Please add a delivery address before placing your order', 400)
  }

  const selectedAddress = await addressModel.findOne({
    _id: resolvedAddressId,
    user: req.user._id
  })

  if (!selectedAddress) {
    throw new AppError('Selected delivery address was not found', 404)
  }

  const purchasedItems = []

  for (const cartItem of cartItems) {
    const productDocument = await productModel.findOne({ slug: cartItem.productSlug })
    const product = productDocument ? mapProductToStorefront(productDocument) : null

    if (!product || !productDocument) {
      throw new AppError(`Product ${cartItem.productSlug} is no longer available`, 404)
    }

    assertQuantityAvailable(product, cartItem.quantity)
    productDocument.stock = normalizeStock(productDocument.stock) - cartItem.quantity
    await productDocument.save()

    const orderRecord = await orderModel.create({
      userId: req.user._id,
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: productDocument._id,
      productDetails: {
        _id: productDocument._id.toString(),
        name: productDocument.name,
        image: productDocument.images || []
      },
      paymentStatus: 'completed',
      deliveryAddress: selectedAddress._id,
      subToatl: cartItem.price * cartItem.quantity,
      total: cartItem.totalPrice
    })

    const userDoc = await userModel.findById(req.user._id)
    if (userDoc) {
      if (!userDoc.orderHistory) userDoc.orderHistory = []
      userDoc.orderHistory.push(orderRecord._id)
      await userDoc.save()
    }

    purchasedItems.push(
      mapCartItem(
        cartItem,
        normalizeStock(productDocument.stock),
        normalizeMaxPerOrder(product.maxPerOrder)
      )
    )
  }

  const summary = calculateCartSummary(purchasedItems)
  await cartModel.deleteMany({ userId: req.user._id })

  res.status(200).json({
    message: 'Order placed successfully',
    paymentMethod,
    address: {
      id: selectedAddress._id.toString(),
      addressLine: selectedAddress.addresLine,
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
      mobile: selectedAddress.mobile != null ? String(selectedAddress.mobile) : '',
      country: selectedAddress.country
    },
    summary,
    items: purchasedItems
  })
})

module.exports = {
  getCart,
  getCartCount,
  addCartItem,
  updateCartItem,
  removeCartItem,
  checkoutCart
}
