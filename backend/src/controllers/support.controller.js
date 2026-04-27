const ticketModel = require('../models/ticket.model.js')
const orderModel = require('../models/order.model.js') // Crucial for Mongoose populate resolution
const { USER_ROLES } = require('../constants/auth.constants.js')

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

    ticket = await ticket.populate({
      path: 'user',
      select: 'name email mobile orderHistory',
      populate: {
        path: 'orderHistory',
        select: 'orderId productDetails total paymentStatus createdAt',
        model: 'order'
      }
    })

    try {
      const { getIO } = require('../socket.js')
      getIO().emit('new_ticket', ticket)
    } catch (socketErr) {
      console.error('Socket emission failed', socketErr)
    }

    res.status(201).json({
      success: true,
      ticket
    })
  } catch (error) {
    next(error)
  }
}

const getUserTickets = async (req, res, next) => {
  try {
    const tickets = await ticketModel.find({ user: req.user._id }).sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      tickets
    })
  } catch (error) {
    next(error)
  }
}

const getAllTickets = async (req, res, next) => {
  try {
    // Both Open and Closed
    const tickets = await ticketModel.find().populate({
      path: 'user',
      select: 'name email mobile orderHistory',
      populate: {
        path: 'orderHistory',
        select: 'orderId productDetails total paymentStatus createdAt',
        model: 'order'
      }
    }).sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      tickets
    })
  } catch (error) {
    next(error)
  }
}

const getTicket = async (req, res, next) => {
  try {
    const ticket = await ticketModel.findById(req.params.id).populate({
      path: 'user',
      select: 'name email mobile orderHistory',
      populate: {
        path: 'orderHistory',
        select: 'orderId productDetails total paymentStatus createdAt',
        model: 'order'
      }
    })
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    // Restrict access if standard user requests other's ticket
    if (req.user.role !== USER_ROLES.SUPPORT && ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' })
    }

    res.status(200).json({
      success: true,
      ticket
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
