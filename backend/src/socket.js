const { Server } = require('socket.io')
const ticketModel = require('./models/ticket.model.js')
const userModel = require('./models/user.model.js')
const env = require('./config/env.js')
const {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  USER_ROLES
} = require('./constants/auth.constants.js')
const { hashToken } = require('./utils/auth.util.js')
const jwt = require('jsonwebtoken')

let io
const SUPPORT_ROOM = 'support_agents'
const MESSAGE_RATE_LIMIT_WINDOW_MS = 60 * 1000
const MESSAGE_RATE_LIMIT_MAX = 30

const parseCookieHeader = (cookieHeader = '') => {
  const parsedCookies = {}

  for (const chunk of cookieHeader.split(';')) {
    const [name, ...rest] = chunk.trim().split('=')

    if (!name) {
      continue
    }

    try {
      parsedCookies[name] = decodeURIComponent(rest.join('='))
    } catch (error) {
      parsedCookies[name] = rest.join('=')
    }
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

const findUserFromAccessToken = async (accessToken) => {
  if (!accessToken) {
    return null
  }

  const decoded = jwt.verify(accessToken, env.accessTokenSecret)
  return userModel.findById(decoded.userId)
}

const findUserFromRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    return null
  }

  const decoded = jwt.verify(refreshToken, env.refreshTokenSecret)
  const user = await userModel.findById(decoded.userId).select('+refreshToken')

  if (!user?.refreshToken || user.refreshToken !== hashToken(refreshToken)) {
    return null
  }

  return user
}

const isRateLimited = (socket) => {
  const now = Date.now()
  const recentMessages = (socket.data.messageTimestamps || []).filter(
    (timestamp) => now - timestamp < MESSAGE_RATE_LIMIT_WINDOW_MS
  )

  if (recentMessages.length >= MESSAGE_RATE_LIMIT_MAX) {
    socket.data.messageTimestamps = recentMessages
    return true
  }

  socket.data.messageTimestamps = [...recentMessages, now]
  return false
}

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  })

  console.log(
    `Socket.IO initialized${
      env.corsOrigins.length ? ` for origins: ${env.corsOrigins.join(', ')}` : ''
    }`
  )

  io.engine.on('connection_error', (error) => {
    console.error(
      `Socket.IO connection error: ${error.message || 'Unknown socket error'}`
    )
  })

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie || '')
      const cookieToken = cookies[ACCESS_TOKEN_COOKIE_NAME]
      const refreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME]
      const authToken = socket.handshake.auth?.token
      const bearerToken = socket.handshake.headers?.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : null

      const accessToken = cookieToken || authToken || bearerToken

      if (!accessToken && !refreshToken) {
        console.warn('Socket authentication rejected: missing auth token')
        return next(new Error('Authentication required'))
      }

      let user = null

      try {
        user = await findUserFromAccessToken(accessToken)
      } catch (error) {
        // Fall back to the refresh cookie below.
      }

      if (!user) {
        user = await findUserFromRefreshToken(refreshToken)
      }

      if (!user) {
        console.warn('Socket authentication rejected: user not found')
        return next(new Error('User not found'))
      }

      socket.user = user
      return next()
    } catch (error) {
      console.warn('Socket authentication rejected: invalid auth token')
      return next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    if (socket.user?.role === USER_ROLES.SUPPORT) {
      socket.join(SUPPORT_ROOM)
      console.log(`Support agent joined support room: ${socket.id}`)
    }

    socket.on('join_ticket', async (ticketId, callback) => {
      const reply = (payload) => {
        if (typeof callback === 'function') {
          callback(payload)
        }
      }

      try {
        if (!ticketId) {
          return reply({ ok: false, error: 'Ticket id is required' })
        }

        const ticket = await ticketModel.findById(ticketId).select('user status')

        if (!ticket) {
          return reply({ ok: false, error: 'Ticket not found' })
        }

        const isSupportAgent = socket.user.role === USER_ROLES.SUPPORT
        const isTicketOwner = ticket.user.toString() === socket.user._id.toString()

        if (!isSupportAgent && !isTicketOwner) {
          return reply({ ok: false, error: 'Not authorized to join this ticket' })
        }

        socket.join(ticketId)
        console.log(`Socket ${socket.id} joined ticket ${ticketId}`)
        return reply({ ok: true })
      } catch (error) {
        console.error('Error joining ticket room:', error)
        return reply({ ok: false, error: 'Unable to join ticket chat' })
      }
    })

    socket.on('send_message', async (data, callback) => {
      const reply = (payload) => {
        if (typeof callback === 'function') {
          callback(payload)
        }
      }

      const { ticketId, text } = data || {}
      if (!ticketId) {
        return reply({ ok: false, error: 'Ticket id is required' })
      }

      if (isRateLimited(socket)) {
        return reply({ ok: false, error: 'You are sending messages too quickly. Please wait a moment.' })
      }

      try {
        const ticket = await ticketModel.findById(ticketId)
        if (!ticket) {
          return reply({ ok: false, error: 'Ticket not found' })
        }

        const normalizedText = String(text || '').trim()

        if (!normalizedText || normalizedText.length > 2000) {
          return reply({ ok: false, error: 'Message must be between 1 and 2000 characters' })
        }

        const isSupportAgent = socket.user.role === USER_ROLES.SUPPORT
        const isTicketOwner = ticket.user.toString() === socket.user._id.toString()

        if (!isSupportAgent && !isTicketOwner) {
          return reply({ ok: false, error: 'Not authorized to send messages for this ticket' })
        }

        if (ticket.status === 'closed') {
          return reply({ ok: false, error: 'This ticket is closed' })
        }

        const newMessage = { sender: socket.user._id, text: normalizedText }
        ticket.messages.push(newMessage)
        await ticket.save()

        await ticket.populate({
          path: 'messages.sender',
          select: 'name email role'
        })

        const savedMessage = ticket.messages[ticket.messages.length - 1]

        // Ensure support agents are always inside the support room
        if (socket.user?.role === USER_ROLES.SUPPORT) {
          socket.join(SUPPORT_ROOM)
        }

        // Ensure the sender socket is also inside the ticket room
        socket.join(ticketId)

        const formattedMessage = {
          ...formatMessage(savedMessage),
          ticketId
        }

        // Send message to everyone inside the ticket room
        io.to(ticketId).emit('receive_message', formattedMessage)

        // Also notify support dashboard listeners
        io.to(SUPPORT_ROOM).emit('support_receive_message', formattedMessage)

        return reply({ ok: true, message: formattedMessage })
      } catch (err) {
        console.error('Error saving message:', err)
        return reply({ ok: false, error: 'Unable to send message' })
      }
    })

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`)
    })
  })

  return io
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
