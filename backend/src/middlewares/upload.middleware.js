const multer = require('multer')
const AppError = require('../utils/app-error.js')

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed for upload', 400))
    }

    return cb(null, true)
  }
})

module.exports = {
  imageUpload,
  avatarUpload: imageUpload,
  MAX_IMAGE_SIZE_BYTES
}
