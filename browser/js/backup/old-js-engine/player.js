/**
 * Player management system for Daifugo game
 * Supports 3-20 players (human + CPU)
 */

class Player {
  constructor(name, type = 'cpu', difficulty = 'medium') {
    this.name = name;
    this.type = type; // 'human' or 'cpu'
    this.difficulty = difficulty; // 'easy', 'medium', 'hard'
    this.hand = [];
    this.isCurrentTurn = false;
    this.position = 0;
    this.status = 'waiting'; // 'waiting', 'playing', 'finished'
    this.thinking = false;
  }

  /**
   * Check if this is a human player
   */
  isHuman() {
    return this.type === 'human';
  }

  /**
   * Add card to player's hand
   */
  addCard(card) {
    this.hand.push(card);
  }

  /**
   * Remove card from hand by index
   */
  removeCard(index) {
    if (index >= 0 && index < this.hand.length) {
      return this.hand.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * Remove specific cards from hand
   */
  removeCards(cards) {
    cards.forEach(card => {
      const index = this.hand.findIndex(c => 
        c.suit === card.suit && c.rank === card.rank
      );
      if (index !== -1) {
        this.hand.splice(index, 1);
      }
    });
  }

  /**
   * Get player's hand
   */
  getHand() {
    return [...this.hand];
  }

  /**
   * Get number of cards in hand
   */
  getCardCount() {
    return this.hand.length;
  }

  /**
   * Check if player can play (has cards and is their turn)
   */
  canPlay() {
    return this.hand.length > 0 && this.isCurrentTurn;
  }

  /**
   * Check if player has finished (no cards left)
   */
  isFinished() {
    return this.hand.length === 0;
  }

  /**
   * Check if it's player's turn
   */
  isTurn() {
    return this.isCurrentTurn;
  }

  /**
   * Set player's turn status
   */
  setTurn(isTurn) {
    this.isCurrentTurn = isTurn;
    if (isTurn && !this.isHuman()) {
      this.thinking = true;
    } else {
      this.thinking = false;
    }
  }

  /**
   * Set thinking status for CPU players
   */
  setThinking(thinking) {
    if (!this.isHuman()) {
      this.thinking = thinking;
    }
  }

  /**
   * Sort hand by card value
   */
  sortHand(isRevolution = false) {
    this.hand.sort((a, b) => a.getValue(isRevolution) - b.getValue(isRevolution));
  }

  /**
   * Get player info for display
   */
  getDisplayInfo() {
    return {
      name: this.name,
      cardCount: this.getCardCount(),
      isHuman: this.isHuman(),
      isTurn: this.isTurn(),
      isFinished: this.isFinished(),
      thinking: this.thinking,
      difficulty: this.difficulty
    };
  }
}

/**
 * PlayerManager handles multiple players and game flow
 */
class PlayerManager {
  constructor(playerCount = 4) {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameActive = false;
    
    this.initializePlayers(playerCount);
  }

  /**
   * Initialize players for the game
   */
  initializePlayers(count) {
    this.players = [];
    
    // Add human player
    this.players.push(new Player('あなた', 'human'));
    
    // Add CPU players
    const difficulties = ['easy', 'medium', 'hard'];
    for (let i = 1; i < count; i++) {
      const difficulty = difficulties[(i - 1) % difficulties.length];
      this.players.push(new Player(`CPU${i}`, 'cpu', difficulty));
    }
    
    // Set positions
    this.players.forEach((player, index) => {
      player.position = index;
    });
    
    // Human starts first
    this.setCurrentPlayer(0);
  }

  /**
   * Get all players
   */
  getAllPlayers() {
    return [...this.players];
  }

  /**
   * Get current player
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get current player index
   */
  getCurrentPlayerIndex() {
    return this.currentPlayerIndex;
  }

  /**
   * Set current player by index
   */
  setCurrentPlayer(index) {
    if (index >= 0 && index < this.players.length) {
      // Clear all turn flags
      this.players.forEach(player => player.setTurn(false));
      
      // Set new current player
      this.currentPlayerIndex = index;
      this.players[index].setTurn(true);
    }
  }

  /**
   * Move to next player's turn
   */
  nextTurn() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    
    // Skip finished players
    let attempts = 0;
    while (this.players[nextIndex].isFinished() && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }
    
    this.setCurrentPlayer(nextIndex);
  }

  /**
   * Get human player
   */
  getHumanPlayer() {
    return this.players.find(player => player.isHuman());
  }

  /**
   * Get CPU players
   */
  getCPUPlayers() {
    return this.players.filter(player => !player.isHuman());
  }

  /**
   * Deal cards to all players
   */
  dealCards(deck) {
    // Shuffle and deal cards evenly
    const cardsPerPlayer = Math.floor(deck.length / this.players.length);
    
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (let j = 0; j < this.players.length; j++) {
        if (deck.length > 0) {
          this.players[j].addCard(deck.pop());
        }
      }
    }
    
    // Sort all players' hands
    this.players.forEach(player => player.sortHand());
  }

