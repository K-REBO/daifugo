/**
 * Card Strength Comparison System Tests
 * TDD Red Phase: Write failing tests for core Daifugo card hierarchy
 * 
 * Daifugo Card Hierarchy: 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < Joker
 * Revolution Mode: Reverses order (except Joker stays strongest)
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
log('🔴 TDD Red Phase: Card Strength Comparison Tests');
log('='.repeat(60));

let testResults = [];
let lispEngine;

// Setup
try {
    lispEngine = new LispGameEngine();
    log('✅ Lisp Engine created for testing');
} catch (error) {
    logError('❌ Failed to create Lisp Engine');
    process.exit(1);
}

// Test Group 1: Basic Card Strength Comparison
log('\n🎴 Basic Card Strength Tests:');

testResults.push(runTest('3 should be weaker than 4', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"3"} {"suit":"♥","rank":"4"})');
    assert(result === -1, 'Card 3 should be weaker than 4 (return -1)');
}));

testResults.push(runTest('4 should be stronger than 3', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"4"} {"suit":"♥","rank":"3"})');
    assert(result === 1, 'Card 4 should be stronger than 3 (return 1)');
}));

testResults.push(runTest('Same rank cards should be equal', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"7"} {"suit":"♥","rank":"7"})');
    assert(result === 0, 'Same rank cards should be equal (return 0)');
}));

// Test Group 2: Complete Daifugo Hierarchy
log('\n🏆 Complete Hierarchy Tests:');

testResults.push(runTest('3 should be weakest regular card', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"3"} {"suit":"♥","rank":"4"})');
    assert(result === -1, '3 should be weaker than 4');
}));

testResults.push(runTest('2 should be strongest regular card', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"A"} {"suit":"♥","rank":"2"})');
    assert(result === -1, 'Ace should be weaker than 2');
}));

testResults.push(runTest('Joker should be strongest card', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"2"} {"suit":"JOKER","rank":"JOKER"})');
    assert(result === -1, '2 should be weaker than Joker');
}));

testResults.push(runTest('Face cards hierarchy: J < Q < K < A', () => {
    const jVsQ = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"J"} {"suit":"♥","rank":"Q"})');
    const qVsK = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"Q"} {"suit":"♥","rank":"K"})');
    const kVsA = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"K"} {"suit":"♥","rank":"A"})');
    
    assert(jVsQ === -1, 'J should be weaker than Q');
    assert(qVsK === -1, 'Q should be weaker than K');
    assert(kVsA === -1, 'K should be weaker than A');
}));

// Test Group 3: Revolution Mode
log('\n🔄 Revolution Mode Tests:');

testResults.push(runTest('Revolution should reverse card order', () => {
    // In revolution: 2 < A < K < Q < J < 10 < 9 < 8 < 7 < 6 < 5 < 4 < 3 (Joker still strongest)
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"2"} {"suit":"♥","rank":"3"} true)');
    assert(result === -1, 'In revolution, 2 should be weaker than 3');
}));

testResults.push(runTest('Revolution should not affect Joker', () => {
    const result = lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"3"} {"suit":"JOKER","rank":"JOKER"} true)');
    assert(result === -1, 'Even in revolution, 3 should be weaker than Joker');
}));

// Test Group 4: Field Validation
log('\n🃏 Field Validation Tests:');

testResults.push(runTest('Should be able to play stronger card on field', () => {
    const result = lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"4"}] [{"suit":"♥","rank":"3"}])');
    assert(result.canPlay === true, 'Should be able to play 4 on 3');
}));

testResults.push(runTest('Should not be able to play weaker card on field', () => {
    const result = lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"3"}] [{"suit":"♥","rank":"4"}])');
    assert(result.canPlay === false, 'Should not be able to play 3 on 4');
}));

testResults.push(runTest('Should be able to play same rank on field', () => {
    const result = lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"7"}] [{"suit":"♥","rank":"7"}])');
    assert(result.canPlay === true, 'Should be able to play same rank');
}));

testResults.push(runTest('Should validate multiple cards of same rank', () => {
    const result = lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"4"},{"suit":"♦","rank":"4"}] [{"suit":"♥","rank":"3"},{"suit":"♣","rank":"3"}])');
    assert(result.canPlay === true, 'Should be able to play pair of 4s on pair of 3s');
}));

testResults.push(runTest('Should reject multiple cards of different count', () => {
    const result = lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"4"}] [{"suit":"♥","rank":"3"},{"suit":"♦","rank":"3"}])');
    assert(result.canPlay === false, 'Should not be able to play single on pair');
}));

// Test Group 5: Special Cases
log('\n✨ Special Cases Tests:');

testResults.push(runTest('Empty field should accept any cards', () => {
    const result = lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"3"}] [])');
    assert(result.canPlay === true, 'Empty field should accept any cards');
}));

testResults.push(runTest('Should get card rank value', () => {
    const value3 = lispEngine.eval('(get-card-rank-value {"suit":"♠","rank":"3"})');
    const value2 = lispEngine.eval('(get-card-rank-value {"suit":"♠","rank":"2"})');
    const valueJoker = lispEngine.eval('(get-card-rank-value {"suit":"JOKER","rank":"JOKER"})');
    
    assert(typeof value3 === 'number', 'Should return numeric value for 3');
    assert(typeof value2 === 'number', 'Should return numeric value for 2');
    assert(typeof valueJoker === 'number', 'Should return numeric value for Joker');
    assert(value3 < value2, '3 should have lower value than 2');
    assert(value2 < valueJoker, '2 should have lower value than Joker');
}));

// Results Summary
log('\n' + '='.repeat(60));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
log(`📊 Card Strength Test Results: ${passed}/${total} passed`);

if (passed === 0) {
    log('🔴 Perfect! All card strength tests failed as expected in Red phase.');
    log('Next: Implement card strength comparison system to make tests pass');
} else {
    logError(`❌ Unexpected: ${passed} tests passed in Red phase`);
    log('Some card strength functionality may already exist');
}

log('\n🎯 Required Implementation:');
log('- (compare-card-strength card1 card2 [revolution])');
log('- (can-play-on-field newCards fieldCards)');
log('- (get-card-rank-value card)');
log('- Proper Daifugo card hierarchy support');
log('- Revolution mode support');

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTest,
        assert,
        testResults
    };
}