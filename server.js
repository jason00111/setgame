const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

let state = {
  deck: [],
  faceUpCards: [],
  users: {}
}

let port = process.env.PORT || 8080

server.listen(port, () => console.log(`listening on port ${port}`))

app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/set.html')
})

newGame()

io.on('connection', function(socket) {
  console.log(`a player connected`, socket.id)

  Object.assign(state.users, {
    [socket.id]: {
      foundSets: [],
      score: 0,
      socket: socket
    }
  })

  socket.emit('renderData', {
    faceUpCards: state.faceUpCards
  })
  io.emit('scoreData', allUsersScores(state.users))

  socket.on('disconnect', function () {
    console.log('a player disconnected', socket.id)
    delete state.users[socket.id]
    io.emit('scoreData', allUsersScores(state.users))
  })

  socket.on('guessSet', function (guessedCardIds) {
    const guessedCards = guessedCardIds.map(id => state.faceUpCards[id])
    if (isASet(guessedCards)) {
      console.log(socket.id, 'correctly guessed a set')
      ++ state.users[socket.id].score
      state.users[socket.id].foundSets.push(guessedCards)
      let {drawnCards, deck} = draw(3, state.deck)
      state.deck = deck
      state.faceUpCards = state.faceUpCards.map((card, id) => {
        if (guessedCardIds.indexOf(id) === -1) {
          return card
        } else {
          return drawnCards.pop()
        }
      })
      io.emit('newlyFoundSet', guessedCardIds)
      setTimeout(() => sendRenderDataToAll(state), 2000)
    } else {
      console.log(socket.id, 'incorrectly guessed a set')
      if (state.users[socket.id].score > 0) {
        -- state.users[socket.id].score
      }
      io.emit('scoreData', allUsersScores(state.users))
    }
  })
})

// pure
function allUsersScores(users) {
  let scores = {}
  for (userId in users) {
    scores[userId] = users[userId].score
  }
  return scores
}

// impure
function sendRenderDataToAll(state) {
  for (userId in state.users) {
    state.users[userId].socket.emit('renderData', {
      faceUpCards: state.faceUpCards,
      foundSets: state.users[userId].foundSets,
      scores: allUsersScores(state.users)
    })
  }
}

// impure
function newGame () {
  state.deck = shuffleCards(generateCards())
  const {drawnCards, deck} = draw(12, state.deck)
  state.faceUpCards = drawnCards
  state.deck = deck
}

// pure
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

// pure
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

// pure, draw n cards from inputDeck
function draw (n, inputDeck = []) {
  let outputDeck = inputDeck.slice()
  while (n > outputDeck.length) {
    n--
  }
  if (n === 0) {
    return {drawnCards: null, deck: outputDeck}
  }
  let drawnCards = []
  for (let i = 0; i < n; i++) {
    drawnCards.push(outputDeck.pop())
  }
  return {drawnCards: drawnCards, deck: outputDeck}
}

// pure, checks to see if cards make a set
// if, for any feature, the cards are not all the same and are also not all different, they are not a set
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
