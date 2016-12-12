const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

server.listen(8080, () => console.log('listening on port 8080'))

app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/set.html')
})

io.on('connection', function (socket) {
  socket.emit('serverToClient', 'hello from the server')
  socket.on('clientToServer', function (data) {
    console.log(data)
  })
})
