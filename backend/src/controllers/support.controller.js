const ticketModel = require('../models/ticket.model.js')
const orderModel = require('../models/order.model.js') // Crucial for Mongoose populate resolution
const { USER_ROLES } = require('../constants/auth.constants.js')
const SUPPORT_ROOM = 'support_agents'

const senderPopulate = {
  path: 'messages.sender',
  select: 'name email role'
}

const userPopulate = {
  path: 'user',
  select: 'name email mobile orderHistory',
  populate: {
    path: 'orderHistory',
    select: 'orderId productDetails total paymentStatus createdAt',
    model: 'order'
  }
}

const formatMessage = (message) => {
  const sender = message?.sender
  const senderId =
    sender && typeof sender === 'object' && sender._id
      ? sender._id.toString()
      : sender?.toString?.() || ''

  return {
    _id: message._id,
    sender: senderId,
    senderId,
    senderName: sender && typeof sender === 'object' ? sender.name || 'Unknown' : 'Unknown',
    senderRole: sender && typeof sender === 'object' ? sender.role || USER_ROLES.USER : USER_ROLES.USER,
    text: message.text,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  }
}

const formatTicket = (ticket) => ({
  ...ticket.toObject(),
  messages: (ticket.messages || []).map(formatMessage)
})

const createTicket = async (req, res, next) => {
  try {
    const { title, description } = req.body
    
    // Support agents should probably not create tickets, but we don't strictly forbid it.
    // However standard behavior is standard users create them.
    let ticket = await ticketModel.create({
      user: req.user._id,
      title,
      description
    })

    ticket = await ticket.populate([userPopulate, senderPopulate])

    try {
      const { getIO } = require('../socket.js')
      getIO().to(SUPPORT_ROOM).emit('new_ticket', formatTicket(ticket))
    } catch (socketErr) {
      console.error('Socket emission failed', socketErr)
    }

    res.status(201).json({
      success: true,
      ticket: formatTicket(ticket)
    })
  } catch (error) {
    next(error)
  }
}

const getUserTickets = async (req, res, next) => {
  try {
    const tickets = await ticketModel
      .find({ user: req.user._id })
      .populate(senderPopulate)
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      tickets: tickets.map(formatTicket)
    })
  } catch (error) {
    next(error)
  }
}

const getAllTickets = async (req, res, next) => {
  try {
    // Both Open and Closed
    const tickets = await ticketModel
      .find()
      .populate([userPopulate, senderPopulate])
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      tickets: tickets.map(formatTicket)
    })
  } catch (error) {
    next(error)
  }
}

const getTicket = async (req, res, next) => {
  try {
    const ticket = await ticketModel.findById(req.params.id).populate([userPopulate, senderPopulate])
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    // Restrict access if standard user requests other's ticket
    if (req.user.role !== USER_ROLES.SUPPORT && ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' })
    }

    res.status(200).json({
      success: true,
      ticket: formatTicket(ticket)
    })
  } catch (error) {
    next(error)
  }
}

const closeTicket = async (req, res, next) => {
  try {
    const ticket = await ticketModel.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    )

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    res.status(200).json({
      success: true,
      ticket
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicket,
  closeTicket
}
