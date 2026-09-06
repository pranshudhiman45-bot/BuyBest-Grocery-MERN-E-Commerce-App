const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { products, categories } = require('../src/data/catalog.js')

const requiredCategories = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Beverages',
  'Snacks',
  'Bakery',
  'Staples',
  'Instant Food',
  'Frozen Food',
  'Personal Care',
  'Household Care',
  'Breakfast',
  'Tea & Coffee'
]

test('catalog contains unique, publishable grocery products', () => {
  assert.ok(products.length >= 30)
  assert.equal(new Set(products.map((product) => product.slug)).size, products.length)
  assert.equal(new Set(products.flatMap((product) => product.images)).size, products.length)

  for (const product of products) {
    assert.ok(product.name)
    assert.ok(product.brand)
    assert.ok(product.category)
    assert.ok(product.categoryLabel)
    assert.ok(product.subcategory)
    assert.ok(product.description)
    assert.match(product.size, /(ml|L|g|kg|piece|pack|tub)/i)
    assert.ok(Number.isFinite(product.price) && product.price > 0)
    assert.ok(Number.isInteger(product.stock) && product.stock >= 0)
    assert.ok(product.images.every((imageUrl) => imageUrl.startsWith('/products/')))
    assert.ok(['cover', 'contain'].includes(product.imageFit))
    assert.ok(
      product.images.every((imageUrl) => fs.existsSync(
        path.resolve(__dirname, '../../frontend/public', imageUrl.slice(1))
      )),
      `${product.name} must reference an existing local image`
    )
    assert.equal(product.publish, true)
    assert.equal('rating' in product, false)
    assert.equal('reviewCount' in product, false)
    assert.doesNotMatch(`${product.name} ${product.size}`, /Pranshu|170cm|12ml|\btest\b/i)
  }
})

test('catalog exposes every required grocery category once', () => {
  assert.equal(categories.length, requiredCategories.length)
  assert.deepEqual(
    new Set(categories.map((category) => category.name)),
    new Set(requiredCategories)
  )
})

test('catalog fallback image exists and category images resolve locally', () => {
  const publicDirectory = path.resolve(__dirname, '../../frontend/public')

  assert.ok(fs.existsSync(path.join(publicDirectory, 'products/fallback/product-image-fallback.avif')))

  for (const category of categories) {
    assert.ok(category.image.startsWith('/products/'))
    assert.ok(fs.existsSync(path.join(publicDirectory, category.image.slice(1))))
  }
})
