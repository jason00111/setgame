function render() {
  saveGame()
  renderCards()
  renderScore()
}

function renderCards() {
  clearCards()
  displayCards()
  attachClickHandlers()
  attachHoverHandlers()
}

function clearCards() {
  const cardsDiv = document.getElementById('cards')
  while (cardsDiv.lastChild) cardsDiv.removeChild(cardsDiv.lastChild)
}

function renderScore() {
  const scoreBoard = document.getElementById('score')

  while (scoreBoard.lastChild) scoreBoard.removeChild(scoreBoard.lastChild)

  const scoreDiv = document.createElement('div')
  const scoreText = document.createTextNode(`Score: ${state.score}`)
  scoreDiv.appendChild(scoreText)

  const noOfSetsDiv = document.createElement('div')
  const noOfSetsText = document.createTextNode(`Possible sets: ${numberOfSets(state.faceUpCards)}`)
  noOfSetsDiv.appendChild(noOfSetsText)

  const inputKeysDiv = document.createElement('div')

  const resetDiv = document.createElement('div')
  const add3Div = document.createElement('div')
  const hintDiv = document.createElement('div')
  const inputDiv = document.createElement('div')

  const resetText = document.createTextNode('r: reset game')
  const add3Text = document.createTextNode('3: add 3 cards')
  const hintText = document.createTextNode('h: hint')
  const inputText = document.createTextNode('i: toggle input mode')

  resetDiv.appendChild(resetText)
  add3Div.appendChild(add3Text)
  hintDiv.appendChild(hintText)
  inputDiv.appendChild(inputText)

  inputKeysDiv.appendChild(resetDiv)
  inputKeysDiv.appendChild(add3Div)
  inputKeysDiv.appendChild(hintDiv)
  inputKeysDiv.appendChild(inputDiv)

  scoreBoard.appendChild(scoreDiv)
  scoreBoard.appendChild(noOfSetsDiv)
  scoreBoard.appendChild(inputKeysDiv)
}

function attachClickHandlers() {
  const cardDivs = Array.from(document.getElementsByClassName('card'))
  cardDivs.forEach(card =>
    card.addEventListener('click', function() {
      this.classList.toggle('selected')
      const card = state.faceUpCards[Number(this.id)]
      if (!state.selectedCards.includes(card)) {
        state.selectedCards.push(card)
      } else {
        state.selectedCards.splice(state.selectedCards.indexOf(card), 1)
      }
      if (state.selectedCards.length >= 3) {
        if (isASet(state.selectedCards)) {
          state.score++
          discardAndReplace()
          render()
          state.hintI = 0
        } else {
          alert('This is not a set...')
          if (state.score > 0) state.score--
          render()
          state.selectedCards = []
          const cardDivs = Array.from(document.getElementsByClassName('card'))
          cardDivs.forEach(card => card.classList.remove('selected'))
        }
      }
    })
  )
}

function attachKeypressEvents () {
  document.body.addEventListener('keypress', function(event) {
    switch (event.which) {
      case 104:
        giveHint()
        break
      case 114:
        resetGame()
        break
      case 51:
        addThreeCards()
        break
      case 105:
        if (!state.inputMode)
          state.inputMode = true
        else
          state.inputMode = false
        // renderCards()
        break
      default:
        // console.log(event.which)
    }
  })
}

function attachHoverHandlers() {
  const cardDivs = Array.from(document.getElementsByClassName('card'))
  cardDivs.forEach(card => {

    card.addEventListener('mouseenter', function() {
      if (!state.inputMode) return
      this.classList.remove('card')
      this.classList.add('input-card')
      renderSmallCards(this)
    })

    card.addEventListener('mouseleave', function() {
      if (!state.inputMode) return
      this.classList.remove('input-card')
      this.classList.add('card')
      while (this.lastChild)
        this.removeChild(this.lastChild)
      const card = state.faceUpCards[this.id]
      this.appendChild(cardSvgNode(card))
    })

  })
}

function renderSmallCards(bigCardDiv) {
  while (bigCardDiv.lastChild)
    bigCardDiv.removeChild(bigCardDiv.lastChild)
  const card = state.faceUpCards[bigCardDiv.id]
  const smallCards = generateInputCards(card)
  const cardDivs = smallCards.map((card, i) => {
    const cardDiv = document.createElement('div')
    cardDiv.className = 'small-card'
    cardDiv.id = `small ${i}`
    cardDiv.appendChild(cardSvgNode(card))
    return cardDiv
  })

  let row
  let rows = cardDivs.reduce((rows, cardDiv, i) => {
    if (i % 3 === 0) {
      row = document.createElement('div')
      row.className = 'row'
    }
    row.appendChild(cardDiv)
    return rows.concat(row)
  }, [])

  rows.forEach(row => bigCardDiv.appendChild(row))

  attachSmallCardClickHandlers(cardDivs, smallCards, bigCardDiv)
}

