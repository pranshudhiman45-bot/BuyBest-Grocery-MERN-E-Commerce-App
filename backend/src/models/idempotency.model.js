const mongoose = require('mongoose')

const idempotencySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fingerprint: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    },
    response: {
      statusCode: Number,
      headers: {
        type: Map,
        of: String,
        default: {}
      },
      body: mongoose.Schema.Types.Mixed
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
)

const idempotencyModel = mongoose.model('idempotency', idempotencySchema)

module.exports = idempotencyModel
