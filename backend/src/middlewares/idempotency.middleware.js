const AppError = require('../utils/app-error.js')
const {
  DEFAULT_TTL_MS,
  buildRequestFingerprint,
  getIdempotencyKey,
  startRequest,
  completeRequest,
  releaseRequest
} = require('../services/idempotency.service.js')

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const parseTtlMs = (value) => {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_MS
}

const cloneHeaders = (res) => {
  const headerNames = ['Content-Type']
  const headers = {}

  for (const headerName of headerNames) {
    const headerValue = res.getHeader(headerName)

    if (headerValue) {
      headers[headerName] = headerValue
    }
  }

  return headers
}

const idempotencyMiddleware = (options = {}) => {
  const ttlMs = parseTtlMs(options.ttlMs)

  return (req, res, next) => {
    if (!IDEMPOTENT_METHODS.has(req.method)) {
      return next()
    }

    const key = getIdempotencyKey(req)
    const fingerprint = buildRequestFingerprint(req)

    req.idempotency = { key, fingerprint }
    res.setHeader('Idempotency-Key', key)

    const { created, entry } = startRequest({ key, fingerprint, ttlMs })

    if (!created) {
      if (entry.fingerprint !== fingerprint) {
        return next(new AppError('Idempotency key already used for a different request', 409))
      }

      if (entry.status === 'in_progress') {
        return res.status(409).json({
          message: 'A request with this idempotency key is already being processed'
        })
      }

      res.setHeader('Idempotency-Status', 'replayed')

      if (entry.response?.headers) {
        for (const [headerName, headerValue] of Object.entries(entry.response.headers)) {
          res.setHeader(headerName, headerValue)
        }
      }

      return res.status(entry.response.statusCode).send(entry.response.body)
    }

    res.setHeader('Idempotency-Status', 'created')

    let responseBody

    const originalJson = res.json.bind(res)
    const originalSend = res.send.bind(res)

    res.json = (body) => {
      responseBody = body
      return originalJson(body)
    }

    res.send = (body) => {
      if (typeof responseBody === 'undefined') {
        responseBody = body
      }

      return originalSend(body)
    }

    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        releaseRequest(key)
        return
      }

      completeRequest({
        key,
        statusCode: res.statusCode,
        headers: cloneHeaders(res),
        body: responseBody,
        ttlMs
      })
    })

    res.on('close', () => {
      if (!res.writableEnded) {
        releaseRequest(key)
      }
    })

    return next()
  }
}

module.exports = idempotencyMiddleware
