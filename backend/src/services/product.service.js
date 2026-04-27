const productModel = require('../models/product.model.js')
const { uploadImageToCloudinary } = require('../utils/cloudinaryImage.js')
const AppError = require('../utils/app-error.js')

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeImageInput = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeMaxPerOrder = (value, existingValue = null) => {
  if (value === undefined) {
    return existingValue
  }

  if (value === null || value === '') {
    return null
  }

  const parsedValue = Math.floor(Number(value))

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null
  }

  return parsedValue
}

const createGalleryFromImages = (images, accent, fallbackLabel, slug) =>
  images.map((imageUrl, index) => ({
    id: `${slug || 'product'}-image-${index + 1}`,
    label:
      index === 0 ? fallbackLabel || 'Product image' : `${fallbackLabel || 'Product image'} ${index + 1}`,
    accent: accent || '#9CD56A',
    imageUrl
  }))

const ensureStorefrontSeeded = async () => {
  // No-op by design: storefront is now fully API/database driven.
}

const buildProductPayload = (input = {}, existingProduct = null) => {
  const baseName = String(input.name || existingProduct?.name || '').trim()
  const slugSource = String(input.slug || baseName || existingProduct?.slug || '').trim()
  const images = normalizeImageInput(input.images ?? existingProduct?.images ?? [])
  const accent = String(input.accent || existingProduct?.accent || '#9CD56A').trim()
  const imageLabel = String(input.imageLabel || existingProduct?.imageLabel || baseName || 'Product image').trim()

  return {
    slug: slugify(slugSource),
    name: baseName,
    brand: String(input.brand || '').trim(),
    category: String(input.category || '').trim(),
    categoryLabel: String(input.categoryLabel || input.category || '').trim(),
    size: String(input.size || '').trim(),
    price: Number(input.price) || 0,
    originalPrice:
      input.originalPrice === '' || input.originalPrice === null || input.originalPrice === undefined
        ? null
        : Number(input.originalPrice) || 0,
    offer: String(input.offer || '').trim(),
    badge: String(input.offer || input.badge || '').trim(),
    accent,
    imageLabel,
    images,
    description: String(input.description || '').trim(),
    stock: Number(input.stock) || 0,
    maxPerOrder: normalizeMaxPerOrder(input.maxPerOrder, existingProduct?.maxPerOrder ?? null),
    expirationDate:
      input.expirationDate === '' || input.expirationDate === null || input.expirationDate === undefined
        ? null
        : new Date(input.expirationDate),
    benefits: normalizeStringArray(input.benefits),
    storage: String(input.storage || '').trim(),
    tags: normalizeStringArray(input.tags),
    relatedIds: normalizeStringArray(input.relatedIds),
    isBestSeller:
      input.isBestSeller === undefined
        ? Boolean(existingProduct?.isBestSeller)
        : Boolean(input.isBestSeller),
    isNewArrival:
      input.isNewArrival === undefined
        ? Boolean(existingProduct?.isNewArrival)
        : Boolean(input.isNewArrival),
    publish: input.publish === undefined ? true : Boolean(input.publish)
  }
}

const mapProductToStorefront = (productDocument) => {
  const product = productDocument.toObject ? productDocument.toObject() : productDocument
  const images = normalizeImageInput(product.images)
  const gallery =
    Array.isArray(product.gallery) && product.gallery.length
      ? product.gallery
      : createGalleryFromImages(images, product.accent, product.imageLabel || product.name, product.slug)

  return {
    id: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    categoryLabel: product.categoryLabel,
    size: product.size,
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    offer: product.offer || undefined,
    badge: product.badge || product.offer || undefined,
    accent: product.accent,
    imageLabel: product.imageLabel || product.name,
    images,
    description: product.description || undefined,
    stock: product.stock,
    maxPerOrder:
      product.maxPerOrder === undefined || product.maxPerOrder === null
        ? null
        : Number(product.maxPerOrder),
    expirationDate: product.expirationDate || null,
    benefits: product.benefits || [],
    storage: product.storage || undefined,
    tags: product.tags || [],
    gallery,
    relatedIds: product.relatedIds || [],
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival)
  }
}

const findProductBySlug = async (slug) => {
  return productModel.findOne({ slug })
}

const uploadProductImage = async (file) => {
  if (!file?.buffer) {
    throw new AppError('Product image is required', 400)
  }

  const uploadedImage = await uploadImageToCloudinary(file.buffer, {
    folder: 'final-project/products',
    publicId: `product-${Date.now()}`,
    overwrite: false,
    transformation: [
      {
        width: 1200,
        height: 1200,
        crop: 'limit'
      },
      {
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  })

  return {
    url: uploadedImage.secure_url,
    publicId: uploadedImage.public_id
  }
}

module.exports = {
  slugify,
  ensureStorefrontSeeded,
  buildProductPayload,
  mapProductToStorefront,
  findProductBySlug,
  uploadProductImage
}
