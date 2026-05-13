const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const addressModel = require('../models/address.model.js')
const userModel = require('../models/user.model.js')

const MAX_ADDRESSES_PER_USER = 5
const ADDRESS_LIMIT_MESSAGE = 'You can only add 5 addresses. Delete one to add a new address.'

const normalizeAddress = (address, selectedAddressId) => ({
  id: address._id.toString(),
  addressLine: address.addresLine,
  street: address.street,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  mobile: address.mobile != null ? String(address.mobile) : '',
  country: address.country,
  isDefault: selectedAddressId === address._id.toString()
})

const pickFirst = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || ''

const buildSuggestedAddress = (data) => {
  const address = data?.address || {}
  const city = pickFirst(
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county
  )
  const state = pickFirst(address.state, address.region, address.state_district)
  const street = pickFirst(
    [address.road, address.neighbourhood, address.suburb].filter(Boolean).join(', '),
    address.quarter,
    address.hamlet
  )
  const addressLine = pickFirst(
    [address.house_number, address.road, address.neighbourhood, address.suburb]
      .filter(Boolean)
      .join(', '),
    data?.display_name
  )

  return {
    addressLine,
    street,
    city,
    state,
    postalCode: pickFirst(address.postcode),
    country: pickFirst(address.country) || 'India'
  }
}

const syncDefaultAddress = async (userId, selectedAddressId) => {
  await addressModel.updateMany({ user: userId }, { status: false })
  await addressModel.findByIdAndUpdate(selectedAddressId, { status: true })
}

const getAddressResponse = async (user) => {
  const addresses = await addressModel.find({ user: user._id }).sort({ createdAt: -1 })
  const selectedAddressId = user.addresDetails ? user.addresDetails.toString() : null

  return {
    addresses: addresses.map((address) => normalizeAddress(address, selectedAddressId)),
    selectedAddressId
  }
}

const validateAddressPayload = (payload) => {
  const {
    addressLine,
    street = '',
    city,
    state,
    postalCode,
    mobile,
    country = 'India'
  } = payload

  const normalizedMobile = String(mobile || '').trim()
  const numericMobile = Number(normalizedMobile)

  if (!addressLine || !city || !state || !postalCode || !normalizedMobile) {
    throw new AppError('Please provide complete address details', 400)
  }

  if (!Number.isFinite(numericMobile)) {
    throw new AppError('Please provide a valid mobile number', 400)
  }

  return {
    addresLine: addressLine.trim(),
    street: street.trim(),
    city: city.trim(),
    state: state.trim(),
    postalCode: postalCode.trim(),
    mobile: numericMobile,
    country: String(country || '').trim() || 'India'
  }
}

const getAddresses = asyncHandler(async (req, res) => {
  const response = await getAddressResponse(req.user)
  res.status(200).json(response)
})

const suggestAddressFromLocation = asyncHandler(async (req, res) => {
  const latitude = Number(req.body.latitude)
  const longitude = Number(req.body.longitude)

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError('Please provide valid location coordinates', 400)
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BuyBest/1.0 support@buybest.local'
    }
  })

  if (!response.ok) {
    throw new AppError('Unable to suggest an address from this location', 502)
  }

  const data = await response.json()
  const suggestion = buildSuggestedAddress(data)

  res.status(200).json({
    message: 'Address suggestion created from your current location',
    address: suggestion
  })
})

const createAddress = asyncHandler(async (req, res) => {
  const { setAsDefault = false } = req.body
  const normalizedPayload = validateAddressPayload(req.body)
  const existingAddressCount = await addressModel.countDocuments({ user: req.user._id })

  if (existingAddressCount >= MAX_ADDRESSES_PER_USER) {
    throw new AppError(ADDRESS_LIMIT_MESSAGE, 400)
  }

  const shouldSetDefault = setAsDefault || existingAddressCount === 0

  const address = await addressModel.create({
    user: req.user._id,
    ...normalizedPayload,
    status: shouldSetDefault
  })

  if (shouldSetDefault) {
    await userModel.findByIdAndUpdate(req.user._id, { addresDetails: address._id })
    await syncDefaultAddress(req.user._id, address._id)
    req.user.addresDetails = address._id
  }

  const response = await getAddressResponse(req.user)

  res.status(201).json({
    message: 'Address added successfully',
    ...response
  })
})

const selectAddress = asyncHandler(async (req, res) => {
  const address = await addressModel.findOne({
    _id: req.params.addressId,
    user: req.user._id
  })

  if (!address) {
    throw new AppError('Address not found', 404)
  }

  await userModel.findByIdAndUpdate(req.user._id, { addresDetails: address._id })
  await syncDefaultAddress(req.user._id, address._id)
  req.user.addresDetails = address._id

  const response = await getAddressResponse(req.user)

  res.status(200).json({
    message: 'Delivery address updated successfully',
    ...response
  })
})

const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressModel.findOne({
    _id: req.params.addressId,
    user: req.user._id
  })

  if (!address) {
    throw new AppError('Address not found', 404)
  }

  const normalizedPayload = validateAddressPayload(req.body)

  Object.assign(address, normalizedPayload)
  await address.save()

  const response = await getAddressResponse(req.user)

  res.status(200).json({
    message: 'Address updated successfully',
    ...response
  })
})

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await addressModel.findOne({
    _id: req.params.addressId,
    user: req.user._id
  })

  if (!address) {
    throw new AppError('Address not found', 404)
  }

  const deletedAddressId = address._id.toString()
  await address.deleteOne()

  if (req.user.addresDetails?.toString() === deletedAddressId) {
    const fallbackAddress = await addressModel.findOne({ user: req.user._id }).sort({ createdAt: -1 })

    if (fallbackAddress) {
      await userModel.findByIdAndUpdate(req.user._id, { addresDetails: fallbackAddress._id })
      await syncDefaultAddress(req.user._id, fallbackAddress._id)
      req.user.addresDetails = fallbackAddress._id
    } else {
      await userModel.findByIdAndUpdate(req.user._id, { addresDetails: null })
      req.user.addresDetails = null
    }
  }

  const response = await getAddressResponse(req.user)

  res.status(200).json({
    message: 'Address deleted successfully',
    ...response
  })
})

module.exports = {
  getAddresses,
  suggestAddressFromLocation,
  createAddress,
  selectAddress,
  updateAddress,
  deleteAddress
}
