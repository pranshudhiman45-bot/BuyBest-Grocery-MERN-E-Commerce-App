const http = require('http')
const env = require('./config/env.js')
require('./config/passport.js')

const connectDB = require('./config/db.js')
const app = require('./app.js')
const { setupSocket } = require('./socket.js')

const server = http.createServer(app)
setupSocket(server)

const startServer = async () => {
  await connectDB()

  server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`)
  })
}

startServer()
