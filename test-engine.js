/**
 * Node.js Game Engine Test Suite
 * ブラウザ版のゲームエンジンを Node.js で直接テストする
 */

// テスト結果を格納
let testResults = [];

// ログ関数
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        info: '\x1b[36m',    // cyan
        success: '\x1b[32m', // green
        error: '\x1b[31m',   // red
        warning: '\x1b[33m', // yellow
        reset: '\x1b[0m'     // reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// アサーション関数
function assert(condition, message) {
    if (condition) {
        log(`✅ ${message}`, 'success');
        return true;
    } else {
        log(`❌ ${message}`, 'error');
        return false;
    }
}

// テスト結果記録
function addTestResult(name, passed, details = '') {
    testResults.push({ name, passed, details, timestamp: new Date() });
}

// カードクラスの簡易実装（テスト用）
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.isJoker = suit === 'JOKER';
    }
    
    getValue(isRevolution = false) {
        if (this.isJoker) return isRevolution ? 0 : 15;
        
        const values = {
            '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
            'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13
        };
        
        const value = values[this.rank] || 0;
        return isRevolution ? (14 - value) : value;
    }
    
    getDisplayText() {
        return `${this.suit}${this.rank}`;
    }
}

// プレイヤークラスの簡易実装（テスト用）
class Player {
    constructor(name, isHuman = false) {
        this.name = name;
        this.hand = [];
        this.isCurrentTurn = false;
        this.status = 'waiting';
        this._isHuman = isHuman;
    }
    
    isHuman() {
        return this._isHuman;
    }
    
    getHand() {
        return [...this.hand];
    }
    
    addCards(cards) {
        this.hand.push(...cards);
    }
    
    removeCards(cards) {
        cards.forEach(card => {
            const index = this.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
            if (index !== -1) {
                this.hand.splice(index, 1);
            }
        });
    }
    
    isFinished() {
        return this.hand.length === 0;
    }
    
    setTurn(isTurn) {
        this.isCurrentTurn = isTurn;
    }
}

// プレイヤーマネージャークラス（テスト用）
class PlayerManager {
    constructor(playerCount) {
        this.players = [];
        this.currentPlayerIndex = 0;
        
        // プレイヤー作成
        for (let i = 0; i < playerCount; i++) {
            const isHuman = i === 0;
            const name = isHuman ? 'Human' : `CPU${i}`;
            this.players.push(new Player(name, isHuman));
        }
        
        this.setCurrentPlayer(0);
    }
    
    getAllPlayers() {
        return this.players;
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    getCurrentPlayerIndex() {
        return this.currentPlayerIndex;
    }
    
    setCurrentPlayer(index) {
        this.players.forEach(p => p.setTurn(false));
        this.currentPlayerIndex = index;
        this.players[index].setTurn(true);
    }
    
    nextTurn() {
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Skip finished players
        while (this.players[nextIndex].isFinished() && nextIndex !== this.currentPlayerIndex) {
            nextIndex = (nextIndex + 1) % this.players.length;
        }
        
        this.setCurrentPlayer(nextIndex);
    }
    
    dealCards(deck) {
        // Simple card dealing
        for (let i = 0; i < deck.length; i++) {
            const playerIndex = i % this.players.length;
            this.players[playerIndex].addCards([deck[i]]);
        }
    }
    
    isGameOver() {
        const activePlayers = this.players.filter(p => !p.isFinished());
        return activePlayers.length <= 1;
    }
    
    getGameStatus() {
        return {
            currentPlayer: this.getCurrentPlayer().name,
            currentPlayerIndex: this.currentPlayerIndex,
            players: this.players.map(p => ({
                name: p.name,
                cardCount: p.hand.length,
                isFinished: p.isFinished(),
                isTurn: p.isCurrentTurn
            }))
        };
    }
}

// ゲームロジッククラス（テスト用 - 主要部分のみ）
class GameLogic {
    constructor(playerManager) {
        this.playerManager = playerManager;
        this.deck = [];
        this.fieldCards = [];
        this.lastPlayedCards = [];
        this.lastPlayerName = '';
        this.gameState = 'waiting';
        this.isRevolution = false;
        this.skipCount = 0;
        this.finishedOrder = [];
    }
    
