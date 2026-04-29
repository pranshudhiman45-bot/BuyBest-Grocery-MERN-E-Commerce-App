const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 10

const stores = new Map()

const cleanupExpiredEntries = (now) => {
  for (const [key, entry] of stores.entries()) {
    if (entry.resetAt <= now) {
      stores.delete(key)
    }
  }
}

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for']

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  return req.ip || req.socket?.remoteAddress || 'unknown'
}

const createRateLimit = ({
  windowMs = WINDOW_MS,
  maxRequests = MAX_REQUESTS,
  keyPrefix = 'global',
  message = 'Too many requests. Please try again later.'
} = {}) => (req, res, next) => {
  const now = Date.now()
  cleanupExpiredEntries(now)

  const key = `${keyPrefix}:${getClientIp(req)}:${req.path}`
  const existingEntry = stores.get(key)

  if (!existingEntry || existingEntry.resetAt <= now) {
    stores.set(key, {
      count: 1,
      resetAt: now + windowMs
    })

    return next()
  }

  existingEntry.count += 1

  if (existingEntry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((existingEntry.resetAt - now) / 1000)
    res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)))

    return res.status(429).json({
      message
    })
  }

  return next()
}

module.exports = {
  createRateLimit
}
