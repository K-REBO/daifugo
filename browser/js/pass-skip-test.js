/**
 * Pass/Skip Mechanism Tests
 * TDD Red Phase: Write failing tests for pass/skip turn functionality
 * 
 * Pass/Skip Rules:
 * - Players can pass when they cannot or don't want to play cards
 * - When all players pass in sequence, the round ends
 * - The last player to play cards starts the next round
 * - Pass tracking is essential for game flow
 */

// Import Lisp Engine
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

// 🔴 RED PHASE: These tests should FAIL initially
log('🔴 TDD Red Phase: Pass/Skip Mechanism Tests');
log('='.repeat(60));

let testResults = [];
let lispEngine;

// Setup
try {
    lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    lispEngine.eval('(create-and-shuffle-deck)');
    lispEngine.eval('(deal-cards-to-all-players)');
    log('✅ Lisp Engine setup complete');
} catch (error) {
    logError('❌ Failed to setup Lisp Engine');
    process.exit(1);
}

// Test Group 1: Basic Pass/Skip Functionality
log('\n🚶 Basic Pass/Skip Tests:');

testResults.push(runTest('Should allow player to pass turn', () => {
    const result = lispEngine.eval('(pass-turn)');
    assert(result.success === true, 'Pass turn should succeed');
    assert(result.action === 'pass', 'Action should be pass');
}));

testResults.push(runTest('Should track pass count for current player', () => {
    const gameState = lispEngine.eval('(get-complete-game-state)');
    const currentPlayer = gameState.players[gameState.currentPlayer];
    assert(typeof currentPlayer.passCount === 'number', 'Player should have pass count');
    assert(currentPlayer.passCount >= 0, 'Pass count should be non-negative');
}));

testResults.push(runTest('Should advance to next player after pass', () => {
    const initialPlayer = lispEngine.eval('(get-current-player)');
    lispEngine.eval('(pass-turn)');
    const newPlayer = lispEngine.eval('(get-current-player)');
    assert(newPlayer.id !== initialPlayer.id, 'Should advance to next player');
}));

testResults.push(runTest('Should reset pass count when player plays cards', () => {
    const playResult = lispEngine.eval('(play-cards-and-reset-pass [{\"suit\":\"♠\",\"rank\":\"3\"}])');
    assert(playResult.success === true, 'Playing cards should succeed');
    assert(playResult.passReset === true, 'Pass count should be reset');
}));

// Test Group 2: Sequential Pass Detection
log('\n🔄 Sequential Pass Detection Tests:');

testResults.push(runTest('Should track consecutive passes', () => {
    const passResult = lispEngine.eval('(get-consecutive-pass-count)');
    assert(typeof passResult.count === 'number', 'Should return consecutive pass count');
    assert(passResult.count >= 0, 'Consecutive pass count should be non-negative');
}));

testResults.push(runTest('Should detect when all players pass in sequence', () => {
    // Simulate all 4 players passing
    lispEngine.eval('(pass-turn)'); // Player 1
    lispEngine.eval('(pass-turn)'); // Player 2
    lispEngine.eval('(pass-turn)'); // Player 3
    lispEngine.eval('(pass-turn)'); // Player 4
    
    const roundState = lispEngine.eval('(check-round-end)');
    assert(roundState.roundEnded === true, 'Round should end when all players pass');
    assert(roundState.reason === 'all-passed', 'End reason should be all-passed');
}));

testResults.push(runTest('Should start new round after all players pass', () => {
    const newRoundResult = lispEngine.eval('(start-new-round)');
    assert(newRoundResult.success === true, 'New round should start');
    assert(newRoundResult.fieldCleared === true, 'Field should be cleared');
    assert(newRoundResult.consecutivePassReset === true, 'Consecutive pass count should reset');
}));

// Test Group 3: Round Management
log('\n🎲 Round Management Tests:');

testResults.push(runTest('Should identify last player to play cards', () => {
    const lastPlayer = lispEngine.eval('(get-last-player-to-play)');
    assert(typeof lastPlayer.id === 'number', 'Should return player ID');
    assert(lastPlayer.id >= 0 && lastPlayer.id < 4, 'Player ID should be valid');
}));