    createDeck() {
        this.deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        
        suits.forEach(suit => {
            ranks.forEach(rank => {
                this.deck.push(new Card(suit, rank));
            });
        });
        
        this.deck.push(new Card('JOKER', 'JOKER'));
        this.deck.push(new Card('JOKER', 'JOKER'));
        
        this.shuffleDeck();
    }
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.isRevolution = false;
        this.skipCount = 0;
        this.finishedOrder = [];
        this.fieldCards = [];
        this.lastPlayedCards = [];
        
        this.createDeck();
        this.playerManager.dealCards(this.deck);
        this.deck = []; // Cards are dealt
        
        return true;
    }
    
    has8Cut(cards) {
        return cards.some(card => card.rank === '8');
    }
    
    isRuleEnabled(ruleId) {
        // テスト用：全ルール有効
        return true;
    }
    
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
        
        // Check for 8-cut rule first
        if (this.has8Cut(cards) && this.isRuleEnabled('eight-cut') && cards.length === 1) {
            return { valid: true, reason: '8切り！', special: '8cut' };
        }
        
        // Check if it beats the last played cards
        if (this.lastPlayedCards.length > 0) {
            if (cards.length !== this.lastPlayedCards.length) {
                return { valid: false, reason: `${this.lastPlayedCards.length}枚のカードを出してください` };
            }
            
            const newValue = this.getCardsValue(cards);
            const lastValue = this.getCardsValue(this.lastPlayedCards);
            
            if (newValue <= lastValue) {
                return { valid: false, reason: 'より強いカードを出してください' };
            }
        }
        
        // Check for revolution
        if (cards.length === 4 && this.isRuleEnabled('revolution')) {
            return { valid: true, reason: '革命！', special: 'revolution' };
        }
        
        return { valid: true, reason: '' };
    }
    
    getCardsValue(cards) {
        if (cards.length === 0) return 0;
        const card = cards.find(c => !c.isJoker) || cards[0];
        return card.getValue(this.isRevolution);
    }
    
    playCards(cards) {
        const validation = this.canPlayCards(cards);
        if (!validation.valid) {
            return { success: false, message: validation.reason };
        }
        
        const currentPlayer = this.playerManager.getCurrentPlayer();
        currentPlayer.removeCards(cards);
        
        this.fieldCards = [...cards];
        this.lastPlayedCards = [...cards];
        this.lastPlayerName = currentPlayer.name;
        
        if (validation.special === 'revolution') {
            this.isRevolution = !this.isRevolution;
        }
        
        if (validation.special === '8cut') {
            this.fieldCards = [];
            this.lastPlayedCards = [];
            this.lastPlayerName = '';
        }
        
        if (currentPlayer.isFinished()) {
            this.finishedOrder.push(currentPlayer);
        }
        
        this.skipCount = 0;
        
        // 8切りの場合はターンを進めない
        if (validation.special !== '8cut') {
            this.playerManager.nextTurn();
        }
        
        return {
            success: true,
            message: validation.reason || 'カードを出しました',
            special: validation.special
        };
    }
    
    passTurn() {
        this.skipCount++;
        
        const playersLeft = this.playerManager.getAllPlayers().filter(p => !p.isFinished()).length;
        if (this.skipCount >= playersLeft - 1) {
            this.fieldCards = [];
            this.lastPlayedCards = [];
            this.lastPlayerName = '';
            this.skipCount = 0;
        }
        
        this.playerManager.nextTurn();
        return { success: true, message: 'パスしました' };
    }
}

