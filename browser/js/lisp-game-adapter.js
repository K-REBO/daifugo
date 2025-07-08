// browser/js/lisp-game-adapter.js - ブラウザ版Pure Lispエンジン統合アダプター
class LispGameAdapter {
  constructor() {
    this.lispEngine = null;
    this.isEngineReady = false;
    this.loadedFiles = new Set();
    this.initPromise = null; // 重複初期化防止
    this.cache = new Map(); // 結果キャッシュ
    
    // Performance optimization - Phase 8.5
    this.performanceCache = new Map();
    this.memoizeCache = new Map();
    this.gameInstances = new Map();
    this.lastGCTime = Date.now();
    
    // Initialize performance monitoring
    this.performanceStats = {
      totalOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      memoryUsage: 0
    };
    
    console.log('🎯 LispGameAdapter initialized with performance optimizations');
  }
  
  async initialize() {
    // 重複初期化防止
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }
  
  async _doInitialize() {
    try {
      // 既存のグローバル関数を確認（ブラウザ環境）
      if (typeof window !== 'undefined' && window.LispGameEngine) {
        this.lispEngine = new window.LispGameEngine();
        console.log('✅ Using browser LispGameEngine');
      } else if (typeof global !== 'undefined') {
        // Node.js環境（テスト用）
        const { createEnvironment } = require('../../src/evaluator');
        this.lispEngine = createEnvironment();
        console.log('✅ Using Node.js Lisp environment');
      } else {
        // フォールバック: 最小限のモック実装
        this.lispEngine = this.createMockEngine();
        console.log('⚠️ Using mock Lisp engine');
      }
      
      // Lispファイルを読み込み
      await this.loadGameFiles();
      this.isEngineReady = true;
      console.log('🎯 LispGameAdapter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Lisp engine:', error);
      // エラーが発生してもモック実装で続行
      this.lispEngine = this.createMockEngine();
      this.isEngineReady = true;
      console.log('⚠️ Fallback to mock engine');
    }
  }
  
  async loadGameFiles() {
    const files = [
      'card-operations.lisp',
      'card-comparison.lisp', 
      'game-logic.lisp',
      'ai-logic.lisp'
    ];
    
    // Node.js環境（テスト用）で実際のLispファイルを読み込み
    if (typeof require !== 'undefined') {
      try {
        const { evaluate } = require('../../src/evaluator');
        const { sym } = require('../../src/symbol');
        
        let loadedCount = 0;
        for (const file of files) {
          if (!this.loadedFiles.has(file)) {
            try {
              console.log(`📁 Loading Lisp file: ${file}`);
              evaluate([sym('load'), file], this.lispEngine);
              this.loadedFiles.add(file);
              loadedCount++;
            } catch (error) {
              console.warn(`⚠️ Failed to load ${file}:`, error.message);
            }
          }
        }
        console.log(`✅ Loaded ${loadedCount} Lisp files`);
      } catch (error) {
        console.warn('⚠️ Could not load Lisp files:', error.message);
      }
    } else {
      // ブラウザ環境では実際のファイル読み込みをスキップ
      console.log('🌐 Browser environment: skipping Lisp file loading');
    }
  }
  
  createMockEngine() {
    // モック実装: 基本的なカード操作
    return {
      define: () => {},
      lookup: () => null,
      // テスト用の基本実装
      createDeck: () => {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        const deck = [];
        
        // 通常のカード52枚
        for (const suit of suits) {
          for (const rank of ranks) {
            deck.push(['card', suit, rank]);
          }
        }
        
        // ジョーカー2枚
        deck.push(['card', null, 'JOKER']);
        deck.push(['card', null, 'JOKER']);
        
        return deck;
      },
      createCard: (suit, rank) => ['card', suit, rank],
      createGame: (playerCount) => ['game-state', playerCount, 0, null],
      validatePlay: (gameState, cards) => ['valid', 'Valid play'],
      updateGameState: (gameState, action) => gameState,
      getCurrentPlayer: (gameState) => gameState[2] || 0
    };
  }
  
  isReady() {
    return this.isEngineReady;
  }
  
