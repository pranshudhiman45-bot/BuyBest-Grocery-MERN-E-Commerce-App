const { Server } = require('socket.io')
const ticketModel = require('./models/ticket.model.js')
const userModel = require('./models/user.model.js')
const env = require('./config/env.js')
const { USER_ROLES } = require('./constants/auth.constants.js')
const { ACCESS_TOKEN_COOKIE_NAME } = require('./constants/auth.constants.js')
const jwt = require('jsonwebtoken')

let io
const SUPPORT_ROOM = 'support_agents'

const parseCookieHeader = (cookieHeader = '') => {
  const parsedCookies = {}

  for (const chunk of cookieHeader.split(';')) {
    const [name, ...rest] = chunk.trim().split('=')

    if (!name) {
      continue
    }

    parsedCookies[name] = decodeURIComponent(rest.join('='))
  }

  return parsedCookies
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

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true
    }
  })

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie || '')
      const token = cookies[ACCESS_TOKEN_COOKIE_NAME]

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, env.accessTokenSecret)
      const user = await userModel.findById(decoded.userId)

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.user = user
      return next()
    } catch (error) {
      return next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    if (socket.user?.role === USER_ROLES.SUPPORT) {
      socket.join(SUPPORT_ROOM)
    }

    socket.on('join_ticket', async (ticketId) => {
      try {
        const ticket = await ticketModel.findById(ticketId).select('user')

        if (!ticket) {
          return
        }

        const isSupportAgent = socket.user.role === USER_ROLES.SUPPORT
        const isTicketOwner = ticket.user.toString() === socket.user._id.toString()

        if (!isSupportAgent && !isTicketOwner) {
          return
        }

        socket.join(ticketId)
        console.log(`Socket ${socket.id} joined ticket ${ticketId}`)
      } catch (error) {
        console.error('Error joining ticket room:', error)
      }
    })

    socket.on('send_message', async (data) => {
      const { ticketId, text } = data || {}
      try {
        const ticket = await ticketModel.findById(ticketId)
        if (!ticket) return

        const normalizedText = String(text || '').trim()

        if (!normalizedText || normalizedText.length > 2000) {
          return
        }

        const isSupportAgent = socket.user.role === USER_ROLES.SUPPORT
        const isTicketOwner = ticket.user.toString() === socket.user._id.toString()

        if (!isSupportAgent && !isTicketOwner) {
          return
        }

        if (ticket.status === 'closed') {
          return
        }

        const newMessage = { sender: socket.user._id, text: normalizedText }
        ticket.messages.push(newMessage)
        await ticket.save()

        await ticket.populate({
          path: 'messages.sender',
          select: 'name email role'
            })

        const savedMessage = ticket.messages[ticket.messages.length - 1]

        io.to(ticketId).emit('receive_message', {
          ...formatMessage(savedMessage),
          ticketId
        })
      } catch (err) {
        console.error('Error saving message:', err)
      }
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

module.exports = {
  setupSocket,
  getIO
}
