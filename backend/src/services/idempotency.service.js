const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

const requests = new Map()

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

const createIdempotencyKey = () => uuidv4()

const getIdempotencyKey = (req) => {
  const headerKey = req.get('Idempotency-Key')

  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim()
  }

  return createIdempotencyKey()
}

const purgeExpiredEntries = () => {
  const now = Date.now()

  for (const [key, value] of requests.entries()) {
    if (value.expiresAt <= now) {
      requests.delete(key)
    }
  }
}

const getStoredRequest = (key) => {
  const entry = requests.get(key)

  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    requests.delete(key)
    return null
  }

  return entry
}

const startRequest = ({ key, fingerprint, ttlMs = DEFAULT_TTL_MS }) => {
  purgeExpiredEntries()

  const existingEntry = getStoredRequest(key)

  if (existingEntry) {
    return {
      created: false,
      entry: existingEntry
    }
  }

  const entry = {
    key,
    fingerprint,
    status: 'in_progress',
    response: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  }

  requests.set(key, entry)

  return {
    created: true,
    entry
  }
}

const completeRequest = ({ key, statusCode, headers, body, ttlMs = DEFAULT_TTL_MS }) => {
  const entry = getStoredRequest(key)

  if (!entry) {
    return null
  }

  entry.status = 'completed'
  entry.response = {
    statusCode,
    headers,
    body
  }
  entry.expiresAt = Date.now() + ttlMs

  return entry
}

const releaseRequest = (key) => {
  requests.delete(key)
}

module.exports = {
  DEFAULT_TTL_MS,
  buildRequestFingerprint,
  createIdempotencyKey,
  getIdempotencyKey,
  getStoredRequest,
  startRequest,
  completeRequest,
  releaseRequest
}
