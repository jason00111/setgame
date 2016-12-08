let state = {
  deck: [],
  faceUpCards: [],
  selectedCards: [],
  score: 0,
  hintI: 0
}

function saveGame() {
  localStorage.state = JSON.stringify(state)
}

function loadGame() {
  if (localStorage.state) {
    state = JSON.parse(localStorage.state)
    return true
  } else {
    return false
  }
}

$(function() {
  if (!loadGame()) {
    state.deck = shuffleCards(generateCards())
    state.faceUpCards = draw(12)
  }
  renderCards()
  renderScore()
  $('body').keypress(function(event) {
    if (event.which === 104) {
      giveHint()
    }
  })
})

function giveHint() {
  sets = findSets(state.faceUpCards)
  if (sets.length !== 0) {
    sets[state.hintI].forEach(card => {
      $(`#${state.faceUpCards.indexOf(card)}`).addClass('hint')
      window.setTimeout(
        function() {
          $(`#${state.faceUpCards.indexOf(card)}`).removeClass('hint')
        }, 350
      )
    })
    state.hintI = (state.hintI + 1) % sets.length
  } else {
    alert('There are no sets here')
    addThreeCards()
    renderCards()
  }
}

function renderCards() {
  saveGame()
  $('tr').remove()
  displayCards()
  attachClickHandlers()
}

function renderScore() {
  $('#score').empty()
  $('#score').append(`<div>Score: ${state.score}</div>
                      <div>Possible sets: ${numberOfSets(state.faceUpCards)}</div>`)
}

function attachClickHandlers() {
  $('td').click(function() {
    $(this).toggleClass('selected')
    const card = state.faceUpCards[Number($(this).attr('id'))]
    if (!state.selectedCards.includes(card)) {
      state.selectedCards.push(card)
    } else {
      state.selectedCards.splice(state.selectedCards.indexOf(card), 1)
    }
    if (state.selectedCards.length === 3) {
      if (isASet(state.selectedCards)) {
        // alert('You found a set!')
        state.score++
        renderScore()
        discardAndReplace()
        renderCards()
        state.hintI = 0
      } else {
        alert('This is not a set...')
        if (state.score > 0) state.score--
        renderScore()
        state.selectedCards = []
        $('td').removeClass('selected')
      }
    }
  })
}

// depends on faceUpCards
function displayCards() {
  const columns = Math.ceil(state.faceUpCards.length / 3)
  let htmlString = ''
  state.faceUpCards.forEach((card, i) => {
    if (i % columns === 0) {
      htmlString += '<tr>'
    }
    htmlString += `<td id="${i}">`
    htmlString += cardHtml(card)
    htmlString += '</td>'
    if (i % columns === columns - 1) {
      htmlString += '</tr>\n'
    }
  })
  $('table').append(htmlString)
}

const symbols = {
  diamond: diamond,
  squiggle: squiggle,
  oval: oval
}

const colors = {
  red: '#e91e63',
  green: '#4caf50',
  purple: '#673ab7'
}

const shadings = {
  solid: 1,
  striped: 1,
  open: 0
}

function cardHtml(card) {
  if (!card) return ''
  let cardSymbols = ''
  let pathAttributes = ''
  let pattern = ''

  if (card.shading === 'striped') {
    pattern =
      `<defs>
        <pattern id="Striped" x="0" y="0" width="0.03" height="1">
          <line x1="0" y1="0" x2="0" y2="1" stroke-width="0.04" stroke=${colors[card.color]}/>
        </pattern>
      </defs>`
    pathAttributes =
      `d="${symbols[card.symbol]()}"
      stroke="${colors[card.color]}"
      fill="url(#Striped)"`
  } else {
    pathAttributes =
      `d="${symbols[card.symbol]()}"
      fill="${colors[card.color]}"
      stroke="${colors[card.color]}"
      fill-opacity="${shadings[card.shading]}"`
  }

  if (card.number === 'one') {
    cardSymbols =
      `${pattern}
      <path
        ${pathAttributes}
        transform="translate(0, 2)"/>`
  } else if (card.number === 'two') {
    cardSymbols =
      `${pattern}
      <path
        ${pathAttributes}
        transform="translate(0,1.375)"/>
      <path
        ${pathAttributes}
        transform="translate(0,2.625)"/>`
  } else if (card.number === 'three') {
    cardSymbols =
      `${pattern}
      <path
        ${pathAttributes}
        transform="translate(0,0.75)"/>
      <path
        ${pathAttributes}
        transform="translate(0,2)"/>
      <path
        ${pathAttributes}
        transform="translate(0,3.25)"/>`
  }

  return `<svg version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="-1 0 2 4">
      ${cardSymbols}
  </svg>`
}

function diamond() {
  const SQRT3_2 = Math.sqrt(3) / 2
  return `M ${-SQRT3_2} 0 L 0 0.5 L ${SQRT3_2} 0 L 0 -0.5 Z`
}

function squiggle() {
  return `m -1,0 c 0.0219,-0.22632 0.19302,-0.42982 0.40935,-0.49502 0.18511,-0.0385 0.35255,0.0735 0.52058,0.1313 0.12701,0.0488 0.27616,0.062 0.3974,-0.0111 0.13821,-0.0674 0.26427,-0.19055 0.42758,-0.18155 0.16573,0.0246 0.28275,0.19002 0.29308,0.34992 0.003,0.20586 -0.14932,0.3758 -0.31174,0.48394 -0.11055,0.0754 -0.24898,0.12618 -0.38284,0.0895 -0.18566,-0.0396 -0.35768,-0.16081 -0.55425,-0.13296 -0.17664,0.0339 -0.28742,0.21813 -0.47144,0.22797 -0.15944,-0.0138 -0.26399,-0.16518 -0.30768,-0.30625 -0.0163,-0.0505 -0.0219,-0.10376 -0.0191,-0.15642 z`
}

function oval() {
  return `M 0.5 0.5 A 0.5 0.5 0 0 0 0.5 -0.5 L -0.5 -0.5 A 0.5 0.5 0 0 0 -0.5 0.5 Z`
}

///////

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
}
