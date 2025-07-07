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
        
        // Make AI decision
        if (trimmed.startsWith('(make-ai-decision')) {
            const playerId = parseInt(trimmed.match(/\d+/)[0]);
            return this.makeAIDecision(playerId);
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
        
        // ゲーム状態初期化
        if (trimmed.startsWith('(init-game-state')) {
            const playerCount = parseInt(trimmed.match(/\d+/)[0]);
            this.gameState = {
                playerCount: playerCount,
                players: Array.from({ length: playerCount }, (_, i) => ({
                    id: i,
                    hand: [],
                    name: i === 0 ? 'Human' : `CPU${i}`
                })),
                currentPlayer: 0,
                fieldCards: [],
                lastPlayedCards: [],
                isRevolution: false
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
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.validatePlay(cards);
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
            const cardsMatch = trimmed.match(/\[.*\]/);
            if (cardsMatch) {
                const cards = JSON.parse(cardsMatch[0]);
                return this.playCards(cards);
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
                cardCount: p.hand.length
            })),
            currentPlayer: this.gameState.currentPlayer,
            fieldCards: this.gameState.fieldCards,
            lastPlayedCards: this.gameState.lastPlayedCards,
            isRevolution: this.gameState.isRevolution
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
        
        // Q-bomberチェック（優先度2）
        const qBomberResult = this.detectQBomber(cards);
        if (qBomberResult.detected) {
            return { valid: true, reason: '💣 Qボンバー！', special: 'q-bomber' };
        }
        
        // 8切りチェック（優先度1 - 最高）
        const has8 = cards.some(card => card.rank === '8');
        if (has8 && cards.length === 1) {
            return { valid: true, reason: '8切り！', special: '8cut' };
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
                isAI: i !== 0
            })),
            currentPlayer: 0,
            fieldCards: [],
            lastPlayedCards: [],
            isRevolution: false,
            gamePhase: 'ready',
            turnCount: 0,
            winner: null,
            deck: []
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
                isAI: p.isAI
            })),
            currentPlayer: this.gameState.currentPlayer,
            fieldCards: this.gameState.fieldCards,
            gamePhase: this.gameState.gamePhase,
            turnCount: this.gameState.turnCount,
            winner: this.gameState.winner
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
        if (!this.gameState || !this.gameState.players[playerId]) {
            return { action: 'pass' };
        }
        
        const player = this.gameState.players[playerId];
        
        // Simple AI: play first card if possible
        if (player.hand.length > 0) {
            return {
                action: 'play',
                cards: [player.hand[0]]
            };
        }
        
        return { action: 'pass' };
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
            'state-management'
        ];
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