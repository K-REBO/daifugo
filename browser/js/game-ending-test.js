/**
 * Game Ending Conditions Tests
 * TDD Red Phase: Write failing tests for win/lose detection and ranking
 * 
 * Daifugo Game Ending Rules:
 * - Player wins when they empty their hand (no cards left)
 * - Game ends when only one player has cards remaining
 * - Players are ranked by finish order: 1st, 2nd, 3rd, 4th
 * - Social rankings: Daifugo (1st), Fugo (2nd), Heimin (3rd), Hinmin (4th)
 * - Multi-round gameplay with ranking persistence
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
log('🔴 TDD Red Phase: Game Ending Conditions Tests');
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

// Test Group 1: Player Elimination Detection
log('\n🏁 Player Elimination Tests:');

testResults.push(runTest('Should detect when player has no cards left', () => {
    // Simulate player 1 having no cards
    const result = lispEngine.eval('(check-player-finished 1)');
    assert(typeof result.finished === 'boolean', 'Should return finished status');
    assert(typeof result.cardCount === 'number', 'Should return card count');
}));

testResults.push(runTest('Should detect first player to finish', () => {
    // Simulate player 2 finishing first
    const result = lispEngine.eval('(player-finish 2)');
    assert(result.success === true, 'Player finish should succeed');
    assert(result.rank === 1, 'First player to finish should get rank 1');
    assert(result.socialRank === 'Daifugo', 'First finisher should be Daifugo');
}));

testResults.push(runTest('Should track multiple players finishing', () => {
    // Simulate second player finishing
    lispEngine.eval('(player-finish 0)'); // Human player finishes second
    const rankings = lispEngine.eval('(get-current-rankings)');
    
    assert(Array.isArray(rankings.players), 'Should return player rankings array');
    assert(rankings.players.length >= 2, 'Should have at least 2 finished players');
    assert(rankings.players[0].rank === 1, 'First finisher should have rank 1');
    assert(rankings.players[1].rank === 2, 'Second finisher should have rank 2');
}));

testResults.push(runTest('Should assign correct social rankings', () => {
    const rankings = lispEngine.eval('(get-social-rankings)');
    assert(typeof rankings.daifugo === 'number', 'Should identify Daifugo player');
    assert(typeof rankings.fugo === 'number', 'Should identify Fugo player');
    // Heimin and Hinmin might not be assigned yet if only 2 players finished
}));

// Test Group 2: Game End Detection
log('\n🎮 Game End Detection Tests:');

testResults.push(runTest('Should detect game end condition', () => {
    const gameStatus = lispEngine.eval('(check-game-end)');
    assert(typeof gameStatus.gameEnded === 'boolean', 'Should return game end status');
    assert(typeof gameStatus.remainingPlayers === 'number', 'Should return remaining player count');
}));

testResults.push(runTest('Should end game when only one player remains', () => {
    // Simulate 3rd player finishing, leaving only 1 player
    lispEngine.eval('(player-finish 3)');
    const gameStatus = lispEngine.eval('(check-game-end)');
    
    assert(gameStatus.gameEnded === true, 'Game should end when only 1 player remains');
    assert(gameStatus.winner !== null, 'Should identify a winner');
    assert(gameStatus.finalRankings !== null, 'Should provide final rankings');
}));

testResults.push(runTest('Should auto-assign last player ranking', () => {
    const finalRankings = lispEngine.eval('(get-final-rankings)');
    assert(finalRankings.complete === true, 'Rankings should be complete');
    assert(finalRankings.players.length === 4, 'Should have rankings for all 4 players');
    
    // Check that last player gets rank 4 (Hinmin)
    const lastPlayer = finalRankings.players.find(p => p.rank === 4);
    assert(lastPlayer !== undefined, 'Should have a 4th place player');
    assert(lastPlayer.socialRank === 'Hinmin', 'Last player should be Hinmin');
}));

// Test Group 3: Ranking System
log('\n🏆 Ranking System Tests:');

testResults.push(runTest('Should maintain finish order', () => {
    const rankings = lispEngine.eval('(get-finish-order)');
    assert(Array.isArray(rankings.order), 'Should return finish order array');
    assert(rankings.order.length === 4, 'Should have all 4 players in order');
    
    // Verify ranking order is 1, 2, 3, 4
    for (let i = 0; i < 4; i++) {
        assert(rankings.order[i].rank === i + 1, `Player at position ${i} should have rank ${i + 1}`);
    }
}));

testResults.push(runTest('Should assign social rankings correctly', () => {
    const social = lispEngine.eval('(get-complete-social-rankings)');
    assert(typeof social.daifugo === 'number', 'Should have Daifugo (1st place)');
    assert(typeof social.fugo === 'number', 'Should have Fugo (2nd place)');
    assert(typeof social.heimin === 'number', 'Should have Heimin (3rd place)');
    assert(typeof social.hinmin === 'number', 'Should have Hinmin (4th place)');
    
    // Verify all different players
    const players = [social.daifugo, social.fugo, social.heimin, social.hinmin];
    const uniquePlayers = new Set(players);
    assert(uniquePlayers.size === 4, 'All social ranks should be different players');
}));

testResults.push(runTest('Should track ranking statistics', () => {
    const stats = lispEngine.eval('(get-ranking-statistics)');
    assert(Array.isArray(stats.playerStats), 'Should return player statistics');
    assert(stats.playerStats.length === 4, 'Should have stats for all players');
    
    stats.playerStats.forEach((stat, index) => {
        assert(typeof stat.playerId === 'number', `Player ${index} should have ID`);
        assert(typeof stat.rank === 'number', `Player ${index} should have rank`);
        assert(typeof stat.socialRank === 'string', `Player ${index} should have social rank`);
        assert(typeof stat.finishTime === 'number', `Player ${index} should have finish time`);
    });
}));

// Test Group 4: Game State Management
log('\n📊 Game State Management Tests:');

testResults.push(runTest('Should mark game as completed', () => {
    const gameState = lispEngine.eval('(get-complete-game-state)');
    assert(gameState.gamePhase === 'completed', 'Game phase should be completed');
    assert(gameState.winner !== null, 'Should have a winner');
    assert(Array.isArray(gameState.finalRankings), 'Should have final rankings');
}));

testResults.push(runTest('Should prevent moves after game end', () => {
    const playResult = lispEngine.eval('(validate-move-after-game-end)');
    assert(playResult.valid === false, 'Moves should not be valid after game end');
    assert(playResult.reason === 'game-ended', 'Should specify game ended reason');
}));

testResults.push(runTest('Should provide game summary', () => {
    const summary = lispEngine.eval('(get-game-summary)');
    assert(typeof summary.winner === 'number', 'Should identify winner');
    assert(Array.isArray(summary.rankings), 'Should provide rankings');
    assert(typeof summary.totalTurns === 'number', 'Should track total turns');
    assert(typeof summary.gameLength === 'number', 'Should track game length');
}));

// Test Group 5: Multi-Round Support
log('\n🔄 Multi-Round Support Tests:');

testResults.push(runTest('Should prepare for next round', () => {
    const nextRound = lispEngine.eval('(prepare-next-round)');
    assert(nextRound.success === true, 'Next round preparation should succeed');
    assert(nextRound.rankingsCarriedOver === true, 'Rankings should carry over');
    assert(nextRound.cardExchangeRequired === true, 'Card exchange should be required');
}));

testResults.push(runTest('Should implement card exchange between ranks', () => {
    const exchange = lispEngine.eval('(get-card-exchange-rules)');
    assert(typeof exchange.hinminToDaifugo === 'number', 'Hinmin should give cards to Daifugo');
    assert(typeof exchange.heiminToFugo === 'number', 'Heimin should give cards to Fugo');
    assert(exchange.hinminToDaifugo === 2, 'Hinmin should give 2 best cards');
    assert(exchange.heiminToFugo === 1, 'Heimin should give 1 best card');
}));

testResults.push(runTest('Should track round-based statistics', () => {
    const roundStats = lispEngine.eval('(get-multi-round-statistics)');
    assert(typeof roundStats.currentRound === 'number', 'Should track current round');
    assert(Array.isArray(roundStats.roundHistory), 'Should maintain round history');
    assert(Array.isArray(roundStats.playerRankHistory), 'Should track rank history per player');
}));

// Results Summary
log('\n' + '='.repeat(60));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 Game Ending Test Results: ${passed}/${total} passed`);

if (passed === 0) {
    log('🔴 Perfect! All game ending tests failed as expected in Red phase.');
    log('Next: Implement game ending detection and ranking system');
} else {
    logError(`❌ Unexpected: ${passed} tests passed in Red phase`);
    log('Some game ending functionality may already exist');
}

log('\n🎯 Required Implementation:');
log('- (check-player-finished playerId) - Detect when player has no cards');
log('- (player-finish playerId) - Handle player finishing');
log('- (get-current-rankings) - Get current finish rankings');
log('- (get-social-rankings) - Get Daifugo social rankings');
log('- (check-game-end) - Detect game end conditions');
log('- (get-final-rankings) - Get complete final rankings');
log('- (get-finish-order) - Get finish order');
log('- (get-complete-social-rankings) - Get all social rankings');
log('- (get-ranking-statistics) - Get ranking statistics');
log('- (validate-move-after-game-end) - Prevent moves after game end');
log('- (get-game-summary) - Provide game summary');
log('- (prepare-next-round) - Prepare for multi-round gameplay');
log('- (get-card-exchange-rules) - Get card exchange rules');
log('- (get-multi-round-statistics) - Get multi-round statistics');

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTest,
        assert,
        testResults
    };
}