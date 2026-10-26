// ==========================================
// RUMMY GAME - FRONTEND PROTOTYPE
// ==========================================

const suits = [
  { symbol: "♠", name: "spades", color: "black" },
  { symbol: "♥", name: "hearts", color: "red" },
  { symbol: "♦", name: "diamonds", color: "red" },
  { symbol: "♣", name: "clubs", color: "black" }
];

const ranks = [
  { name: "A", value: 1 },
  { name: "2", value: 2 },
  { name: "3", value: 3 },
  { name: "4", value: 4 },
  { name: "5", value: 5 },
  { name: "6", value: 6 },
  { name: "7", value: 7 },
  { name: "8", value: 8 },
  { name: "9", value: 9 },
  { name: "10", value: 10 },
  { name: "J", value: 11 },
  { name: "Q", value: 12 },
  { name: "K", value: 13 }
];

let deck = [];
let playerHand = [];
let opponentHand = [];
let discardPile = [];
let selectedCard = null;
let gameOver = false;


// ==========================================
// CREATE DECK
// ==========================================

function createDeck() {

  const newDeck = [];

  for (const suit of suits) {
    for (const rank of ranks) {

      newDeck.push({
        suit: suit.symbol,
        suitName: suit.name,
        color: suit.color,
        rank: rank.name,
        value: rank.value
      });

    }
  }

  return newDeck;
}


// ==========================================
// SHUFFLE
// Fisher-Yates algorithm
// ==========================================

function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}


// ==========================================
// START NEW GAME
// ==========================================

function newGame() {

  deck = shuffle(createDeck());

  playerHand = [];
  opponentHand = [];
  discardPile = [];

  selectedCard = null;
  gameOver = false;

  // Deal 13 cards to each player
  for (let i = 0; i < 13; i++) {

    playerHand.push(deck.pop());
    opponentHand.push(deck.pop());

  }

  // First discard
  discardPile.push(deck.pop());

  updateUI();

  showMessage("Your turn — draw a card.");
}


// ==========================================
// CREATE CARD HTML
// ==========================================

function createCardElement(card, index, hidden = false) {

  const div = document.createElement("div");

  div.classList.add("card");

  if (card.color === "red") {
    div.classList.add("red");
  }

  // Opponent cards are hidden
  if (hidden) {

    div.innerHTML = `
      <div class="suit">🂠</div>
    `;

    return div;
  }

  div.innerHTML = `
    <div class="rank">${card.rank}</div>
    <div class="suit">${card.suit}</div>
  `;

  div.addEventListener("click", () => {

    if (gameOver) return;

    selectCard(index);
  });

  return div;
}


// ==========================================
// DISPLAY CARDS
// ==========================================

function renderPlayerCards() {

  const container = document.getElementById("playerCards");

  container.innerHTML = "";

  playerHand.forEach((card, index) => {

    const element = createCardElement(card, index);

    if (selectedCard === index) {
      element.classList.add("selected");
    }

    container.appendChild(element);

  });
}


function renderOpponentCards() {

  const container = document.getElementById("opponentCards");

  container.innerHTML = "";

  opponentHand.forEach((card, index) => {

    container.appendChild(
      createCardElement(card, index, true)
    );

  });
}


// ==========================================
// UPDATE UI
// ==========================================

function updateUI() {

  renderPlayerCards();
  renderOpponentCards();

  document.getElementById("score").textContent =
    calculateScore(playerHand);

  if (discardPile.length > 0) {

    const card = discardPile[discardPile.length - 1];

    document.getElementById("discardCard").textContent =
      `${card.rank}${card.suit}`;

  }

}


// ==========================================
// SELECT CARD
// ==========================================

function selectCard(index) {

  selectedCard =
    selectedCard === index ? null : index;

  renderPlayerCards();
}


// ==========================================
// DRAW CARD
// ==========================================

document.getElementById("drawPile").addEventListener("click", () => {

  if (gameOver) return;

  if (deck.length === 0) {

    showMessage("No cards left in the draw pile.");

    return;
  }

  const card = deck.pop();

  playerHand.push(card);

  selectedCard = null;

  updateUI();

  showMessage(
    `You drew ${card.rank}${card.suit}. Select a card to discard.`
  );

});


// ==========================================
// DISCARD CARD
// ==========================================

document.getElementById("discardPile").addEventListener("click", () => {

  if (gameOver) return;

  if (selectedCard === null) {

    showMessage("Select a card from your hand first.");

    return;
  }

  const card = playerHand.splice(selectedCard, 1)[0];

  discardPile.push(card);

  selectedCard = null;

  updateUI();

  showMessage(
    `You discarded ${card.rank}${card.suit}.`
  );

  // Give computer a simple turn
  setTimeout(computerTurn, 700);

});


// ==========================================
// COMPUTER TURN
// ==========================================

function computerTurn() {

  if (gameOver) return;

  if (deck.length > 0) {
    opponentHand.push(deck.pop());
  }

  // Computer discards a random card
  const randomIndex =
    Math.floor(Math.random() * opponentHand.length);

  const discarded =
    opponentHand.splice(randomIndex, 1)[0];

  discardPile.push(discarded);

  updateUI();

  showMessage(
    `Computer discarded ${discarded.rank}${discarded.suit}. Your turn.`
  );

}


// ==========================================
// SORT CARDS
// ==========================================

document.getElementById("sortBtn").addEventListener("click", () => {

  playerHand.sort((a, b) => {

    if (a.suitName === b.suitName) {
      return a.value - b.value;
    }

    return a.suitName.localeCompare(b.suitName);
  });

  selectedCard = null;

  updateUI();

});


// ==========================================
// SCORE
// ==========================================

function calculateScore(hand) {

  return hand.reduce((total, card) => {

    if (card.value >= 10) {
      return total + 10;
    }

    return total + card.value;

  }, 0);

}


// ==========================================
// DECLARE
// ==========================================

document.getElementById("declareBtn").addEventListener("click", () => {

  if (playerHand.length < 13) {

    showMessage(
      "You need 13 cards to declare."
    );

    return;
  }

  const valid = checkBasicRummyValidity(playerHand);

  if (valid) {

    gameOver = true;

    showMessage(
      "🎉 Valid declaration! You win this prototype round."
    );

  } else {

    showMessage(
      "❌ Invalid declaration. Arrange your cards into valid sequences/sets."
    );

  }

});


// ==========================================
// BASIC VALIDATION
// ==========================================

function checkBasicRummyValidity(hand) {

  // This is a simplified validator.
  // A production rummy game needs a complete
  // sequence + set solver.

  const suitGroups = {};

  for (const card of hand) {

    if (!suitGroups[card.suitName]) {
      suitGroups[card.suitName] = [];
    }

    suitGroups[card.suitName].push(card.value);
  }

  // Look for at least one 3-card consecutive sequence
  for (const suit in suitGroups) {

    const values =
      suitGroups[suit].sort((a, b) => a - b);

    for (let i = 0; i < values.length - 2; i++) {

      if (
        values[i + 1] === values[i] + 1 &&
        values[i + 2] === values[i] + 2
      ) {

        return true;
      }
    }
  }

  return false;
}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text) {

  document.getElementById("message").textContent = text;
}


// ==========================================
// NEW GAME BUTTON
// ==========================================

document.getElementById("newGameBtn").addEventListener("click", () => {

  newGame();

});


// ==========================================
// START
// ==========================================

newGame();