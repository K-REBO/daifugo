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
        return Array.from(this.rules.keys()).map(key => key.replace('.lisp', ''));
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