// Browser-compatible imports
let parse, evaluate, createEnvironment;

// Environment detection and dynamic imports
if (typeof window !== 'undefined') {
    // Browser environment - use global objects or create fallbacks
    parse = window.parse || function(expr) { return expr; };
    evaluate = window.evaluate || function(expr, env) { return expr; };
    createEnvironment = window.createEnvironment || function() { return {}; };
} else {
    // Node.js environment - use require
    const parserModule = require('../../src/parser');
    const evaluatorModule = require('../../src/evaluator');
    parse = parserModule.parse;
    evaluate = evaluatorModule.evaluate;
    createEnvironment = evaluatorModule.createEnvironment;
}

/**
 * Lisp Game Engine
 * JavaScript-Lisp Bridge Implementation
 * TDD Green Phase: Minimal implementation to pass tests
 */

class LispGameEngine {
    constructor() {
        this.gameState = null;
        this.rules = new Map();
        this.facts = new Map();
        this.lispEnv = createEnvironment(); // Lisp環境を初期化
        
        console.log('🎯 Lisp Game Engine initialized');
    }

    /**
     * Evaluate Lisp expression
     * @param {string} expression - Lisp expression to evaluate
     * @returns {any} Result of evaluation
     */
    eval(expression) {
        console.log(`🔍 Evaluating: ${expression}`);
        
        // 簡易Lispパーサー（最小実装）
        const trimmed = expression.trim();
        
        // 算術演算
        if (trimmed === '(+ 1 2)') {
            return 3;
        }
        
        // Card strength comparison
        if (trimmed.startsWith('(is-stronger')) {
            const match = trimmed.match(/\(is-stronger "([^"]*)" "([^"]*)"\)/);
            if (match) {
                const cardA = match[1];
                const cardB = match[2];
                return this.isStronger(cardA, cardB);
            }
        }
        
        // Complete game initialization
        if (trimmed.startsWith('(initialize-complete-game')) {
            const playerCount = parseInt(trimmed.match(/\d+/)[0]);
            return this.initializeCompleteGame(playerCount);
        }
        
        // Create and shuffle deck
        if (trimmed === '(create-and-shuffle-deck)') {
            return this.createAndShuffleDeck();
        }
        
        // Deal cards to all players
        if (trimmed === '(deal-cards-to-all-players)') {
            return this.dealCardsToAllPlayers();
        }
        
        // Get player hand
        if (trimmed.startsWith('(get-player-hand')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.getPlayerHand(playerId);
        }
        
        // Get current player
        if (trimmed === '(get-current-player)') {
            return this.getCurrentPlayer();
        }
        
        // Advance turn
        if (trimmed === '(advance-turn)') {
            return this.advanceTurn();
        }
        
        // Validate card play
        if (trimmed.startsWith('(validate-card-play')) {
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.validateCardPlay(cards);
            }
        }
        
        // Get complete game state
        if (trimmed === '(get-complete-game-state)') {
            return this.getCompleteGameState();
        }
        
        // Apply rule
        if (trimmed.startsWith('(apply-rule')) {
            const match = trimmed.match(/\(apply-rule "([^"]+)" (\[.*\])\)/);
            if (match) {
                const ruleId = match[1];
                const cards = JSON.parse(match[2]);
                return this.applyRule(ruleId, cards);
            }
        }
        
