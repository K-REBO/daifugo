/**
 * Game Controller - Integrates all game components
 * Manages the complete Daifugo game flow with UI
 */

class GameController {
  constructor() {
    this.playerManager = null;
    this.gameLogic = null;
    this.cpuManager = null;
    this.gameState = 'menu'; // 'menu', 'playing', 'finished'
    this.selectedCards = [];
    this.humanPlayer = null;
    this.debugSystem = window.debugSystem; // Use global debug system
    
    this.initializeUI();
  }

  /**
   * Initialize UI event listeners
   */
  initializeUI() {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
  }

  /**
   * Setup UI elements and event listeners
   */
  setupUI() {
    // Game control buttons
    this.setupGameControls();
    
    // Card interaction
    this.setupCardInteraction();
    
    // Settings panel
    this.setupSettingsPanel();
    
    // Ensure start button is created after a delay
    setTimeout(() => {
      this.createStartGameButton();
    }, 500);
    
    console.log('🎮 Game Controller initialized');
  }

  /**
   * Check for rule triggers
   */
  checkRuleTriggers(cards) {
    if (!window.ruleSettings || !this.debugSystem) return;

    const activeRules = Array.from(window.ruleSettings.activeRules);
    const cardStrings = cards.map(card => `${card.suit}${card.rank}`);

    activeRules.forEach(ruleId => {
      const rule = window.ruleSettings.availableRules.get(ruleId);
      if (!rule) return;

      // Check for specific rule triggers
      let triggered = false;
      let triggerDetails = {};

      switch (ruleId) {
        case 'revolution':
          if (cards.length === 4 && cards.every(card => card.rank === cards[0].rank)) {
            triggered = true;
            triggerDetails = { type: '4_of_a_kind', rank: cards[0].rank };
          }
          break;

        case 'eight-cut':
          if (cards.some(card => card.rank === '8')) {
            triggered = true;
            triggerDetails = { type: 'eight_played', cards: cardStrings };
          }
          break;

        case 'eleven-back':
          if (cards.some(card => card.rank === 'J')) {
            triggered = true;
            triggerDetails = { type: 'jack_played', cards: cardStrings };
          }
          break;

        case 'three-spades':
          if (cards.some(card => card.suit === '♠' && card.rank === '3')) {
            triggered = true;
            triggerDetails = { type: 'spade_three_played', cards: cardStrings };
          }
          break;

        case 'stairs':
          if (cards.length >= 3 && this.isConsecutive(cards)) {
            triggered = true;
            triggerDetails = { type: 'consecutive_cards', length: cards.length, cards: cardStrings };
          }
          break;

        case 'binding':
          if (cards.length >= 2 && cards.every(card => card.suit === cards[0].suit)) {
            triggered = true;
            triggerDetails = { type: 'same_suit', suit: cards[0].suit, cards: cardStrings };
          }
          break;
      }

      if (triggered) {
        this.debugSystem.recordRuleEvent(rule.name, 'rule_triggered', {
          ruleId: ruleId,
          cards: cardStrings,
          ...triggerDetails
        });
      }
    });
  }

  /**
   * Check if cards are consecutive
   */
  isConsecutive(cards) {
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const rankIndices = cards.map(card => ranks.indexOf(card.rank)).sort((a, b) => a - b);
    
    for (let i = 1; i < rankIndices.length; i++) {
      if (rankIndices[i] - rankIndices[i-1] !== 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Setup game control buttons
   */
  setupGameControls() {
    const playButton = document.getElementById('play-button');
    const passButton = document.getElementById('pass-button');
    
    if (playButton) {
      playButton.addEventListener('click', () => this.handlePlayCards());
    }
    
    if (passButton) {
      passButton.addEventListener('click', () => this.handlePass());
    }
    
    // Add start game button
    this.createStartGameButton();
  }

  /**
   * Create start game button
   */
  createStartGameButton() {
    const gameStatus = document.getElementById('game-status');
    if (!gameStatus) {
      console.error('Game status element not found');
      return;
    }

    // Check if button already exists
    if (document.getElementById('start-game-button')) {
      console.log('Start button already exists');
      return;
    }

    const startButton = document.createElement('button');
    startButton.textContent = '🎮 ゲーム開始';
    startButton.className = 'button-primary mt-4';
    startButton.id = 'start-game-button';
    
    startButton.addEventListener('click', () => this.startNewGame());
    
    gameStatus.appendChild(startButton);
    console.log('✅ Start game button created');
  }

  /**
   * Setup card interaction for human player
   */
  setupCardInteraction() {
    // Delegate event listener for dynamic cards
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('card') && 
          event.target.closest('#human-cards')) {
        this.handleCardClick(event.target);
      }
    });
  }

