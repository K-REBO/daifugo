/**
 * CPU AI for Daifugo with three difficulty levels
 * Easy: Random plays, Medium: Basic strategy, Hard: Advanced strategy
 */

class CPUPlayer {
  constructor(player, gameLogic) {
    this.player = player;
    this.gameLogic = gameLogic;
    this.thinkingTime = this.getThinkingTime();
  }

  /**
   * Get thinking time based on difficulty
   */
  getThinkingTime() {
    const baseTimes = {
      'easy': { min: 800, max: 1500 },
      'medium': { min: 1200, max: 2500 },
      'hard': { min: 2000, max: 4000 }
    };
    
    const times = baseTimes[this.player.difficulty] || baseTimes.medium;
    return Math.random() * (times.max - times.min) + times.min;
  }

  /**
   * Make CPU decision with thinking delay
   */
  async makeDecision() {
    if (!this.player.isTurn() || this.player.isHuman()) {
      return;
    }

    console.log(`🤖 ${this.player.name} (${this.player.difficulty}) thinking...`);
    this.player.setThinking(true);

    // Update UI to show thinking
    this.updateThinkingUI(true);

    // Think for a while
    await this.delay(this.thinkingTime);

    // Make decision based on difficulty
    const decision = this.makeStrategyDecision();
    
    this.player.setThinking(false);
    this.updateThinkingUI(false);

    // Execute decision
    await this.executeDecision(decision);
  }

  /**
   * Make strategic decision based on difficulty level
   */
  makeStrategyDecision() {
    const hand = this.player.getHand();
    const fieldCards = this.gameLogic.getFieldCards();
    const lastPlayed = this.gameLogic.lastPlayedCards;

    switch (this.player.difficulty) {
      case 'easy':
        return this.makeEasyDecision(hand, lastPlayed);
      case 'medium':
        return this.makeMediumDecision(hand, lastPlayed);
      case 'hard':
        return this.makeHardDecision(hand, lastPlayed);
      default:
        return this.makeMediumDecision(hand, lastPlayed);
    }
  }

  /**
   * Easy AI: Random valid plays or pass
   */
  makeEasyDecision(hand, lastPlayed) {
    const validPlays = this.findValidPlays(hand, lastPlayed);
    
    if (validPlays.length === 0) {
      return { action: 'pass' };
    }

    // 60% chance to play, 40% chance to pass (even if can play)
    if (Math.random() < 0.4) {
      return { action: 'pass' };
    }

    // Play random valid combination
    const randomPlay = validPlays[Math.floor(Math.random() * validPlays.length)];
    return { action: 'play', cards: randomPlay };
  }

  /**
   * Medium AI: Basic strategy with card conservation
   */
  makeMediumDecision(hand, lastPlayed) {
    const validPlays = this.findValidPlays(hand, lastPlayed);
    
    if (validPlays.length === 0) {
      return { action: 'pass' };
    }

    // Try to play lowest possible cards first
    const lowValuePlays = validPlays.filter(play => 
      this.getCardsValue(play) <= 8 // Play low cards preferentially
    );

    if (lowValuePlays.length > 0) {
      // Play the lowest valid combination
      const sortedPlays = lowValuePlays.sort((a, b) => 
        this.getCardsValue(a) - this.getCardsValue(b)
      );
      return { action: 'play', cards: sortedPlays[0] };
    }

    // If only high cards available, sometimes pass to conserve
    if (hand.length > 3 && Math.random() < 0.3) {
      return { action: 'pass' };
    }

    // Play lowest available
    const sortedPlays = validPlays.sort((a, b) => 
      this.getCardsValue(a) - this.getCardsValue(b)
    );
    return { action: 'play', cards: sortedPlays[0] };
  }

  /**
   * Hard AI: Advanced strategy with opponent analysis
   */
  makeHardDecision(hand, lastPlayed) {
    const validPlays = this.findValidPlays(hand, lastPlayed);
    
    if (validPlays.length === 0) {
      return { action: 'pass' };
    }

    // Check for winning opportunity
    const winningPlay = validPlays.find(play => 
      hand.length - play.length === 0
    );
    if (winningPlay) {
      return { action: 'play', cards: winningPlay };
    }

    // Check for revolution opportunity
    const revolutionPlay = validPlays.find(play => play.length === 4);
    if (revolutionPlay && this.shouldPlayRevolution(hand)) {
      return { action: 'play', cards: revolutionPlay };
    }

    // Check for 8-cut opportunity
    const eightCutPlay = validPlays.find(play => 
      play.some(card => card.rank === '8')
    );
    if (eightCutPlay && this.shouldPlay8Cut(lastPlayed)) {
      return { action: 'play', cards: eightCutPlay };
    }

    // Strategic passing based on hand composition
    if (this.shouldStrategicPass(hand, lastPlayed, validPlays)) {
      return { action: 'pass' };
    }

    // Play optimal card based on strategy
    const strategicPlay = this.selectStrategicPlay(validPlays, hand);
    return { action: 'play', cards: strategicPlay };
  }

