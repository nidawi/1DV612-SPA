// Socket wrapper and storage.
const io = require('socket.io-client')('wss://1dv612-gateway.nidawi.me', {
  path: '/events'
})

module.exports = io