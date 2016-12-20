let state = {
  faceUpCards: [],
  selectedCardIds: [],
  setCalled: false,
  iCalledSet: false,
  gaveUp: false
}

const socket = io()

attachKeypressEvents()

socket.on('faceUpCards', function (faceUpCards) {
  state.faceUpCards = faceUpCards
  renderCards()
})

socket.on('correct', function () {
  console.log('correct')
  clearSelection()
})

socket.on('incorrect', function () {
  console.log('incorrect')
  clearSelection()
})

socket.on('setCalled', function () {
  console.log('setCalled')
  state.setCalled = true
  document.body.style.backgroundColor = '#f8bbd0'
})

socket.on('youCalledSet', function () {
  console.log('youCalledSet')
  state.iCalledSet = true
  makeCardsSelectable()
  document.body.style.backgroundColor = '#c8e6c9'
})

socket.on('noSetCalled', function () {
  state.setCalled = false
  state.iCalledSet = false
  clearSelection()
  document.body.style.backgroundColor = ''
})

socket.on('countdown', function (countdown) {
  console.log(countdown)
})

socket.on('youGaveUp', function () {
  state.gaveUp = true
  document.body.style.backgroundColor = '#f8bbd0'
})

socket.on('resetGiveUp', function () {
  state.gaveUp = false
  document.body.style.backgroundColor = ''
})

socket.on('message', function (message) {
  alert(message)
})

function attachKeypressEvents () {
  document.body.addEventListener('keypress', function (event) {
    switch (event.which) {
      case 115:
        socket.emit('set')
        break;
      case 103:
        socket.emit('giveUp')
        break;
      default:
        console.log(event.which)
    }
  })
}

function attachClickHandlers () {
  const cardDivs = Array.from(document.getElementsByClassName('card'))
  cardDivs.forEach(card => card.addEventListener('click', clickHandler))
}

function clickHandler () {
  if (!state.iCalledSet) {
    alert('Press \'s\' to call set')
    return
  }
  const cardId = Number(this.id)
  if (
    !state.selectedCardIds.includes(cardId)
      && state.selectedCardIds.length < 3
  ) {
    state.selectedCardIds.push(cardId)
    this.classList.add('selected')
    if (state.selectedCardIds.length === 3) {
      socket.emit('guess', state.selectedCardIds)
    }
  } else if (state.selectedCardIds.includes(cardId)) {
    state.selectedCardIds.splice(state.selectedCardIds.indexOf(cardId), 1)
    this.classList.remove('selected')
  }
}

function clearSelection () {
  state.selectedCardIds = []
  const cardDivs = Array.from(document.getElementsByClassName('card'))
  cardDivs.forEach(card => {
    card.classList.remove('selected')
    card.classList.remove('selectable')
  })
}

function makeCardsSelectable () {
  const cardDivs = Array.from(document.getElementsByClassName('card'))
  cardDivs.forEach(card => card.classList.add('selectable'))
}


function renderCards () {
  clearCards()
  displayCards()
  attachClickHandlers()
}

function clearCards () {
  const cardsDiv = document.getElementById('cards')
  while (cardsDiv.lastChild) cardsDiv.removeChild(cardsDiv.lastChild)
}

function displayCards () {
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
  let fill = (card.shading === 'striped') ?
               `url(#${card.color}Striped)` :
               `${colors[card.color]}`

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
