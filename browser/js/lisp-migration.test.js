/**
 * Lisp Game Engine Migration Tests
 * TDD Red Phase: Define complete Lisp engine replacement requirements
 * 
 * These tests define what the complete Lisp engine should do to replace
 * the current JavaScript game engine entirely.
 */

// Import current engines for comparison
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
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Values not equal'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// 🔴 Red Phase: Complete Lisp Engine Migration Tests
log('🔴 TDD Red Phase: Complete Lisp Engine Migration Tests');
log('='.repeat(60));

let testResults = [];

// Test Group 1: Core Game Engine Replacement
log('\n📦 Core Game Engine Replacement Tests:');

// Test 1: Complete game initialization through Lisp
testResults.push(runTest('Complete Lisp game initialization', () => {
    const lispEngine = new LispGameEngine();
    
    // Should initialize complete game through Lisp expressions
    const initResult = lispEngine.eval('(initialize-complete-game 4)');
    
    assert(initResult.success === true, 'Game should initialize successfully');
    assert(initResult.players === 4, 'Should create 4 players');
    assert(initResult.deck === 54, 'Should create 54-card deck');
    assert(initResult.gameState === 'ready', 'Game should be ready to start');
}));

// Test 2: Complete deck creation and shuffling in Lisp
testResults.push(runTest('Lisp deck creation and shuffling', () => {
    const lispEngine = new LispGameEngine();
    
    const deckResult = lispEngine.eval('(create-and-shuffle-deck)');
    
    assert(deckResult.cards.length === 54, 'Should have 54 cards');
    assert(deckResult.shuffled === true, 'Deck should be shuffled');
    
    // Verify all card types exist
    const suits = new Set(deckResult.cards.map(c => c.suit));
    assert(suits.has('♠') && suits.has('♥') && suits.has('♦') && suits.has('♣'), 'Should have all suits');
    assert(suits.has('JOKER'), 'Should have jokers');
}));

// Test 3: Complete card dealing through Lisp
testResults.push(runTest('Lisp card dealing system', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    
    const dealResult = lispEngine.eval('(deal-cards-to-all-players)');
    
    assert(dealResult.success === true, 'Cards should be dealt successfully');
    assert(dealResult.playersWithCards === 4, 'All 4 players should have cards');
    assert(dealResult.totalCardsDealt === 54, 'All 54 cards should be dealt');
    
    // Check each player has cards
    for (let i = 0; i < 4; i++) {
        const playerHand = lispEngine.eval(`(get-player-hand ${i})`);
        assert(playerHand.length > 0, `Player ${i} should have cards`);
    }
}));

// Test Group 2: Game Flow Control
log('\n🎮 Game Flow Control Tests:');

// Test 4: Turn management through Lisp
testResults.push(runTest('Lisp turn management system', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    lispEngine.eval('(deal-cards-to-all-players)');
    
    const currentPlayer = lispEngine.eval('(get-current-player)');
    assert(typeof currentPlayer.id === 'number', 'Should return current player');
    
    const nextTurnResult = lispEngine.eval('(advance-turn)');
    assert(nextTurnResult.success === true, 'Turn should advance successfully');
    
    const newCurrentPlayer = lispEngine.eval('(get-current-player)');
    assert(newCurrentPlayer.id !== currentPlayer.id, 'Current player should change');
}));

// Test 5: Complete card play validation through Lisp
testResults.push(runTest('Complete Lisp card play validation', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    lispEngine.eval('(deal-cards-to-all-players)');
    
    // Test various play scenarios
    const validSingle = lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"}])');
    assert(validSingle.valid === true, 'Single card should be valid');
    
    const invalidEmpty = lispEngine.eval('(validate-card-play [])');
    assert(invalidEmpty.valid === false, 'Empty play should be invalid');
    
    const validPair = lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"3"}])');
    assert(validPair.valid === true, 'Pair should be valid');
    
    const invalidMixed = lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"4"}])');
    assert(invalidMixed.valid === false, 'Mixed ranks should be invalid');
}));

// Test 6: Complete game state management
testResults.push(runTest('Complete Lisp game state management', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    
    const gameState = lispEngine.eval('(get-complete-game-state)');
    
    assert(gameState.players, 'Should include players');
    assert(gameState.currentPlayer !== undefined, 'Should track current player');
    assert(gameState.fieldCards !== undefined, 'Should track field cards');
    assert(gameState.gamePhase !== undefined, 'Should track game phase');
    assert(gameState.turnCount !== undefined, 'Should track turn count');
    assert(gameState.winner === null, 'Should track winner (null initially)');
}));

// Test Group 3: Rule Engine Integration
log('\n⚖️ Rule Engine Integration Tests:');

// Test 7: All local rules processed through Lisp
testResults.push(runTest('All local rules through Lisp engine', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    
    // Test 8-cut rule
    const eightCut = lispEngine.eval('(apply-rule "eight-cut" [{"suit":"♠","rank":"8"}])');
    assert(eightCut.ruleApplied === true, '8-cut should be applied');
    assert(eightCut.effect === 'field-clear', '8-cut should clear field');
    
    // Test revolution rule
    const revolution = lispEngine.eval('(apply-rule "revolution" [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"3"},{"suit":"♦","rank":"3"},{"suit":"♣","rank":"3"}])');
    assert(revolution.ruleApplied === true, 'Revolution should be applied');
    assert(revolution.effect === 'card-order-reverse', 'Revolution should reverse card order');
    
    // Test Q-bomber rule
    const qBomber = lispEngine.eval('(apply-rule "q-bomber" [{"suit":"♠","rank":"Q"},{"suit":"♥","rank":"Q"}])');
    assert(qBomber.ruleApplied === true, 'Q-bomber should be applied');
    assert(qBomber.requiresDeclaration === true, 'Q-bomber should require number declaration');
}));