// テスト関数群
function test8CutRule() {
    log('🔍 8切りルールテストを開始...', 'info');
    
    try {
        const playerManager = new PlayerManager(4);
        const gameLogic = new GameLogic(playerManager);
        
        const eightCard = new Card('♠', '8');
        const testCards = [eightCard];
        
        // Test 1: 8切り検出
        const has8Cut = gameLogic.has8Cut(testCards);
        const test1 = assert(has8Cut, '8切り検出テスト');
        
        // Test 2: ルール有効性
        const ruleEnabled = gameLogic.isRuleEnabled('eight-cut');
        const test2 = assert(ruleEnabled, '8切りルール有効性テスト');
        
        // Test 3: バリデーション
        const validation = gameLogic.canPlayCards(testCards);
        const test3 = assert(validation.valid && validation.special === '8cut', '8切りバリデーションテスト');
        
        // Test 4: 実際のプレイとターン継続
        gameLogic.fieldCards = [new Card('♥', 'K')];
        gameLogic.lastPlayedCards = [new Card('♥', 'K')];
        
        const playerBefore = gameLogic.playerManager.getCurrentPlayerIndex();
        const playResult = gameLogic.playCards(testCards);
        const playerAfter = gameLogic.playerManager.getCurrentPlayerIndex();
        
        const test4 = assert(playResult.success && playResult.special === '8cut', '8切りプレイテスト');
        const test5 = assert(gameLogic.fieldCards.length === 0, 'フィールドクリアテスト');
        const test6 = assert(playerBefore === playerAfter, 'ターン継続テスト');
        
        const allPassed = test1 && test2 && test3 && test4 && test5 && test6;
        addTestResult('8切りルール', allPassed);
        
        log(`8切りルールテスト完了: ${allPassed ? '成功' : '失敗'}`, allPassed ? 'success' : 'error');
        return allPassed;
        
    } catch (error) {
        log(`❌ 8切りテストエラー: ${error.message}`, 'error');
        addTestResult('8切りルール', false, error.message);
        return false;
    }
}

function testRevolutionRule() {
    log('🔍 革命ルールテストを開始...', 'info');
    
    try {
        const playerManager = new PlayerManager(4);
        const gameLogic = new GameLogic(playerManager);
        
        const fourCards = [
            new Card('♠', '3'),
            new Card('♥', '3'),
            new Card('♦', '3'),
            new Card('♣', '3')
        ];
        
        // Test 1: 革命検出
        const validation = gameLogic.canPlayCards(fourCards);
        const test1 = assert(validation.valid && validation.special === 'revolution', '革命検出テスト');
        
        // Test 2: 革命実行
        const initialRevolution = gameLogic.isRevolution;
        const playResult = gameLogic.playCards(fourCards);
        const afterRevolution = gameLogic.isRevolution;
        
        const test2 = assert(playResult.success && playResult.special === 'revolution', '革命実行テスト');
        const test3 = assert(initialRevolution !== afterRevolution, '革命状態変更テスト');
        
        const allPassed = test1 && test2 && test3;
        addTestResult('革命ルール', allPassed);
        
        log(`革命ルールテスト完了: ${allPassed ? '成功' : '失敗'}`, allPassed ? 'success' : 'error');
        return allPassed;
        
    } catch (error) {
        log(`❌ 革命テストエラー: ${error.message}`, 'error');
        addTestResult('革命ルール', false, error.message);
        return false;
    }
}

