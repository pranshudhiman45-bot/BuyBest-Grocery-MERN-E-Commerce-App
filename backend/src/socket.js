const { Server } = require('socket.io')
const ticketModel = require('./models/ticket.model.js')
const env = require('./config/env.js')

let io

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('join_ticket', (ticketId) => {
      socket.join(ticketId)
      console.log(`Socket ${socket.id} joined ticket ${ticketId}`)
    })

    socket.on('send_message', async (data) => {
      const { ticketId, senderId, text } = data
      try {
        const ticket = await ticketModel.findById(ticketId)
        if (!ticket) return

        const newMessage = { sender: senderId, text }
        ticket.messages.push(newMessage)
        await ticket.save()

        const savedMessage = ticket.messages[ticket.messages.length - 1]

        io.to(ticketId).emit('receive_message', {
          ...savedMessage.toObject(),
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
