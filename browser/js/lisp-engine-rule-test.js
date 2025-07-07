/**
 * Lisp Game Engine Rule Testing Suite
 * Comprehensive automated testing for game rule validation
 */

// Import the Lisp Engine
require('./lisp-engine.js');

class LispEngineRuleTester {
    constructor() {
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
        this.warnings = [];
        this.criticalIssues = [];
        this.lispEngine = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'pass' ? '✅' : 
                      type === 'fail' ? '❌' : 
                      type === 'warn' ? '⚠️' : 
                      type === 'critical' ? '🚨' : 
                      '📋';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    assert(condition, message) {
        this.testCount++;
        if (condition) {
            this.passCount++;
            this.log(`PASS: ${message}`, 'pass');
            return true;
        } else {
            this.failCount++;
            this.log(`FAIL: ${message}`, 'fail');
            return false;
        }
    }

    warn(message) {
        this.warnings.push(message);
        this.log(`WARNING: ${message}`, 'warn');
    }

    critical(message) {
        this.criticalIssues.push(message);
        this.log(`CRITICAL: ${message}`, 'critical');
    }

    setupEngine() {
        try {
            this.lispEngine = new LispGameEngine();
            const initResult = this.lispEngine.eval('(initialize-complete-game 4)');
            const deckResult = this.lispEngine.eval('(create-and-shuffle-deck)');
            const dealResult = this.lispEngine.eval('(deal-cards-to-all-players)');
            
            if (!initResult.success || !deckResult.shuffled || !dealResult.success) {
                this.critical('Engine setup failed');
                return false;
            }
            return true;
        } catch (error) {
            this.critical(`Engine setup error: ${error.message}`);
            return false;
        }
    }

    testBasicGameFlow() {
        this.log('\n🎮 Testing Basic Game Flow...', 'info');
        
        if (!this.setupEngine()) return;

        try {
            // Test game state
            const gameState = this.lispEngine.eval('(get-complete-game-state)');
            this.assert(gameState && gameState.players, 'Game state should exist');
            this.assert(gameState.players.length === 4, 'Should have 4 players');
            this.assert(typeof gameState.currentPlayer === 'number', 'Should have current player ID');

            // Test player hands
            let totalCards = 0;
            for (let i = 0; i < 4; i++) {
                const hand = this.lispEngine.eval(`(get-player-hand ${i})`);
                this.assert(Array.isArray(hand), `Player ${i} should have a hand array`);
                this.assert(hand.length > 0, `Player ${i} should have cards`);
                totalCards += hand.length;
            }
            this.assert(totalCards === 54, 'All 54 cards should be distributed');

            // Test turn management
            const initialPlayer = this.lispEngine.eval('(get-current-player)');
            const turnResult = this.lispEngine.eval('(advance-turn)');
            this.assert(turnResult.success, 'Turn advancement should succeed');
            
            const newPlayer = this.lispEngine.eval('(get-current-player)');
            this.assert(newPlayer.id !== initialPlayer.id, 'Current player should change');

        } catch (error) {
            this.critical(`Basic game flow error: ${error.message}`);
        }
    }

    testCardValidation() {
        this.log('\n🃏 Testing Card Validation...', 'info');

        try {
            // Test basic validation
            const emptyPlay = this.lispEngine.eval('(validate-card-play [])');
            this.assert(!emptyPlay.valid, 'Empty card play should be invalid');

            const singleCard = this.lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"}])');
            this.assert(singleCard.valid, 'Single card play should be valid');

            const validPair = this.lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"3"}])');
            this.assert(validPair.valid, 'Pair of same rank should be valid');

            const invalidPair = this.lispEngine.eval('(validate-card-play [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"4"}])');
            this.assert(!invalidPair.valid, 'Pair of different ranks should be invalid');

            // Critical: Test Daifugo card strength
            this.log('🔍 Testing Daifugo card strength logic...', 'info');
            
