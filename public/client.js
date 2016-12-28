let state = {selectedCardIds: []}

const socket = io()

socket.on('renderData', function (renderData) {
  const {faceUpCards, foundSets, scores} = renderData
  if (faceUpCards) renderFaceUpCards(faceUpCards)
  if (foundSets) renderFoundSets(foundSets)
  if (scores) renderScores(scores)
})

socket.on('newlyFoundSet', function(newlyFoundSetCardIds) {
  console.log('newsetfound', newlyFoundSetCardIds)
  newlyFoundSetCardIds.forEach(id => {
    const cardDiv = document.getElementById(id)
    cardDiv.classList.add('new-set')
  })
})

socket.on('scoreData', function (scores) {
  renderScores(scores)
})

function renderScores (scores) {
  const scoresDiv = document.getElementById('scores')
  while (scoresDiv.lastChild) scoresDiv.removeChild(scoresDiv.lastChild)

  let scoreDiv, scoreTextNode, user
  for (userId in scores) {
    if (userId === socket.id) {
      user = 'Me'
    } else {
      user = userId.slice(0, 2)
    }
    scoreDiv = document.createElement('div')
    scoreTextNode = document.createTextNode(
      `${user}: ${scores[userId]}`
    )
    scoreDiv.appendChild(scoreTextNode)
    scoresDiv.appendChild(scoreDiv)
  }
}

function renderFaceUpCards (faceUpCards) {
  const cardsDiv = document.getElementById('cards')
  while (cardsDiv.lastChild) cardsDiv.removeChild(cardsDiv.lastChild)

  let cardDivs = faceUpCards.map((card, i) => {
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

  rows.forEach(row =>
    cardsDiv.appendChild(row)
  )

  attachCardClickHandlers(cardDivs)
}

function renderFoundSets (foundSets) {
  const setsDiv = document.getElementById('sets')
  while (setsDiv.lastChild) setsDiv.removeChild(setsDiv.lastChild)

  let setDivs = foundSets.map(set => {
    const setDiv = document.createElement('div')
    setDiv.className = 'set'
    let cardDivs = set.map(card => {
      let cardDiv = document.createElement('div')
      cardDiv.className = 'setCard'
      cardDiv.appendChild(cardSvgNode(card))
      return cardDiv
    })

    cardDivs.forEach(cardDiv =>
      setDiv.appendChild(cardDiv)
    )
    return setDiv
  })

  setDivs.forEach(setDiv =>
    setsDiv.appendChild(setDiv)
  )
}

function attachCardClickHandlers (cardDivs) {
  cardDivs.forEach(card => card.addEventListener('click', function () {
    const cardId = Number(this.id)
    if (
      !state.selectedCardIds.includes(cardId)
        && state.selectedCardIds.length < 3
    ) {
      state.selectedCardIds.push(cardId)
      this.classList.add('selected')
      if (state.selectedCardIds.length === 3) {
        socket.emit('guessSet', state.selectedCardIds)
        clearCardSelection()
      }
    } else if (state.selectedCardIds.includes(cardId)) {
      state.selectedCardIds.splice(state.selectedCardIds.indexOf(cardId), 1)
      this.classList.remove('selected')
    }
  }))
}

function clearCardSelection () {
  state.selectedCardIds = []
  const cardDivs = Array.from(document.getElementsByClassName('card'))
  cardDivs.forEach(card => {
    card.classList.remove('selected')
  })
}

function cardSvgNode (card) {
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

  const svg = createSvgElement('svg', {viewBox: '-1 0 2 4'})

  if (card.shading === 'striped') {
    const defs = createSvgElement('defs')

    const pattern = createSvgElement('pattern', {
      id: `${card.color}Striped`,
      x: '0',
      y: '0',
      width: '0.03',
      height: '1'
    })

    const line = createSvgElement('line', {
      x1: '0',
      y1: '0',
      x2: '0',
      y2: '1',
      'stroke-width': '0.04',
      stroke: colors[card.color]
    })

    pattern.appendChild(line)
    defs.appendChild(pattern)
    svg.appendChild(defs)
  }

  let path, yPosition
  let numberOfShapes = numbers[card.number]
  let fill = (card.shading === 'striped')
    ? `url(#${card.color}Striped)`
    : `${colors[card.color]}`

  for (let i = 0; i < numberOfShapes; i++) {
    yPosition = 2 - (numberOfShapes - 1) * 0.625 + i * 1.25

    const path = createSvgElement('path', {
      d: symbols[card.symbol],
      fill: fill,
      stroke: colors[card.color],
      'fill-opacity': shadings[card.shading],
      transform: `translate(0, ${yPosition})`
    })

    svg.appendChild(path)
  }

  return svg
}

function createSvgElement (tagName, attributes = {}) {
  const svgElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    tagName
  )
  for (let key in attributes) {
    svgElement.setAttribute(key, attributes[key])
  }
  return svgElement
}
