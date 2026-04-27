const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const couponModel = require('../models/coupon.model.js')

const mapCoupon = (couponDocument) => {
  const coupon = couponDocument.toObject ? couponDocument.toObject() : couponDocument

  return {
    id: String(coupon._id),
    code: coupon.code,
    description: coupon.description || '',
    discountType: coupon.discountType,
    value: coupon.value,
    minimumOrderValue: coupon.minimumOrderValue || 0,
    maxDiscount: coupon.maxDiscount ?? null,
    isActive: coupon.isActive !== false
  }
}

const buildCouponPayload = (input = {}, existingCoupon = null) => {
  const code = String(input.code || existingCoupon?.code || '').trim().toUpperCase()
  const description = String(input.description || '').trim()
  const discountType =
    input.discountType === 'percentage' || existingCoupon?.discountType === 'percentage'
      ? 'percentage'
      : 'fixed'
  const value = Number(input.value ?? existingCoupon?.value ?? 0) || 0
  const minimumOrderValue = Number(input.minimumOrderValue ?? existingCoupon?.minimumOrderValue ?? 0) || 0
  const maxDiscount =
    input.maxDiscount === '' || input.maxDiscount === null || input.maxDiscount === undefined
      ? null
      : Number(input.maxDiscount) || 0

  return {
    code,
    description,
    discountType,
    value,
    minimumOrderValue,
    maxDiscount,
    isActive: input.isActive === undefined ? existingCoupon?.isActive !== false : Boolean(input.isActive)
  }
}

const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await couponModel.find({ isActive: true }).sort({ createdAt: -1 })

  res.status(200).json({ coupons: coupons.map(mapCoupon) })
})

const listAdminCoupons = asyncHandler(async (_req, res) => {
  const coupons = await couponModel.find().sort({ createdAt: -1 })

  res.status(200).json({ coupons: coupons.map(mapCoupon) })
})

const createCoupon = asyncHandler(async (req, res) => {
  const payload = buildCouponPayload(req.body)

  if (!payload.code) {
    throw new AppError('Coupon code is required', 400)
  }

  const existingCoupon = await couponModel.findOne({ code: payload.code })

  if (existingCoupon) {
    throw new AppError('A coupon with this code already exists', 409)
  }

  const coupon = await couponModel.create(payload)

  res.status(201).json({
    message: 'Coupon created successfully',
    coupon: mapCoupon(coupon)
  })
})

const updateCoupon = asyncHandler(async (req, res) => {
  const existingCoupon = await couponModel.findById(req.params.couponId)

  if (!existingCoupon) {
    throw new AppError('Coupon not found', 404)
  }

  const payload = buildCouponPayload(req.body, existingCoupon)

  if (!payload.code) {
    throw new AppError('Coupon code is required', 400)
  }

  if (payload.code !== existingCoupon.code) {
    const duplicateCoupon = await couponModel.findOne({ code: payload.code })

    if (duplicateCoupon) {
      throw new AppError('Another coupon already uses this code', 409)
    }
  }

  Object.assign(existingCoupon, payload)
  await existingCoupon.save()

  res.status(200).json({
    message: 'Coupon updated successfully',
    coupon: mapCoupon(existingCoupon)
  })
})

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponModel.findByIdAndDelete(req.params.couponId)

  if (!coupon) {
    throw new AppError('Coupon not found', 404)
  }

  res.status(200).json({ message: 'Coupon removed successfully' })
})

module.exports = {
  listCoupons,
  listAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
}