  /**
   * Find all valid card combinations that can be played
   */
  findValidPlays(hand, lastPlayed) {
    const validPlays = [];
    const requiredCount = lastPlayed.length || 1;

    if (requiredCount === 1) {
      // Single card plays
      for (const card of hand) {
        const result = this.gameLogic.canPlayCards([card]);
        if (result.valid) {
          validPlays.push([card]);
        }
      }
    } else {
      // Multi-card plays (pairs, triples, etc.)
      const combinations = this.generateCombinations(hand, requiredCount);
      for (const combo of combinations) {
        const result = this.gameLogic.canPlayCards(combo);
        if (result.valid) {
          validPlays.push(combo);
        }
      }
    }

    return validPlays;
  }

  /**
   * Generate all combinations of cards of specified length
   */
  generateCombinations(hand, length) {
    if (length === 1) {
      return hand.map(card => [card]);
    }

    const combinations = [];
    
    // Group cards by rank
    const rankGroups = {};
    hand.forEach(card => {
      const rank = card.isJoker ? 'JOKER' : card.rank;
      if (!rankGroups[rank]) rankGroups[rank] = [];
      rankGroups[rank].push(card);
    });

    // Generate combinations for each rank group
    Object.values(rankGroups).forEach(group => {
      if (group.length >= length) {
        const combos = this.getCombinations(group, length);
        combinations.push(...combos);
      }
    });

    return combinations;
  }

  /**
   * Get all combinations of specified length from array
   */
  getCombinations(arr, length) {
    if (length === 1) return arr.map(item => [item]);
    if (length > arr.length) return [];

    const combinations = [];
    for (let i = 0; i <= arr.length - length; i++) {
      const head = arr[i];
      const tailCombos = this.getCombinations(arr.slice(i + 1), length - 1);
      tailCombos.forEach(combo => combinations.push([head, ...combo]));
    }
    return combinations;
  }

  /**
   * Get value of cards for comparison
   */
  getCardsValue(cards) {
    return this.gameLogic.getCardsValue(cards);
  }

  /**
   * Advanced strategy: Should play revolution?
   */
  shouldPlayRevolution(hand) {
    // Play revolution if it helps with low cards in revolution mode
    const lowCards = hand.filter(card => 
      !card.isJoker && ['3', '4', '5', '6'].includes(card.rank)
    );
    return lowCards.length >= hand.length * 0.4; // 40% low cards
  }

  /**
   * Advanced strategy: Should play 8-cut?
   */
  shouldPlay8Cut(lastPlayed) {
    // Use 8-cut when opponent played high cards
    if (lastPlayed.length === 0) return false;
    const lastValue = this.getCardsValue(lastPlayed);
    return lastValue >= 11; // High cards (K, A, 2)
  }

  /**
   * Advanced strategy: Should pass strategically?
   */
  shouldStrategicPass(hand, lastPlayed, validPlays) {
    // Pass if forced to play high cards when hand is large
    if (hand.length <= 2) return false;
    
    const lowestPlay = validPlays.reduce((lowest, play) => 
      this.getCardsValue(play) < this.getCardsValue(lowest) ? play : lowest
    );
    
    const lowestValue = this.getCardsValue(lowestPlay);
    return lowestValue >= 11 && hand.length > 4; // Don't waste high cards early
  }

  /**
   * Advanced strategy: Select best strategic play
   */
  selectStrategicPlay(validPlays, hand) {
    // Prefer plays that maintain good hand balance
    const scoredPlays = validPlays.map(play => ({
      cards: play,
      score: this.calculatePlayScore(play, hand)
    }));

    scoredPlays.sort((a, b) => b.score - a.score);
    return scoredPlays[0].cards;
  }

