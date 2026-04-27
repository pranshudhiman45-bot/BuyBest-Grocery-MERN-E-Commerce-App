const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const catagoryModel = require('../models/catagory.mode.js')
const productModel = require('../models/product.model.js')
const {
  ensureCatagoriesSeeded,
  listCatagories,
  mapCatagory,
  slugify
} = require('../services/catagory.service.js')

const getCatagories = asyncHandler(async (_req, res) => {
  const catagories = await listCatagories()
  res.status(200).json({ catagories })
})

const createCatagory = asyncHandler(async (req, res) => {
  await ensureCatagoriesSeeded()

  const name = String(req.body.name || '').trim()
  const image = String(req.body.image || '').trim() || null

  if (!name) {
    throw new AppError('Category name is required', 400)
  }

  const existingCatagories = await catagoryModel.find().lean()
  const duplicate = existingCatagories.find(
    (catagory) => slugify(catagory.name) === slugify(name)
  )

  if (duplicate) {
    throw new AppError('A category with this name already exists', 409)
  }

  const catagory = await catagoryModel.create({ name, image })

  res.status(201).json({
    message: 'Category created successfully',
    catagory: mapCatagory(catagory)
  })
})

const updateCatagory = asyncHandler(async (req, res) => {
  await ensureCatagoriesSeeded()

  const catagory = await catagoryModel.findById(req.params.catagoryId)

  if (!catagory) {
    throw new AppError('Category not found', 404)
  }

  const previousCategorySlug = slugify(catagory.name)
  const name = String(req.body.name || catagory.name || '').trim()
  const image =
    req.body.image === undefined ? catagory.image : String(req.body.image || '').trim() || null

  if (!name) {
    throw new AppError('Category name is required', 400)
  }

  const existingCatagories = await catagoryModel.find({
    _id: { $ne: catagory._id }
  }).lean()
  const duplicate = existingCatagories.find(
    (item) => slugify(item.name) === slugify(name)
  )

  if (duplicate) {
    throw new AppError('Another category already uses this name', 409)
  }

  catagory.name = name
  catagory.image = image
  await catagory.save()

  const nextCategorySlug = slugify(name)

  if (previousCategorySlug && nextCategorySlug && previousCategorySlug !== nextCategorySlug) {
    await productModel.updateMany(
      { category: previousCategorySlug },
      {
        $set: {
          category: nextCategorySlug,
          categoryLabel: name
        }
      }
    )
  } else {
    await productModel.updateMany(
      { category: nextCategorySlug },
      {
        $set: {
          categoryLabel: name
        }
      }
    )
  }

  res.status(200).json({
    message: 'Category updated successfully',
    catagory: mapCatagory(catagory)
  })
})

const deleteCatagory = asyncHandler(async (req, res) => {
  await ensureCatagoriesSeeded()

  const catagory = await catagoryModel.findById(req.params.catagoryId)

  if (!catagory) {
    throw new AppError('Category not found', 404)
  }

  const linkedProducts = await productModel.countDocuments({
    category: slugify(catagory.name)
  })

  if (linkedProducts > 0) {
    throw new AppError('This category is still linked to products. Reassign those products first.', 409)
  }

  await catagory.deleteOne()

  res.status(200).json({ message: 'Category removed successfully' })
})

module.exports = {
  getCatagories,
  createCatagory,
  updateCatagory,
  deleteCatagory
}