function attachSmallCardClickHandlers(smallCardDivs, smallCards, bigCardDiv) {
  smallCardDivs.forEach(smallCardDiv =>
    smallCardDiv.addEventListener('click', function(event) {
      event.stopPropagation()
      Object.assign(state.faceUpCards[bigCardDiv.id],
        smallCards[parseInt(this.id.slice(-1))])
      // renderSmallCards(bigCardDiv)
    })
  )
}

function generateInputCards(card) {
  let cards = []
  let newCard

  for (color of ['red', 'green', 'purple']) {
    newCard = Object.assign({}, card, {color})
    cards.push(newCard)
  }
  for (number of ['one', 'two', 'three']) {
    newCard = Object.assign({}, card, {number})
    cards.push(newCard)
  }
  for (shading of ['solid', 'striped', 'open']) {
    newCard = Object.assign({}, card, {shading})
    cards.push(newCard)
  }
  for (symbol of ['diamond', 'squiggle', 'oval']) {
    newCard = Object.assign({}, card, {symbol})
    cards.push(newCard)
  }

  return cards
}

// depends on faceUpCards
function displayCards() {
  let cardDivs = state.faceUpCards.map((card, i) => {
    let cardDiv = document.createElement('div')
    cardDiv.className = 'card'
    cardDiv.id = i
    cardDiv.appendChild(cardSvgNode(card))
    return cardDiv
  })

  const cardsPerRow = Math.ceil(cardDivs.length / 3)
  let row

  let rows = cardDivs.reduce((rows, cardDiv, i) => {
    if (i % cardsPerRow === 0) {
      row = document.createElement('div')
      row.className = 'row'
    }
    row.appendChild(cardDiv)
    return rows.concat(row)
  }, [])

  const cardsDiv = document.getElementById('cards')

  rows.forEach(row =>
    cardsDiv.appendChild(row)
  )
}

function cardSvgNode(card) {
  const numbers = {
    one: 1,
    two: 2,
    three: 3
  }

  const SQRT3_2 = Math.sqrt(3) / 2

  const symbols = {
    diamond: `M ${-SQRT3_2} 0 L 0 0.5 L ${SQRT3_2} 0 L 0 -0.5 Z`,

    squiggle: 'm -1,0 c 0.0219,-0.22632 0.19302,-0.42982 0.40935,-0.49502 0.18511,-0.0385 0.35255,0.0735 0.52058,0.1313 0.12701,0.0488 0.27616,0.062 0.3974,-0.0111 0.13821,-0.0674 0.26427,-0.19055 0.42758,-0.18155 0.16573,0.0246 0.28275,0.19002 0.29308,0.34992 0.003,0.20586 -0.14932,0.3758 -0.31174,0.48394 -0.11055,0.0754 -0.24898,0.12618 -0.38284,0.0895 -0.18566,-0.0396 -0.35768,-0.16081 -0.55425,-0.13296 -0.17664,0.0339 -0.28742,0.21813 -0.47144,0.22797 -0.15944,-0.0138 -0.26399,-0.16518 -0.30768,-0.30625 -0.0163,-0.0505 -0.0219,-0.10376 -0.0191,-0.15642 z',

    oval: 'M 0.5 0.5 A 0.5 0.5 0 0 0 0.5 -0.5 L -0.5 -0.5 A 0.5 0.5 0 0 0 -0.5 0.5 Z'
  }

  const shadings = {
    solid: 1,
    striped: 1,
    open: 0
  }

  const colors = {
    red: '#e91e63',
    green: '#4caf50',
    purple: '#673ab7'
  }

  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '-1 0 2 4')

  if (card.shading === 'striped') {
    let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')

    let pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern')
    pattern.setAttribute('id', 'Striped')
    pattern.setAttribute('x', '0')
    pattern.setAttribute('y', '0')
    pattern.setAttribute('width', '0.03')
    pattern.setAttribute('height', '1')

    let line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', '0')
    line.setAttribute('y1', '0')
    line.setAttribute('x2', '0')
    line.setAttribute('y2', '1')
    line.setAttribute('stroke-width', '0.04')
    line.setAttribute('stroke', colors[card.color])

    pattern.appendChild(line)
    defs.appendChild(pattern)
    svg.appendChild(defs)
  }

  let path, yPosition
  let numberOfShapes = numbers[card.number]
  let fill = (card.shading === 'striped') ?
               'url(#Striped)' :
               `${colors[card.color]}`

  for (let i = 0; i < numberOfShapes; i++) {
    yPosition = 2 - (numberOfShapes - 1) * 0.625 + i * 1.25

    path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', symbols[card.symbol])
    path.setAttribute('fill', fill)
    path.setAttribute('stroke', colors[card.color])
    path.setAttribute('fill-opacity', shadings[card.shading])
    path.setAttribute('transform', `translate(0, ${yPosition})`)

    svg.appendChild(path)
  }

  return svg
}