  /**
   * Check if game is over (only one player left with cards)
   */
  isGameOver() {
    const playersWithCards = this.players.filter(player => !player.isFinished());
    return playersWithCards.length <= 1;
  }

  /**
   * Get game status
   */
  getGameStatus() {
    return {
      currentPlayer: this.getCurrentPlayer().name,
      playersLeft: this.players.filter(p => !p.isFinished()).length,
      gameOver: this.isGameOver(),
      playerStats: this.players.map(p => p.getDisplayInfo())
    };
  }

  /**
   * Render players in UI
   */
  renderPlayersUI() {
    const playersArea = document.getElementById('players-area');
    if (!playersArea) return;
    
    playersArea.innerHTML = '';
    
    // Render CPU players in top area layout
    const cpuPlayers = this.getCPUPlayers();
    if (cpuPlayers.length <= 4) {
      // Single row for 3-4 players
      this.renderTopRowLayout(cpuPlayers, playersArea);
    } else {
      // Two rows for 5+ players
      this.renderTopTwoRowLayout(cpuPlayers, playersArea);
    }
  }

  /**
   * Render single row layout for 3-4 players
   */
  renderTopRowLayout(cpuPlayers, container) {
    container.className = 'flex justify-center items-start space-x-4 py-4';
    
    cpuPlayers.forEach(player => {
      const playerEl = this.createPlayerElement(player);
      playerEl.classList.add('cpu-player-top');
      container.appendChild(playerEl);
    });
  }

  /**
   * Render two-row layout for 5+ players
   */
  renderTopTwoRowLayout(cpuPlayers, container) {
    container.className = 'py-4';
    
    // Split players into two rows
    const playersPerRow = Math.ceil(cpuPlayers.length / 2);
    const firstRow = cpuPlayers.slice(0, playersPerRow);
    const secondRow = cpuPlayers.slice(playersPerRow);
    
    // Create first row
    const firstRowDiv = document.createElement('div');
    firstRowDiv.className = 'flex justify-center items-start space-x-3 mb-3';
    firstRow.forEach(player => {
      const playerEl = this.createPlayerElement(player);
      playerEl.classList.add('cpu-player-top', 'cpu-player-compact');
      firstRowDiv.appendChild(playerEl);
    });
    container.appendChild(firstRowDiv);
    
    // Create second row if needed
    if (secondRow.length > 0) {
      const secondRowDiv = document.createElement('div');
      secondRowDiv.className = 'flex justify-center items-start space-x-3';
      secondRow.forEach(player => {
        const playerEl = this.createPlayerElement(player);
        playerEl.classList.add('cpu-player-top', 'cpu-player-compact');
        secondRowDiv.appendChild(playerEl);
      });
      container.appendChild(secondRowDiv);
    }
  }

  /**
   * Create player element for UI
   */
  createPlayerElement(player) {
    const playerEl = document.createElement('div');
    playerEl.className = `cpu-player player-area text-center min-w-24 px-3 py-2 ${
      player.isTurn() ? 'ring-2 ring-yellow-400' : ''
    }`;
    
    const info = player.getDisplayInfo();
    
    playerEl.innerHTML = `
      <h4 class="player-name text-white font-semibold text-sm mb-1">${player.name}</h4>
      <div class="text-white/80 text-xs space-y-1">
        <div>手札: ${info.cardCount}枚</div>
        <div class="text-xs">${info.difficulty.toUpperCase()}</div>
        ${info.thinking ? '<div class="thinking-indicator text-xs">🤔 考え中...</div>' : ''}
        ${info.isTurn ? '<div class="text-yellow-400 text-xs">● ターン</div>' : ''}
      </div>
    `;
    
    return playerEl;
  }

  /**
   * Update UI for all players
   */
  updatePlayersUI() {
    const cpuPlayerElements = document.querySelectorAll('.cpu-player');
    const cpuPlayers = this.getCPUPlayers();
    
    cpuPlayerElements.forEach((element, index) => {
      if (cpuPlayers[index]) {
        const player = cpuPlayers[index];
        const info = player.getDisplayInfo();
        
        // Update ring for current turn
        if (info.isTurn) {
          element.classList.add('ring-2', 'ring-yellow-400');
        } else {
          element.classList.remove('ring-2', 'ring-yellow-400');
        }
        
        // Update content
        element.innerHTML = `
          <h4 class="player-name text-white font-semibold mb-2">${player.name}</h4>
          <div class="text-white/80 text-sm space-y-1">
            <div>手札: ${info.cardCount}枚</div>
            <div class="text-xs">${info.difficulty.toUpperCase()}</div>
            ${info.thinking ? '<div class="thinking-indicator">🤔 考え中...</div>' : ''}
            ${info.isTurn ? '<div class="text-yellow-400">● 現在のターン</div>' : ''}
          </div>
        `;
      }
    });
  }
}

// Global exports for browser use
window.PlayerModule = {
  Player,
  PlayerManager,
  players: []
};

// ES6 module export
export { Player, PlayerManager };