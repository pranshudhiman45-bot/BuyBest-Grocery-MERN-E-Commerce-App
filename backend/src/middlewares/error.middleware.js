const multer = require('multer')
const { nodeEnv } = require('../config/env.js')

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

const errorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 400 : 500

    return res.status(statusCode).json({
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Avatar image must be 5MB or smaller'
          : error.message
    })
  }

  const statusCode = error.statusCode || 500
  const response = {
    message: error.message || 'Server error'
  }

  if (nodeEnv !== 'production' && error.stack) {
    response.stack = error.stack
  }

  console.error(error)
  res.status(statusCode).json(response)
}

module.exports = {
  notFoundHandler,
  errorHandler
}