testResults.push(runTest('Should set last player as starter of next round', () => {
    const nextRoundResult = lispEngine.eval('(determine-next-round-starter)');
    assert(typeof nextRoundResult.starterId === 'number', 'Should return starter ID');
    assert(nextRoundResult.starterId >= 0 && nextRoundResult.starterId < 4, 'Starter ID should be valid');
}));

testResults.push(runTest('Should handle case where no one played cards yet', () => {
    // Reset game state
    lispEngine.eval('(initialize-complete-game 4)');
    const starterResult = lispEngine.eval('(determine-next-round-starter)');
    assert(starterResult.starterId === 0, 'Should default to first player when no one played');
}));

// Test Group 4: Pass Validation
log('\n✅ Pass Validation Tests:');

testResults.push(runTest('Should validate pass is legal move', () => {
    const validateResult = lispEngine.eval('(validate-pass-move)');
    assert(validateResult.valid === true, 'Pass should always be valid move');
    assert(validateResult.reason === 'pass-always-legal', 'Pass should always be legal');
}));

testResults.push(runTest('Should allow pass even when player has playable cards', () => {
    const currentPlayer = lispEngine.eval('(get-current-player)');
    const playerHand = lispEngine.eval(`(get-player-hand ${currentPlayer.id})`);
    
    // Check if player has cards that could be played
    const playableCards = lispEngine.eval('(get-playable-cards-from-hand)');
    
    const passResult = lispEngine.eval('(pass-turn)');
    assert(passResult.success === true, 'Should allow pass even with playable cards');
}));

testResults.push(runTest('Should provide pass statistics', () => {
    const stats = lispEngine.eval('(get-pass-statistics)');
    assert(Array.isArray(stats.playerPassCounts), 'Should return player pass counts');
    assert(stats.playerPassCounts.length === 4, 'Should have stats for all 4 players');
    assert(typeof stats.totalPasses === 'number', 'Should return total passes');
    assert(typeof stats.consecutivePasses === 'number', 'Should return consecutive passes');
}));

// Test Group 5: Game Flow Integration
log('\n🎮 Game Flow Integration Tests:');

testResults.push(runTest('Should integrate pass with turn system', () => {
    const initialTurn = lispEngine.eval('(get-turn-number)');
    lispEngine.eval('(pass-turn)');
    const newTurn = lispEngine.eval('(get-turn-number)');
    assert(newTurn > initialTurn, 'Turn number should increment after pass');
}));

testResults.push(runTest('Should maintain game state during pass sequence', () => {
    const gameState = lispEngine.eval('(get-complete-game-state)');
    lispEngine.eval('(pass-turn)');
    const newGameState = lispEngine.eval('(get-complete-game-state)');
    
    assert(gameState.players.length === newGameState.players.length, 'Player count should remain same');
    assert(Array.isArray(newGameState.fieldCards), 'Field cards should still exist');
    assert(typeof newGameState.currentPlayer === 'number', 'Should still have current player');
}));

// Results Summary
log('\n' + '='.repeat(60));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 Pass/Skip Test Results: ${passed}/${total} passed`);

if (passed === 0) {
    log('🔴 Perfect! All pass/skip tests failed as expected in Red phase.');
    log('Next: Implement pass/skip mechanism to make tests pass');
} else {
    logError(`❌ Unexpected: ${passed} tests passed in Red phase`);
    log('Some pass/skip functionality may already exist');
}

log('\n🎯 Required Implementation:');
log('- (pass-turn) - Allow player to pass their turn');
log('- (get-consecutive-pass-count) - Track consecutive passes');
log('- (check-round-end) - Detect when all players pass');
log('- (start-new-round) - Start new round after all pass');
log('- (get-last-player-to-play) - Track who played last');
log('- (determine-next-round-starter) - Set round starter');
log('- (validate-pass-move) - Validate pass is legal');
log('- (get-pass-statistics) - Provide pass statistics');
log('- (get-turn-number) - Track turn progression');

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTest,
        assert,
        testResults
    };
}