  /**
   * Calculate strategic score for a play
   */
  calculatePlayScore(play, hand) {
    let score = 0;
    
    // Prefer lower value cards
    const value = this.getCardsValue(play);
    score -= value; 
    
    // Prefer plays that don't break up pairs/sets
    const remainingHand = hand.filter(card => 
      !play.some(playCard => 
        playCard.suit === card.suit && playCard.rank === card.rank
      )
    );
    
    const rankCounts = {};
    remainingHand.forEach(card => {
      const rank = card.isJoker ? 'JOKER' : card.rank;
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    // Bonus for maintaining pairs/sets
    Object.values(rankCounts).forEach(count => {
      if (count >= 2) score += count * 2;
    });

    return score;
  }

  /**
   * Execute the AI decision
   */
  async executeDecision(decision) {
    console.log(`🎯 ${this.player.name} decided to ${decision.action}`);
    
    // Debug: Record CPU decision
    if (window.gameController?.debugSystem) {
      if (decision.action === 'play') {
        const cardStrings = decision.cards.map(card => `${card.suit}${card.rank}`);
        window.gameController.debugSystem.recordPlayerAction(this.player.name, 'cpu_play_cards', {
          cards: cardStrings,
          cardCount: decision.cards.length,
          difficulty: this.player.difficulty,
          thinkingTime: this.thinkingTime
        });
      } else {
        window.gameController.debugSystem.recordPlayerAction(this.player.name, 'cpu_pass', {
          difficulty: this.player.difficulty,
          thinkingTime: this.thinkingTime
        });
      }
    }
    
    if (decision.action === 'play') {
      const result = this.gameLogic.playCards(decision.cards);
      console.log(`💫 ${this.player.name}: ${result.message}`);
      
      // Debug: Record result
      if (window.gameController?.debugSystem) {
        window.gameController.debugSystem.recordPlayerAction(this.player.name, 
          result.success ? 'cpu_play_success' : 'cpu_play_failed', {
          message: result.message,
          difficulty: this.player.difficulty
        });
        
        // Check for rule triggers for CPU cards
        if (result.success && window.gameController.checkRuleTriggers) {
          window.gameController.checkRuleTriggers(decision.cards);
        }
      }
    } else {
      const result = this.gameLogic.passTurn();
      console.log(`⏭️ ${this.player.name}: ${result.message}`);
      
      // Debug: Record pass result
      if (window.gameController?.debugSystem) {
        window.gameController.debugSystem.recordPlayerAction(this.player.name, 
          result.success ? 'cpu_pass_success' : 'cpu_pass_failed', {
          message: result.message,
          difficulty: this.player.difficulty
        });
      }
    }

    // Update UI
    this.updateGameUI();
    
    // Debug: Record game state after CPU action
    if (window.gameController?.debugSystem) {
      window.gameController.debugSystem.recordGameState();
    }
  }

  /**
   * Update thinking indicator in UI
   */
  updateThinkingUI(isThinking) {
    // This will be called by PlayerManager's updatePlayersUI
    // The thinking state is already set on the player object
  }

  /**
   * Update game UI after AI action
   */
  updateGameUI() {
    // Update players display
    if (this.gameLogic.playerManager.updatePlayersUI) {
      this.gameLogic.playerManager.updatePlayersUI();
    }

    // Update game status
    const status = this.gameLogic.getGameStatus();
    const gameStatusEl = document.getElementById('game-status');
    if (gameStatusEl) {
      if (status.gameOver) {
        gameStatusEl.textContent = 'ゲーム終了！';
      } else {
        gameStatusEl.textContent = `${status.currentPlayer}のターン`;
      }
    }

    // Update field cards
    this.updateFieldDisplay();
  }

  /**
   * Update field card display
   */
  updateFieldDisplay() {
    const fieldCardsEl = document.getElementById('field-cards');
    if (!fieldCardsEl) return;

    const fieldCards = this.gameLogic.getFieldCards();
    fieldCardsEl.innerHTML = '';

    if (fieldCards.length > 0) {
      fieldCards.forEach(card => {
        const cardEl = card.createElement();
        cardEl.classList.add('field-card');
        fieldCardsEl.appendChild(cardEl);
      });
    } else {
      fieldCardsEl.innerHTML = '<div class="text-white/60 text-center py-8">場に出されたカードはありません</div>';
    }
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CPU AI Manager - handles all CPU players
 */
class CPUManager {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.cpuPlayers = new Map();
    this.isProcessing = false;
  }

  /**
   * Initialize CPU players
   */
  initializeCPUPlayers() {
    const players = this.gameLogic.playerManager.getCPUPlayers();
    
    players.forEach(player => {
      const cpuPlayer = new CPUPlayer(player, this.gameLogic);
      this.cpuPlayers.set(player.name, cpuPlayer);
    });

    console.log(`🤖 Initialized ${this.cpuPlayers.size} CPU players`);
  }

  /**
   * Process current player's turn if it's a CPU
   */
  async processCPUTurn() {
    if (this.isProcessing) return;

    const currentPlayer = this.gameLogic.playerManager.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isHuman()) return;

    const cpuPlayer = this.cpuPlayers.get(currentPlayer.name);
    if (!cpuPlayer) return;

    this.isProcessing = true;
    
    try {
      await cpuPlayer.makeDecision();
    } catch (error) {
      console.error('CPU decision error:', error);
    } finally {
      this.isProcessing = false;
      
      // Continue to next CPU if needed
      setTimeout(() => {
        this.processCPUTurn();
      }, 500);
    }
  }

  /**
   * Get CPU player by name
   */
  getCPUPlayer(playerName) {
    return this.cpuPlayers.get(playerName);
  }

  /**
   * Reset CPU manager
   */
  reset() {
    this.cpuPlayers.clear();
    this.isProcessing = false;
  }
}

// Global exports for browser use
window.CPUModule = {
  CPUPlayer,
  CPUManager
};

// ES6 module export
export { CPUPlayer, CPUManager };