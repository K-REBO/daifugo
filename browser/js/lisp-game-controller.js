/**
 * Lisp Game Controller - Complete migration to Lisp engine
 * Replaces JavaScript GameController with pure Lisp-based implementation
 */

class LispGameController {
  constructor() {
    this.lispEngine = new LispGameEngine();
    this.gameState = 'menu'; // 'menu', 'playing', 'finished'
    this.selectedCards = [];
    this.humanPlayerId = 0;
    this.debugSystem = window.debugSystem;
    
    this.initializeUI();
    console.log('🎯 Lisp Game Controller initialized');
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
    
    // Rule activation event listeners
    this.setupRuleEventListeners();
    
    // Ensure start button is created after a delay
    setTimeout(() => {
      this.createStartGameButton();
    }, 500);
    
    console.log('🎮 Lisp Game Controller UI setup complete');
  }

  /**
   * Setup rule event listeners for dynamic UI
   */
  setupRuleEventListeners() {
    document.addEventListener('ruleActivated', (event) => {
      const { ruleId, message, data } = event.detail;
      
      // Show rule activation notification
      this.showRuleActivation(ruleId, message, data);
      
      // Handle special rule UI needs
      if (ruleId === 'q-bomber' && data.requiresDeclaration) {
        this.showQBomberDeclarationUI(data);
      }
    });
  }

