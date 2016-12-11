let state = {
  deck: [],
  faceUpCards: [],
  selectedCards: [],
  score: 0,
  hintI: 0
}

function saveGame() {
  localStorage.deck = JSON.stringify(state.deck)
  localStorage.faceUpCards = JSON.stringify(state.faceUpCards)
  localStorage.score = JSON.stringify(state.score)
}

function loadGame() {
  if (localStorage.deck) {
    state.deck = JSON.parse(localStorage.deck)
    state.faceUpCards = JSON.parse(localStorage.faceUpCards)
    state.score = JSON.parse(localStorage.score)
    return true
  } else {
    return false
  }
}

function resetGame() {
  state = {
    deck: shuffleCards(generateCards()),
    faceUpCards: draw(12),
    selectedCards: [],
    score: 0,
    hintI: 0
  }
  render()
}

window.addEventListener('load', function() {
  if (!loadGame()) {
    state.deck = shuffleCards(generateCards())
    state.faceUpCards = draw(12)
  }
  render()
  attachKeypressEvents()
})

function giveHint() {
  sets = findSets(state.faceUpCards)
  if (sets.length !== 0) {
    sets[state.hintI].forEach(card => {
      let cardId = state.faceUpCards.indexOf(card)
      document.getElementById(cardId).classList.add('hint')
      window.setTimeout(
        function() {
          document.getElementById(cardId).classList.remove('hint')
        }, 350
      )
    })
    state.hintI = (state.hintI + 1) % sets.length
  } else {
    alert('There are no sets here')
    addThreeCards()
  }
}

function generateCards() {
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

function shuffleCards(unshuffledCards) {
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

function isASet(cards) {
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

function findSets(cards) {
  let sets = []
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isASet([cards[i], cards[j], cards[k]])) {
          sets.push([cards[i], cards[j], cards[k]])
        }
      }
    }
  }
  return sets
}

function numberOfSets(cards) {
  let count = 0
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isASet([cards[i], cards[j], cards[k]])) {
          count++
        }
      }
    }
  }
  return count
}

// depends on and alters deck
function draw(n) {
  while (n > state.deck.length) {
    n--
  }
  if (n === 0) {
    return null
  }
  if (n === 1) return state.deck.pop()
  let drawnCards = []
  for (let i = 0; i < n; i++) {
    drawnCards.push(state.deck.pop())
  }
  return drawnCards
}

// depends on and alters selectedCards, faceUpCards, and deck
function discardAndReplace() {
  let card
  state.selectedCards.forEach(selectedCard => {
    card = draw(1)
    if (card) {
      state.faceUpCards.splice(state.faceUpCards.indexOf(selectedCard), 1, card)
    } else {
      state.faceUpCards.splice(state.faceUpCards.indexOf(selectedCard), 1)
    }
  })
  state.selectedCards = []
}

// depends on and alters faceUpCards, and deck
function addThreeCards() {
  const columns = Math.ceil(state.faceUpCards.length / 3)
  let card = draw(1)
  if (card)
    state.faceUpCards.splice(columns, 0, card)
  card = draw(1)
  if (card)
    state.faceUpCards.splice(columns * 2 + 1, 0, draw(1))
  card = draw(1)
  if (card)
    state.faceUpCards.splice(state.faceUpCards.length, 0, draw(1))
  render()
}
