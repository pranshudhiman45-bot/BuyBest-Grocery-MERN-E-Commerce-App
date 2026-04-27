const catagoryModel = require('../models/catagory.mode.js')

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const mapCatagory = (catagoryDocument) => {
  const catagory = catagoryDocument.toObject ? catagoryDocument.toObject() : catagoryDocument
  const name = String(catagory.name || '').trim()

  return {
    id: slugify(name) || String(catagory._id),
    name,
    image: catagory.image || null,
    mongoId: String(catagory._id)
  }
}

const ensureCatagoriesSeeded = async () => {
  // No-op by design: categories are managed from DB/admin only.
}

const listCatagories = async () => {
  await ensureCatagoriesSeeded()

  const catagories = await catagoryModel.find().sort({ name: 1 })
  const uniqueCatagories = new Map()

  catagories.forEach((catagory) => {
    const mappedCatagory = mapCatagory(catagory)

    if (!mappedCatagory.id || uniqueCatagories.has(mappedCatagory.id)) {
      return
    }

    uniqueCatagories.set(mappedCatagory.id, mappedCatagory)
  })

  return Array.from(uniqueCatagories.values())
}

module.exports = {
  slugify,
  mapCatagory,
  ensureCatagoriesSeeded,
  listCatagories
}
