const http = require('http')
const env = require('../src/config/env.js')

const requestPath = '/socket.io/?EIO=4&transport=polling'

const req = http.get(
  {
    hostname: 'localhost',
    port: env.port,
    path: requestPath,
    timeout: 5000
  },
  (res) => {
    let body = ''

    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      body += chunk
    })
    res.on('end', () => {
      if (res.statusCode === 200 && body.startsWith('0{')) {
        console.log(`Socket.IO is working on port ${env.port}`)
        process.exit(0)
      }

      console.error(
        `Socket.IO check failed: expected 200 polling handshake, got ${res.statusCode || 'no status'}`
      )
      process.exit(1)
    })
  }
)

req.on('timeout', () => {
  req.destroy(new Error(`Socket.IO check timed out on port ${env.port}`))
})

req.on('error', (error) => {
  const details = [error.code, error.message].filter(Boolean).join(' - ')
  console.error(`Socket.IO check failed: ${details || 'Unknown error'}`)
  process.exit(1)
})
