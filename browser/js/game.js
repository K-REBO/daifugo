/**
 * Game logic for Daifugo
 * Handles deck creation, dealing, play validation, and turn flow
 */

class GameLogic {
  constructor(playerManager) {
    this.playerManager = playerManager;
    this.deck = [];
    this.fieldCards = [];
    this.lastPlayedCards = [];
    this.lastPlayerName = ''; // Track who played the last cards
    this.gameState = 'waiting'; // 'waiting', 'playing', 'finished'
    this.isRevolution = false;
    this.skipCount = 0;
    this.finishedOrder = [];
  }

  /**
   * Create a standard 52-card deck + 2 jokers
   */
  createDeck() {
    this.deck = [];
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    
    // Add regular cards
    suits.forEach(suit => {
      ranks.forEach(rank => {
        this.deck.push(new window.CardModule.Card(suit, rank));
      });
    });
    
    // Add jokers
    this.deck.push(new window.CardModule.Card('JOKER', 'JOKER'));
    this.deck.push(new window.CardModule.Card('JOKER', 'JOKER'));
    
    // Shuffle deck
    this.shuffleDeck();
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * Start a new game
   */
  startGame() {
    console.log('🎮 Starting new game...');
    
    // Reset game state
    this.gameState = 'playing';
    this.isRevolution = false;
    this.skipCount = 0;
    this.finishedOrder = [];
    this.fieldCards = [];
    this.lastPlayedCards = [];
    
    // Create and deal cards
    this.createDeck();
    this.playerManager.dealCards(this.deck);
    
    // Find player with 3 of clubs to start
    this.findStartingPlayer();
    
    console.log('✅ Game started successfully');
    return true;
  }

  /**
   * Find the player with 3 of clubs to start the game
   */
  findStartingPlayer() {
    const players = this.playerManager.getAllPlayers();
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const has3Clubs = player.getHand().some(card => 
        card.suit === '♣' && card.rank === '3'
      );
      
      if (has3Clubs) {
        this.playerManager.setCurrentPlayer(i);
        break;
      }
    }
  }

  /**
   * Validate if cards can be played
   */
  canPlayCards(cards) {
    if (!cards || cards.length === 0) {
      return { valid: false, reason: 'カードが選択されていません' };
    }

    // Check if all cards have same rank (except jokers)
    const nonJokerCards = cards.filter(card => !card.isJoker);
    if (nonJokerCards.length > 1) {
      const firstRank = nonJokerCards[0].rank;
      const allSameRank = nonJokerCards.every(card => card.rank === firstRank);
      if (!allSameRank) {
        return { valid: false, reason: '同じランクのカードを選択してください' };
      }
    }

    // Check if it beats the last played cards
    if (this.lastPlayedCards.length > 0) {
      // Must play same number of cards
      if (cards.length !== this.lastPlayedCards.length) {
        return { valid: false, reason: `${this.lastPlayedCards.length}枚のカードを出してください` };
      }

      // Must beat the last played value
      const newValue = this.getCardsValue(cards);
      const lastValue = this.getCardsValue(this.lastPlayedCards);
      
      if (newValue <= lastValue) {
        return { valid: false, reason: 'より強いカードを出してください' };
      }
    }

    // Check for 8-cut rule
    if (this.has8Cut(cards)) {
      return { valid: true, reason: '8切り！', special: '8cut' };
    }

    // Check for revolution
    if (cards.length === 4) {
      return { valid: true, reason: '革命！', special: 'revolution' };
    }

    return { valid: true, reason: '' };
  }

  /**
   * Get the value of a set of cards for comparison
   */
  getCardsValue(cards) {
    if (cards.length === 0) return 0;
    
    // For multiple cards, use the rank value
    const card = cards.find(c => !c.isJoker) || cards[0];
    return card.getValue(this.isRevolution);
  }

  /**
   * Check if cards contain 8-cut (any 8)
   */
  has8Cut(cards) {
    return cards.some(card => card.rank === '8');
  }

