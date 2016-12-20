const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

let state = {
  deck: [],
  faceUpCards: [],
  setCalled: false,
  timerId: null,
  countdown: 10,
  users: {}
}

server.listen(8080, () => console.log('listening on port 8080'))

app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/set.html')
})

newGame()

io.on('connection', function (socket) {
  console.log(`a player connected`, socket.id)
  state.users = Object.assign(state.users, {
    [socket.id]: {
      connected: true,
      gaveUp: false
    }
  })
  socket.emit('faceUpCards', state.faceUpCards)

  socket.on('disconnect', function () {
    console.log('a player disconnected', socket.id)
    state.users[socket.id].connected = false
  })

  socket.on('set', function () {
    if (state.users[socket.id].gaveUp) {
      socket.emit('message', 'You gave up. Wait until everyone else gives up or someone else finds a set')
      return
    }
    console.log('set called by', socket.id)
    if (!state.setCalled) {
      state.setCalled = socket.id
      socket.broadcast.emit('setCalled')
      socket.emit('youCalledSet')
      state.countdownId = setInterval(function () {
        io.emit('countdown', state.countdown)
        if (state.countdown > 0) {
          state.countdown--
        } else {
          clearInterval(state.countdownId)
          state.countdown = 10
          state.setCalled = false
          io.emit('noSetCalled')
        }
      }, 1000)
    }
  })

  socket.on('guess', function (selectedCardIds) {
    if (state.setCalled !== socket.id) return
    if (
      isASet(selectedCardIds.map(id => state.faceUpCards[id]))
    ) {
      socket.emit('correct')
      discardAndReplace(selectedCardIds)
      io.emit('faceUpCards', state.faceUpCards)
      io.emit('resetGiveUp')
    } else {
      socket.emit('incorrect')
    }
    clearInterval(state.countdownId)
    io.emit('noSetCalled')
    state.countdown = 10
    state.setCalled = false
  })

  socket.on('giveUp', function () {
    console.log(socket.id, 'gave up')
    socket.emit('youGaveUp')
    state.users[socket.id].gaveUp = true
    if (everyoneGaveUp()) {
      addThreeCards()
      io.emit('faceUpCards', state.faceUpCards)
      io.emit('resetGiveUp')
      resetGiveUp()
    }
  })
})

function everyoneGaveUp () {
  for (let userId in state.users) {
    if (state.users[userId].connected && !state.users[userId].gaveUp) {
      return false
    }
  }
  return true
}

function resetGiveUp () {
  for (let userId in state.users) {
    state.users[userId].gaveUp = false
  }
}

function addThreeCards () {
  const columns = Math.ceil(state.faceUpCards.length / 3)
  let card = draw1()
  if (card) {
    state.faceUpCards.splice(columns, 0, card)
  }
  card = draw1()
  if (card) {
    state.faceUpCards.splice(columns * 2 + 1, 0, card)
  }
  card = draw1()
  if (card) {
    state.faceUpCards.splice(state.faceUpCards.length, 0, card)
  }
}

function discardAndReplace (selectedCardIds) {
  let newCard
  selectedCardIds.forEach(id => {
    newCard = draw1()
    if (newCard) {
      state.faceUpCards.splice(id, 1, newCard)
    } else {
      state.faceUpCards.splice(id, 1)
    }
  })
}

function newGame () {
  state.deck = shuffleCards(generateCards())
  state.faceUpCards = draw(12)
}

function generateCards () {
  let cards = []
  for (number of ['one', 'two', 'three']) {
    for (symbol of ['diamond', 'squiggle', 'oval']) {
      for (shading of ['solid', 'striped', 'open']) {
        for (color of ['red', 'green', 'purple']) {
          cards.push({number, symbol, shading, color})
        }
      }
    }
  }
  return cards
}

function shuffleCards (unshuffledCards) {
  let shuffledCards = unshuffledCards.slice()
  let randomI, temp
  for (let i = shuffledCards.length - 1; i > 0; i--) {
    randomI = Math.floor(Math.random() * i)
    temp = shuffledCards[randomI]
    shuffledCards[randomI] = shuffledCards[i]
    shuffledCards[i] = temp
  }
  return shuffledCards
}

function draw (n) {
  while (n > state.deck.length) {
    n--
  }
  if (n === 0) {
    return null
  }
  let drawnCards = []
  for (let i = 0; i < n; i++) {
    drawnCards.push(state.deck.pop())
  }
  return drawnCards
}

function draw1 () {
  if (state.deck.length > 0) {
    return state.deck.pop()
  } else {
    return null
  }
}

function isASet (cards) {
  for (feature in cards[0]) {
    if (
      !(
        cards[0][feature] === cards[1][feature] &&
        cards[1][feature] === cards[2][feature]
      ) && !(
        cards[0][feature] !== cards[1][feature] &&
        cards[1][feature] !== cards[2][feature] &&
        cards[2][feature] !== cards[0][feature]
      )
    ) {
      return false
    }
  }
  return true
}
