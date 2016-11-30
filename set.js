let deck = [],
    faceUpCards = [],
    selectedCards = []

$(function() {
  deck = shuffleCards(generateCards())
  faceUpCards = pick(12)
  render()
  $('body').keypress(function(event) {
    if (event.which === 104) {
      giveHint()
    }
  })
})

function giveHint() {
  set = findSet(faceUpCards)
  if (set) {
    set.forEach(card => {
      $(`#${faceUpCards.indexOf(card)}`).toggleClass('hint')
    })
  } else {
    alert('There are no sets here')
    addThreeCards()
    render()
  }
}

function render() {
  $('tr').remove()
  displayCards()
  attachClickHandlers()
  console.log('Number of sets:', numberOfSets(faceUpCards))
}

function attachClickHandlers() {
  $('td').click(function() {
    $(this).toggleClass('selected')
    const card = faceUpCards[Number($(this).attr('id'))]
    if (!selectedCards.includes(card)) {
      selectedCards.push(card)
    } else {
      selectedCards.splice(selectedCards.indexOf(card), 1)
    }
    if (selectedCards.length === 3) {
      if (isASet(selectedCards)) {
        alert('You found a set!')
        discardAndReplace()
        render()
      } else {
        alert('This is not a set...')
        selectedCards = []
        $('td').removeClass('selected')
      }
    }
  })
}

// depends on faceUpCards
function displayCards() {
  const columns = Math.ceil(faceUpCards.length / 3)
  let htmlString = ''
  faceUpCards.forEach((card, i) => {
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
  return `M 0.5 0.5 A 0.5 0.5 0 0 0 0.5 -0.5 L -0.5 0.5 A 0.5 0.5 0 0 1 -0.5 -0.5 Z`
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

function findSet(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isASet([cards[i], cards[j], cards[k]])) {
          return [cards[i], cards[j], cards[k]]
        }
      }
    }
  }
  return null
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
function pick(n) {
  if (n === 1) return deck.pop()
  let pickedCards = []
  for (let i = 0; i < n; i++) {
    pickedCards.push(deck.pop())
  }
  return pickedCards
}

// depends on and alters selectedCards, faceUpCards, and deck
function discardAndReplace() {
  selectedCards.forEach(selectedCard => {
    faceUpCards.splice(faceUpCards.indexOf(selectedCard), 1, pick(1))
  })
  selectedCards = []
}

function addThreeCards() {
  const columns = Math.ceil(faceUpCards.length / 3)
  faceUpCards.splice(columns, 0, pick(1))
  faceUpCards.splice(columns * 2 + 1, 0, pick(1))
  faceUpCards.splice(faceUpCards.length, 0, pick(1))
}
