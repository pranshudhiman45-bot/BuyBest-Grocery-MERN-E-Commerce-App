const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },
    messages: [messageSchema]
  },
  { timestamps: true }
)

const ticketModel = mongoose.model('ticket', ticketSchema)

module.exports = ticketModel