  /**
   * Show rule activation notification
   */
  showRuleActivation(ruleId, message, data) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg z-50 animate-pulse';
    notification.innerHTML = `
      <div class="text-center">
        <div class="text-lg font-bold">${message}</div>
        <div class="text-sm opacity-80">${ruleId} 発動!</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Show Q-bomber declaration UI
   */
  showQBomberDeclarationUI(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 text-white p-6 rounded-lg max-w-md">
        <h3 class="text-xl font-bold mb-4">💣 Q-bomber 数字宣言</h3>
        <p class="mb-4">削除する数字を選択してください (最大${data.maxDeclarations}個)</p>
        <div class="grid grid-cols-4 gap-2 mb-4">
          ${['3','4','5','6','7','8','9','10','J','Q','K','A','2'].map(rank => `
            <button class="q-bomber-rank bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-center" data-rank="${rank}">
              ${rank}
            </button>
          `).join('')}
        </div>
        <div class="flex justify-between">
          <button id="q-bomber-cancel" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">キャンセル</button>
          <button id="q-bomber-confirm" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">実行</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle rank selection
    const selectedRanks = [];
    modal.querySelectorAll('.q-bomber-rank').forEach(button => {
      button.addEventListener('click', () => {
        const rank = button.dataset.rank;
        if (button.classList.contains('bg-red-600')) {
          // Deselect
          button.classList.remove('bg-red-600');
          button.classList.add('bg-gray-700');
          selectedRanks.splice(selectedRanks.indexOf(rank), 1);
        } else if (selectedRanks.length < data.maxDeclarations) {
          // Select
          button.classList.remove('bg-gray-700');
          button.classList.add('bg-red-600');
          selectedRanks.push(rank);
        }
      });
    });
    
    // Handle confirm
    modal.querySelector('#q-bomber-confirm').addEventListener('click', () => {
      this.executeQBomberDeclaration(selectedRanks);
      modal.remove();
    });
    
    // Handle cancel
    modal.querySelector('#q-bomber-cancel').addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Execute Q-bomber declaration
   */
  executeQBomberDeclaration(declaredNumbers) {
    const result = this.lispEngine.eval(`(apply-q-bomber ${JSON.stringify(this.selectedCards)} ${JSON.stringify(declaredNumbers)})`);
    
    if (result.success) {
      this.showMessage(`Q-bomber発動！ ${declaredNumbers.join(', ')} を削除しました`);
      this.clearSelectedCards();
      this.updateFullUI();
      this.advanceToNextTurn();
    } else {
      this.showMessage('Q-bomber実行に失敗しました');
    }
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
    startButton.textContent = '🎮 ゲーム開始 (Lisp Engine)';
    startButton.className = 'button-primary mt-4';
    startButton.id = 'start-game-button';
    
    startButton.addEventListener('click', () => this.startNewGame());
    
    gameStatus.appendChild(startButton);
    console.log('✅ Lisp start game button created');
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
   * Start a new game with Lisp engine
   */
  async startNewGame(playerCount = 4) {
    console.log(`🎯 Starting new Lisp game with ${playerCount} players`);
    
    try {
      // Initialize game through Lisp engine
      const initResult = this.lispEngine.eval(`(initialize-complete-game ${playerCount})`);
      if (!initResult.success) {
        throw new Error('Failed to initialize game');
      }
      
      // Create and shuffle deck
      const deckResult = this.lispEngine.eval('(create-and-shuffle-deck)');
      if (!deckResult.shuffled) {
        throw new Error('Failed to create deck');
      }
      
      // Deal cards to all players
      const dealResult = this.lispEngine.eval('(deal-cards-to-all-players)');
      if (!dealResult.success) {
        throw new Error('Failed to deal cards');
      }
      
      // Update game state
      this.gameState = 'playing';
      this.selectedCards = [];
      this.humanPlayerId = 0;
      
      // Update UI
      this.updateFullUI();
      this.enableGameControls();
      
      // Load local rules
      this.loadLocalRules();
      
      // Start CPU turn processing
      setTimeout(() => {
        this.processCPUTurn();
      }, 1000);
      
      console.log('✅ Lisp game started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start Lisp game:', error);
      this.showMessage('ゲーム開始に失敗しました');
    }
  }

  /**
   * Load local rules into Lisp engine
   */
  loadLocalRules() {
    const rules = ['q-bomber', 'eight-cut', 'revolution'];
    
    rules.forEach(rule => {
      const loadResult = this.lispEngine.eval(`(load-rule-file "rules/${rule}.lisp")`);
      if (loadResult.success) {
        console.log(`✅ Loaded rule: ${rule}`);
      }
    });
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
    } else {
      // Select
      cardElement.classList.add('card-selected');
      this.selectedCards.push(cardData);
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
    
    return { suit, rank };
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
      // Validate cards through Lisp engine
      const validation = this.lispEngine.eval(`(validate-card-play ${JSON.stringify(this.selectedCards)})`);
      
      if (!validation.valid) {
        this.showMessage(validation.reason);
        return;
      }
      
      // Play cards and generate events
      const playResult = this.lispEngine.eval(`(play-cards-and-generate-events ${JSON.stringify(this.selectedCards)})`);
      
      if (playResult.success) {
        this.showMessage('カードを出しました');
        
        // Remove cards from player hand
        this.selectedCards.forEach(card => {
          this.lispEngine.eval(`(remove-card-from-player ${this.humanPlayerId} ${JSON.stringify(card)})`);
        });
        
        // Check for special rules
        const specialResult = this.checkSpecialRules(this.selectedCards);
        if (specialResult.requiresDeclaration) {
          this.showQBomberDeclarationUI(specialResult);
          return;
        }
        
        this.clearSelectedCards();
        this.updateFullUI();
        this.advanceToNextTurn();
        
        // Process CPU turns
        setTimeout(() => {
          this.processCPUTurn();
        }, 500);
        
      } else {
        this.showMessage('カードを出すことができませんでした');
      }
      
    } catch (error) {
      console.error('Play cards error:', error);
      this.showMessage('カードを出すことができませんでした');
    }
  }

  /**
   * Check for special rules
   */
  checkSpecialRules(cards) {
    // Check for Q-bomber
    const qBomberResult = this.lispEngine.eval(`(detect-q-bomber ${JSON.stringify(cards)})`);
    if (qBomberResult.detected) {
      return {
        special: 'q-bomber',
        requiresDeclaration: true,
        maxDeclarations: qBomberResult.maxDeclarations
      };
    }
    
    // Check for 8-cut
    const has8 = cards.some(card => card.rank === '8');
    if (has8) {
      // Trigger 8-cut event
      document.dispatchEvent(new CustomEvent('ruleActivated', {
        detail: { ruleId: 'eight-cut', message: '8切り！', data: {} }
      }));
      return { special: '8cut' };
    }
    
    // Check for revolution
    if (cards.length === 4) {
      document.dispatchEvent(new CustomEvent('ruleActivated', {
        detail: { ruleId: 'revolution', message: '革命！', data: {} }
      }));
      return { special: 'revolution' };
    }
    
    return { special: null };
  }

  /**
   * Handle pass action
   */
  handlePass() {
    if (!this.canPlayerAct()) return;
    
    try {
      this.showMessage('パスしました');
      this.clearSelectedCards();
      this.updateFullUI();
      this.advanceToNextTurn();
      
      // Process CPU turns
      setTimeout(() => {
        this.processCPUTurn();
      }, 500);
      
    } catch (error) {
      console.error('Pass error:', error);
      this.showMessage('パスに失敗しました');
    }
  }

  /**
   * Advance to next turn
   */
  advanceToNextTurn() {
    const result = this.lispEngine.eval('(advance-turn)');
    if (result.success) {
      console.log(`Turn advanced to player ${result.currentPlayer}`);
    }
  }

  /**
   * Process CPU turn
   */
  processCPUTurn() {
    const currentPlayer = this.lispEngine.eval('(get-current-player)');
    
    // Skip if human player's turn
    if (currentPlayer.id === this.humanPlayerId) {
      this.updatePlayButtonState();
      return;
    }
    
    // Make AI decision
    const aiDecision = this.lispEngine.eval(`(make-ai-decision ${currentPlayer.id})`);
    
    if (aiDecision.action === 'play' && aiDecision.cards.length > 0) {
      // CPU plays cards
      this.showMessage(`${currentPlayer.name}がカードを出しました`);
      
      // Remove cards from CPU hand
      aiDecision.cards.forEach(card => {
        this.lispEngine.eval(`(remove-card-from-player ${currentPlayer.id} ${JSON.stringify(card)})`);
      });
      
      this.updateFullUI();
      this.advanceToNextTurn();
      
      // Continue CPU turns
      setTimeout(() => {
        this.processCPUTurn();
      }, 1000);
      
    } else {
      // CPU passes
      this.showMessage(`${currentPlayer.name}がパスしました`);
      this.advanceToNextTurn();
      
      // Continue CPU turns
      setTimeout(() => {
        this.processCPUTurn();
      }, 500);
    }
  }

  /**
   * Check if human player can act
   */
  canPlayerAct() {
    if (this.gameState !== 'playing') return false;
    
    const currentPlayer = this.lispEngine.eval('(get-current-player)');
    return currentPlayer.id === this.humanPlayerId;
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
    
    // Pass button: always enabled when player can act
    passButton.disabled = !canAct;
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
    const gameState = this.lispEngine.eval('(get-complete-game-state)');
    if (gameState.winner !== null) {
      this.handleGameOver();
    }
  }

  /**
   * Update game status display
   */
  updateGameStatus() {
    const gameStatus = document.getElementById('game-status');
    if (!gameStatus) return;
    
    const uiState = this.lispEngine.eval('(get-ui-state)');
    if (uiState.gameStatus) {
      gameStatus.textContent = uiState.gameStatus;
      gameStatus.className = 'text-white/80 mt-2';
    }
  }

  /**
   * Update human player cards
   */
  updateHumanCards() {
    const humanCards = document.getElementById('human-cards');
    const cardCount = document.getElementById('human-card-count');
    
    if (!humanCards || !cardCount) return;
    
    const playerHand = this.lispEngine.eval(`(get-player-hand ${this.humanPlayerId})`);
    
    // Update card count
    cardCount.textContent = `手札: ${playerHand.length}枚`;
    
    // Clear and rebuild cards
    humanCards.innerHTML = '';
    
    playerHand.forEach(card => {
      const cardElement = this.createCardElement(card);
      cardElement.dataset.suit = card.suit;
      cardElement.dataset.rank = card.rank;
      
      // Add selection styling
      cardElement.classList.add('cursor-pointer', 'transition-transform', 'hover:scale-105');
      cardElement.style.userSelect = 'none';
      
      humanCards.appendChild(cardElement);
    });
  }

  /**
   * Create card element
   */
  createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card bg-white text-black p-2 m-1 rounded border-2 border-gray-300 min-w-12 text-center';
    
    const suitColor = (card.suit === '♥' || card.suit === '♦') ? 'text-red-500' : 'text-black';
    
    cardElement.innerHTML = `
      <div class="text-xs font-bold ${suitColor}">${card.suit}</div>
      <div class="text-sm font-bold">${card.rank}</div>
    `;
    
    return cardElement;
  }

  /**
   * Update field cards display
   */
  updateFieldCards() {
    const fieldCards = document.getElementById('field-cards');
    if (!fieldCards) return;
    
    const gameState = this.lispEngine.eval('(get-complete-game-state)');
    
    fieldCards.innerHTML = '';
    
    if (gameState.fieldCards && gameState.fieldCards.length > 0) {
      // Show cards
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'flex justify-center space-x-2';
      gameState.fieldCards.forEach(card => {
        const cardElement = this.createCardElement(card);
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
    const playersContainer = document.getElementById('players-container');
    if (!playersContainer) return;
    
    const allPlayers = this.lispEngine.eval('(get-all-players)');
    
    playersContainer.innerHTML = '';
    
    allPlayers.forEach((player, index) => {
      if (index === this.humanPlayerId) return; // Skip human player
      
      const playerElement = document.createElement('div');
      playerElement.className = 'player-card bg-gray-700 text-white p-4 rounded-lg';
      playerElement.innerHTML = `
        <div class="text-lg font-bold">${player.name}</div>
        <div class="text-sm">手札: ${player.cardCount}枚</div>
      `;
      
      playersContainer.appendChild(playerElement);
    });
  }

  /**
   * Handle game over
   */
  handleGameOver() {
    this.gameState = 'finished';
    
    console.log('🎉 Lisp Game Over!');
    this.showMessage('ゲーム終了！');
    
    // Show restart button
    setTimeout(() => {
      const startButton = document.getElementById('start-game-button');
      if (startButton) {
        startButton.style.display = 'block';
        startButton.textContent = '🔄 新しいゲーム (Lisp Engine)';
      }
    }, 3000);
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
   * Reset game
   */
  resetGame() {
    this.gameState = 'menu';
    this.selectedCards = [];
    this.humanPlayerId = 0;
    
    // Initialize new Lisp engine
    this.lispEngine = new LispGameEngine();
    
    this.updateFullUI();
    
    console.log('🔄 Lisp Game reset');
  }
}

// Global export for browser use
window.LispGameControllerModule = {
  LispGameController
};

// ES6 module export
export { LispGameController };