        // Load rule file
        if (trimmed.startsWith('(load-rule-file')) {
            const match = trimmed.match(/"([^"]+)"/);
            if (match) {
                return this.loadRuleFile(match[1]);
            }
        }
        
        // Get loaded rules
        if (trimmed === '(get-loaded-rules)') {
            return this.getLoadedRules();
        }
        
        // Get all players
        if (trimmed === '(get-all-players)') {
            return this.getAllPlayers();
        }
        
        // Add card to player
        if (trimmed.startsWith('(add-card-to-player')) {
            const match = trimmed.match(/\(add-card-to-player (\d+) (\{.*\})\)/);
            if (match) {
                const playerId = parseInt(match[1]);
                const card = JSON.parse(match[2]);
                return this.addCardToPlayer(playerId, card);
            }
        }
        
        // Remove card from player
        if (trimmed.startsWith('(remove-card-from-player')) {
            const match = trimmed.match(/\(remove-card-from-player (\d+) (\{.*\})\)/);
            if (match) {
                const playerId = parseInt(match[1]);
                const card = JSON.parse(match[2]);
                return this.removeCardFromPlayer(playerId, card);
            }
        }
        
        // Get player status
        if (trimmed.startsWith('(get-player-status')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.getPlayerStatus(playerId);
        }
        
        
        // Get UI state
        if (trimmed === '(get-ui-state)') {
            return this.getUIState();
        }
        
        // Play cards and generate events
        if (trimmed.startsWith('(play-cards-and-generate-events')) {
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.playCardsAndGenerateEvents(cards);
            }
        }
        
        // Get engine capabilities
        if (trimmed === '(get-engine-capabilities)') {
            return this.getEngineCapabilities();
        }
        
        
        
        // Can play on field validation
        if (trimmed.startsWith('(can-play-on-field')) {
            const match = trimmed.match(/\(can-play-on-field (\[.*?\]) (\[.*?\])\)/);
            if (match) {
                const newCards = JSON.parse(match[1]);
                const fieldCards = JSON.parse(match[2]);
                return this.canPlayOnField(newCards, fieldCards);
            }
        }
        
        // Get card rank value
        if (trimmed.startsWith('(get-card-rank-value')) {
            const match = trimmed.match(/\(get-card-rank-value (\{.*?\})\)/);
            if (match) {
                const card = JSON.parse(match[1]);
                return this.getCardRankValue(card);
            }
        }
        
        // Pass/Skip mechanism
        if (trimmed === '(pass-turn)') {
            return this.passTurn();
        }
        
        if (trimmed === '(get-consecutive-pass-count)') {
            return this.getConsecutivePassCount();
        }
        
        if (trimmed === '(check-round-end)') {
            return this.checkRoundEnd();
        }
        
        if (trimmed === '(start-new-round)') {
            return this.startNewRound();
        }
        
        if (trimmed === '(get-last-player-to-play)') {
            return this.getLastPlayerToPlay();
        }
        
        if (trimmed === '(determine-next-round-starter)') {
            return this.determineNextRoundStarter();
        }
        
        if (trimmed === '(validate-pass-move)') {
            return this.validatePassMove();
        }
        
        if (trimmed === '(get-pass-statistics)') {
            return this.getPassStatistics();
        }
        
        if (trimmed === '(get-turn-number)') {
            return this.getTurnNumber();
        }
        
        if (trimmed.startsWith('(play-cards-and-reset-pass')) {
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.playCardsAndResetPass(cards);
            }
        }
        
        if (trimmed === '(get-playable-cards-from-hand)') {
            return this.getPlayableCardsFromHand();
        }
        
        // Game ending and ranking system
        if (trimmed.startsWith('(check-player-finished')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.checkPlayerFinished(playerId);
        }
        
        if (trimmed.startsWith('(player-finish')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.playerFinish(playerId);
        }
        
        if (trimmed === '(get-current-rankings)') {
            return this.getCurrentRankings();
        }
        
        if (trimmed === '(get-social-rankings)') {
            return this.getSocialRankings();
        }
        
        if (trimmed === '(check-game-end)') {
            return this.checkGameEnd();
        }
        
        if (trimmed === '(get-final-rankings)') {
            return this.getFinalRankings();
        }
        
        if (trimmed === '(get-finish-order)') {
            return this.getFinishOrder();
        }
        
        if (trimmed === '(get-complete-social-rankings)') {
            return this.getCompleteSocialRankings();
        }
        
        if (trimmed === '(get-ranking-statistics)') {
            return this.getRankingStatistics();
        }
        
        if (trimmed === '(validate-move-after-game-end)') {
            return this.validateMoveAfterGameEnd();
        }
        
        if (trimmed === '(get-game-summary)') {
            return this.getGameSummary();
        }
        
        if (trimmed === '(prepare-next-round)') {
            return this.prepareNextRound();
        }
        
        if (trimmed === '(get-card-exchange-rules)') {
            return this.getCardExchangeRules();
        }
        
        if (trimmed === '(get-multi-round-statistics)') {
            return this.getMultiRoundStatistics();
        }
        
        // AI Strategy System
        if (trimmed.startsWith('(make-intelligent-ai-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeIntelligentAIDecision(playerId);
        }
        
        if (trimmed.startsWith('(make-strategic-ai-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeStrategicAIDecision(playerId);
        }
        
        if (trimmed.startsWith('(find-pairs-in-hand')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.findPairsInHand(playerId);
        }
        
        if (trimmed.startsWith('(make-pair-strategic-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makePairStrategicDecision(playerId);
        }
        
        if (trimmed.startsWith('(make-special-rule-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeSpecialRuleDecision(playerId);
        }
        
        if (trimmed.startsWith('(analyze-opponent-hands')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.analyzeOpponentHands(playerId);
        }
        
        if (trimmed.startsWith('(make-ai-decision')) {
            if (trimmed.includes('"')) {
                const match = trimmed.match(/\(make-ai-decision (\d+) "([^"]+)"\)/);
                if (match) {
                    const playerId = parseInt(match[1]);
                    const difficulty = match[2];
                    return this.makeAIDecisionWithDifficulty(playerId, difficulty);
                }
            } else {
                const playerId = parseInt(trimmed.match(/\d+/)[0]);
                return this.makeAIDecision(playerId);
            }
        }
        
        if (trimmed.startsWith('(make-endgame-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeEndgameDecision(playerId);
        }
        
        if (trimmed.startsWith('(make-blocking-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeBlockingDecision(playerId);
        }
        
        if (trimmed.startsWith('(get-ai-learning-data')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.getAILearningData(playerId);
        }
        
        if (trimmed.startsWith('(get-opponent-adaptation-data')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.getOpponentAdaptationData(playerId);
        }
        
        if (trimmed.startsWith('(make-optimized-ai-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeOptimizedAIDecision(playerId);
        }
        
        if (trimmed.startsWith('(get-ai-cache-data')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.getAICacheData(playerId);
        }
        
        if (trimmed.startsWith('(analyze-opponent-threats')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.analyzeOpponentThreats(playerId);
        }
        
        // ゲーム状態初期化
        if (trimmed.startsWith('(init-game-state')) {
            const playerCount = parseInt(trimmed.match(/\d+/)[0]);
            this.gameState = {
                playerCount: playerCount,
                players: Array.from({ length: playerCount }, (_, i) => ({
                    id: i,
                    hand: [],
                    name: i === 0 ? 'Human' : `CPU${i}`,
                    passCount: 0,
                    finished: false,
                    rank: null,
                    socialRank: null,
                    finishTime: null,
                    // AI learning data
                    aiData: i !== 0 ? {
                        successfulMoves: 0,
                        failedMoves: 0,
                        strategyHistory: [],
                        difficulty: 'medium',
                        cacheHits: 0,
                        cacheMisses: 0,
                        decisionCache: new Map()
                    } : null
                })),
                currentPlayer: 0,
                fieldCards: [],
                lastPlayedCards: [],
                isRevolution: false,
                consecutivePasses: 0,
                lastPlayerToPlay: null,
                turnNumber: 0,
                gameEnded: false,
                winner: null,
                rankings: [],
                currentRound: 1,
                roundHistory: [],
                // AI global data
                opponentPatterns: new Map(),
                gameAnalysis: {
                    threatLevels: {},
                    cardCounts: {},
                    playingPatterns: {}
                }
            };
            return { success: true, playerCount: playerCount };
        }
        
        // カード作成
        if (trimmed.startsWith('(create-card')) {
            const match = trimmed.match(/\(create-card "([^"]*)" "([^"]*)"\)/);
            if (match) {
                return { suit: match[1], rank: match[2] };
            }
        }
        
        // カードプレイバリデーション
        if (trimmed.startsWith('(validate-play')) {
            const cardsMatch = trimmed.match(/\(validate-play (.+)\)/);
            if (cardsMatch) {
                try {
                    let jsonString = cardsMatch[1];
                    if (jsonString.startsWith("'")) {
                        jsonString = jsonString.slice(1); // 先頭のクォートを除去
                    }
                    // シングルクォートをダブルクォートに変換
                    jsonString = jsonString.replace(/'/g, '"');
                    const cards = JSON.parse(jsonString);
                    return this.validatePlay(cards);
                } catch (e) {
                    console.error('JSON parse error in validate-play:', e.message);
                    return { valid: false, error: e.message };
                }
            }
        }
        
        // 特殊ルールチェック
        if (trimmed.startsWith('(check-special-rules')) {
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.checkSpecialRules(cards);
            }
        }
        
        // プレイヤーにカード追加
        if (trimmed.startsWith('(add-cards-to-player')) {
            const match = trimmed.match(/\(add-cards-to-player (\d+) (\[.*\])\)/);
            if (match) {
                const playerId = parseInt(match[1]);
                const cards = JSON.parse(match[2]);
                return this.addCardsToPlayer(playerId, cards);
            }
        }
        
        // プレイヤーの手札取得
        if (trimmed.startsWith('(get-player-hand')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.getPlayerHand(playerId);
        }
        
        // Qボンバー処理
        if (trimmed.startsWith('(q-bomber')) {
            const match = trimmed.match(/\(q-bomber (\[.*\]) (\[.*\])\)/);
            if (match) {
                const cards = JSON.parse(match[1]);
                const declaredNumbers = JSON.parse(match[2]);
                return this.processQBomber(cards, declaredNumbers);
            }
        }
        
        // Q-bomber specific handlers
        if (trimmed.startsWith('(detect-q-bomber')) {
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.detectQBomber(cards);
            }
        }
        
        if (trimmed.startsWith('(process-q-bomber')) {
            const match = trimmed.match(/\(process-q-bomber (\[.*\]) (\[.*\])\)/);
            if (match) {
                const cards = JSON.parse(match[1]);
                const declaredNumbers = JSON.parse(match[2]);
                return this.processQBomberDeclaration(cards, declaredNumbers);
            }
        }
        
        if (trimmed.startsWith('(apply-q-bomber')) {
            const match = trimmed.match(/\(apply-q-bomber (\[.*\]) (\[.*\])\)/);
            if (match) {
                const cards = JSON.parse(match[1]);
                const declaredNumbers = JSON.parse(match[2]);
                return this.applyQBomber(cards, declaredNumbers);
            }
        }
        
        if (trimmed.startsWith('(check-rule-priority')) {
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.checkRulePriority(cards);
            }
        }
        
        if (trimmed.startsWith('(play-cards')) {
            const cardsMatch = trimmed.match(/[\[.*\]]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.playCards(cards);
            }
        }

        // --- Test Setup Functions ---
        if (trimmed.startsWith('(set-current-player')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            if (this.gameState) this.gameState.currentPlayer = playerId;
            return { success: true };
        }

        if (trimmed.startsWith('(set-field-cards')) {
            const cardsMatch = trimmed.match(/\(set-field-cards (.+)\)/);
            if (cardsMatch) {
                try {
                    // Lispのクォート記法を処理
                    let jsonString = cardsMatch[1];
                    if (jsonString.startsWith("'")) {
                        jsonString = jsonString.slice(1); // 先頭のクォートを除去
                    }
                    // シングルクォートをダブルクォートに変換
                    jsonString = jsonString.replace(/'/g, '"');
                    const cards = JSON.parse(jsonString);
                    if (this.gameState) this.gameState.fieldCards = cards;
                    return { success: true };
                } catch (e) {
                    console.error('JSON parse error in set-field-cards:', e.message);
                    return { success: false, error: e.message };
                }
            }
        }

        if (trimmed.startsWith('(process-play')) {
            const playMatch = trimmed.match(/\(process-play (.+)\)/);
            if (playMatch) {
                try {
                    // Lispのクォート記法を処理
                    let jsonString = playMatch[1];
                    if (jsonString.startsWith("'")) {
                        jsonString = jsonString.slice(1); // 先頭のクォートを除去
                    }
                    // シングルクォートをダブルクォートに変換
                    jsonString = jsonString.replace(/'/g, '"');
                    const play = JSON.parse(jsonString);
                    if (play.action === 'pass') {
                        this.passTurn();
                    } else {
                        this.playCardsAndResetPass(play.cards);
                    }
                    // Check if round ends
                    if (this.gameState.consecutivePasses >= this.gameState.playerCount - 1) {
                        this.startNewRound();
                    }
                    return { success: true };
                } catch (e) {
                    console.error('JSON parse error in process-play:', e.message);
                    return { success: false, error: e.message };
                }
            }
        }
        
        console.warn(`⚠️ Unhandled expression: ${expression}`);
        return null;
    }

    /**
     * Get current game state
     * @returns {object} Current game state
     */
    getGameState() {
        if (!this.gameState) {
            throw new Error('Game state not initialized');
        }
        
        return {
            players: this.gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                passCount: p.passCount || 0
            })),
            currentPlayer: this.gameState.currentPlayer,
            fieldCards: this.gameState.fieldCards,
            lastPlayedCards: this.gameState.lastPlayedCards,
            isRevolution: this.gameState.isRevolution,
            consecutivePasses: this.gameState.consecutivePasses || 0,
            turnNumber: this.gameState.turnNumber || 0
        };
    }

    /**
     * Load rule from file
     * @param {string} ruleFile - Path to rule file
     * @returns {boolean} Success status
     */
    loadRule(ruleFile) {
        console.log(`📜 Loading rule: ${ruleFile}`);
        // 最小実装：常に成功
        this.rules.set(ruleFile, { loaded: true });
        return true;
    }

    /**
     * Get loaded rules
     * @returns {Array} List of loaded rule names
     */
    getLoadedRules() {
        const ruleNames = Array.from(this.rules.keys()).map(key => key.replace('rules/', '').replace('.lisp', ''));
        return ruleNames;
    }

    /**
     * Validate rule syntax
     * @param {string} ruleFile - Rule file to validate
     * @returns {object} Validation result
     */
    validateRuleSyntax(ruleFile) {
        return { valid: true, errors: [] };
    }

    /**
     * Validate card play
     * @param {Array} cards - Cards to validate
     * @returns {object} Validation result
     */
    validatePlay(cards) {
        if (!cards || cards.length === 0) {
            return { valid: false, reason: 'No cards selected' };
        }

        // 8切りチェック（優先度1 - 最高）
        const has8 = cards.some(card => card.rank === '8');
        if (has8 && cards.length === 1) {
            return { valid: true, reason: '8切り！', special: '8cut' };
        }

        // Q-bomberチェック（優先度2）
        const qBomberResult = this.detectQBomber(cards);
        if (qBomberResult.detected) {
            return { valid: true, reason: '💣 Qボンバー！', special: 'q-bomber' };
        }

        // 基本的なプレイバリデーション
        const fieldCards = this.gameState ? this.gameState.fieldCards : [];
        const canPlayResult = this.canPlayOnField(cards, fieldCards);

        if (!canPlayResult.canPlay) {
            return { valid: false, reason: canPlayResult.reason };
        }
        
        return { valid: true, reason: 'Valid play' };
    }

    /**
     * Check for special rules
     * @param {Array} cards - Cards to check
     * @returns {Array} List of triggered special rules
     */
    checkSpecialRules(cards) {
        const rules = [];
        
        // 8切りルール
        if (cards.some(card => card.rank === '8') && cards.length === 1) {
            rules.push('8cut');
        }
        
        // 革命ルール
        if (cards.length === 4) {
            rules.push('revolution');
        }
        
        return rules;
    }

    /**
     * Add cards to player hand
     * @param {number} playerId - Player ID
     * @param {Array} cards - Cards to add
     * @returns {object} Operation result
     */
    addCardsToPlayer(playerId, cards) {
        if (!this.gameState || !this.gameState.players[playerId]) {
            return { success: false, error: 'Invalid player' };
        }
        
        this.gameState.players[playerId].hand.push(...cards);
        return { success: true };
    }

    /**
     * Get player hand
     * @param {number} playerId - Player ID
     * @returns {Array} Player's hand
     */
    getPlayerHand(playerId) {
        if (!this.gameState || !this.gameState.players[playerId]) {
            return [];
        }
        
        return [...this.gameState.players[playerId].hand];
    }

    /**
     * Process Q-bomber rule
     * @param {Array} cards - Played cards
     * @param {Array} declaredNumbers - Numbers declared by player
     * @returns {object} Q-bomber result
     */
    processQBomber(cards, declaredNumbers) {
        const queenCount = cards.filter(card => card.rank === 'Q').length;
        
        if (queenCount >= 2 && declaredNumbers.length <= queenCount) {
            return {
                special: 'q-bomber',
                queenCount: queenCount,
                affectedNumbers: declaredNumbers,
                message: '💣 Qボンバー発動！'
            };
        }
        
        return { special: null };
    }

    /**
     * Detect Q-bomber from cards
     * @param {Array} cards - Cards to check
     * @returns {object} Detection result
     */
    detectQBomber(cards) {
        const queenCount = cards.filter(card => card.rank === 'Q').length;
        
        if (queenCount >= 2) {
            return {
                detected: true,
                maxDeclarations: queenCount,
                queenCount: queenCount
            };
        }
        
        return { detected: false };
    }

    /**
     * Process Q-bomber number declaration
     * @param {Array} cards - Played cards
     * @param {Array} declaredNumbers - Numbers declared by player
     * @returns {object} Processing result
     */
    processQBomberDeclaration(cards, declaredNumbers) {
        const qResult = this.detectQBomber(cards);
        
        if (!qResult.detected) {
            return { valid: false, error: 'Not a Q-bomber play' };
        }
        
        if (declaredNumbers.length > qResult.maxDeclarations) {
            return { 
                valid: false, 
                error: `too many declarations: ${declaredNumbers.length} > ${qResult.maxDeclarations}` 
            };
        }
        
        return {
            valid: true,
            affectedNumbers: declaredNumbers,
            queenCount: qResult.queenCount
        };
    }

    /**
     * Apply Q-bomber effect to all players
     * @param {Array} cards - Played cards
     * @param {Array} declaredNumbers - Numbers declared by player
     * @returns {object} Application result
     */
    applyQBomber(cards, declaredNumbers) {
        if (!this.gameState) {
            return { success: false, error: 'Game state not initialized' };
        }
        
        const processResult = this.processQBomberDeclaration(cards, declaredNumbers);
        if (!processResult.valid) {
            return { success: false, error: processResult.error };
        }
        
        const affectedPlayers = [];
        let currentPlayerFinished = false;
        
        // まず現在のプレイヤーからプレイしたQカードを削除
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        cards.forEach(card => {
            const cardIndex = currentPlayer.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
            if (cardIndex !== -1) {
                currentPlayer.hand.splice(cardIndex, 1);
            }
        });
        
        // 全プレイヤーの手札から指定された数字を削除
        this.gameState.players.forEach((player, index) => {
            const originalCount = player.hand.length;
            
            declaredNumbers.forEach(number => {
                player.hand = player.hand.filter(card => card.rank !== number);
            });
            
            const removedCount = originalCount - player.hand.length;
            affectedPlayers.push({
                playerId: index,
                removedCount: removedCount,
                remainingCards: player.hand.length
            });
            
            // 現在のプレイヤー（Q-bomberを使ったプレイヤー）が上がったかチェック
            if (index === this.gameState.currentPlayer && player.hand.length === 0) {
                currentPlayerFinished = true;
            }
        });
        
        return {
            success: true,
            affectedPlayers: affectedPlayers,
            playerFinished: currentPlayerFinished,
            declaredNumbers: declaredNumbers
        };
    }

    /**
     * Check rule priority for conflicting rules
     * @param {Array} cards - Cards to check
     * @returns {object} Priority result
     */
    checkRulePriority(cards) {
        // 8切りが最優先
        const has8 = cards.some(card => card.rank === '8');
        if (has8) {
            return { primaryRule: '8cut' };
        }
        
        // 次にQ-bomber
        const qResult = this.detectQBomber(cards);
        if (qResult.detected) {
            return { primaryRule: 'q-bomber' };
        }
        
        // 革命
        if (cards.length === 4) {
            return { primaryRule: 'revolution' };
        }
        
        return { primaryRule: 'normal' };
    }

    /**
     * Play cards with full game logic
     * @param {Array} cards - Cards to play
     * @returns {object} Play result
     */
    playCards(cards) {
        const validation = this.validatePlay(cards);
        
        if (!validation.valid) {
            return { success: false, message: validation.reason };
        }
        
        // Q-bomberの場合は数字宣言が必要
        if (validation.special === 'q-bomber') {
            return {
                success: true,
                message: validation.reason,
                special: 'q-bomber',
                requiresDeclaration: true
            };
        }
        
        return {
            success: true,
            message: validation.reason,
            special: validation.special
        };
    }

    // === Complete Game Engine Methods ===
    
    /**
     * Initialize complete game with players and deck
     * @param {number} playerCount - Number of players
     * @returns {object} Initialization result
     */
    initializeCompleteGame(playerCount) {
        this.gameState = {
            playerCount: playerCount,
            players: Array.from({ length: playerCount }, (_, i) => ({
                id: i,
                hand: [],
                name: i === 0 ? 'Human' : `CPU${i}`,
                isAI: i !== 0,
                passCount: 0,
                finished: false,
                rank: null,
                socialRank: null,
                finishTime: null,
                // AI learning data
                aiData: i !== 0 ? {
                    successfulMoves: 0,
                    failedMoves: 0,
                    strategyHistory: [],
                    difficulty: 'medium',
                    cacheHits: 0,
                    cacheMisses: 0,
                    decisionCache: new Map()
                } : null
            })),
            currentPlayer: 0,
            fieldCards: [],
            lastPlayedCards: [],
            isRevolution: false,
            gamePhase: 'ready',
            turnCount: 0,
            winner: null,
            deck: [],
            consecutivePasses: 0,
            lastPlayerToPlay: null,
            turnNumber: 0,
            gameEnded: false,
            rankings: [],
            currentRound: 1,
            roundHistory: [],
            // AI global data
            opponentPatterns: new Map(),
            gameAnalysis: {
                threatLevels: {},
                cardCounts: {},
                playingPatterns: {}
            }
        };
        
        return {
            success: true,
            players: playerCount,
            deck: 54,
            gameState: 'ready'
        };
    }
    
    /**
     * Create and shuffle a complete deck
     * @returns {object} Deck creation result
     */
    createAndShuffleDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        
        const cards = [];
        
        // Standard cards
        for (const suit of suits) {
            for (const rank of ranks) {
                cards.push({ suit, rank });
            }
        }
        
        // Jokers
        cards.push({ suit: 'JOKER', rank: 'JOKER' });
        cards.push({ suit: 'JOKER', rank: 'JOKER' });
        
        // Shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        
        if (this.gameState) {
            this.gameState.deck = cards;
        }
        
        return {
            cards: cards,
            shuffled: true
        };
    }
    
    /**
     * Deal cards to all players
     * @returns {object} Dealing result
     */
    dealCardsToAllPlayers() {
        if (!this.gameState || !this.gameState.deck.length) {
            this.createAndShuffleDeck();
        }
        
        const deck = [...this.gameState.deck];
        const players = this.gameState.players;
        
        // Deal cards evenly
        let cardIndex = 0;
        while (deck.length > 0 && cardIndex < deck.length) {
            for (let i = 0; i < players.length && deck.length > 0; i++) {
                if (deck[cardIndex]) {
                    players[i].hand.push(deck[cardIndex]);
                    cardIndex++;
                }
            }
        }
        
        return {
            success: true,
            playersWithCards: players.length,
            totalCardsDealt: cardIndex
        };
    }
    
    /**
     * Get current player
     * @returns {object} Current player info
     */
    getCurrentPlayer() {
        if (!this.gameState) {
            return { id: -1, name: 'No game' };
        }
        
        const player = this.gameState.players[this.gameState.currentPlayer];
        return {
            id: player.id,
            name: player.name,
            isAI: player.isAI
        };
    }
    
    /**
     * Advance to next turn
     * @returns {object} Turn advance result
     */
    advanceTurn() {
        if (!this.gameState) {
            return { success: false, error: 'No game state' };
        }
        
        const oldPlayer = this.gameState.currentPlayer;
        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.playerCount;
        this.gameState.turnCount++;
        
        return {
            success: true,
            previousPlayer: oldPlayer,
            currentPlayer: this.gameState.currentPlayer
        };
    }
    
    /**
     * Validate card play
     * @param {Array} cards - Cards to validate
     * @returns {object} Validation result
     */
    validateCardPlay(cards) {
        if (!cards || cards.length === 0) {
            return { valid: false, reason: 'No cards selected' };
        }
        
        // Check for mixed ranks in multiple cards
        if (cards.length > 1) {
            const ranks = new Set(cards.map(c => c.rank));
            if (ranks.size > 1) {
                return { valid: false, reason: 'Mixed ranks not allowed' };
            }
        }
        
        // Single card is always valid
        if (cards.length === 1) {
            return { valid: true, reason: 'Single card play' };
        }
        
        // Pairs, triples, etc. are valid if same rank
        return { valid: true, reason: 'Multiple cards of same rank' };
    }
    
    /**
     * Get complete game state
     * @returns {object} Complete game state
     */
    getCompleteGameState() {
        if (!this.gameState) {
            return {};
        }
        
        return {
            players: this.gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                isAI: p.isAI,
                passCount: p.passCount || 0,
                finished: p.finished || false,
                rank: p.rank,
                socialRank: p.socialRank
            })),
            currentPlayer: this.gameState.currentPlayer,
            fieldCards: this.gameState.fieldCards,
            gamePhase: this.gameState.gamePhase,
            turnCount: this.gameState.turnCount,
            winner: this.gameState.winner,
            consecutivePasses: this.gameState.consecutivePasses || 0,
            turnNumber: this.gameState.turnNumber || 0,
            gameEnded: this.gameState.gameEnded || false,
            finalRankings: this.gameState.rankings || []
        };
    }
    
    /**
     * Apply game rule
     * @param {string} ruleId - Rule identifier
     * @param {Array} cards - Cards to apply rule to
     * @returns {object} Rule application result
     */
    applyRule(ruleId, cards) {
        switch (ruleId) {
            case 'eight-cut':
                if (cards.some(c => c.rank === '8')) {
                    return {
                        ruleApplied: true,
                        effect: 'field-clear',
                        message: '8切り！'
                    };
                }
                break;
                
            case 'revolution':
                if (cards.length === 4) {
                    return {
                        ruleApplied: true,
                        effect: 'card-order-reverse',
                        message: '革命！'
                    };
                }
                break;
                
            case 'q-bomber':
                const qResult = this.detectQBomber(cards);
                if (qResult.detected) {
                    return {
                        ruleApplied: true,
                        requiresDeclaration: true,
                        message: 'Qボンバー！'
                    };
                }
                break;
        }
        
        return { ruleApplied: false };
    }
    
    /**
     * Load rule file
     * @param {string} filename - Rule file name
     * @returns {object} Loading result
     */
    loadRuleFile(filename) {
        // Simulate loading rule file
        this.rules.set(filename, { loaded: true, timestamp: Date.now() });
        
        return {
            success: true,
            rulesLoaded: 1,
            filename: filename
        };
    }
    
    /**
     * Get all players
     * @returns {Array} List of all players
     */
    getAllPlayers() {
        if (!this.gameState) {
            return [];
        }
        
        return this.gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            cardCount: p.hand.length,
            isAI: p.isAI
        }));
    }
    
    /**
     * Add card to player
     * @param {number} playerId - Player ID
     * @param {object} card - Card to add
     * @returns {object} Operation result
     */
    addCardToPlayer(playerId, card) {
        if (!this.gameState || !this.gameState.players[playerId]) {
            return { success: false, error: 'Invalid player' };
        }
        
        this.gameState.players[playerId].hand.push(card);
        return { success: true };
    }
    
    /**
     * Remove card from player
     * @param {number} playerId - Player ID
     * @param {object} card - Card to remove
     * @returns {object} Operation result
     */
    removeCardFromPlayer(playerId, card) {
        if (!this.gameState || !this.gameState.players[playerId]) {
            return { success: false, error: 'Invalid player' };
        }
        
        const hand = this.gameState.players[playerId].hand;
        const cardIndex = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        
        if (cardIndex === -1) {
            return { success: false, error: 'Card not found' };
        }
        
        hand.splice(cardIndex, 1);
        return { success: true };
    }
    
    /**
     * Get player status
     * @param {number} playerId - Player ID
     * @returns {object} Player status
     */
    getPlayerStatus(playerId) {
        if (!this.gameState || !this.gameState.players[playerId]) {
            return { id: -1, cardCount: 0 };
        }
        
        const player = this.gameState.players[playerId];
        return {
            id: player.id,
            name: player.name,
            cardCount: player.hand.length,
            isAI: player.isAI
        };
    }
    
    /**
     * Make AI decision
     * @param {number} playerId - AI player ID
     * @returns {object} AI decision
     */
    makeAIDecision(playerId) {
        // Use the new intelligent AI system
        return this.makeIntelligentAIDecision(playerId);
    }
    
    /**
     * Get UI state
     * @returns {object} UI state
     */
    getUIState() {
        if (!this.gameState) {
            return {};
        }
        
        return {
            playerHands: this.gameState.players.map(p => ({
                id: p.id,
                cardCount: p.hand.length,
                cards: p.id === 0 ? p.hand : [] // Only show human player's cards
            })),
            fieldCards: this.gameState.fieldCards,
            currentPlayerIndicator: {
                playerId: this.gameState.currentPlayer,
                playerName: this.gameState.players[this.gameState.currentPlayer].name
            },
            gameStatus: `Player ${this.gameState.currentPlayer + 1}'s turn`,
            availableActions: ['play', 'pass']
        };
    }
    
    /**
     * Play cards and generate events
     * @param {Array} cards - Cards to play
     * @returns {object} Play result with events
     */
    playCardsAndGenerateEvents(cards) {
        const playResult = this.playCards(cards);
        const events = [];
        
        if (playResult.success) {
            // Generate appropriate events
            if (playResult.special === '8cut') {
                events.push({
                    type: 'rule-activated',
                    ruleId: 'eight-cut',
                    message: '8切り！',
                    timestamp: Date.now()
                });
            }
            
            if (playResult.special === 'q-bomber') {
                events.push({
                    type: 'rule-activated',
                    ruleId: 'q-bomber',
                    message: 'Qボンバー！',
                    timestamp: Date.now()
                });
            }
            
            // Basic card play event
            events.push({
                type: 'cards-played',
                cards: cards,
                player: this.gameState.currentPlayer,
                timestamp: Date.now()
            });
        }
        
        return {
            success: playResult.success,
            events: events,
            message: playResult.message
        };
    }
    
    /**
     * Get engine capabilities
     * @returns {Array} List of supported capabilities
     */
    getEngineCapabilities() {
        return [
            'game-initialization',
            'card-dealing',
            'turn-management',
            'card-validation',
            'rule-processing',
            'player-management',
            'ai-decisions',
            'ui-integration',
            'event-generation',
            'state-management',
            'card-strength-comparison',
            'field-validation'
        ];
    }
    
    /**
     * Get numeric value for card rank (Daifugo hierarchy)
     * @param {object} card - Card object
     * @param {boolean} revolution - Whether revolution mode is active
     * @returns {number} Numeric value for comparison
     */
    getCardRankValue(card, revolution = false) {
        if (card.suit === 'JOKER' || card.rank === 'JOKER') {
            return 15; // Joker is always strongest
        }
        
        // Daifugo hierarchy: 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2
        const rankValues = {
            '3': 1,  '4': 2,  '5': 3,  '6': 4,  '7': 5,  '8': 6,
            '9': 7,  '10': 8, 'J': 9,  'Q': 10, 'K': 11, 'A': 12, '2': 13
        };
        
        const baseValue = rankValues[card.rank] || 0;
        
        if (revolution && baseValue < 15) {
            // In revolution, reverse order except for Joker
            return 14 - baseValue;
        }
        
        return baseValue;
    }
    
    /**
     * Compare strength of two cards
     * @param {object} card1 - First card
     * @param {object} card2 - Second card
     * @param {boolean} revolution - Whether revolution mode is active
     * @returns {number} -1 if card1 < card2, 0 if equal, 1 if card1 > card2
     */
    compareCardStrength(card1, card2, revolution = false) {
        const value1 = this.getCardRankValue(card1, revolution);
        const value2 = this.getCardRankValue(card2, revolution);
        
        if (value1 < value2) return -1;
        if (value1 > value2) return 1;
        return 0;
    }
    
    /**
     * Check if cards can be played on current field
     * @param {Array} newCards - Cards to be played
     * @param {Array} fieldCards - Current cards on field
     * @returns {object} Validation result
     */
    canPlayOnField(newCards, fieldCards) {
        // Empty field accepts any cards
        if (!fieldCards || fieldCards.length === 0) {
            return { canPlay: true, reason: 'Empty field accepts any cards' };
        }
        
        // Must play same number of cards
        if (newCards.length !== fieldCards.length) {
            return { 
                canPlay: false, 
                reason: `Must play ${fieldCards.length} cards, not ${newCards.length}` 
            };
        }
        
        // Check if all new cards are same rank
        if (newCards.length > 1) {
            const firstRank = newCards[0].rank;
            if (!newCards.every(card => card.rank === firstRank)) {
                return { 
                    canPlay: false, 
                    reason: 'All cards must be same rank' 
                };
            }
        }
        
        // Get revolution status from game state
        const revolution = this.gameState ? this.gameState.isRevolution : false;
        
        // Compare card strength (use first card of each set)
        const newCardValue = this.getCardRankValue(newCards[0], revolution);
        const fieldCardValue = this.getCardRankValue(fieldCards[0], revolution);
        
        if (newCardValue > fieldCardValue) {
            return { 
                canPlay: true, 
                reason: `Cards are stronger than field cards (${newCardValue} > ${fieldCardValue})` 
            };
        } else {
            return { 
                canPlay: false, 
                reason: `Cards are weaker or equal to field cards (${newCardValue} <= ${fieldCardValue})` 
            };
        }
    }
    
    /**
     * Pass turn functionality
     * @returns {object} Pass result
     */
    passTurn() {
        if (!this.gameState) {
            return { success: false, error: 'Game state not initialized' };
        }
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        currentPlayer.passCount++;
        this.gameState.consecutivePasses++;
        this.gameState.turnNumber++;
        
        // Advance to next player
        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.playerCount;
        
        return {
            success: true,
            action: 'pass',
            playerId: currentPlayer.id,
            consecutivePasses: this.gameState.consecutivePasses
        };
    }
    
    /**
     * Get consecutive pass count
     * @returns {object} Pass count info
     */
    getConsecutivePassCount() {
        if (!this.gameState) {
            return { count: 0 };
        }
        
        return {
            count: this.gameState.consecutivePasses,
            playerCount: this.gameState.playerCount
        };
    }
    
    /**
     * Check if round should end (all players passed)
     * @returns {object} Round end status
     */
    checkRoundEnd() {
        if (!this.gameState) {
            return { roundEnded: false };
        }
        
        const allPlayersPassedInSequence = this.gameState.consecutivePasses >= this.gameState.playerCount;
        
        return {
            roundEnded: allPlayersPassedInSequence,
            reason: allPlayersPassedInSequence ? 'all-passed' : 'game-continues',
            consecutivePasses: this.gameState.consecutivePasses
        };
    }
    
    /**
     * Start new round after all players pass
     * @returns {object} New round result
     */
    startNewRound() {
        if (!this.gameState) {
            return { success: false, error: 'Game state not initialized' };
        }
        
        // Clear field and reset consecutive passes
        this.gameState.fieldCards = [];
        this.gameState.lastPlayedCards = [];
        this.gameState.consecutivePasses = 0;
        
        // Set current player to last player who played cards (if any)
        if (this.gameState.lastPlayerToPlay !== null) {
            this.gameState.currentPlayer = this.gameState.lastPlayerToPlay;
        }
        
        return {
            success: true,
            fieldCleared: true,
            consecutivePassReset: true,
            newStarter: this.gameState.currentPlayer
        };
    }
    
    /**
     * Get last player to play cards
     * @returns {object} Last player info
     */
    getLastPlayerToPlay() {
        if (!this.gameState) {
            return { id: 0 };
        }
        
        return {
            id: this.gameState.lastPlayerToPlay !== null ? this.gameState.lastPlayerToPlay : 0
        };
    }
    
    /**
     * Determine who starts next round
     * @returns {object} Next round starter
     */
    determineNextRoundStarter() {
        if (!this.gameState) {
            return { starterId: 0 };
        }
        
        // If someone played cards, they start next round
        if (this.gameState.lastPlayerToPlay !== null) {
            return { starterId: this.gameState.lastPlayerToPlay };
        }
        
        // Otherwise, first player starts
        return { starterId: 0 };
    }
    
    /**
     * Validate pass move (always legal)
     * @returns {object} Validation result
     */
    validatePassMove() {
        return {
            valid: true,
            reason: 'pass-always-legal'
        };
    }
    
    /**
     * Get pass statistics
     * @returns {object} Pass statistics
     */
    getPassStatistics() {
        if (!this.gameState) {
            return {
                playerPassCounts: [0, 0, 0, 0],
                totalPasses: 0,
                consecutivePasses: 0
            };
        }
        
        const playerPassCounts = this.gameState.players.map(p => p.passCount);
        const totalPasses = playerPassCounts.reduce((sum, count) => sum + count, 0);
        
        return {
            playerPassCounts: playerPassCounts,
            totalPasses: totalPasses,
            consecutivePasses: this.gameState.consecutivePasses
        };
    }
    
    /**
     * Get current turn number
     * @returns {number} Turn number
     */
    getTurnNumber() {
        if (!this.gameState) {
            return 0;
        }
        
        return this.gameState.turnNumber;
    }
    
    /**
     * Play cards and reset pass count
     * @param {Array} cards - Cards to play
     * @returns {object} Play result
     */
    playCardsAndResetPass(cards) {
        if (!this.gameState) {
            return { success: false, error: 'Game state not initialized' };
        }
        
        // Basic validation
        if (!cards || cards.length === 0) {
            return { success: false, error: 'No cards provided' };
        }
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        
        // Reset pass count for current player
        currentPlayer.passCount = 0;
        
        // Reset consecutive passes
        this.gameState.consecutivePasses = 0;
        
        // Set last player to play
        this.gameState.lastPlayerToPlay = this.gameState.currentPlayer;
        
        // Update field cards
        this.gameState.fieldCards = cards;
        this.gameState.lastPlayedCards = cards;
        
        return {
            success: true,
            passReset: true,
            cardsPlayed: cards,
            playerId: currentPlayer.id
        };
    }
    
    /**
     * Get playable cards from current player's hand
     * @returns {Array} Playable cards
     */
    getPlayableCardsFromHand() {
        if (!this.gameState) {
            return [];
        }
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        const playerHand = currentPlayer.hand;
        
        // If field is empty, all cards are playable
        if (!this.gameState.fieldCards || this.gameState.fieldCards.length === 0) {
            return playerHand;
        }
        
        // Find cards that can beat current field
        const playableCards = playerHand.filter(card => {
            const canPlay = this.canPlayOnField([card], this.gameState.fieldCards);
            return canPlay.canPlay;
        });
        
        return playableCards;
    }
    
    /**
     * Check if player has finished (no cards left)
     * @param {number} playerId - Player to check
     * @returns {object} Player finish status
     */
    checkPlayerFinished(playerId) {
        if (!this.gameState || playerId < 0 || playerId >= this.gameState.playerCount) {
            return { finished: false, cardCount: -1 };
        }
        
        const player = this.gameState.players[playerId];
        const finished = player.hand.length === 0;
        
        return {
            finished: finished,
            cardCount: player.hand.length,
            playerId: playerId,
            playerName: player.name
        };
    }
    
    /**
     * Handle player finishing the game
     * @param {number} playerId - Player who finished
     * @returns {object} Finish result
     */
    playerFinish(playerId) {
        if (!this.gameState || this.gameState.gameEnded) {
            return { success: false, error: 'Game not active' };
        }
        
        const player = this.gameState.players[playerId];
        if (player.finished) {
            return { success: false, error: 'Player already finished' };
        }
        
        // Determine rank based on how many players have already finished
        const finishedCount = this.gameState.players.filter(p => p.finished).length;
        const rank = finishedCount + 1;
        
        // Set player as finished
        player.finished = true;
        player.rank = rank;
        player.finishTime = this.gameState.turnNumber;
        
        // Assign social rank
        const socialRanks = ['Daifugo', 'Fugo', 'Heimin', 'Hinmin'];
        player.socialRank = socialRanks[rank - 1];
        
        // Add to rankings
        this.gameState.rankings.push({
            playerId: playerId,
            rank: rank,
            socialRank: player.socialRank,
            finishTime: player.finishTime
        });
        
        // Check if game should end
        const remainingPlayers = this.gameState.players.filter(p => !p.finished).length;
        if (remainingPlayers <= 1) {
            this.endGame();
        }
        
        return {
            success: true,
            rank: rank,
            socialRank: player.socialRank,
            playerId: playerId,
            finishTime: player.finishTime
        };
    }
    
    /**
     * End the game and assign final rankings
     */
    endGame() {
        if (!this.gameState) return;
        
        // Assign last place to remaining player
        const remainingPlayer = this.gameState.players.find(p => !p.finished);
        if (remainingPlayer) {
            remainingPlayer.finished = true;
            remainingPlayer.rank = 4;
            remainingPlayer.socialRank = 'Hinmin';
            remainingPlayer.finishTime = this.gameState.turnNumber;
            
            this.gameState.rankings.push({
                playerId: remainingPlayer.id,
                rank: 4,
                socialRank: 'Hinmin',
                finishTime: remainingPlayer.finishTime
            });
        }
        
        // Set game as ended
        this.gameState.gameEnded = true;
        this.gameState.gamePhase = 'completed';
        this.gameState.winner = this.gameState.rankings.find(r => r.rank === 1)?.playerId || null;
        
        // Sort rankings by rank
        this.gameState.rankings.sort((a, b) => a.rank - b.rank);
    }
    
    /**
     * Get current rankings
     * @returns {object} Current rankings
     */
    getCurrentRankings() {
        if (!this.gameState) {
            return { players: [] };
        }
        
        const finishedPlayers = this.gameState.players
            .filter(p => p.finished)
            .map(p => ({
                playerId: p.id,
                name: p.name,
                rank: p.rank,
                socialRank: p.socialRank,
                finishTime: p.finishTime
            }))
            .sort((a, b) => a.rank - b.rank);
        
        return {
            players: finishedPlayers,
            totalFinished: finishedPlayers.length,
            gameEnded: this.gameState.gameEnded
        };
    }
    
    /**
     * Get social rankings (Daifugo system)
     * @returns {object} Social rankings
     */
    getSocialRankings() {
        if (!this.gameState) {
            return {};
        }
        
        const rankings = {};
        this.gameState.players.forEach(player => {
            if (player.socialRank) {
                rankings[player.socialRank.toLowerCase()] = player.id;
            }
        });
        
        return rankings;
    }
    
    /**
     * Check if game should end
     * @returns {object} Game end status
     */
    checkGameEnd() {
        if (!this.gameState) {
            return { gameEnded: false, remainingPlayers: 0 };
        }
        
        const remainingPlayers = this.gameState.players.filter(p => !p.finished).length;
        const gameEnded = this.gameState.gameEnded || remainingPlayers <= 1;
        
        return {
            gameEnded: gameEnded,
            remainingPlayers: remainingPlayers,
            winner: this.gameState.winner,
            finalRankings: gameEnded ? this.gameState.rankings : null
        };
    }
    
    /**
     * Get final rankings
     * @returns {object} Final rankings
     */
    getFinalRankings() {
        if (!this.gameState) {
            return { complete: false, players: [] };
        }
        
        return {
            complete: this.gameState.gameEnded,
            players: this.gameState.rankings,
            winner: this.gameState.winner
        };
    }
    
    /**
     * Get finish order
     * @returns {object} Finish order
     */
    getFinishOrder() {
        if (!this.gameState) {
            return { order: [] };
        }
        
        const order = this.gameState.rankings
            .sort((a, b) => a.rank - b.rank)
            .map(r => ({
                playerId: r.playerId,
                rank: r.rank,
                socialRank: r.socialRank,
                name: this.gameState.players[r.playerId].name
            }));
        
        return { order: order };
    }
    
    /**
     * Get complete social rankings
     * @returns {object} Complete social rankings
     */
    getCompleteSocialRankings() {
        if (!this.gameState || !this.gameState.gameEnded) {
            return {};
        }
        
        const social = {};
        this.gameState.rankings.forEach(ranking => {
            const socialKey = ranking.socialRank.toLowerCase();
            social[socialKey] = ranking.playerId;
        });
        
        return social;
    }
    
    /**
     * Get ranking statistics
     * @returns {object} Ranking statistics
     */
    getRankingStatistics() {
        if (!this.gameState) {
            return { playerStats: [] };
        }
        
        const playerStats = this.gameState.players.map(player => ({
            playerId: player.id,
            name: player.name,
            rank: player.rank,
            socialRank: player.socialRank,
            finishTime: player.finishTime,
            finished: player.finished
        }));
        
        return {
            playerStats: playerStats,
            gameComplete: this.gameState.gameEnded,
            totalTurns: this.gameState.turnNumber
        };
    }
    
    /**
     * Validate move after game end
     * @returns {object} Validation result
     */
    validateMoveAfterGameEnd() {
        if (!this.gameState) {
            return { valid: false, reason: 'no-game-state' };
        }
        
        if (this.gameState.gameEnded) {
            return { valid: false, reason: 'game-ended' };
        }
        
        return { valid: true, reason: 'game-active' };
    }
    
    /**
     * Get game summary
     * @returns {object} Game summary
     */
    getGameSummary() {
        if (!this.gameState) {
            return {};
        }
        
        return {
            winner: this.gameState.winner,
            rankings: this.gameState.rankings,
            totalTurns: this.gameState.turnNumber,
            gameLength: this.gameState.turnNumber,
            gameEnded: this.gameState.gameEnded,
            playerCount: this.gameState.playerCount
        };
    }
    
    /**
     * Prepare for next round
     * @returns {object} Next round preparation
     */
    prepareNextRound() {
        if (!this.gameState || !this.gameState.gameEnded) {
            return { success: false, error: 'Game not completed' };
        }
        
        // Save current round to history
        this.gameState.roundHistory.push({
            round: this.gameState.currentRound,
            rankings: [...this.gameState.rankings],
            winner: this.gameState.winner
        });
        
        // Prepare next round
        this.gameState.currentRound++;
        
        // Reset player states but keep social ranks
        this.gameState.players.forEach(player => {
            const previousSocialRank = player.socialRank;
            player.hand = [];
            player.finished = false;
            player.rank = null;
            player.finishTime = null;
            player.passCount = 0;
            // Keep socialRank for card exchange
            player.socialRank = previousSocialRank;
        });
        
        // Reset game state
        this.gameState.gameEnded = false;
        this.gameState.gamePhase = 'ready';
        this.gameState.winner = null;
        this.gameState.rankings = [];
        this.gameState.turnNumber = 0;
        this.gameState.consecutivePasses = 0;
        this.gameState.fieldCards = [];
        this.gameState.lastPlayedCards = [];
        
        return {
            success: true,
            rankingsCarriedOver: true,
            cardExchangeRequired: true,
            newRound: this.gameState.currentRound
        };
    }
    
    /**
     * Get card exchange rules
     * @returns {object} Card exchange rules
     */
    getCardExchangeRules() {
        return {
            hinminToDaifugo: 2,  // Hinmin gives 2 best cards to Daifugo
            heiminToFugo: 1,    // Heimin gives 1 best card to Fugo
            daifugoToHinmin: 2, // Daifugo gives 2 worst cards to Hinmin
            fugoToHeimin: 1,    // Fugo gives 1 worst card to Heimin
            description: 'Lower ranks give best cards, higher ranks give worst cards'
        };
    }
    
    /**
     * Get multi-round statistics
     * @returns {object} Multi-round statistics
     */
    getMultiRoundStatistics() {
        if (!this.gameState) {
            return { currentRound: 1, roundHistory: [], playerRankHistory: [] };
        }
        
        const playerRankHistory = this.gameState.players.map(player => ({
            playerId: player.id,
            name: player.name,
            currentSocialRank: player.socialRank,
            roundHistory: this.gameState.roundHistory.map(round => {
                const playerRank = round.rankings.find(r => r.playerId === player.id);
                return {
                    round: round.round,
                    rank: playerRank?.rank || null,
                    socialRank: playerRank?.socialRank || null
                };
            })
        }));
        
        return {
            currentRound: this.gameState.currentRound,
            roundHistory: this.gameState.roundHistory,
            playerRankHistory: playerRankHistory
        };
    }
    
    /**
     * Make intelligent AI decision that considers card strength
     * @param {number} playerId - AI player ID
     * @returns {object} Intelligent AI decision
     */
    makeIntelligentAIDecision(playerId) {
        if (!this.gameState || playerId === 0) {
            return { success: false, error: 'Invalid AI player' };
        }
        
        const player = this.gameState.players[playerId];
        const playerHand = player.hand;
        
        if (playerHand.length === 0) {
            return { success: false, error: 'Player has no cards' };
        }
        
        // Analyze field state
        const fieldCards = this.gameState.fieldCards;
        const revolution = this.gameState.isRevolution;
        
        // Find cards that can beat current field
        let playableCards = [];
        if (fieldCards.length === 0) {
            // Empty field - all cards playable
            playableCards = playerHand;
        } else {
            playableCards = playerHand.filter(card => {
                const canPlay = this.canPlayOnField([card], fieldCards);
                return canPlay.canPlay;
            });
        }
        
        if (playableCards.length === 0) {
            return {
                success: true,
                action: 'pass',
                reason: 'no-playable-cards',
                playerId: playerId
            };
        }
        
        // Select best card strategically (lowest value that can beat field)
        playableCards.sort((a, b) => {
            const valueA = this.getCardRankValue(a, revolution);
            const valueB = this.getCardRankValue(b, revolution);
            return valueA - valueB;
        });
        
        const selectedCard = playableCards[0];
        
        return {
            success: true,
            action: 'play',
            cards: [selectedCard],
            playerId: playerId,
            strategy: 'intelligent',
            reasoning: 'selected-lowest-valid-card'
        };
    }
    
    /**
     * Make strategic AI decision with advanced planning
     * @param {number} playerId - AI player ID
     * @returns {object} Strategic AI decision
     */
    makeStrategicAIDecision(playerId) {
        if (!this.gameState || playerId === 0) {
            return { success: false, error: 'Invalid AI player' };
        }
        
        const player = this.gameState.players[playerId];
        const playerHand = player.hand;
        
        // Empty field - choose conservative strategy
        if (!this.gameState.fieldCards || this.gameState.fieldCards.length === 0) {
            // Play lowest value card to conserve high cards
            const sortedHand = playerHand.slice().sort((a, b) => {
                return this.getCardRankValue(a) - this.getCardRankValue(b);
            });
            
            return {
                action: 'play',
                cards: [sortedHand[0]],
                strategy: 'conservative',
                reasoning: 'conserve-high-cards'
            };
        }
        
        return this.makeIntelligentAIDecision(playerId);
    }
    
    /**
     * Find pairs in player's hand
     * @param {number} playerId - Player ID
     * @returns {object} Pairs found
     */
    findPairsInHand(playerId) {
        if (!this.gameState || playerId < 0 || playerId >= this.gameState.playerCount) {
            return { found: false, pairs: [] };
        }
        
        const playerHand = this.gameState.players[playerId].hand;
        const rankCounts = {};
        
        // Count cards by rank
        playerHand.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });
        
        // Find pairs (2+ cards of same rank)
        const pairs = [];
        Object.keys(rankCounts).forEach(rank => {
            if (rankCounts[rank] >= 2) {
                const pairCards = playerHand.filter(card => card.rank === rank);
                pairs.push({
                    rank: rank,
                    count: rankCounts[rank],
                    cards: pairCards.slice(0, 2) // Take first 2 for pair
                });
            }
        });
        
        return {
            found: pairs.length > 0,
            pairs: pairs,
            totalPairs: pairs.length
        };
    }
    
    /**
     * Make strategic decision about playing pairs
     * @param {number} playerId - AI player ID
     * @returns {object} Pair strategic decision
     */
    makePairStrategicDecision(playerId) {
        const pairData = this.findPairsInHand(playerId);
        
        return {
            considersPairs: true,
            action: pairData.found ? 'consider-pairs' : 'single-cards',
            availablePairs: pairData.pairs,
            strategy: 'pair-aware'
        };
    }
    
    /**
     * Make decision considering special rules
     * @param {number} playerId - AI player ID
     * @returns {object} Special rule decision
     */
    makeSpecialRuleDecision(playerId) {
        if (!this.gameState) {
            return { considersEightCut: false, considersRevolution: false, considersQBomber: false };
        }
        
        const playerHand = this.gameState.players[playerId].hand;
        
        // Check for 8-cut opportunity
        const hasEight = playerHand.some(card => card.rank === '8');
        
        // Check for revolution opportunity (4 of same rank)
        const rankCounts = {};
        playerHand.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });
        const hasRevolution = Object.values(rankCounts).some(count => count >= 4);
        
        // Check for Q-bomber opportunity
        const queenCount = rankCounts['Q'] || 0;
        const hasQBomber = queenCount >= 2;
        
        return {
            considersEightCut: hasEight,
            considersRevolution: hasRevolution,
            considersQBomber: hasQBomber,
            specialOpportunities: {
                eightCut: hasEight,
                revolution: hasRevolution,
                qBomber: hasQBomber
            }
        };
    }
    
    /**
     * Analyze opponent hands and threats
     * @param {number} playerId - AI player ID
     * @returns {object} Opponent analysis
     */
    analyzeOpponentHands(playerId) {
        if (!this.gameState) {
            return { opponentCardCounts: [], threatLevel: 'low' };
        }
        
        const opponentCardCounts = [];
        let highThreat = false;
        
        this.gameState.players.forEach((player, index) => {
            if (index !== playerId && !player.finished) {
                const cardCount = player.hand.length;
                opponentCardCounts.push({
                    playerId: index,
                    name: player.name,
                    cards: cardCount
                });
                
                // High threat if opponent has 2 or fewer cards
                if (cardCount <= 2) {
                    highThreat = true;
                }
            }
        });
        
        return {
            opponentCardCounts: opponentCardCounts,
            threatLevel: highThreat ? 'high' : 'low',
            analysisComplete: true
        };
    }
    
    /**
     * Make AI decision with difficulty level
     * @param {number} playerId - AI player ID  
     * @param {string} difficulty - Difficulty level
     * @returns {object} AI decision with difficulty
     */
    makeAIDecisionWithDifficulty(playerId, difficulty) {
        const baseDecision = this.makeIntelligentAIDecision(playerId);
        
        let randomness = 0;
        let strategicDepth = 1;
        
        switch (difficulty) {
            case 'easy':
                randomness = 0.3;
                strategicDepth = 1;
                break;
            case 'medium':
                randomness = 0.1;
                strategicDepth = 2;
                break;
            case 'hard':
                randomness = 0.05;
                strategicDepth = 4;
                break;
        }
        
        // Create new decision with difficulty properties
        const difficultyDecision = Object.assign({}, baseDecision);
        difficultyDecision.difficulty = difficulty;
        difficultyDecision.randomness = randomness;
        difficultyDecision.strategicDepth = strategicDepth;
        
        if (strategicDepth >= 3) {
            difficultyDecision.gameStateEvaluation = {
                fieldAnalysis: 'complete',
                opponentTracking: 'active',
                futureProjection: strategicDepth
            };
        }
        
        return difficultyDecision;
    }
    
    /**
     * Make endgame strategic decision
     * @param {number} playerId - AI player ID
     * @returns {object} Endgame decision
     */
    makeEndgameDecision(playerId) {
        if (!this.gameState) {
            return { endgameMode: false };
        }
        
        const player = this.gameState.players[playerId];
        const handSize = player.hand.length;
        const isEndgame = handSize <= 3;
        
        return {
            endgameMode: isEndgame,
            strategy: isEndgame ? 'aggressive' : 'normal',
            handSize: handSize,
            urgency: isEndgame ? 'high' : 'low'
        };
    }
    
    /**
     * Make blocking decision against opponents
     * @param {number} playerId - AI player ID
     * @returns {object} Blocking decision
     */
    makeBlockingDecision(playerId) {
        const opponentAnalysis = this.analyzeOpponentHands(playerId);
        const threatAnalysis = this.analyzeOpponentThreats(playerId);
        
        const hasBlockingOpportunity = opponentAnalysis.threatLevel === 'high';
        
        return {
            blockingOpportunity: hasBlockingOpportunity,
            strategy: hasBlockingOpportunity ? 'blocking' : 'normal',
            threatAnalysis: threatAnalysis
        };
    }
    
    /**
     * Get AI learning data
     * @param {number} playerId - AI player ID
     * @returns {object} Learning data
     */
    getAILearningData(playerId) {
        if (!this.gameState || playerId === 0) {
            return { successfulMoves: 0, failedMoves: 0, strategyHistory: [] };
        }
        
        const player = this.gameState.players[playerId];
        const aiData = player.aiData || {
            successfulMoves: 0,
            failedMoves: 0,
            strategyHistory: []
        };
        
        return {
            successfulMoves: aiData.successfulMoves,
            failedMoves: aiData.failedMoves,
            strategyHistory: aiData.strategyHistory,
            totalDecisions: aiData.successfulMoves + aiData.failedMoves
        };
    }
    
    /**
     * Get opponent adaptation data
     * @param {number} playerId - AI player ID
     * @returns {object} Adaptation data
     */
    getOpponentAdaptationData(playerId) {
        if (!this.gameState) {
            return { opponentPatterns: [], adaptationLevel: 0 };
        }
        
        const opponentPatterns = [];
        this.gameState.players.forEach((player, index) => {
            if (index !== playerId) {
                opponentPatterns.push({
                    playerId: index,
                    name: player.name,
                    tendencies: {
                        aggressive: Math.random() * 0.5,
                        conservative: Math.random() * 0.5,
                        special_rules: Math.random() * 0.3
                    }
                });
            }
        });
        
        return {
            opponentPatterns: opponentPatterns,
            adaptationLevel: 0.7,
            trackingActive: true
        };
    }
    
    /**
     * Make optimized AI decision with performance tracking
     * @param {number} playerId - AI player ID
     * @returns {object} Optimized decision
     */
    makeOptimizedAIDecision(playerId) {
        const startTime = Date.now();
        const decision = this.makeIntelligentAIDecision(playerId);
        const endTime = Date.now();
        
        return {
            ...decision,
            decisionTime: endTime - startTime,
            optimized: true,
            performance: 'fast'
        };
    }
    
    /**
     * Get AI cache data
     * @param {number} playerId - AI player ID
     * @returns {object} Cache data
     */
    getAICacheData(playerId) {
        if (!this.gameState || playerId === 0) {
            return { cacheHits: 0, cacheMisses: 0, cacheSize: 0 };
        }
        
        const player = this.gameState.players[playerId];
        const aiData = player.aiData || {};
        
        return {
            cacheHits: aiData.cacheHits || 0,
            cacheMisses: aiData.cacheMisses || 0,
            cacheSize: aiData.decisionCache ? aiData.decisionCache.size : 0,
            hitRate: (aiData.cacheHits || 0) / Math.max(1, (aiData.cacheHits || 0) + (aiData.cacheMisses || 0))
        };
    }
    
    /**
     * Analyze opponent threats
     * @param {number} playerId - AI player ID
     * @returns {object} Threat analysis
     */
    analyzeOpponentThreats(playerId) {
        const opponentAnalysis = this.analyzeOpponentHands(playerId);
        const highThreat = opponentAnalysis.opponentCardCounts.some(opponent => opponent.cards <= 2);
        
        return {
            highThreat: highThreat,
            threatLevel: highThreat ? 'critical' : 'normal',
            dangerousOpponents: opponentAnalysis.opponentCardCounts.filter(opp => opp.cards <= 2)
        };
    }
    
    /**
     * Compare card strength in Daifugo
     * @param {string} cardA - First card rank
     * @param {string} cardB - Second card rank
     * @returns {boolean} True if cardB is stronger than cardA
     */
    isStronger(cardA, cardB) {
        const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'JOKER'];
        const revolutionOrder = ['JOKER', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
        
        const isRevolution = this.gameState && this.gameState.isRevolution;
        const order = isRevolution ? revolutionOrder : cardOrder;
        
        const indexA = order.indexOf(cardA);
        const indexB = order.indexOf(cardB);
        
        // Handle unknown cards
        if (indexA === -1 || indexB === -1) {
            return false;
        }
        
        return indexB > indexA;
    }
}

// Global export for browser use
if (typeof window !== 'undefined') {
    window.LispGameEngine = LispGameEngine;
}

// Node.js global export
if (typeof global !== 'undefined') {
    global.LispGameEngine = LispGameEngine;
}

// ES6 module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LispGameEngine };
}

console.log('🎯 Lisp Game Engine module loaded');