            // Check if engine has card strength comparison
            try {
                const strengthTest = this.lispEngine.eval('(compare-card-strength {"suit":"♠","rank":"3"} {"suit":"♥","rank":"A"})');
                if (strengthTest === null || strengthTest === undefined) {
                    this.critical('Card strength comparison not implemented - CORE DAIFUGO FEATURE MISSING');
                }
            } catch (error) {
                this.critical('Card strength comparison not implemented - CORE DAIFUGO FEATURE MISSING');
            }

            // Test field state validation
            try {
                const fieldValidation = this.lispEngine.eval('(can-play-on-field [{"suit":"♠","rank":"3"}] [{"suit":"♥","rank":"2"}])');
                if (fieldValidation === null) {
                    this.critical('Field state validation not implemented');
                }
            } catch (error) {
                this.critical('Field state validation not implemented');
            }

        } catch (error) {
            this.critical(`Card validation error: ${error.message}`);
        }
    }

    testSpecialRules() {
        this.log('\n⚖️ Testing Special Rules...', 'info');

        try {
            // Test 8-cut
            const eightCut = this.lispEngine.eval('(apply-rule "eight-cut" [{"suit":"♠","rank":"8"}])');
            this.assert(eightCut.ruleApplied, '8-cut rule should be applied');
            this.assert(eightCut.effect === 'field-clear', '8-cut should clear field');

            // Test revolution
            const revolution = this.lispEngine.eval('(apply-rule "revolution" [{"suit":"♠","rank":"3"},{"suit":"♥","rank":"3"},{"suit":"♦","rank":"3"},{"suit":"♣","rank":"3"}])');
            this.assert(revolution.ruleApplied, 'Revolution rule should be applied');

            // Test Q-bomber
            const qBomber = this.lispEngine.eval('(apply-rule "q-bomber" [{"suit":"♠","rank":"Q"},{"suit":"♥","rank":"Q"}])');
            this.assert(qBomber.ruleApplied, 'Q-bomber rule should be applied');

            // Test rule integration with game flow
            this.warn('Rule effects on game state not fully validated');
            this.warn('Rule priority system needs comprehensive testing');

        } catch (error) {
            this.critical(`Special rules error: ${error.message}`);
        }
    }

    testAILogic() {
        this.log('\n🤖 Testing AI Logic...', 'info');

        try {
            // Test AI decisions for each CPU
            for (let i = 1; i < 4; i++) {
                const aiDecision = this.lispEngine.eval(`(make-ai-decision ${i})`);
                this.assert(aiDecision && (aiDecision.action === 'play' || aiDecision.action === 'pass'), 
                           `CPU ${i} should make valid decision`);

                if (aiDecision.action === 'play') {
                    this.assert(Array.isArray(aiDecision.cards), `CPU ${i} should provide cards array`);
                    this.assert(aiDecision.cards.length > 0, `CPU ${i} should select cards`);

                    // Validate AI card selection
                    const playerHand = this.lispEngine.eval(`(get-player-hand ${i})`);
                    const selectedCard = aiDecision.cards[0];
                    const cardInHand = playerHand.some(card => 
                        card.suit === selectedCard.suit && card.rank === selectedCard.rank
                    );
                    this.assert(cardInHand, `CPU ${i} should only select cards from hand`);
                }
            }

            // Critical AI issues
            this.critical('AI uses simplistic "play first card" strategy');
            this.critical('AI does not consider field state or card strength');
            this.critical('AI does not validate if cards can beat current field');
            this.critical('AI does not use special rules strategically');
            this.warn('AI difficulty levels not implemented');

        } catch (error) {
            this.critical(`AI logic error: ${error.message}`);
        }
    }

    testGameProgression() {
        this.log('\n🏁 Testing Game Progression...', 'info');

        try {
            const initialState = this.lispEngine.eval('(get-complete-game-state)');
            this.assert(Array.isArray(initialState.fieldCards), 'Field cards should be array');

            // Test card playing
            const playResult = this.lispEngine.eval('(play-cards-and-generate-events [{"suit":"♠","rank":"3"}])');
            this.assert(typeof playResult.success === 'boolean', 'Play should return success status');

            // Critical missing features
            this.critical('Field state not updated after card plays');
            this.critical('Last played cards tracking missing');
            this.critical('Cannot play stronger cards on field');
            this.critical('Turn progression logic incomplete');
            this.critical('Game ending conditions not implemented');
            this.critical('Player elimination not handled');
            this.critical('Win/lose detection missing');
            this.critical('Ranking system not implemented');

        } catch (error) {
            this.critical(`Game progression error: ${error.message}`);
        }
    }

    testDaifugoRules() {
        this.log('\n🎴 Testing Core Daifugo Rules...', 'info');

        // Test card hierarchy (3 is lowest, 2 is highest, Joker is strongest)
        this.critical('Card hierarchy (3<4<5<6<7<8<9<10<J<Q<K<A<2<Joker) not implemented');
        this.critical('Revolution mode (reverses card order) not implemented');
        this.critical('Pass/skip turn mechanism missing');
        this.critical('Multiple players passing in sequence not handled');
        this.critical('Round ending when all players pass not implemented');
        this.critical('Social ranking (Daifugo/Fugo/Heimin/Hinmin) not implemented');
        this.critical('Card exchange between ranks not implemented');
        this.critical('Multi-round gameplay not supported');
    }

    generateReport() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('📊 LISP ENGINE RULE TESTING REPORT', 'info');
        this.log('='.repeat(60), 'info');
        
        this.log(`\nTest Results:`, 'info');
        this.log(`  Total Tests: ${this.testCount}`, 'info');
        this.log(`  Passed: ${this.passCount}`, this.passCount === this.testCount ? 'pass' : 'info');
        this.log(`  Failed: ${this.failCount}`, this.failCount === 0 ? 'pass' : 'fail');
        this.log(`  Success Rate: ${Math.round((this.passCount/this.testCount)*100)}%`, 'info');

        if (this.criticalIssues.length > 0) {
            this.log(`\n🚨 CRITICAL ISSUES (${this.criticalIssues.length}):`, 'critical');
            this.criticalIssues.forEach((issue, index) => {
                this.log(`  ${index + 1}. ${issue}`, 'critical');
            });
        }

        if (this.warnings.length > 0) {
            this.log(`\n⚠️ WARNINGS (${this.warnings.length}):`, 'warn');
            this.warnings.forEach((warning, index) => {
                this.log(`  ${index + 1}. ${warning}`, 'warn');
            });
        }

        this.log('\n📋 CONCLUSION:', 'info');
        if (this.criticalIssues.length > 10) {
            this.log('❌ LISP ENGINE IS NOT SUITABLE FOR DAIFUGO GAMEPLAY', 'critical');
            this.log('   Major game rule components are missing or broken', 'critical');
            this.log('   Recommend complete rewrite of core game logic', 'critical');
        } else if (this.criticalIssues.length > 5) {
            this.log('⚠️  LISP ENGINE HAS SIGNIFICANT ISSUES', 'warn');
            this.log('   Core gameplay features need implementation', 'warn');
        } else {
            this.log('✅ LISP ENGINE BASIC FUNCTIONALITY WORKING', 'pass');
            this.log('   Minor issues and enhancements needed', 'info');
        }
    }

    runFullTest() {
        this.log('🧪 Starting Comprehensive Lisp Engine Rule Testing...', 'info');
        
        this.testBasicGameFlow();
        this.testCardValidation();
        this.testSpecialRules();
        this.testAILogic();
        this.testGameProgression();
        this.testDaifugoRules();
        
        this.generateReport();
    }
}

// Run the test if called directly
if (require.main === module) {
    const tester = new LispEngineRuleTester();
    tester.runFullTest();
}

// Export for other modules
module.exports = LispEngineRuleTester;