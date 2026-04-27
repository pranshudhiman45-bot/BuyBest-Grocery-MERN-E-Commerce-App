const cloudinary = require('cloudinary').v2
const env = require('../config/env.js')
const AppError = require('./app-error.js')

const requiredCloudinaryEnvVars = [
  ['CLOUDINARY_CLOUD_NAME', env.cloudinaryCloudName],
  ['CLOUDINARY_API_KEY', env.cloudinaryApiKey],
  ['CLOUDINARY_API_SECRET', env.cloudinaryApiSecret]
]

const missingCloudinaryEnvVars = requiredCloudinaryEnvVars
  .filter(([, value]) => !value)
  .map(([name]) => name)

if (!missingCloudinaryEnvVars.length) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
  })
}

const ensureCloudinaryConfigured = () => {
  if (missingCloudinaryEnvVars.length) {
    throw new AppError(
      `Cloudinary is not configured. Missing env vars: ${missingCloudinaryEnvVars.join(', ')}`,
      500
    )
  }
}

const uploadImageToCloudinary = async (
  file,
  options = {}
) => {
  ensureCloudinaryConfigured()

  if (!file) {
    throw new AppError('Image file is required for upload', 400)
  }

  const uploadOptions = {
    folder: options.folder || 'final-project',
    resource_type: options.resourceType || 'image',
    public_id: options.publicId,
    overwrite: options.overwrite ?? true,
    transformation: options.transformation
  }

  if (Buffer.isBuffer(file)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            return reject(error)
          }

          return resolve(result)
        }
      )

      uploadStream.end(file)
    })
  }

  return cloudinary.uploader.upload(file, uploadOptions)
}

const deleteImageFromCloudinary = async (
  publicId,
  options = {}
) => {
  ensureCloudinaryConfigured()

  if (!publicId) {
    throw new AppError('Cloudinary public ID is required', 400)
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: options.resourceType || 'image'
  })
}

module.exports = {
  cloudinary,
  uploadImageToCloudinary,
  deleteImageFromCloudinary
}
