const crypto = require('crypto')
const idempotencyModel = require('../models/idempotency.model.js')

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

const buildRequestFingerprint = (req) => {
  const payload = {
    method: req.method,
    path: req.originalUrl,
    body: req.body ?? null,
    query: req.query ?? null
  }

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
}

const getIdempotencyKey = (req) => {
  const headerKey = req.get('Idempotency-Key')

  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim()
  }

  return null
}

const normalizeEntry = (entry) => {
  if (!entry) {
    return null
  }

  const plainEntry = entry.toObject ? entry.toObject() : entry

  return {
    ...plainEntry,
    response: plainEntry.response
      ? {
          ...plainEntry.response,
          headers:
            plainEntry.response.headers instanceof Map
              ? Object.fromEntries(plainEntry.response.headers)
              : plainEntry.response.headers || {}
        }
      : null
  }
}

const startRequest = async ({ key, fingerprint, ttlMs = DEFAULT_TTL_MS, retryExpired = true }) => {
  const expiresAt = new Date(Date.now() + ttlMs)

  try {
    const entry = await idempotencyModel.create({
      key,
      fingerprint,
      status: 'in_progress',
      expiresAt
    })

    return {
      created: true,
      entry: normalizeEntry(entry)
    }
  } catch (error) {
    if (error.code !== 11000) {
      throw error
    }

    const entry = await idempotencyModel.findOne({ key })

    if (entry?.expiresAt <= new Date() && retryExpired) {
      await idempotencyModel.deleteOne({ _id: entry._id })
      return startRequest({ key, fingerprint, ttlMs, retryExpired: false })
    }

    return {
      created: false,
      entry: normalizeEntry(entry)
    }
  }
}

const completeRequest = async ({ key, statusCode, headers, body, ttlMs = DEFAULT_TTL_MS }) => {
  return idempotencyModel.findOneAndUpdate(
    { key },
    {
      $set: {
        status: 'completed',
        response: {
          statusCode,
          headers,
          body
        },
        expiresAt: new Date(Date.now() + ttlMs)
      }
    },
    { new: true }
  )
}

const releaseRequest = async (key) => {
  await idempotencyModel.deleteOne({ key, status: 'in_progress' })
}

module.exports = {
  DEFAULT_TTL_MS,
  buildRequestFingerprint,
  getIdempotencyKey,
  startRequest,
  completeRequest,
  releaseRequest
}
