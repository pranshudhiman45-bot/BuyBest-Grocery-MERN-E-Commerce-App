const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const productModel = require('../models/product.model.js')
const {
  buildProductPayload,
  ensureStorefrontSeeded,
  findProductBySlug,
  mapProductToStorefront,
  uploadProductImage
} = require('../services/product.service.js')

const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parseLimit = (value, fallback = null) => {
  const parsed = Math.floor(Number(value))
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : fallback
}

const validateProductPayload = (payload) => {
  if (!payload.slug || !payload.name || !payload.category) {
    throw new AppError('Name, category, and a valid slug are required', 400)
  }

  if (!payload.brand || !payload.size || !payload.description) {
    throw new AppError('Brand, pack size, and description are required', 400)
  }

  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    throw new AppError('Price must be greater than zero', 400)
  }

  if (!Number.isInteger(payload.stock) || payload.stock < 0) {
    throw new AppError('Stock must be a whole number of zero or more', 400)
  }

  if (payload.originalPrice !== null && payload.originalPrice < payload.price) {
    throw new AppError('Original price cannot be lower than the selling price', 400)
  }

  if (!payload.images.length) {
    throw new AppError('At least one product image is required', 400)
  }

  const hasInvalidImage = payload.images.some((imageUrl) => {
    try {
      const url = new URL(imageUrl)
      return !['http:', 'https:'].includes(url.protocol)
    } catch {
      return true
    }
  })

  if (hasInvalidImage) {
    throw new AppError('Product images must use valid HTTP or HTTPS URLs', 400)
  }
}

const listProducts = asyncHandler(async (req, res) => {
  const { category = '', limit } = req.query
  await ensureStorefrontSeeded()

  const query = {
    publish: { $ne: false }
  }

  let products = await productModel.find(query).sort({ createdAt: -1 })
  products = products.map(mapProductToStorefront)

  if (category) {
    products = products.filter((product) => product.category === String(category))
  }

  const parsedLimit = parseLimit(limit)
  if (parsedLimit) {
    products = products.slice(0, parsedLimit)
  }

  res.status(200).json({ products })
})

const searchProducts = asyncHandler(async (req, res) => {
  const { q = '', limit } = req.query
  await ensureStorefrontSeeded()

  const normalizedQuery = String(q).trim()
  const safeQuery = escapeRegex(normalizedQuery).slice(0, 100)
  const mongoQuery = normalizedQuery
    ? {
        $or: [
          { name: { $regex: safeQuery, $options: 'i' } },
          { brand: { $regex: safeQuery, $options: 'i' } },
          { category: { $regex: safeQuery, $options: 'i' } },
          { categoryLabel: { $regex: safeQuery, $options: 'i' } },
          { subcategory: { $regex: safeQuery, $options: 'i' } },
          { tags: { $regex: safeQuery, $options: 'i' } },
          { size: { $regex: safeQuery, $options: 'i' } },
          { offer: { $regex: safeQuery, $options: 'i' } }
        ]
      }
    : {}

  let products = await productModel.find(mongoQuery).sort({ createdAt: -1 })
  products = products
    .filter((product) => product.publish !== false)
    .map(mapProductToStorefront)

  const parsedLimit = parseLimit(limit)
  if (parsedLimit) {
    products = products.slice(0, parsedLimit)
  }

  res.status(200).json({ products })
})

const getProductById = asyncHandler(async (req, res) => {
  const productDocument = await findProductBySlug(req.params.productId)
  const product = productDocument ? mapProductToStorefront(productDocument) : null

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  res.status(200).json({ product })
})

const createProduct = asyncHandler(async (req, res) => {
  await ensureStorefrontSeeded()

  const payload = buildProductPayload(req.body)

  validateProductPayload(payload)

  const existingProduct = await productModel.findOne({ slug: payload.slug })

  if (existingProduct) {
    throw new AppError('A product with this slug already exists', 409)
  }

  const product = await productModel.create(payload)

  res.status(201).json({
    message: 'Product created successfully',
    product: mapProductToStorefront(product)
  })
})

const uploadProductImageAsset = asyncHandler(async (req, res) => {
  const uploadedImage = await uploadProductImage(req.file)

  res.status(200).json({
    message: 'Product image uploaded successfully',
    image: uploadedImage
  })
})

const updateProduct = asyncHandler(async (req, res) => {
  await ensureStorefrontSeeded()

  const existingProduct = await productModel.findOne({ slug: req.params.productId })

  if (!existingProduct) {
    throw new AppError('Product not found', 404)
  }

  const payload = buildProductPayload(req.body, existingProduct)
  validateProductPayload(payload)

  if (payload.slug !== existingProduct.slug) {
    const duplicateProduct = await productModel.findOne({ slug: payload.slug })

    if (duplicateProduct) {
      throw new AppError('Another product already uses this slug', 409)
    }
  }

  Object.assign(existingProduct, payload)
  await existingProduct.save()

  res.status(200).json({
    message: 'Product updated successfully',
    product: mapProductToStorefront(existingProduct)
  })
})

const deleteProduct = asyncHandler(async (req, res) => {
  await ensureStorefrontSeeded()

  const product = await productModel.findOneAndDelete({ slug: req.params.productId })

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  res.status(200).json({ message: 'Product removed successfully' })
})

const getInventoryAlerts = asyncHandler(async (req, res) => {
  await ensureStorefrontSeeded()

  const products = await productModel.find().sort({ updatedAt: -1 })
  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const LOW_STOCK_THRESHOLD = 5

  const lowStockProducts = products
    .filter((product) => Number(product.stock) > 0 && Number(product.stock) <= LOW_STOCK_THRESHOLD)
    .map((product) => ({
      id: product.slug,
      name: product.name,
      stock: product.stock,
      categoryLabel: product.categoryLabel || product.category
    }))

  const outOfStockProducts = products
    .filter((product) => Number(product.stock) <= 0)
    .map((product) => ({
      id: product.slug,
      name: product.name,
      stock: 0,
      categoryLabel: product.categoryLabel || product.category
    }))

  const expiringSoonProducts = products
    .filter((product) => {
      if (!product.expirationDate) {
        return false
      }

      const expirationDate = new Date(product.expirationDate)
      if (Number.isNaN(expirationDate.getTime())) {
        return false
      }
      return expirationDate >= now && expirationDate <= thirtyDaysFromNow
    })
    .map((product) => ({
      id: product.slug,
      name: product.name,
      stock: product.stock,
      categoryLabel: product.categoryLabel || product.category,
      expirationDate: product.expirationDate
    }))

  res.status(200).json({
    alerts: {
      lowStockProducts,
      outOfStockProducts,
      expiringSoonProducts
    },
    summary: {
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringSoonCount: expiringSoonProducts.length
    }
  })
})

module.exports = {
  listProducts,
  searchProducts,
  getProductById,
  createProduct,
  uploadProductImageAsset,
  updateProduct,
  deleteProduct,
  getInventoryAlerts
}