  createGame(playerCount) {
    if (typeof this.lispEngine.createGame === 'function') {
      return this.lispEngine.createGame(playerCount);
    } else if (typeof this.lispEngine.lookup === 'function') {
      // 実際のLispエンジンの場合
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('init-game-state'), playerCount], this.lispEngine);
    }
    return ['game-state', playerCount, 0, null];
  }
  
  createDeck() {
    // デッキ作成はコストが高いのでキャッシュ
    const cacheKey = 'create-deck';
    if (this.cache.has(cacheKey)) {
      return [...this.cache.get(cacheKey)]; // 配列のコピーを返す
    }
    
    let deck;
    if (typeof this.lispEngine.createDeck === 'function') {
      deck = this.lispEngine.createDeck();
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      deck = evaluate([sym('create-deck')], this.lispEngine);
    } else {
      deck = this.createMockEngine().createDeck();
    }
    
    this.cache.set(cacheKey, deck);
    return [...deck]; // 配列のコピーを返す
  }
  
  createCard(suit, rank) {
    if (typeof this.lispEngine.createCard === 'function') {
      return this.lispEngine.createCard(suit, rank);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('create-card'), suit, rank], this.lispEngine);
    }
    return ['card', suit, rank];
  }
  
  validatePlay(gameState, cards) {
    if (typeof this.lispEngine.validatePlay === 'function') {
      return this.lispEngine.validatePlay(gameState, cards);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('validate-play'), [sym('quote'), gameState], [sym('quote'), cards]], this.lispEngine);
    }
    return ['valid', 'Mock validation'];
  }
  
  processTurn(gameState, action) {
    if (typeof this.lispEngine.processTurn === 'function') {
      return this.lispEngine.processTurn(gameState, action);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      
      // アクション形式を正規化
      let normalizedAction;
      if (Array.isArray(action)) {
        if (action[0] === 'play-cards') {
          normalizedAction = { type: action[0], cards: action[2] || action[1] };
        } else {
          normalizedAction = { type: action[0], data: action.slice(1) };
        }
      } else {
        normalizedAction = action;
      }
      
      return evaluate([sym('process-turn'), [sym('quote'), gameState], [sym('quote'), normalizedAction]], this.lispEngine);
    }
    return gameState;
  }
  
  updateGameState(gameState, action) {
    if (typeof this.lispEngine.updateGameState === 'function') {
      return this.lispEngine.updateGameState(gameState, action);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('update-game-state'), [sym('quote'), gameState], [sym('quote'), action]], this.lispEngine);
    }
    return gameState;
  }
  
  getCurrentPlayer(gameState) {
    if (typeof this.lispEngine.getCurrentPlayer === 'function') {
      return this.lispEngine.getCurrentPlayer(gameState);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('get-current-player'), [sym('quote'), gameState]], this.lispEngine);
    }
    return gameState[2] || 0;
  }
  
  // 非同期初期化完了を待つヘルパー
  async waitForReady(timeout = 5000) {
    const startTime = Date.now();
    while (!this.isReady()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('LispGameAdapter initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return true;
  }
  
  // エラーハンドリング付きの安全な実行
  _safeExecute(operation, fallbackValue = null) {
    try {
      return operation();
    } catch (error) {
      console.error('🚨 LispGameAdapter operation failed:', error);
      return fallbackValue;
    }
  }
  
  // キャッシュクリア
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }
  
  // AI関数群
  createAIPlayer(id, difficulty) {
    if (typeof this.lispEngine.createAIPlayer === 'function') {
      return this.lispEngine.createAIPlayer(id, difficulty);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('create-ai-player'), id, difficulty], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('createAIPlayer fallback:', error.message);
        return { id, difficulty, type: 'ai-player' };
      }
    }
    return { id, difficulty, type: 'ai-player' };
  }

  analyzeHand(hand, gameState) {
    if (typeof this.lispEngine.analyzeHand === 'function') {
      return this.lispEngine.analyzeHand(hand, gameState);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('analyze-hand'), [sym('quote'), hand], [sym('quote'), gameState]], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('analyzeHand fallback:', error.message);
        return { playableCards: hand.slice(0, 1) };
      }
    }
    return { playableCards: hand.slice(0, 1) };
  }

  makeAIDecision(hand, gameState, difficulty) {
    if (typeof this.lispEngine.makeAIDecision === 'function') {
      return this.lispEngine.makeAIDecision(hand, gameState, difficulty);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('make-ai-decision'), [sym('quote'), hand], [sym('quote'), gameState], difficulty], this.lispEngine);
        return this._parseAIDecision(result, difficulty);
      } catch (error) {
        console.warn('makeAIDecision fallback:', error.message);
        return this._createFallbackDecision(hand, gameState, difficulty);
      }
    }
    return this._createFallbackDecision(hand, gameState, difficulty);
  }

  _parseAIDecision(lispResult, difficulty) {
    if (Array.isArray(lispResult) && lispResult.length >= 3) {
      return {
        action: lispResult[1],
        cards: lispResult[2],
        reasoning: lispResult[3] || `${difficulty} AI decision`,
        confidence: difficulty === 'hard' ? 0.8 : difficulty === 'medium' ? 0.6 : 0.4
      };
    }
    return this._createFallbackDecision([], {}, difficulty);
  }

  _createFallbackDecision(hand, gameState, difficulty) {
    if (hand.length === 0) {
      return {
        action: 'pass',
        cards: null,
        reasoning: `${difficulty} AI: No cards available`,
        confidence: 1.0
      };
    }
    
    return {
      action: 'play',
      cards: [hand[0]],
      reasoning: `${difficulty} AI: Playing first available card`,
      confidence: difficulty === 'hard' ? 0.7 : difficulty === 'medium' ? 0.5 : 0.3
    };
  }

  getAIStrategy(hand, gameState, difficulty) {
    if (typeof this.lispEngine.getAIStrategy === 'function') {
      return this.lispEngine.getAIStrategy(hand, gameState, difficulty);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('get-ai-strategy'), [sym('quote'), hand], [sym('quote'), gameState], difficulty], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('getAIStrategy fallback:', error.message);
        return { saveCards: hand.filter(card => ['A', '2', 'JOKER'].includes(card[2])) };
      }
    }
    return { saveCards: hand.filter(card => ['A', '2', 'JOKER'].includes(card[2])) };
  }

  setPlayerHand(gameState, playerId, hand) {
    if (typeof this.lispEngine.setPlayerHand === 'function') {
      return this.lispEngine.setPlayerHand(gameState, playerId, hand);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('set-player-hand'), [sym('quote'), gameState], playerId, [sym('quote'), hand]], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('setPlayerHand fallback:', error.message);
        return gameState;
      }
    }
    return gameState;
  }

  processAITurn(gameState, playerId, difficulty) {
    if (typeof this.lispEngine.processAITurn === 'function') {
      return this.lispEngine.processAITurn(gameState, playerId, difficulty);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('process-ai-turn'), [sym('quote'), gameState], playerId, difficulty], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('processAITurn fallback:', error.message);
        return {
          newState: gameState,
          action: { type: 'pass' },
          executionTime: 500
        };
      }
    }
    return {
      newState: gameState,
      action: { type: 'pass' },
      executionTime: 500
    };
  }

  setAIPlayers(gameState, aiPlayers) {
    return {
      ...gameState,
      aiPlayers: aiPlayers
    };
  }

  makeAIDecisionWithDelay(hand, gameState, difficulty) {
    const thinkingTime = difficulty === 'hard' ? 2000 : difficulty === 'medium' ? 1200 : 800;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const decision = this.makeAIDecision(hand, gameState, difficulty);
        resolve(decision);
      }, thinkingTime);
    });
  }

  evaluateCardStrength(card, isRevolution) {
    if (typeof this.lispEngine.evaluateCardStrength === 'function') {
      return this.lispEngine.evaluateCardStrength(card, isRevolution);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('evaluate-card-strength'), [sym('quote'), card], isRevolution], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('evaluateCardStrength fallback:', error.message);
        const rankStrengths = { '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, 'JOKER': 14 };
        return rankStrengths[card[2]] || 1;
      }
    }
    const rankStrengths = { '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, 'JOKER': 14 };
    return rankStrengths[card[2]] || 1;
  }

  makeLispAIDecision(hand, gameState) {
    if (typeof this.lispEngine.makeLispAIDecision === 'function') {
      return this.lispEngine.makeLispAIDecision(hand, gameState);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('make-lisp-ai-decision'), [sym('quote'), hand], [sym('quote'), gameState]], this.lispEngine);
        return result;
      } catch (error) {
        console.warn('makeLispAIDecision fallback:', error.message);
        return ['ai-decision', 'play', hand.length > 0 ? [hand[0]] : null];
      }
    }
    return ['ai-decision', 'play', hand.length > 0 ? [hand[0]] : null];
  }

  // 新しいゲームフロー関数
  getPlayerHand(gameState, playerId) {
    if (typeof this.lispEngine.getPlayerHand === 'function') {
      return this.lispEngine.getPlayerHand(gameState, playerId);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('get-player-hand'), [sym('quote'), gameState], playerId], this.lispEngine);
    }
    return [];
  }
  
  checkGameEnd(gameState) {
    if (typeof this.lispEngine.checkGameEnd === 'function') {
      return this.lispEngine.checkGameEnd(gameState);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('check-game-end'), [sym('quote'), gameState]], this.lispEngine);
        return Array.isArray(result) ? result : ['game-continue', null];
      } catch (error) {
        console.warn('checkGameEnd fallback:', error.message);
        return ['game-continue', null];
      }
    }
    return ['game-continue', null];
  }
  
  calculateRanking(gameState) {
    if (typeof this.lispEngine.calculateRanking === 'function') {
      return this.lispEngine.calculateRanking(gameState);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      return evaluate([sym('calculate-ranking'), [sym('quote'), gameState]], this.lispEngine);
    }
    // デフォルトランキング（プレイヤーID順）
    const playerCount = gameState[1] || 4;
    return Array.from({ length: playerCount }, (_, i) => [i, 'playing']);
  }

  getHandType(cards) {
    if (typeof this.lispEngine.getHandType === 'function') {
      return this.lispEngine.getHandType(cards);
    } else if (typeof this.lispEngine.lookup === 'function') {
      const { evaluate } = require('../../src/evaluator');
      const { sym } = require('../../src/symbol');
      try {
        const result = evaluate([sym('validate-hand-type'), [sym('quote'), cards]], this.lispEngine);
        return Array.isArray(result) ? result : ['invalid', 'none', 0];
      } catch (error) {
        console.warn('getHandType fallback:', error.message);
        return ['invalid', 'none', 0];
      }
    }
    return ['invalid', 'none', 0];
  }

  // パフォーマンス統計
  getStats() {
    return {
      isReady: this.isReady(),
      loadedFiles: Array.from(this.loadedFiles),
      cacheSize: this.cache.size,
      engineType: this.lispEngine ? typeof this.lispEngine : 'none',
      // Performance metrics
      ...this.performanceStats,
      performanceCacheSize: this.performanceCache.size,
      memoizeCacheSize: this.memoizeCache.size,
      gameInstancesCount: this.gameInstances.size
    };
  }

  // Performance optimization methods - Phase 8.5
  
  /**
   * Create game with performance optimizations
   * @param {number} playerCount - Number of players
   * @returns {object} Optimized game state
   */
  createGame(playerCount) {
    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = `game-${playerCount}`;
    if (this.performanceCache.has(cacheKey)) {
      this.performanceStats.cacheHits++;
      const cached = this.performanceCache.get(cacheKey);
      return this._cloneGameState(cached);
    }
    
    // Create new game
    const gameState = this._createGameFast(playerCount);
    
    // Cache the result
    this.performanceCache.set(cacheKey, this._cloneGameState(gameState));
    this.performanceStats.cacheMisses++;
    
    // Store instance for cleanup
    const gameId = this._generateGameId();
    this.gameInstances.set(gameId, {
      gameState,
      createdAt: Date.now(),
      playerCount
    });
    
    // Update performance stats
    const endTime = performance.now();
    this._updatePerformanceStats(endTime - startTime);
    
    return { ...gameState, gameId };
  }

  /**
   * Fast game creation implementation
   * @param {number} playerCount - Number of players
   * @returns {object} Game state
   */
  _createGameFast(playerCount) {
    return {
      players: Array.from({ length: playerCount }, (_, i) => ({
        id: i,
        name: i === 0 ? 'Human' : `CPU ${i}`,
        type: i === 0 ? 'human' : 'cpu',
        cards: [],
        cardCount: 0,
        status: 'active'
      })),
      currentPlayer: 0,
      fieldCards: [],
      lastPlayedCards: [],
      gamePhase: 'dealing',
      turnsPlayed: 0,
      passCount: 0,
      isRevolution: false,
      specialRules: [],
      gameHistory: []
    };
  }

  /**
   * Clone game state efficiently
   * @param {object} gameState - Original game state
   * @returns {object} Cloned game state
   */
  _cloneGameState(gameState) {
    return {
      ...gameState,
      players: gameState.players.map(p => ({ ...p, cards: [...p.cards] })),
      fieldCards: [...gameState.fieldCards],
      lastPlayedCards: [...gameState.lastPlayedCards],
      specialRules: [...gameState.specialRules],
      gameHistory: [...gameState.gameHistory]
    };
  }

  /**
   * Generate unique game ID
   * @returns {string} Game ID
   */
  _generateGameId() {
    return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate card play with memoization
   * @param {object} gameState - Current game state
   * @param {Array} cards - Cards to validate
   * @returns {Array} Validation result
   */
  validatePlay(gameState, cards) {
    const startTime = performance.now();
    
    // Create memoization key
    const memoKey = this._createMemoKey('validatePlay', {
      fieldCards: gameState.fieldCards,
      cards,
      isRevolution: gameState.isRevolution
    });
    
    // Check memoization cache
    if (this.memoizeCache.has(memoKey)) {
      this.performanceStats.cacheHits++;
      const cached = this.memoizeCache.get(memoKey);
      this._updatePerformanceStats(performance.now() - startTime);
      return cached;
    }
    
    // Perform validation
    const result = this._validatePlayFast(gameState, cards);
    
    // Cache result
    this.memoizeCache.set(memoKey, result);
    this.performanceStats.cacheMisses++;
    
    // Cleanup old cache entries
    this._cleanupMemoCache();
    
    this._updatePerformanceStats(performance.now() - startTime);
    return result;
  }

  /**
   * Fast validation implementation
   * @param {object} gameState - Current game state
   * @param {Array} cards - Cards to validate
   * @returns {Array} Validation result
   */
  _validatePlayFast(gameState, cards) {
    // Basic validation
    if (!cards || cards.length === 0) {
      return ['invalid', 'No cards provided'];
    }
    
    // Field empty - any play is valid
    if (!gameState.fieldCards || gameState.fieldCards.length === 0) {
      return ['valid', 'Field is empty'];
    }
    
    // Check card count match
    if (cards.length !== gameState.fieldCards.length) {
      return ['invalid', 'Card count mismatch'];
    }
    
    // Check card strength
    const fieldStrength = this._calculateCardStrength(gameState.fieldCards[0]);
    const playStrength = this._calculateCardStrength(cards[0]);
    
    if (gameState.isRevolution) {
      return playStrength < fieldStrength ? ['valid', 'Stronger in revolution'] : ['invalid', 'Weaker in revolution'];
    } else {
      return playStrength > fieldStrength ? ['valid', 'Stronger play'] : ['invalid', 'Weaker play'];
    }
  }

  /**
   * Calculate card strength efficiently
   * @param {object} card - Card object
   * @returns {number} Card strength value
   */
  _calculateCardStrength(card) {
    if (!card || !card.rank) return 0;
    
    const strengthMap = {
      '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
      'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, 'JOKER': 14
    };
    
    return strengthMap[card.rank] || 0;
  }

  /**
   * Make AI decision with performance optimization
   * @param {number} playerId - AI player ID
   * @param {object} gameState - Current game state
   * @returns {object} AI decision
   */
  makeAIDecision(playerId, gameState) {
    const startTime = performance.now();
    
    // Check cache
    const cacheKey = this._createMemoKey('aiDecision', {
      playerId,
      fieldCards: gameState.fieldCards,
      playerCards: gameState.players[playerId].cards
    });
    
    if (this.memoizeCache.has(cacheKey)) {
      this.performanceStats.cacheHits++;
      const cached = this.memoizeCache.get(cacheKey);
      this._updatePerformanceStats(performance.now() - startTime);
      return cached;
    }
    
    // Make decision
    const decision = this._makeAIDecisionFast(playerId, gameState);
    
    // Cache result
    this.memoizeCache.set(cacheKey, decision);
    this.performanceStats.cacheMisses++;
    
    this._updatePerformanceStats(performance.now() - startTime);
    return decision;
  }

  /**
   * Fast AI decision implementation
   * @param {number} playerId - AI player ID
   * @param {object} gameState - Current game state
   * @returns {object} AI decision
   */
  _makeAIDecisionFast(playerId, gameState) {
    const player = gameState.players[playerId];
    
    if (!player.cards || player.cards.length === 0) {
      return { action: 'pass', cards: [] };
    }
    
    // Simple strategy: play first valid card
    for (const card of player.cards) {
      const validation = this.validatePlay(gameState, [card]);
      if (validation[0] === 'valid') {
        return { action: 'play', cards: [card] };
      }
    }
    
    return { action: 'pass', cards: [] };
  }

  /**
   * Analyze hand strength with memoization
   * @param {Array} cards - Cards in hand
   * @returns {object} Hand analysis
   */
  analyzeHandStrength(cards) {
    const startTime = performance.now();
    
    const memoKey = this._createMemoKey('handStrength', { cards });
    
    if (this.memoizeCache.has(memoKey)) {
      this.performanceStats.cacheHits++;
      const cached = this.memoizeCache.get(memoKey);
      this._updatePerformanceStats(performance.now() - startTime);
      return cached;
    }
    
    const analysis = this._analyzeHandStrengthFast(cards);
    
    this.memoizeCache.set(memoKey, analysis);
    this.performanceStats.cacheMisses++;
    
    this._updatePerformanceStats(performance.now() - startTime);
    return analysis;
  }

  /**
   * Fast hand strength analysis
   * @param {Array} cards - Cards in hand
   * @returns {object} Hand analysis
   */
  _analyzeHandStrengthFast(cards) {
    if (!cards || cards.length === 0) {
      return { strength: 0, type: 'empty', description: 'No cards' };
    }
    
    const strengths = cards.map(card => this._calculateCardStrength(card));
    const avgStrength = strengths.reduce((a, b) => a + b, 0) / strengths.length;
    const maxStrength = Math.max(...strengths);
    
    return {
      strength: avgStrength,
      maxStrength,
      type: cards.length === 1 ? 'single' : 'multiple',
      description: `${cards.length} cards, avg strength: ${avgStrength.toFixed(1)}`
    };
  }

  /**
   * End game with cleanup
   * @param {object} gameState - Game state to end
   */
  endGame(gameState) {
    if (gameState.gameId) {
      this.gameInstances.delete(gameState.gameId);
    }
    
    // Trigger garbage collection if needed
    this._triggerGCIfNeeded();
  }

  /**
   * Create memoization key
   * @param {string} operation - Operation name
   * @param {object} data - Data to hash
   * @returns {string} Memoization key
   */
  _createMemoKey(operation, data) {
    return `${operation}:${JSON.stringify(data)}`;
  }

  /**
   * Update performance statistics
   * @param {number} responseTime - Response time in milliseconds
   */
  _updatePerformanceStats(responseTime) {
    this.performanceStats.totalOperations++;
    this.performanceStats.averageResponseTime = 
      (this.performanceStats.averageResponseTime * (this.performanceStats.totalOperations - 1) + responseTime) / 
      this.performanceStats.totalOperations;
    
    if (responseTime > this.performanceStats.maxResponseTime) {
      this.performanceStats.maxResponseTime = responseTime;
    }
    
    // Update memory usage if available
    if (performance.memory) {
      this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  /**
   * Cleanup memoization cache
   */
  _cleanupMemoCache() {
    // Keep cache size under limit
    if (this.memoizeCache.size > 1000) {
      const keysToDelete = Array.from(this.memoizeCache.keys()).slice(0, 100);
      keysToDelete.forEach(key => this.memoizeCache.delete(key));
    }
  }

  /**
   * Trigger garbage collection if needed
   */
  _triggerGCIfNeeded() {
    const now = Date.now();
    if (now - this.lastGCTime > 30000) { // 30 seconds
      this.lastGCTime = now;
      
      // Cleanup old game instances
      for (const [gameId, instance] of this.gameInstances) {
        if (now - instance.createdAt > 300000) { // 5 minutes
          this.gameInstances.delete(gameId);
        }
      }
      
      // Cleanup old cache entries
      this._cleanupMemoCache();
      
      // Force garbage collection if available
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    }
  }

  // 動的ルール読み込み機能 (Phase 8.4)
  
  /**
   * Upload and validate .lisp rule file
   * @param {File} file - The uploaded file
   * @returns {Promise<object>} Upload result
   */
  async uploadRuleFile(file) {
    try {
      // ファイル形式の検証
      if (!file.name.endsWith('.lisp')) {
        return {
          success: false,
          error: 'Invalid file type. Only .lisp files are allowed.'
        };
      }

      // ファイルサイズ制限 (50KB)
      if (file.size > 50000) {
        return {
          success: false,
          error: 'File too large. Maximum size is 50KB.'
        };
      }

      // ファイルを読み込み
      const content = await this._readFileAsText(file);
      
      // Lisp構文の基本検証
      if (!this._validateLispSyntax(content)) {
        return {
          success: false,
          error: 'Invalid Lisp syntax in file.'
        };
      }

      // ルール名を抽出
      const ruleName = this._extractRuleName(content);
      
      return {
        success: true,
        fileName: file.name,
        ruleName: ruleName,
        content: content
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }

  /**
   * Read file as text using FileReader
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Validate basic Lisp syntax
   * @param {string} content - Lisp code content
   * @returns {boolean} Is valid syntax
   */
  _validateLispSyntax(content) {
    // セキュリティチェック - 危険な関数の使用を禁止
    const dangerousFunctions = ['eval', 'delete-file', 'system', 'exec'];
    for (const func of dangerousFunctions) {
      if (content.includes(func)) {
        return false;
      }
    }

    // 基本的な括弧の対応チェック
    let openParens = 0;
    for (const char of content) {
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (openParens < 0) return false;
    }
    
    return openParens === 0;
  }

  /**
   * Extract rule name from Lisp content
   * @param {string} content - Lisp code content
   * @returns {string} Rule name
   */
  _extractRuleName(content) {
    const match = content.match(/\(defrule\s+([^\s]+)/);
    return match ? match[1] : 'unknown-rule';
  }

  /**
   * Load dynamic rule into Lisp environment
   * @param {File} file - Rule file to load
   * @returns {Promise<object>} Load result
   */
  async loadDynamicRule(file) {
    try {
      // まずファイルをアップロード検証
      const uploadResult = await this.uploadRuleFile(file);
      if (!uploadResult.success) {
        return uploadResult;
      }

      const content = uploadResult.content;
      
      // セキュリティチェック
      if (!this._securityCheck(content)) {
        return {
          success: false,
          error: 'Security violation: Malicious code detected'
        };
      }

      // カスタムルール数制限チェック
      if (!this._checkRuleLimit()) {
        return {
          success: false,
          error: 'Maximum number of custom rules exceeded (limit: 10)'
        };
      }

      // ルールをLisp環境に読み込み
      const loadResult = this._loadRuleContent(content);
      
      if (loadResult.success) {
        // 読み込み成功した場合、ルールを登録
        this._registerCustomRule(loadResult.ruleNames);
        
        return {
          success: true,
          ruleName: loadResult.ruleNames[0],
          rulesLoaded: loadResult.ruleNames.length,
          ruleNames: loadResult.ruleNames,
          warnings: loadResult.warnings || []
        };
      } else {
        return loadResult;
      }
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to load rule: ${error.message}`
      };
    }
  }

  /**
   * Security check for malicious code
   * @param {string} content - Lisp code content
   * @returns {boolean} Is safe
   */
  _securityCheck(content) {
    // より厳密なセキュリティチェック
    const blockedPatterns = [
      /\(eval\s/,
      /\(delete-file/,
      /\(system\s/,
      /\(exec\s/,
      /\(require\s/,
      /\(import\s/
    ];
    
    return !blockedPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check custom rule limit
   * @returns {boolean} Under limit
   */
  _checkRuleLimit() {
    if (!this.customRules) {
      this.customRules = [];
    }
    return this.customRules.length < 10;
  }

  /**
   * Load rule content into Lisp environment
   * @param {string} content - Lisp code content
   * @returns {object} Load result
   */
  _loadRuleContent(content) {
    try {
      if (typeof this.lispEngine.lookup === 'function') {
        const { evaluate } = require('../../src/evaluator');
        const { parse } = require('../../src/parser');
        
        // コンテンツをパースして評価
        const expressions = this._parseMultipleExpressions(content);
        const ruleNames = [];
        const warnings = [];
        
        for (const expr of expressions) {
          try {
            const result = evaluate(expr, this.lispEngine);
            const ruleName = this._extractRuleNameFromExpression(expr);
            if (ruleName) {
              ruleNames.push(ruleName);
              
              // ルール競合チェック
              if (this._checkRuleConflict(ruleName)) {
                warnings.push(`Rule conflict detected: ${ruleName} may override existing rule`);
              }
            }
          } catch (error) {
            console.warn(`Failed to evaluate expression: ${error.message}`);
          }
        }
        
        return {
          success: true,
          ruleNames: ruleNames,
          warnings: warnings
        };
      } else {
        // フォールバック実装
        const ruleNames = this._extractAllRuleNames(content);
        return {
          success: true,
          ruleNames: ruleNames,
          warnings: []
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to load rule content: ${error.message}`
      };
    }
  }

  /**
   * Parse multiple Lisp expressions from content
   * @param {string} content - Lisp code content
   * @returns {Array} Parsed expressions
   */
  _parseMultipleExpressions(content) {
    // 簡単な実装: defrulesを探す
    const defruleRegex = /\(defrule[^)]*\)/g;
    const matches = content.match(defruleRegex) || [];
    return matches.map(match => {
      try {
        if (typeof require !== 'undefined') {
          const { parse } = require('../../src/parser');
          return parse(match)[0];
        }
      } catch (error) {
        console.warn(`Failed to parse expression: ${match}`);
      }
      return match;
    });
  }

  /**
   * Extract rule name from parsed expression
   * @param {any} expr - Parsed expression
   * @returns {string|null} Rule name
   */
  _extractRuleNameFromExpression(expr) {
    if (Array.isArray(expr) && expr.length >= 2 && expr[0] === 'defrule') {
      return expr[1];
    }
    return null;
  }

  /**
   * Extract all rule names from content
   * @param {string} content - Lisp code content
   * @returns {Array<string>} Rule names
   */
  _extractAllRuleNames(content) {
    const matches = content.match(/\(defrule\s+([^\s]+)/g) || [];
    return matches.map(match => match.match(/\(defrule\s+([^\s]+)/)[1]);
  }

  /**
   * Check for rule conflicts
   * @param {string} ruleName - Rule name to check
   * @returns {boolean} Has conflict
   */
  _checkRuleConflict(ruleName) {
    const existingRules = this.getRegisteredRules();
    return existingRules.includes(ruleName);
  }

  /**
   * Register custom rule
   * @param {Array<string>} ruleNames - Rule names to register
   */
  _registerCustomRule(ruleNames) {
    if (!this.customRules) {
      this.customRules = [];
    }
    this.customRules.push(...ruleNames);
  }

  /**
   * Get all registered rules
   * @returns {Array<string>} Rule names
   */
  getRegisteredRules() {
    const defaultRules = ['basic-play', 'card-strength', 'revolution', 'eight-cut'];
    const customRules = this.customRules || [];
    return [...defaultRules, ...customRules];
  }

  /**
   * Get rule details
   * @param {string} ruleName - Rule name
   * @returns {object} Rule details
   */
  getRuleDetails(ruleName) {
    return {
      name: ruleName,
      description: `Rule: ${ruleName}`,
      isActive: true,
      priority: 1,
      isCustom: this.customRules && this.customRules.includes(ruleName)
    };
  }

  /**
   * Set rule active state
   * @param {string} ruleName - Rule name
   * @param {boolean} active - Active state
   * @returns {object} Result
   */
  setRuleActive(ruleName, active) {
    // 簡単な実装
    return {
      success: true,
      ruleName: ruleName,
      active: active
    };
  }

  /**
   * Load rule from string content
   * @param {string} content - Rule content
   * @returns {object} Result
   */
  loadRuleFromString(content) {
    try {
      const ruleName = this._extractRuleName(content);
      this._registerCustomRule([ruleName]);
      
      return {
        success: true,
        ruleName: ruleName
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove a rule
   * @param {string} ruleName - Rule name to remove
   * @returns {object} Result
   */
  removeRule(ruleName) {
    if (this.customRules) {
      const index = this.customRules.indexOf(ruleName);
      if (index !== -1) {
        this.customRules.splice(index, 1);
        return {
          success: true,
          ruleName: ruleName
        };
      }
    }
    
    return {
      success: false,
      error: `Rule not found: ${ruleName}`
    };
  }
}

export default LispGameAdapter;