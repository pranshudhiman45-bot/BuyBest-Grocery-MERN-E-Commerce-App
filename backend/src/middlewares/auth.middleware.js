const userModel = require('../models/user.model.js')
const jwt = require('jsonwebtoken')
const env = require('../config/env.js')
const { ACCESS_TOKEN_COOKIE_NAME } = require('../constants/auth.constants.js')

const authMiddleware = async (req, res, next) => {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null

  const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME] || bearerToken

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' })
  }

  try {
    const decoded = jwt.verify(token, env.accessTokenSecret)
    const user = await userModel.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: 'User not found for this token' })
    }

    req.user = user
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid authentication token' })
  }
}

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You are not authorized to access this resource' })
  }

  return next()
}

module.exports = { authMiddleware, requireRole }