// Test 8: Dynamic rule loading from .lisp files
testResults.push(runTest('Dynamic rule loading from .lisp files', () => {
    const lispEngine = new LispGameEngine();
    
    // Should load and parse actual .lisp rule files
    const loadResult = lispEngine.eval('(load-rule-file "rules/q-bomber.lisp")');
    assert(loadResult.success === true, 'Rule file should load successfully');
    assert(loadResult.rulesLoaded > 0, 'Should load rules from file');
    
    const ruleStatus = lispEngine.eval('(get-loaded-rules)');
    assert(ruleStatus.includes('q-bomber'), 'Q-bomber rule should be loaded');
}));

// Test Group 4: Player Management
log('\n👥 Player Management Tests:');

// Test 9: Complete player lifecycle through Lisp
testResults.push(runTest('Complete player lifecycle through Lisp', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    
    // Create and manage players
    const players = lispEngine.eval('(get-all-players)');
    assert(players.length === 4, 'Should have 4 players');
    
    // Test player actions
    const addCardResult = lispEngine.eval('(add-card-to-player 0 {"suit":"♠","rank":"K"})');
    assert(addCardResult.success === true, 'Should add card to player');
    
    const removeCardResult = lispEngine.eval('(remove-card-from-player 0 {"suit":"♠","rank":"K"})');
    assert(removeCardResult.success === true, 'Should remove card from player');
    
    // Test player status
    const playerStatus = lispEngine.eval('(get-player-status 0)');
    assert(playerStatus.id === 0, 'Should return correct player');
    assert(typeof playerStatus.cardCount === 'number', 'Should return card count');
}));

// Test 10: AI integration through Lisp
testResults.push(runTest('AI decision making through Lisp', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    lispEngine.eval('(deal-cards-to-all-players)');
    
    // Test AI decision making
    const aiDecision = lispEngine.eval('(make-ai-decision 1)'); // Player 1 (CPU)
    
    assert(aiDecision.action !== undefined, 'AI should make a decision');
    assert(['play', 'pass'].includes(aiDecision.action), 'AI should play or pass');
    
    if (aiDecision.action === 'play') {
        assert(Array.isArray(aiDecision.cards), 'AI should select cards to play');
        assert(aiDecision.cards.length > 0, 'AI should select at least one card');
    }
}));

// Test Group 5: UI Integration
log('\n🖥️ UI Integration Tests:');

// Test 11: Complete UI state synchronization
testResults.push(runTest('Complete UI state synchronization', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    
    const uiState = lispEngine.eval('(get-ui-state)');
    
    assert(uiState.playerHands, 'Should provide player hands for UI');
    assert(uiState.fieldCards, 'Should provide field cards for UI');
    assert(uiState.currentPlayerIndicator, 'Should indicate current player');
    assert(uiState.gameStatus, 'Should provide game status text');
    assert(uiState.availableActions, 'Should provide available actions');
}));

// Test 12: Event system for UI notifications
testResults.push(runTest('Event system for UI notifications', () => {
    const lispEngine = new LispGameEngine();
    lispEngine.eval('(initialize-complete-game 4)');
    
    // Should generate events for UI
    const eventResult = lispEngine.eval('(play-cards-and-generate-events [{"suit":"♠","rank":"8"}])');
    
    assert(eventResult.success === true, 'Card play should succeed');
    assert(Array.isArray(eventResult.events), 'Should generate events');
    assert(eventResult.events.length > 0, 'Should have at least one event');
    
    const event = eventResult.events.find(e => e.type === 'rule-activated');
    assert(event !== undefined, 'Should generate rule activation event');
    assert(event.ruleId === 'eight-cut', 'Should identify correct rule');
}));

// Test Group 6: Performance and Compatibility
log('\n⚡ Performance and Compatibility Tests:');

// Test 13: Performance equivalence with JS engine
testResults.push(runTest('Performance equivalence with JS engine', () => {
    const lispEngine = new LispGameEngine();
    
    const startTime = Date.now();
    
    // Perform intensive operations
    lispEngine.eval('(initialize-complete-game 4)');
    lispEngine.eval('(deal-cards-to-all-players)');
    
    for (let i = 0; i < 10; i++) {
        lispEngine.eval('(advance-turn)');
        lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"}])');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    assert(duration < 1000, 'Operations should complete within 1 second');
}));

// Test 14: Complete JavaScript engine replacement
testResults.push(runTest('Complete JavaScript engine replacement', () => {
    const lispEngine = new LispGameEngine();
    
    // Test that all JS engine functionality is available in Lisp
    const capabilities = lispEngine.eval('(get-engine-capabilities)');
    
    const requiredCapabilities = [
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
    
    requiredCapabilities.forEach(capability => {
        assert(capabilities.includes(capability), 
            `Engine should support ${capability}`);
    });
}));

// Results Summary
log('\n' + '='.repeat(60));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 Migration Test Results: ${passed}/${total} passed`);

if (passed === 0) {
    log('🔴 Perfect! All migration tests failed as expected in Red phase.');
    log('Next: Implement complete Lisp engine to replace JavaScript engine');
} else {
    logError(`❌ Unexpected: ${passed} tests passed in Red phase`);
    log('Some Lisp functionality may already exist');
}

log('\n🎯 Migration Requirements Summary:');
log('- Complete game initialization through Lisp');
log('- Full card and player management');
log('- All rule processing in Lisp engine');
log('- UI integration and event generation');
log('- Performance equivalent to JS engine');
log('- Zero dependency on JavaScript game logic');

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTest,
        assert,
        assertEquals,
        testResults
    };
}