  /**
   * Setup settings panel
   */
  setupSettingsPanel() {
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        // Delegate to rule settings
        if (window.ruleSettings) {
          window.ruleSettings.showSettings();
        } else {
          console.error('Rule settings not loaded');
        }
      });
    }
  }

  /**
   * Start a new game
   */
  async startNewGame(playerCount = 4) {
    console.log(`🎯 Starting new game with ${playerCount} players`);
    
    try {
      // Debug: Record game start
      this.debugSystem?.recordPlayerAction('System', 'start_new_game', { playerCount });
      
      // Initialize game components
      this.playerManager = new window.PlayerModule.PlayerManager(playerCount);
      this.gameLogic = new window.GameModule.GameLogic(this.playerManager);
      this.cpuManager = new window.CPUModule.CPUManager(this.gameLogic);
      
      // Get human player reference
      this.humanPlayer = this.playerManager.getHumanPlayer();
      
      // Start the game
      const started = this.gameLogic.startGame();
      if (!started) {
        throw new Error('Failed to start game');
      }
      
      // Initialize CPU players
      this.cpuManager.initializeCPUPlayers();
      
      // Update game state
      this.gameState = 'playing';
      this.selectedCards = [];
      
      // Debug: Record initial game state
      this.debugSystem?.recordGameState();
      
      // Update UI
      this.updateFullUI();
      this.enableGameControls();
      
      // Start CPU turn processing
      setTimeout(() => {
        this.cpuManager.processCPUTurn();
      }, 1000);
      
      console.log('✅ Game started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      this.debugSystem?.recordError(error, { context: 'startNewGame', playerCount });
      this.showMessage('ゲーム開始に失敗しました');
    }
  }

  /**
   * Handle card click for selection
   */
  handleCardClick(cardElement) {
    if (!this.canPlayerAct()) return;
    
    const cardData = this.getCardFromElement(cardElement);
    if (!cardData) return;
    
    // Toggle selection
    if (cardElement.classList.contains('card-selected')) {
      // Deselect
      cardElement.classList.remove('card-selected');
      this.selectedCards = this.selectedCards.filter(c => 
        !(c.suit === cardData.suit && c.rank === cardData.rank)
      );
      
      // Debug: Record card deselection
      this.debugSystem?.recordPlayerAction('Human', 'deselect_card', {
        card: `${cardData.suit}${cardData.rank}`,
        selectedCount: this.selectedCards.length
      });
    } else {
      // Select
      cardElement.classList.add('card-selected');
      this.selectedCards.push(cardData);
      
      // Debug: Record card selection
      this.debugSystem?.recordPlayerAction('Human', 'select_card', {
        card: `${cardData.suit}${cardData.rank}`,
        selectedCount: this.selectedCards.length
      });
    }
    
    this.updatePlayButtonState();
    console.log(`🃏 Selected cards: ${this.selectedCards.length}`);
  }

  /**
   * Get card object from DOM element
   */
  getCardFromElement(element) {
    const suit = element.dataset.suit;
    const rank = element.dataset.rank;
    
    if (!suit || !rank) return null;
    
    return new window.CardModule.Card(suit, rank);
  }

  /**
   * Handle play cards action
   */
  handlePlayCards() {
    if (!this.canPlayerAct() || this.selectedCards.length === 0) {
      this.showMessage('カードを選択してください');
      return;
    }
    
    try {
      // Debug: Record play attempt
      const playCards = this.selectedCards.map(card => `${card.suit}${card.rank}`);
      this.debugSystem?.recordPlayerAction('Human', 'play_cards_attempt', {
        cards: playCards,
        cardCount: this.selectedCards.length
      });
      
      const result = this.gameLogic.playCards(this.selectedCards);
      
      if (result.success) {
        // Debug: Record successful play
        this.debugSystem?.recordPlayerAction('Human', 'play_cards_success', {
          cards: playCards,
          cardCount: this.selectedCards.length,
          message: result.message
        });
        
        // Check for rule triggers
        this.checkRuleTriggers(this.selectedCards);
        
        this.showMessage(result.message);
        this.clearSelectedCards();
        this.updateFullUI();
        
        // Debug: Record game state after play
        this.debugSystem?.recordGameState();
        
        // Process CPU turns
        setTimeout(() => {
          this.cpuManager.processCPUTurn();
        }, 500);
        
      } else {
        // Debug: Record failed play
        this.debugSystem?.recordPlayerAction('Human', 'play_cards_failed', {
          cards: playCards,
          cardCount: this.selectedCards.length,
          reason: result.message
        });
        
        this.showMessage(result.message);
      }
      
    } catch (error) {
      console.error('Play cards error:', error);
      this.debugSystem?.recordError(error, { context: 'handlePlayCards', selectedCards: this.selectedCards });
      this.showMessage('カードを出すことができませんでした');
    }
  }

  /**
   * Handle pass action
   */
  handlePass() {
    if (!this.canPlayerAct()) return;
    
    try {
      // Debug: Record pass attempt
      this.debugSystem?.recordPlayerAction('Human', 'pass_attempt', {});
      
      const result = this.gameLogic.passTurn();
      
      if (result.success) {
        // Debug: Record successful pass
        this.debugSystem?.recordPlayerAction('Human', 'pass_success', {
          message: result.message
        });
        
        this.showMessage(result.message);
        this.clearSelectedCards();
        this.updateFullUI();
        
        // Debug: Record game state after pass
        this.debugSystem?.recordGameState();
        
        // Process CPU turns
        setTimeout(() => {
          this.cpuManager.processCPUTurn();
        }, 500);
        
      } else {
        // Debug: Record failed pass
        this.debugSystem?.recordPlayerAction('Human', 'pass_failed', {
          reason: 'パスできませんでした'
        });
        
        this.showMessage('パスできませんでした');
      }
      
    } catch (error) {
      console.error('Pass error:', error);
      this.debugSystem?.recordError(error, { context: 'handlePass' });
      this.showMessage('パスに失敗しました');
    }
  }

  /**
   * Check if human player can act
   */
  canPlayerAct() {
    return this.gameState === 'playing' && 
           this.humanPlayer && 
           this.humanPlayer.isTurn() &&
           !this.gameLogic.isGameOver();
  }

  /**
   * Clear selected cards
   */
  clearSelectedCards() {
    this.selectedCards = [];
    document.querySelectorAll('.card-selected').forEach(card => {
      card.classList.remove('card-selected');
    });
    this.updatePlayButtonState();
  }

  /**
   * Update play button state
   */
  updatePlayButtonState() {
    const playButton = document.getElementById('play-button');
    const passButton = document.getElementById('pass-button');
    
    if (!playButton || !passButton) return;
    
    const canAct = this.canPlayerAct();
    const hasCards = this.selectedCards.length > 0;
    
    // Play button: only enabled when cards are selected AND can act
    playButton.disabled = !canAct || !hasCards;
    
    // Pass button: always enabled when player can act (no card selection required)
    passButton.disabled = !canAct;
    
    console.log(`🎮 Buttons: Play=${!playButton.disabled}, Pass=${!passButton.disabled}, Cards=${hasCards}`);
  }

  /**
   * Enable game controls
   */
  enableGameControls() {
    const startButton = document.getElementById('start-game-button');
    if (startButton) {
      startButton.style.display = 'none';
    }
    
    this.updatePlayButtonState();
  }

  /**
   * Update complete UI
   */
  updateFullUI() {
    this.updateGameStatus();
    this.updateHumanCards();
    this.updateFieldCards();
    this.updatePlayersDisplay();
    this.updatePlayButtonState();
    
    // Check for game over
    if (this.gameLogic && this.gameLogic.isGameOver()) {
      this.handleGameOver();
    }
  }

  /**
   * Update game status display
   */
  updateGameStatus() {
    const gameStatus = document.getElementById('game-status');
    if (!gameStatus || !this.gameLogic) return;
    
    const status = this.gameLogic.getGameStatus();
    
    if (status.gameOver) {
      gameStatus.textContent = '🎉 ゲーム終了！';
      gameStatus.className = 'text-yellow-400 text-center font-bold text-lg';
    } else {
      const currentPlayer = status.currentPlayer;
      const revolutionText = status.isRevolution ? ' (革命中)' : '';
      gameStatus.textContent = `${currentPlayer}のターン${revolutionText}`;
      gameStatus.className = 'text-white/80 mt-2';
    }
  }

  /**
   * Update human player cards
   */
  updateHumanCards() {
    if (!this.humanPlayer) return;
    
    const humanCards = document.getElementById('human-cards');
    const cardCount = document.getElementById('human-card-count');
    
    if (!humanCards || !cardCount) return;
    
    // Update card count
    cardCount.textContent = `手札: ${this.humanPlayer.getCardCount()}枚`;
    
    // Clear and rebuild cards
    humanCards.innerHTML = '';
    
    this.humanPlayer.getHand().forEach(card => {
      const cardElement = card.createElement();
      cardElement.dataset.suit = card.suit;
      cardElement.dataset.rank = card.rank;
      
      // Add selection styling
      cardElement.classList.add('cursor-pointer', 'transition-transform', 'hover:scale-105');
      cardElement.style.userSelect = 'none';
      
      humanCards.appendChild(cardElement);
    });
  }

  /**
   * Update field cards display
   */
  updateFieldCards() {
    if (!this.gameLogic) return;
    
    const fieldCards = document.getElementById('field-cards');
    if (!fieldCards) return;
    
    const cards = this.gameLogic.getFieldCards();
    const status = this.gameLogic.getGameStatus();
    fieldCards.innerHTML = '';
    
    if (cards.length > 0) {
      // Show last player name
      if (status.lastPlayerName) {
        const playerInfo = document.createElement('div');
        playerInfo.className = 'text-white/80 text-sm mb-2 text-center';
        playerInfo.textContent = `${status.lastPlayerName}が出したカード:`;
        fieldCards.appendChild(playerInfo);
      }
      
      // Show cards
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'flex justify-center space-x-2';
      cards.forEach(card => {
        const cardElement = card.createElement();
        cardElement.classList.add('field-card');
        cardsContainer.appendChild(cardElement);
      });
      fieldCards.appendChild(cardsContainer);
    } else {
      fieldCards.innerHTML = '<div class="text-white/60 text-center py-8">場に出されたカードはありません</div>';
    }
  }

  /**
   * Update players display
   */
  updatePlayersDisplay() {
    if (!this.playerManager) return;
    
    this.playerManager.renderPlayersUI();
    this.playerManager.updatePlayersUI();
  }

  /**
   * Handle game over
   */
  handleGameOver() {
    this.gameState = 'finished';
    
    console.log('🎉 Game Over!');
    
    // Show final ranking
    this.showFinalRanking();
    
    // Show restart button
    setTimeout(() => {
      const startButton = document.getElementById('start-game-button');
      if (startButton) {
        startButton.style.display = 'block';
        startButton.textContent = '🔄 新しいゲーム';
      }
    }, 4000);
  }

  /**
   * Show final game ranking
   */
  showFinalRanking() {
    if (!this.gameLogic) return;
    
    const ranking = this.gameLogic.getFinishRanking();
    const remainingPlayers = this.playerManager.getAllPlayers().filter(p => !p.isFinished());
    
    // Add remaining players to ranking
    remainingPlayers.forEach((player, index) => {
      ranking.push({
        position: ranking.length + index + 1,
        name: player.name,
        isHuman: player.isHuman()
      });
    });
    
    // Create ranking display
    const rankingDiv = document.createElement('div');
    rankingDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-6 rounded-lg z-50 shadow-2xl';
    rankingDiv.innerHTML = `
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-4">🏁 最終順位</h2>
        <div class="space-y-2">
          ${ranking.map(player => `
            <div class="flex justify-between items-center px-4 py-2 ${player.position === 1 ? 'bg-yellow-600' : player.position <= 3 ? 'bg-gray-600' : 'bg-gray-700'} rounded">
              <span class="font-semibold">${player.position}位</span>
              <span class="${player.isHuman ? 'text-blue-300' : 'text-white'}">${player.name}</span>
              <span>${player.position === 1 ? '🏆' : player.position === 2 ? '🥈' : player.position === 3 ? '🥉' : ''}</span>
            </div>
          `).join('')}
        </div>
        <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onclick="this.parentElement.parentElement.remove()">
          閉じる
        </button>
      </div>
    `;
    
    document.body.appendChild(rankingDiv);
    
    console.log('🏁 Final ranking displayed');
  }

  /**
   * Show message to user
   */
  showMessage(message) {
    console.log(`💬 ${message}`);
    
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg z-50';
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  /**
   * Show settings panel
   */
  showSettings() {
    const settings = {
      playerCount: 4,
      difficulty: 'mixed'
    };
    
    this.showMessage(`設定: ${settings.playerCount}人プレイ, 難易度: ${settings.difficulty}`);
  }

  /**
   * Reset game
   */
  resetGame() {
    if (this.gameLogic) {
      this.gameLogic.resetGame();
    }
    
    if (this.cpuManager) {
      this.cpuManager.reset();
    }
    
    this.gameState = 'menu';
    this.selectedCards = [];
    this.humanPlayer = null;
    
    this.updateFullUI();
    
    console.log('🔄 Game reset');
  }
}

// Global export for browser use
window.GameControllerModule = {
  GameController
};

// ES6 module export
export { GameController };