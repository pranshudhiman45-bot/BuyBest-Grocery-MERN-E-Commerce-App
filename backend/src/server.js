const http = require('http')
const env = require('./config/env.js')
require('./config/passport.js')

const connectDB = require('./config/db.js')
const app = require('./app.js')
const { setupSocket } = require('./socket.js')

const server = http.createServer(app)
const io = setupSocket(server)

const listen = () =>
  new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(env.port, resolve)
  })

const startServer = async () => {
  await listen()
  await connectDB()

  console.log(`Server is running on port ${env.port}`)
  console.log(`Socket.IO is ready at /socket.io (${io.engine.clientsCount} connected clients)`)

  if (env.stripeSecretKey && env.stripeWebhookSecret) {
    console.log('Stripe webhook is ready at /api/payment/webhook')
  } else if (env.stripeSecretKey) {
    console.warn('Stripe webhook secret is missing. Set STRIPE_WEBHOOK_SECRET to finalize paid checkout sessions automatically.')
  }
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${env.port} is already in use. Stop the existing backend process or set a different PORT in backend/.env.`
    )
    process.exit(1)
  }

  console.error('Failed to start server:', error)
  process.exit(1)
})

startServer().catch((error) => {
  if (server.listening) {
    server.close()
  }

  console.error('Failed to start backend:', error)
  process.exit(1)
})
