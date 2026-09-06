const fs = require('fs')
const os = require('os')
const path = require('path')
const mongoose = require('mongoose')

const connectDB = require('../src/config/db.js')
const productModel = require('../src/models/product.model.js')
const catagoryModel = require('../src/models/catagory.mode.js')
const cartModel = require('../src/models/cart.model.js')
const appSettingsModel = require('../src/models/app-settings.model.js')
const { products, categories } = require('../src/data/catalog.js')

const shouldApply = process.argv.includes('--apply')

const addRelatedProducts = (catalog) => catalog.map((entry) => ({
  ...entry,
  relatedIds: catalog
    .filter((candidate) => candidate.category === entry.category && candidate.slug !== entry.slug)
    .slice(0, 4)
    .map((candidate) => candidate.slug)
}))

const run = async () => {
  await connectDB()

  const [currentProducts, currentCategories, currentCarts, currentSettings] = await Promise.all([
    productModel.find().lean(),
    catagoryModel.find().lean(),
    cartModel.find().lean(),
    appSettingsModel.find().lean()
  ])
  const canonicalProducts = addRelatedProducts(products)
  const canonicalSlugs = new Set(canonicalProducts.map((entry) => entry.slug))
  const productsToRemove = currentProducts.filter((entry) => !canonicalSlugs.has(entry.slug))
  const staleCartItems = currentCarts.filter((entry) => !canonicalSlugs.has(entry.productSlug))

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    currentProductCount: currentProducts.length,
    canonicalProductCount: canonicalProducts.length,
    productsToRemove: productsToRemove.map((entry) => ({ slug: entry.slug, name: entry.name })),
    currentCategoryCount: currentCategories.length,
    canonicalCategoryCount: categories.length,
    staleCartItemCount: staleCartItems.length
  }, null, 2))

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply to update the database.')
    return
  }

  const backupPath = path.join(os.tmpdir(), `buy-best-catalog-backup-${Date.now()}.json`)
  fs.writeFileSync(backupPath, JSON.stringify({
    createdAt: new Date().toISOString(),
    products: currentProducts,
    categories: currentCategories,
    carts: currentCarts,
    settings: currentSettings
  }, null, 2), { mode: 0o600 })

  await productModel.bulkWrite(canonicalProducts.map((entry) => ({
    updateOne: {
      filter: { slug: entry.slug },
      update: { $set: entry },
      upsert: true
    }
  })))
  const removedProducts = await productModel.deleteMany({
    slug: { $nin: Array.from(canonicalSlugs) }
  })

  await catagoryModel.deleteMany({})
  await catagoryModel.insertMany(categories)

  const removedCartItems = await cartModel.deleteMany({
    productSlug: { $nin: Array.from(canonicalSlugs) }
  })

  for (const entry of canonicalProducts) {
    await cartModel.updateMany(
      { productSlug: entry.slug },
      {
        $set: {
          name: entry.name,
          brand: entry.brand,
          category: entry.categoryLabel,
          sizeLabel: entry.size,
          imageLabel: entry.imageLabel,
          imageUrl: entry.images[0],
          accent: entry.accent,
          price: entry.price
        }
      }
    )
    const cartItems = await cartModel.find({ productSlug: entry.slug })
    await Promise.all(cartItems.map(async (cartItem) => {
      cartItem.totalPrice = Number((entry.price * cartItem.quantity).toFixed(2))
      await cartItem.save()
    }))
  }

  const settings = await appSettingsModel.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { taxPercentage: 5 } },
    { upsert: true, returnDocument: 'after' }
  )

  console.log(JSON.stringify({
    backupPath,
    productsRemoved: removedProducts.deletedCount,
    cartItemsRemoved: removedCartItems.deletedCount,
    productCount: await productModel.countDocuments(),
    categoryCount: await catagoryModel.countDocuments(),
    taxPercentage: settings.taxPercentage
  }, null, 2))
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
