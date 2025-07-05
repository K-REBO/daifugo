/**
 * Card class for Daifugo game
 * Supports Unicode display, value comparison, and DOM rendering
 */
class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.isJoker = suit === 'JOKER';
    this.selected = false;
    this.element = null;
  }

  /**
   * Get Unicode symbol for the suit
   */
  getUnicode() {
    if (this.isJoker) return '🃏';
    
    const suitMap = {
      '♠': '♠',
      '♥': '♥', 
      '♦': '♦',
      '♣': '♣'
    };
    
    return suitMap[this.suit] || this.suit;
  }

  /**
   * Get color for the suit (red or black)
   */
  getColor() {
    if (this.isJoker) return 'joker';
    if (this.suit === '♥' || this.suit === '♦') return 'red';
    return 'black';
  }

  /**
   * Get display text for the card
   */
  getDisplayText() {
    if (this.isJoker) return '🃏';
    return `${this.getUnicode()}${this.rank}`;
  }

  /**
   * Get numeric value for comparison
   * @param {boolean} isRevolution - Whether revolution is active
   */
  getValue(isRevolution = false) {
    if (this.isJoker) return 15; // Joker is always strongest
    
    const rankValues = {
      '3': 1,  '4': 2,  '5': 3,  '6': 4,  '7': 5,  '8': 6,
      '9': 7,  '10': 8, 'J': 9,  'Q': 10, 'K': 11, 'A': 12, '2': 13
    };
    
    const baseValue = rankValues[this.rank] || 0;
    
    if (isRevolution && !this.isJoker) {
      // In revolution, reverse order except for joker
      return 14 - baseValue;
    }
    
    return baseValue;
  }

  /**
   * Compare this card with another card
   */
  isStrongerThan(otherCard, isRevolution = false) {
    return this.getValue(isRevolution) > otherCard.getValue(isRevolution);
  }

  /**
   * Set selection state
   */
  setSelected(selected) {
    this.selected = selected;
    if (this.element) {
      if (selected) {
        this.element.classList.add('card-selected');
      } else {
        this.element.classList.remove('card-selected');
      }
    }
  }

  /**
   * Create DOM element for this card
   */
  createElement() {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${this.getColor() === 'red' ? 'card-red' : 
                              this.getColor() === 'black' ? 'card-black' : 'card-joker'}`;
    cardEl.textContent = this.getDisplayText();
    cardEl.dataset.suit = this.suit;
    cardEl.dataset.rank = this.rank;
    
    // Add click handler for selection
    cardEl.addEventListener('click', () => {
      this.setSelected(!this.selected);
    });
    
    this.element = cardEl;
    
    // Register card globally for testing
    if (!window.CardModule) {
      window.CardModule = { cards: [] };
    }
    window.CardModule.cards.push(this);
    
    return cardEl;
  }

  /**
   * Remove this card from DOM and cleanup
   */
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

/**
 * Utility functions for card management
 */
const CardUtils = {
  /**
   * Create a standard deck of cards
   */
  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const deck = [];
    
    // Add regular cards
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(new Card(suit, rank));
      }
    }
    
    // Add jokers
    deck.push(new Card('JOKER', 'JOKER'));
    deck.push(new Card('JOKER', 'JOKER'));
    
    return deck;
  },

  /**
   * Shuffle array of cards
   */
  shuffle(cards) {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Sort cards by value
   */
  sortCards(cards, isRevolution = false) {
    return [...cards].sort((a, b) => a.getValue(isRevolution) - b.getValue(isRevolution));
  }
};

// Global exports for browser use
window.CardModule = {
  Card,
  CardUtils,
  cards: [],
  getAllCards: () => window.CardModule.cards
};

// ES6 module export
export { Card, CardUtils };