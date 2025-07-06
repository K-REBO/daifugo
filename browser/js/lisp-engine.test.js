/**
 * Lisp Game Engine Tests
 * TDD Green Phase: LispGameEngine実装でテストを通す
 */

// Lisp Engine をインポート
require('./lisp-engine.js');

// テスト用のシンプルなログ関数
function log(message) {
    console.log(message);
}

function logError(message) {
    console.error(message);
}

// テスト実行関数
function runTest(testName, testFn) {
    try {
        testFn();
        log(`✅ ${testName}`);
        return true;
    } catch (error) {
        logError(`❌ ${testName}: ${error.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Values not equal'}: expected ${expected}, got ${actual}`);
    }
}

// 🟢 Green Phase: JavaScript-Lisp Bridge Tests
log('🟢 TDD Green Phase: JavaScript-Lisp Bridge Tests');
log('='.repeat(50));

let testResults = [];

// Test 1: Lisp Engine インスタンス作成
testResults.push(runTest('Lisp Engine creation', () => {
    // まだ実装されていないクラスを期待
    const engine = new LispGameEngine();
    assert(engine !== null, 'Engine should be created');
    assert(typeof engine.eval === 'function', 'Engine should have eval method');
}));

// Test 2: 基本的なLisp式の実行
testResults.push(runTest('Basic Lisp evaluation', () => {
    const engine = new LispGameEngine();
    const result = engine.eval('(+ 1 2)');
    assertEquals(result, 3, 'Simple arithmetic should work');
}));

// Test 3: ゲーム状態の初期化
testResults.push(runTest('Game state initialization', () => {
    const engine = new LispGameEngine();
    const result = engine.eval('(init-game-state 4)'); // 4 players
    assert(result.success === true, 'Game state should initialize successfully');
    assert(result.playerCount === 4, 'Should have 4 players');
}));

// Test 4: カードの作成と操作
testResults.push(runTest('Card creation and manipulation', () => {
    const engine = new LispGameEngine();
    const result = engine.eval('(create-card "♠" "8")');
    assert(result.suit === '♠', 'Card should have correct suit');
    assert(result.rank === '8', 'Card should have correct rank');
}));

// Test 5: カードプレイのバリデーション
testResults.push(runTest('Card play validation', () => {
    const engine = new LispGameEngine();
    engine.eval('(init-game-state 4)');
    
    const cards = [{ suit: '♠', rank: '8' }];
    const result = engine.eval(`(validate-play ${JSON.stringify(cards)})`);
    
    assert(typeof result.valid === 'boolean', 'Should return validation result');
    assert(typeof result.reason === 'string', 'Should provide reason');
}));

// Test 6: 8切りルールの検出
testResults.push(runTest('8-cut rule detection', () => {
    const engine = new LispGameEngine();
    engine.eval('(init-game-state 4)');
    
    const cards = [{ suit: '♠', rank: '8' }];
    const result = engine.eval(`(check-special-rules ${JSON.stringify(cards)})`);
    
    assert(result.includes('8cut'), '8-cut rule should be detected');
}));

// Test 7: ルールの動的追加
testResults.push(runTest('Dynamic rule addition', () => {
    const engine = new LispGameEngine();
    const success = engine.loadRule('test-rule.lisp');
    assert(success === true, 'Rule should load successfully');
}));

// Test 8: ゲーム状態の取得
testResults.push(runTest('Game state retrieval', () => {
    const engine = new LispGameEngine();
    engine.eval('(init-game-state 4)');
    
    const state = engine.getGameState();
    assert(state.players, 'State should include players');
    assert(state.currentPlayer !== undefined, 'State should include current player');
    assert(state.fieldCards !== undefined, 'State should include field cards');
}));

// Test 9: プレイヤーの手札操作
testResults.push(runTest('Player hand manipulation', () => {
    const engine = new LispGameEngine();
    engine.eval('(init-game-state 4)');
    
    const cards = [{ suit: '♥', rank: 'Q' }, { suit: '♠', rank: 'Q' }];
    const result = engine.eval(`(add-cards-to-player 0 ${JSON.stringify(cards)})`);
    
    assert(result.success === true, 'Cards should be added successfully');
    
    const playerHand = engine.eval('(get-player-hand 0)');
    assert(playerHand.length >= 2, 'Player should have at least 2 cards');
}));

// Test 10: Qボンバールールの実装準備
testResults.push(runTest('Q-bomber rule preparation', () => {
    const engine = new LispGameEngine();
    engine.eval('(init-game-state 4)');
    
    // Q-bomberのテストデータ
    const cards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' }
    ];
    const declaredNumbers = ['3', '7'];
    
    const result = engine.eval(`(q-bomber ${JSON.stringify(cards)} ${JSON.stringify(declaredNumbers)})`);
    assert(result.special === 'q-bomber', 'Q-bomber should be detected');
    assert(result.affectedNumbers.length === 2, 'Should affect declared numbers');
}));

// 結果サマリー
log('='.repeat(50));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 Test Results: ${passed}/${total} passed`);

if (passed === total) {
    log('🟢 Perfect! All tests passed in Green phase.');
    log('Next: Refactor for better architecture (Blue phase)');
} else {
    logError(`❌ ${total - passed} tests still failing in Green phase`);
    log('Need to fix implementation to pass all tests');
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTest,
        assert,
        assertEquals,
        testResults
    };
}