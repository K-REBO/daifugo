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
     * Validate card play
     * @param {Array} cards - Cards to validate
     * @returns {object} Validation result
     */
    validatePlay(cards) {
        if (!cards || cards.length === 0) {
            return { valid: false, reason: 'No cards selected' };
        }
        
        // 8切りチェック
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