  /**
   * Play cards from current player
   */
  playCards(cards) {
    const validation = this.canPlayCards(cards);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    const currentPlayer = this.playerManager.getCurrentPlayer();
    
    // Remove cards from player's hand
    currentPlayer.removeCards(cards);
    
    // Add to field
    this.fieldCards = [...cards];
    this.lastPlayedCards = [...cards];
    this.lastPlayerName = currentPlayer.name;
    
    // Handle special cases
    if (validation.special === 'revolution') {
      this.isRevolution = !this.isRevolution;
      console.log(`🔄 Revolution! New state: ${this.isRevolution}`);
    }
    
    if (validation.special === '8cut') {
      this.fieldCards = [];
      this.lastPlayedCards = [];
      this.lastPlayerName = ''; // Clear last player when field is cleared
      console.log('✂️ 8-cut! Field cleared');
    }

    // Check if player finished
    if (currentPlayer.isFinished()) {
      this.finishedOrder.push(currentPlayer);
      const position = this.finishedOrder.length;
      console.log(`🏁 ${currentPlayer.name} finished in position ${position}`);
      
      // Show finish notification
      this.showFinishNotification(currentPlayer.name, position);
    }

    // Reset skip counter
    this.skipCount = 0;

    // Move to next turn
    this.nextTurn();

    return { 
      success: true, 
      message: validation.reason || 'カードを出しました',
      special: validation.special
    };
  }

  /**
   * Pass turn (skip)
   */
  passTurn() {
    const currentPlayer = this.playerManager.getCurrentPlayer();
    console.log(`${currentPlayer.name} がパスしました`);
    
    this.skipCount++;
    
    // If everyone else has passed, clear the field
    const playersLeft = this.playerManager.getAllPlayers().filter(p => !p.isFinished()).length;
    if (this.skipCount >= playersLeft - 1) {
      this.fieldCards = [];
      this.lastPlayedCards = [];
      this.lastPlayerName = ''; // Clear last player when field is cleared
      this.skipCount = 0;
      console.log('🔄 全員パス - 場をクリア');
    }

    this.nextTurn();
    
    return { success: true, message: 'パスしました' };
  }

  /**
   * Move to next player's turn
   */
  nextTurn() {
    this.playerManager.nextTurn();
    
    // Check if game is over
    if (this.isGameOver()) {
      this.gameState = 'finished';
      console.log('🎉 Game finished!');
    }
  }

  /**
   * Check if game is over
   */
  isGameOver() {
    return this.playerManager.isGameOver();
  }

  /**
   * Get current game status
   */
  getGameStatus() {
    const playerStatus = this.playerManager.getGameStatus();
    
    return {
      ...playerStatus,
      gameState: this.gameState,
      isRevolution: this.isRevolution,
      fieldCards: this.fieldCards.map(card => card.getDisplayText()),
      lastPlayedCount: this.lastPlayedCards.length,
      lastPlayerName: this.lastPlayerName,
      skipCount: this.skipCount,
      finishedOrder: this.finishedOrder.map(p => p.name)
    };
  }

  /**
   * Get field cards for display
   */
  getFieldCards() {
    return [...this.fieldCards];
  }

  /**
   * Show finish notification when player completes
   */
  showFinishNotification(playerName, position) {
    const positionText = position === 1 ? '1位で上がりました！🏆' : `${position}位で上がりました！`;
    const message = `${playerName}が${positionText}`;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black px-8 py-4 rounded-lg text-xl font-bold z-50 shadow-2xl';
    notification.innerHTML = `
      <div class="text-center">
        <div class="text-2xl mb-2">${position === 1 ? '🏆' : '🎉'}</div>
        <div>${message}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
    
    console.log(`🎊 ${message}`);
  }

  /**
   * Get finish ranking display
   */
  getFinishRanking() {
    return this.finishedOrder.map((player, index) => ({
      position: index + 1,
      name: player.name,
      isHuman: player.isHuman()
    }));
  }

  /**
   * Reset game
   */
  resetGame() {
    this.gameState = 'waiting';
    this.isRevolution = false;
    this.skipCount = 0;
    this.finishedOrder = [];
    this.fieldCards = [];
    this.lastPlayedCards = [];
    this.deck = [];
    
    // Reset all players
    this.playerManager.getAllPlayers().forEach(player => {
      player.hand = [];
      player.status = 'waiting';
      player.setTurn(false);
    });
    
    console.log('🔄 Game reset');
  }
}

// Global exports for browser use
window.GameModule = {
  GameLogic
};

// ES6 module export
export { GameLogic };