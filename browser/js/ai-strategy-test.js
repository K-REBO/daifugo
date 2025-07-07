/**
 * AI Strategy Improvement Tests
 * TDD Red Phase: Write failing tests for intelligent AI that considers card strength
 * 
 * Current AI Issues (from comprehensive testing):
 * - AI uses simplistic "play first card" strategy
 * - AI does not consider field state or card strength
 * - AI does not validate if cards can beat current field
 * - AI does not use special rules strategically
 * - AI difficulty levels not implemented
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
log('🔴 TDD Red Phase: AI Strategy Improvement Tests');
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

// Test Group 1: Card Strength Awareness
log('\n🧠 Card Strength Awareness Tests:');

testResults.push(runTest('AI should consider card strength when selecting cards', () => {
    // Set up field with a 5
    lispEngine.eval('(play-cards-and-reset-pass [{"suit":"♠","rank":"5"}])');
    
    const aiDecision = lispEngine.eval('(make-intelligent-ai-decision 1)');
    assert(aiDecision.success === true, 'AI decision should succeed');
    
    if (aiDecision.action === 'play') {
        // AI should select a card stronger than 5
        const selectedCard = aiDecision.cards[0];
        const canBeat = lispEngine.eval(`(compare-card-strength {"suit":"♠","rank":"5"} {"suit":"${selectedCard.suit}","rank":"${selectedCard.rank}"})`);
        assert(canBeat === -1, 'AI should select cards stronger than field cards');
    }
}));

testResults.push(runTest('AI should play lowest valid card to conserve strong cards', () => {
    // Clear field and make AI play first
    lispEngine.eval('(start-new-round)');
    const aiDecision = lispEngine.eval('(make-strategic-ai-decision 1)');
    
    if (aiDecision.action === 'play') {
        const playedCard = aiDecision.cards[0];
        const cardValue = lispEngine.eval(`(get-card-rank-value {"suit":"${playedCard.suit}","rank":"${playedCard.rank}"})`);
        
        // AI should prefer playing lower value cards when no constraints
        assert(cardValue <= 8, 'AI should conserve high-value cards when possible');
    }
}));

testResults.push(runTest('AI should recognize when it cannot beat field', () => {
    // Set field to very high card (2 or Joker)
    lispEngine.eval('(play-cards-and-reset-pass [{"suit":"♠","rank":"2"}])');
    
    const aiDecision = lispEngine.eval('(make-intelligent-ai-decision 1)');
    
    // Check if AI can actually beat the field
    const playerHand = lispEngine.eval('(get-player-hand 1)');
    const canBeatField = playerHand.some(card => {
        const comparison = lispEngine.eval(`(compare-card-strength {"suit":"♠","rank":"2"} {"suit":"${card.suit}","rank":"${card.rank}"})`);
        return comparison === -1;
    });
    
    if (!canBeatField) {
        assert(aiDecision.action === 'pass', 'AI should pass when it cannot beat field');
    }
}));

// Test Group 2: Strategic Decision Making
log('\n🎯 Strategic Decision Making Tests:');

testResults.push(runTest('AI should prioritize playing pairs when beneficial', () => {
    // Find AI with pairs in hand and test pair playing logic
    const aiHand = lispEngine.eval('(get-player-hand 1)');
    const pairs = lispEngine.eval('(find-pairs-in-hand 1)');
    
    if (pairs.found && pairs.pairs.length > 0) {
        const aiDecision = lispEngine.eval('(make-pair-strategic-decision 1)');
        assert(aiDecision.considersPairs === true, 'AI should consider pair opportunities');
        
        if (aiDecision.action === 'play' && aiDecision.cards.length === 2) {
            assert(aiDecision.cards[0].rank === aiDecision.cards[1].rank, 'AI should play valid pairs');
        }
    }
}));

testResults.push(runTest('AI should use special rules strategically', () => {
    // Test AI recognition and use of 8-cut rule
    const specialDecision = lispEngine.eval('(make-special-rule-decision 1)');
    assert(typeof specialDecision.considersEightCut === 'boolean', 'AI should consider 8-cut opportunities');
    assert(typeof specialDecision.considersRevolution === 'boolean', 'AI should consider revolution opportunities');
    assert(typeof specialDecision.considersQBomber === 'boolean', 'AI should consider Q-bomber opportunities');
}));

testResults.push(runTest('AI should count remaining cards of opponents', () => {
    const aiAnalysis = lispEngine.eval('(analyze-opponent-hands 1)');
    assert(Array.isArray(aiAnalysis.opponentCardCounts), 'AI should track opponent card counts');
    assert(aiAnalysis.opponentCardCounts.length === 3, 'AI should analyze all other players');
    
    // AI should recognize when opponent is close to winning
    const dangerousOpponent = aiAnalysis.opponentCardCounts.find(count => count.cards <= 2);
    if (dangerousOpponent) {
        assert(aiAnalysis.threatLevel === 'high', 'AI should recognize threat when opponent has few cards');
    }
}));

// Test Group 3: Difficulty Levels
log('\n📊 Difficulty Level Tests:');

testResults.push(runTest('AI should support different difficulty levels', () => {
    const easyAI = lispEngine.eval('(make-ai-decision 1 "easy")');
    const hardAI = lispEngine.eval('(make-ai-decision 1 "hard")');
    
    assert(typeof easyAI.difficulty === 'string', 'Easy AI should report difficulty level');
    assert(typeof hardAI.difficulty === 'string', 'Hard AI should report difficulty level');
    assert(easyAI.difficulty !== hardAI.difficulty, 'Different difficulty levels should be distinct');
}));

testResults.push(runTest('Easy AI should make suboptimal moves occasionally', () => {
    const easyDecision = lispEngine.eval('(make-ai-decision 1 "easy")');
    assert(typeof easyDecision.randomness === 'number', 'Easy AI should have randomness factor');
    assert(easyDecision.randomness > 0, 'Easy AI should introduce some randomness');
    assert(easyDecision.strategicDepth <= 2, 'Easy AI should have limited strategic depth');
}));

testResults.push(runTest('Hard AI should calculate multiple moves ahead', () => {
    const hardDecision = lispEngine.eval('(make-ai-decision 1 "hard")');
    assert(typeof hardDecision.strategicDepth === 'number', 'Hard AI should report strategic depth');
    assert(hardDecision.strategicDepth >= 3, 'Hard AI should think multiple moves ahead');
    assert(typeof hardDecision.gameStateEvaluation === 'object', 'Hard AI should evaluate game state');
}));

// Test Group 4: Endgame Strategy
log('\n🏁 Endgame Strategy Tests:');

testResults.push(runTest('AI should play aggressively when close to winning', () => {
    // Simulate AI with few cards left
    const endgameDecision = lispEngine.eval('(make-endgame-decision 1)');
    assert(typeof endgameDecision.endgameMode === 'boolean', 'AI should recognize endgame');
    
    // When AI has few cards, it should be more aggressive
    const aiHandSize = lispEngine.eval('(get-player-hand 1)').length;
    if (aiHandSize <= 3) {
        assert(endgameDecision.endgameMode === true, 'AI should enter endgame mode with few cards');
        assert(endgameDecision.strategy === 'aggressive', 'AI should be aggressive in endgame');
    }
}));

testResults.push(runTest('AI should block opponents close to winning', () => {
    const blockingDecision = lispEngine.eval('(make-blocking-decision 1)');
    assert(typeof blockingDecision.blockingOpportunity === 'boolean', 'AI should identify blocking opportunities');
    
    // If opponent has very few cards, AI should try to play cards they can't beat
    const opponentAnalysis = lispEngine.eval('(analyze-opponent-threats 1)');
    if (opponentAnalysis.highThreat) {
        assert(blockingDecision.strategy === 'blocking', 'AI should use blocking strategy against threats');
    }
}));

// Test Group 5: Learning and Adaptation
log('\n🎓 Learning and Adaptation Tests:');

testResults.push(runTest('AI should track successful strategies', () => {
    const learningData = lispEngine.eval('(get-ai-learning-data 1)');
    assert(typeof learningData.successfulMoves === 'number', 'AI should track successful moves');
    assert(typeof learningData.failedMoves === 'number', 'AI should track failed moves');
    assert(Array.isArray(learningData.strategyHistory), 'AI should maintain strategy history');
}));

testResults.push(runTest('AI should adapt to opponent playing patterns', () => {
    const adaptationData = lispEngine.eval('(get-opponent-adaptation-data 1)');
    assert(Array.isArray(adaptationData.opponentPatterns), 'AI should track opponent patterns');
    assert(typeof adaptationData.adaptationLevel === 'number', 'AI should have adaptation level');
    
    // AI should notice if opponent frequently plays certain card types
    adaptationData.opponentPatterns.forEach(pattern => {
        assert(typeof pattern.playerId === 'number', 'Pattern should identify player');
        assert(typeof pattern.tendencies === 'object', 'Pattern should track tendencies');
    });
}));

// Test Group 6: Performance Optimization
log('\n⚡ Performance Optimization Tests:');

testResults.push(runTest('AI decision should complete within reasonable time', () => {
    const startTime = Date.now();
    const aiDecision = lispEngine.eval('(make-optimized-ai-decision 1)');
    const endTime = Date.now();
    
    const decisionTime = endTime - startTime;
    assert(decisionTime < 1000, 'AI decision should complete within 1 second');
    assert(aiDecision.decisionTime < 500, 'AI should report fast decision time');
}));

testResults.push(runTest('AI should cache calculation results', () => {
    const cacheData = lispEngine.eval('(get-ai-cache-data 1)');
    assert(typeof cacheData.cacheHits === 'number', 'AI should track cache hits');
    assert(typeof cacheData.cacheMisses === 'number', 'AI should track cache misses');
    assert(typeof cacheData.cacheSize === 'number', 'AI should report cache size');
}));

// Results Summary
log('\n' + '='.repeat(60));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 AI Strategy Test Results: ${passed}/${total} passed`);

if (passed === 0) {
    log('🔴 Perfect! All AI strategy tests failed as expected in Red phase.');
    log('Next: Implement intelligent AI that considers card strength and strategy');
} else {
    logError(`❌ Unexpected: ${passed} tests passed in Red phase`);
    log('Some AI strategy functionality may already exist');
}

log('\n🎯 Required Implementation:');
log('- (make-intelligent-ai-decision playerId) - AI with card strength awareness');
log('- (make-strategic-ai-decision playerId) - AI with strategic planning');
log('- (find-pairs-in-hand playerId) - Find playable pairs');
log('- (make-pair-strategic-decision playerId) - Strategic pair playing');
log('- (make-special-rule-decision playerId) - Strategic special rule usage');
log('- (analyze-opponent-hands playerId) - Opponent analysis');
log('- (make-ai-decision playerId difficulty) - Difficulty level support');
log('- (make-endgame-decision playerId) - Endgame strategy');
log('- (make-blocking-decision playerId) - Opponent blocking strategy');
log('- (get-ai-learning-data playerId) - Learning and adaptation');
log('- (get-opponent-adaptation-data playerId) - Opponent pattern tracking');
log('- (make-optimized-ai-decision playerId) - Performance optimized AI');
log('- (get-ai-cache-data playerId) - Caching for performance');

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTest,
        assert,
        testResults
    };
}