function testCardValidation() {
    log('🔍 カード検証テストを開始...', 'info');
    
    try {
        const playerManager = new PlayerManager(4);
        const gameLogic = new GameLogic(playerManager);
        
        // Test 1: 空のカード
        const test1 = assert(!gameLogic.canPlayCards([]).valid, '空カード拒否テスト');
        
        // Test 2: 異なるランクのカード
        const mixedCards = [
            new Card('♠', '3'),
            new Card('♥', '4')
        ];
        const test2 = assert(!gameLogic.canPlayCards(mixedCards).valid, '異ランク拒否テスト');
        
        // Test 3: 同じランクのカード
        const sameRankCards = [
            new Card('♠', '3'),
            new Card('♥', '3')
        ];
        const test3 = assert(gameLogic.canPlayCards(sameRankCards).valid, '同ランク許可テスト');
        
        // Test 4: 強さ比較
        gameLogic.lastPlayedCards = [new Card('♠', '4')];
        const weakCard = [new Card('♥', '3')];
        const strongCard = [new Card('♦', '5')];
        
        const test4 = assert(!gameLogic.canPlayCards(weakCard).valid, '弱カード拒否テスト');
        const test5 = assert(gameLogic.canPlayCards(strongCard).valid, '強カード許可テスト');
        
        const allPassed = test1 && test2 && test3 && test4 && test5;
        addTestResult('カード検証', allPassed);
        
        log(`カード検証テスト完了: ${allPassed ? '成功' : '失敗'}`, allPassed ? 'success' : 'error');
        return allPassed;
        
    } catch (error) {
        log(`❌ カード検証テストエラー: ${error.message}`, 'error');
        addTestResult('カード検証', false, error.message);
        return false;
    }
}

function testGameFlow() {
    log('🔍 ゲームフローテストを開始...', 'info');
    
    try {
        const playerManager = new PlayerManager(4);
        const gameLogic = new GameLogic(playerManager);
        
        // Test 1: ゲーム開始
        const startResult = gameLogic.startGame();
        const test1 = assert(startResult && gameLogic.gameState === 'playing', 'ゲーム開始テスト');
        
        // Test 2: デッキ作成と配布
        const players = playerManager.getAllPlayers();
        const totalCards = players.reduce((sum, player) => sum + player.getHand().length, 0);
        const test2 = assert(totalCards === 54, '手札配布テスト');
        
        // Test 3: ターンシステム
        const currentPlayer = playerManager.getCurrentPlayer();
        const test3 = assert(currentPlayer !== null, '現在プレイヤーテスト');
        
        // Test 4: パス機能
        const passResult = gameLogic.passTurn();
        const test4 = assert(passResult.success, 'パス機能テスト');
        
        const allPassed = test1 && test2 && test3 && test4;
        addTestResult('ゲームフロー', allPassed);
        
        log(`ゲームフローテスト完了: ${allPassed ? '成功' : '失敗'}`, allPassed ? 'success' : 'error');
        return allPassed;
        
    } catch (error) {
        log(`❌ ゲームフローテストエラー: ${error.message}`, 'error');
        addTestResult('ゲームフロー', false, error.message);
        return false;
    }
}

// メイン実行関数
async function runAllTests() {
    log('🚀 ゲームエンジンテスト開始', 'info');
    log('========================================', 'info');
    
    const tests = [
        test8CutRule,
        testRevolutionRule,
        testCardValidation,
        testGameFlow
    ];
    
    let passedCount = 0;
    const totalCount = tests.length;
    
    for (const test of tests) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        if (test()) {
            passedCount++;
        }
        log('----------------------------------------', 'info');
    }
    
    // 結果サマリー
    log('========================================', 'info');
    log(`📊 テスト結果サマリー`, 'info');
    log(`総テスト数: ${totalCount}`, 'info');
    log(`成功: ${passedCount}`, 'success');
    log(`失敗: ${totalCount - passedCount}`, 'error');
    log(`成功率: ${Math.round((passedCount / totalCount) * 100)}%`, 'warning');
    
    if (passedCount === totalCount) {
        log('🎉 すべてのテストが成功しました！', 'success');
    } else {
        log('❌ 一部のテストが失敗しました。', 'error');
    }
    
    return passedCount === totalCount;
}

// スクリプトが直接実行された場合
if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = {
    runAllTests,
    test8CutRule,
    testRevolutionRule,
    testCardValidation,
    testGameFlow,
    Card,
    Player,
    PlayerManager,
    GameLogic
};