/**
 * Q-bomber Rule Tests
 * TDD Red Phase: 失敗テストでQボンバールールの要件を定義
 */

// Lisp Engine をインポート
require('./lisp-engine.js');

function log(message) {
    console.log(message);
}

function logError(message) {
    console.error(message);
}

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

// 🟢 Green Phase: Q-bomber Rule Tests
log('🟢 TDD Green Phase: Q-bomber Rule Tests');
log('='.repeat(50));

let testResults = [];

// Test 1: Qボンバールールファイルの読み込み
testResults.push(runTest('Q-bomber rule file loading', () => {
    const engine = new LispGameEngine();
    const success = engine.loadRule('q-bomber.lisp');
    assert(success === true, 'Q-bomber rule should load successfully');
    
    // ルールが実際にロードされたか確認
    const rules = engine.getLoadedRules();
    assert(rules.includes('q-bomber'), 'Q-bomber rule should be in loaded rules');
}));

// Test 2: Qカード2枚でのボンバー検出
testResults.push(runTest('Q-bomber detection with 2 Queens', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    const cards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' }
    ];
    
    const result = engine.eval(`(detect-q-bomber ${JSON.stringify(cards)})`);
    assert(result.detected === true, 'Should detect Q-bomber with 2 Queens');
    assert(result.maxDeclarations === 2, 'Should allow 2 declarations');
}));

// Test 3: Qカード1枚では発動しない
testResults.push(runTest('Q-bomber NOT triggered with 1 Queen', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    const cards = [{ suit: '♥', rank: 'Q' }];
    
    const result = engine.eval(`(detect-q-bomber ${JSON.stringify(cards)})`);
    assert(result.detected === false, 'Should NOT detect Q-bomber with 1 Queen');
}));

// Test 4: 数字宣言の処理
testResults.push(runTest('Number declaration processing', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    const cards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' },
        { suit: '♦', rank: 'Q' }
    ];
    const declaredNumbers = ['3', '7'];
    
    const result = engine.eval(`(process-q-bomber ${JSON.stringify(cards)} ${JSON.stringify(declaredNumbers)})`);
    assert(result.valid === true, 'Should accept 2 declarations with 3 Queens');
    assert(result.affectedNumbers.length === 2, 'Should affect 2 numbers');
}));

// Test 5: 宣言数上限の検証
testResults.push(runTest('Declaration limit validation', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    const cards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' }
    ];
    const tooManyDeclarations = ['3', '4', '5']; // 3つ宣言（2枚のQに対して）
    
    const result = engine.eval(`(process-q-bomber ${JSON.stringify(cards)} ${JSON.stringify(tooManyDeclarations)})`);
    assert(result.valid === false, 'Should reject too many declarations');
    assert(result.error.includes('too many'), 'Should provide appropriate error');
}));

// Test 6: 全プレイヤーの手札への影響
testResults.push(runTest('All players hand manipulation', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    // プレイヤーに手札を設定
    engine.eval('(add-cards-to-player 0 [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"7"}])');
    engine.eval('(add-cards-to-player 1 [{"suit":"♦","rank":"3"},{"suit":"♣","rank":"K"}])');
    engine.eval('(add-cards-to-player 2 [{"suit":"♠","rank":"7"},{"suit":"♥","rank":"A"}])');
    
    const qCards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' }
    ];
    const declaredNumbers = ['3', '7'];
    
    const result = engine.eval(`(apply-q-bomber ${JSON.stringify(qCards)} ${JSON.stringify(declaredNumbers)})`);
    
    assert(result.success === true, 'Q-bomber should apply successfully');
    assert(result.affectedPlayers.length === 4, 'Should affect all players');
    
    // プレイヤー0: 3と7が削除されるはず
    const player0Hand = engine.eval('(get-player-hand 0)');
    assert(player0Hand.length === 0, 'Player 0 should have no cards left');
    
    // プレイヤー1: 3が削除されるはず
    const player1Hand = engine.eval('(get-player-hand 1)');
    assert(player1Hand.length === 1, 'Player 1 should have 1 card left');
    assert(player1Hand[0].rank === 'K', 'Player 1 should keep the King');
}));

// Test 7: 勝利条件（Qボンバーで上がり）
testResults.push(runTest('Winning with Q-bomber', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    // プレイヤー0に最後のカードとしてQ2枚を設定
    engine.eval('(add-cards-to-player 0 [{"suit":"♥","rank":"Q"},{"suit":"♠","rank":"Q"}])');
    
    const qCards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' }
    ];
    const declaredNumbers = []; // 何も宣言しない
    
    const result = engine.eval(`(apply-q-bomber ${JSON.stringify(qCards)} ${JSON.stringify(declaredNumbers)})`);
    
    assert(result.success === true, 'Q-bomber should apply successfully');
    assert(result.playerFinished === true, 'Player should finish with Q-bomber');
    
    const player0Hand = engine.eval('(get-player-hand 0)');
    assert(player0Hand.length === 0, 'Player 0 should have finished');
}));

// Test 8: ゲーム統合テスト
testResults.push(runTest('Game integration test', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    const qCards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: 'Q' }
    ];
    
    // 通常のプレイバリデーション
    const validation = engine.eval(`(validate-play ${JSON.stringify(qCards)})`);
    assert(validation.valid === true, 'Q-bomber play should be valid');
    assert(validation.special === 'q-bomber', 'Should be detected as Q-bomber');
    
    // プレイ実行
    const playResult = engine.eval(`(play-cards ${JSON.stringify(qCards)})`);
    assert(playResult.success === true, 'Q-bomber play should succeed');
    assert(playResult.requiresDeclaration === true, 'Should require number declaration');
}));

// Test 9: ルール優先度（8切りとの競合）
testResults.push(runTest('Rule priority with 8-cut', () => {
    const engine = new LispGameEngine();
    engine.loadRule('q-bomber.lisp');
    engine.eval('(init-game-state 4)');
    
    // Q2枚＋8の混在（実際には起こりえないが、テスト用）
    const mixedCards = [
        { suit: '♥', rank: 'Q' },
        { suit: '♠', rank: '8' }
    ];
    
    const result = engine.eval(`(check-rule-priority ${JSON.stringify(mixedCards)})`);
    // 8切りが優先されるべき
    assert(result.primaryRule === '8cut', '8-cut should have higher priority');
}));

// Test 10: Lispルールファイルの構文確認
testResults.push(runTest('Lisp rule file syntax validation', () => {
    const engine = new LispGameEngine();
    
    // ルールファイルの構文エラーチェック
    const syntaxCheck = engine.validateRuleSyntax('q-bomber.lisp');
    assert(syntaxCheck.valid === true, 'Q-bomber rule syntax should be valid');
    assert(syntaxCheck.errors.length === 0, 'Should have no syntax errors');
}));

// 結果サマリー
log('='.repeat(50));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 Test Results: ${passed}/${total} passed`);

if (passed === total) {
    log('🟢 Perfect! All Q-bomber tests passed in Green phase.');
    log('Next: Create Q-bomber UI and game integration');
} else {
    logError(`❌ ${total - passed} Q-bomber tests still failing`);
    log('Need to fix Q-bomber implementation');
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