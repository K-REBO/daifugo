const { evaluate, createEnvironment, sym } = require('./evaluator');
const { parse } = require('./parser');

describe('Pure Lisp Game Engine', () => {
  let env;
  
  beforeEach(() => {
    env = createEnvironment();
  });

  // Test loading Lisp files
  describe('Lisp file loading', () => {
    test('should load card operations from Lisp file', () => {
      const result = evaluate([sym('load'), 'card-operations.lisp'], env);
      
      // Test that functions are now available
      const deck = evaluate([sym('create-deck')], env);
      expect(Array.isArray(deck)).toBe(true);
      expect(deck.length).toBe(54); // Full deck with jokers
    });

    test('should load card comparison from Lisp file', () => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      const result = evaluate([sym('load'), 'card-comparison.lisp'], env);
      
      // Test card comparison functionality
      const card1 = evaluate([sym('create-card'), [sym('quote'), '♠'], [sym('quote'), '3']], env);
      const card2 = evaluate([sym('create-card'), [sym('quote'), '♥'], [sym('quote'), '4']], env);
      const comparison = evaluate([sym('compare-cards'), [sym('quote'), card1], [sym('quote'), card2]], env);
      expect(comparison).toBe(-1); // 3 < 4
    });

    test('should load complete game logic from Lisp file', () => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      const result = evaluate([sym('load'), 'game-logic.lisp'], env);
      
      // Test game initialization
      const gameState = evaluate([sym('init-game'), 4], env);
      expect(gameState).not.toBeNull();
      expect(Array.isArray(gameState)).toBe(true);
      expect(gameState[0]).toBe('game-state');
    });
  });

  describe('Pure Lisp Card Operations', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
    });

    test('should create cards in Lisp', () => {
      const card = evaluate([sym('create-card'), '♠', '8'], env);
      expect(card).toEqual(['card', '♠', '8']);
    });

    test('should create joker in Lisp', () => {
      const joker = evaluate([sym('create-joker')], env);
      expect(joker).toEqual(['card', null, 'JOKER']);
    });

    test('should access card properties in Lisp', () => {
      const card = evaluate([sym('create-card'), '♦', 'Q'], env);
      const suit = evaluate([sym('card-suit'), [sym('quote'), card]], env);
      const rank = evaluate([sym('card-rank'), [sym('quote'), card]], env);
      
      expect(suit).toBe('♦');
      expect(rank).toBe('Q');
    });

    test('should validate cards in Lisp', () => {
      const validCard = evaluate([sym('create-card'), '♥', '7'], env);
      const isValid = evaluate([sym('valid-card'), [sym('quote'), validCard]], env);
      expect(isValid).toBe(true);
    });

    test('should create and shuffle deck in Lisp', () => {
      const deck = evaluate([sym('create-deck')], env);
      const shuffled = evaluate([sym('shuffle-deck'), [sym('quote'), deck]], env);
      
      expect(Array.isArray(shuffled)).toBe(true);
      expect(shuffled.length).toBe(54);
    });
  });

  describe('Pure Lisp Card Comparison', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
    });

    test('should compare single cards in Lisp', () => {
      const card3 = evaluate([sym('create-card'), '♠', '3'], env);
      const card4 = evaluate([sym('create-card'), '♥', '4'], env);
      const cardA = evaluate([sym('create-card'), '♦', 'A'], env);
      const card2 = evaluate([sym('create-card'), '♣', '2'], env);
      
      const comp1 = evaluate([sym('compare-cards'), [sym('quote'), card3], [sym('quote'), card4]], env);
      const comp2 = evaluate([sym('compare-cards'), [sym('quote'), cardA], [sym('quote'), card2]], env);
      
      expect(comp1).toBe(-1); // 3 < 4
      expect(comp2).toBe(-1); // A < 2
    });

    test('should validate hand types in Lisp', () => {
      const card5a = evaluate([sym('create-card'), '♠', '5'], env);
      const singleCard = [card5a];
      
      const handType = evaluate([sym('validate-hand-type'), [sym('quote'), singleCard]], env);
      expect(handType[0]).toBe("single"); // 簡素化されたバージョンではsingleのみ
    });

    test('should compare hands in Lisp', () => {
      const hand1 = [evaluate([sym('create-card'), '♠', '5'], env)];
      const hand2 = [evaluate([sym('create-card'), '♥', '7'], env)];
      
      const stronger = evaluate([sym('is-stronger-than'), [sym('quote'), hand2], [sym('quote'), hand1]], env);
      expect(stronger).toBe(true);
    });
  });

  describe('Pure Lisp Game Logic', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      evaluate([sym('load'), 'game-logic.lisp'], env);
    });

    test('should initialize game in Lisp', () => {
      const gameState = evaluate([sym('init-game'), 4], env);
      
      expect(gameState[0]).toBe('game-state');
      
      const players = evaluate([sym('get-players'), [sym('quote'), gameState]], env);
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBe(4);
    });

    test('should manage game state in Lisp', () => {
      const gameState = evaluate([sym('create-game-state'), 4], env);
      const currentPlayer = evaluate([sym('get-current-player'), [sym('quote'), gameState]], env);
      
      expect(currentPlayer).toBe(0);
      
      const newState = evaluate([sym('set-current-player'), [sym('quote'), gameState], 2], env);
      const newCurrentPlayer = evaluate([sym('get-current-player'), [sym('quote'), newState]], env);
      
      expect(newCurrentPlayer).toBe(2);
    });

    test('should validate plays in Lisp', () => {
      const gameState = evaluate([sym('create-game-state'), 4], env);
      const cards = [evaluate([sym('create-card'), '♠', '8'], env)];
      
      const validation = evaluate([sym('validate-play'), [sym('quote'), gameState], [sym('quote'), cards]], env);
      expect(validation[0]).toBe('valid');
    });

    test('should detect special rules in Lisp', () => {
      const eightCard = [evaluate([sym('create-card'), '♠', '8'], env)];
      const hasEight = evaluate([sym('has-eight-cut'), [sym('quote'), eightCard]], env);
      expect(hasEight).toBe(true);
      
      const fourFives = [
        evaluate([sym('create-card'), '♠', '5'], env),
        evaluate([sym('create-card'), '♥', '5'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♣', '5'], env)
      ];
      const hasRevolution = evaluate([sym('has-revolution'), [sym('quote'), fourFives]], env);
      expect(hasRevolution).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      evaluate([sym('load'), 'game-logic.lisp'], env);
    });

    test('should run complete game flow in Pure Lisp', () => {
      // Initialize game
      const gameState = evaluate([sym('init-game'), 4], env);
      expect(gameState[0]).toBe('game-state');
      
      // Get first player's hand
      const playerHand = evaluate([sym('get-player-hand'), [sym('quote'), gameState], 0], env);
      expect(Array.isArray(playerHand)).toBe(true);
      
      // Try to play a card (if available)
      if (playerHand.length > 0) {
        const cardToPlay = [playerHand[0]];
        const validation = evaluate([sym('validate-play'), [sym('quote'), gameState], [sym('quote'), cardToPlay]], env);
        expect(validation[0]).toBe('valid');
      }
    });
  });

  describe('Pure Lisp Play Validation', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      evaluate([sym('load'), 'game-logic.lisp'], env);
    });

    test('should validate play against empty field', () => {
      // Manually create game state with field cards slot
      const gameState = ["game-state", 4, 0, null];
      const cards = [evaluate([sym('create-card'), '♠', '5'], env)];
      
      const validation = evaluate([sym('validate-play'), [sym('quote'), gameState], [sym('quote'), cards]], env);
      expect(validation[0]).toBe("valid");
    });

    test('should validate play against field cards', () => {
      const gameState = evaluate([sym('create-game-state'), 4], env);
      const fieldCards = [evaluate([sym('create-card'), '♥', '6'], env)];
      const gameStateWithField = evaluate([sym('set-field-cards'), [sym('quote'), gameState], [sym('quote'), fieldCards]], env);
      
      const playCards = [evaluate([sym('create-card'), '♠', '8'], env)];
      const validation = evaluate([sym('validate-play'), [sym('quote'), gameStateWithField], [sym('quote'), playCards]], env);
      expect(validation[0]).toBe("valid"); // 8 > 6
    });

    test('should reject invalid play', () => {
      const gameState = evaluate([sym('create-game-state'), 4], env);
      const fieldCards = [evaluate([sym('create-card'), '♥', 'A'], env)];
      const gameStateWithField = evaluate([sym('set-field-cards'), [sym('quote'), gameState], [sym('quote'), fieldCards]], env);
      
      const playCards = [evaluate([sym('create-card'), '♠', '5'], env)];
      const validation = evaluate([sym('validate-play'), [sym('quote'), gameStateWithField], [sym('quote'), playCards]], env);
      expect(validation[0]).toBe("invalid"); // 5 < A
    });

    test('should validate empty card play as invalid', () => {
      const gameState = evaluate([sym('create-game-state'), 4], env);
      const validation = evaluate([sym('validate-play'), [sym('quote'), gameState], [sym('quote'), []]], env);
      expect(validation[0]).toBe("invalid");
    });
  });

  describe('Phase 7.4: Advanced Play Validation System', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      evaluate([sym('load'), 'game-logic.lisp'], env);
    });

    test('should validate single card plays with comprehensive rules', () => {
      // This test should initially fail because comprehensive validation isn't implemented
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const fieldCards = [evaluate([sym('create-card'), '♥', '6'], env)];
      const gameStateWithField = evaluate([sym('update-game-state-enhanced'), 
        [sym('quote'), gameState], 
        [sym('quote'), { type: 'set-field-cards', cards: fieldCards }]
      ], env);
      
      // Test valid single card
      const validCard = [evaluate([sym('create-card'), '♠', '8'], env)];
      const validResult = evaluate([sym('validate-play-comprehensive'), 
        [sym('quote'), gameStateWithField], 
        [sym('quote'), validCard]
      ], env);
      
      expect(validResult.valid).toBe(true);
      expect(validResult.reason).toBe('single-card-valid');
      expect(validResult.cardType).toBe('single');
    });

    test('should validate pair plays with strict requirements', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const fieldPair = [
        evaluate([sym('create-card'), '♥', '7'], env),
        evaluate([sym('create-card'), '♦', '7'], env)
      ];
      const gameStateWithField = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), gameState],
        [sym('quote'), { type: 'set-field-cards', cards: fieldPair }]
      ], env);
      
      // Test valid pair
      const validPair = [
        evaluate([sym('create-card'), '♠', '9'], env),
        evaluate([sym('create-card'), '♣', '9'], env)
      ];
      const validResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameStateWithField],
        [sym('quote'), validPair]
      ], env);
      
      expect(validResult.valid).toBe(true);
      expect(validResult.cardType).toBe('pair');
      expect(validResult.strength).toBeGreaterThan(0);
    });

    test('should validate triple plays with sequence requirements', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const fieldTriple = [
        evaluate([sym('create-card'), '♥', '5'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♠', '5'], env)
      ];
      const gameStateWithField = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), gameState],
        [sym('quote'), { type: 'set-field-cards', cards: fieldTriple }]
      ], env);
      
      const validTriple = [
        evaluate([sym('create-card'), '♥', 'Q'], env),
        evaluate([sym('create-card'), '♦', 'Q'], env),
        evaluate([sym('create-card'), '♠', 'Q'], env)
      ];
      const validResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameStateWithField],
        [sym('quote'), validTriple]
      ], env);
      
      expect(validResult.valid).toBe(true);
      expect(validResult.cardType).toBe('triple');
    });

    test('should validate sequence plays with complex rules', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const fieldSequence = [
        evaluate([sym('create-card'), '♥', '4'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♠', '6'], env)
      ];
      const gameStateWithField = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), gameState],
        [sym('quote'), { type: 'set-field-cards', cards: fieldSequence }]
      ], env);
      
      const validSequence = [
        evaluate([sym('create-card'), '♥', '7'], env),
        evaluate([sym('create-card'), '♦', '8'], env),
        evaluate([sym('create-card'), '♠', '9'], env)
      ];
      const validResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameStateWithField],
        [sym('quote'), validSequence]
      ], env);
      
      expect(validResult.valid).toBe(true);
      expect(validResult.cardType).toBe('sequence');
      expect(validResult.sequenceLength).toBe(3);
    });

    test('should reject mismatched card type plays', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const fieldPair = [
        evaluate([sym('create-card'), '♥', '7'], env),
        evaluate([sym('create-card'), '♦', '7'], env)
      ];
      const gameStateWithField = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), gameState],
        [sym('quote'), { type: 'set-field-cards', cards: fieldPair }]
      ], env);
      
      // Try to play single card against pair field
      const singleCard = [evaluate([sym('create-card'), '♠', 'A'], env)];
      const invalidResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameStateWithField],
        [sym('quote'), singleCard]
      ], env);
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.reason).toBe('card-type-mismatch');
    });

    test('should handle special card validation (jokers, revolution)', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Test joker play
      const joker = [evaluate([sym('create-joker')], env)];
      const jokerResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameState],
        [sym('quote'), joker]
      ], env);
      
      expect(jokerResult.valid).toBe(true);
      expect(jokerResult.special).toBe('joker');
      expect(jokerResult.alwaysValid).toBe(true);
    });

    test('should validate plays in revolution mode', () => {
      const revolutionState = evaluate([sym('init-game-state'), 4], env);
      const revolutionGameState = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), revolutionState],
        [sym('quote'), { type: 'set-revolution', active: true }]
      ], env);
      
      const fieldCards = [evaluate([sym('create-card'), '♥', 'K'], env)];
      const gameStateWithField = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), revolutionGameState],
        [sym('quote'), { type: 'set-field-cards', cards: fieldCards }]
      ], env);
      
      // In revolution, 3 should beat K
      const lowCard = [evaluate([sym('create-card'), '♠', '3'], env)];
      const revolutionResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameStateWithField],
        [sym('quote'), lowCard]
      ], env);
      
      expect(revolutionResult.valid).toBe(true);
      expect(revolutionResult.revolutionMode).toBe(true);
    });

    test('should validate plays with turn order restrictions', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Set specific player turn
      const gameStatePlayer2 = evaluate([sym('update-game-state-enhanced'),
        [sym('quote'), gameState],
        [sym('quote'), { type: 'set-current-player', player: 2 }]
      ], env);
      
      const cards = [evaluate([sym('create-card'), '♠', '5'], env)];
      
      // Validate that only current player can play
      const validationPlayer2 = evaluate([sym('validate-play-with-turn'),
        [sym('quote'), gameStatePlayer2],
        [sym('quote'), cards],
        2  // Playing as player 2
      ], env);
      
      const validationPlayer1 = evaluate([sym('validate-play-with-turn'),
        [sym('quote'), gameStatePlayer2],
        [sym('quote'), cards],
        1  // Playing as player 1 (wrong turn)
      ], env);
      
      expect(validationPlayer2.valid).toBe(true);
      expect(validationPlayer1.valid).toBe(false);
      expect(validationPlayer1.reason).toBe('not-your-turn');
    });

    test('should provide detailed validation error messages', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Test various error conditions
      const emptyCards = [];
      const emptyResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameState],
        [sym('quote'), emptyCards]
      ], env);
      
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.reason).toBe('no-cards-played');
      expect(emptyResult.errorCode).toBe('EMPTY_PLAY');
      
      // Test invalid card structure
      const invalidCards = [['not-a-card', 'invalid', 'structure']];
      const invalidResult = evaluate([sym('validate-play-comprehensive'),
        [sym('quote'), gameState],
        [sym('quote'), invalidCards]
      ], env);
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.reason).toBe('invalid-card-structure');
      expect(invalidResult.errorCode).toBe('MALFORMED_CARDS');
    });
  });

  describe('Pure Lisp Game State Management', () => {
    test('should initialize game state with player count', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      expect(initialState[0]).toBe("game-state");
      expect(initialState[1]).toBe(4); // player count
      expect(initialState[2]).toBe(0); // current player
      expect(initialState[3]).toBe(null); // field cards
    });

    test('should initialize game state with default values', () => {
      const initialState = evaluate([sym('init-game-state'), 2], env);
      expect(initialState).toEqual(["game-state", 2, 0, null, { consecutivePasses: 0 }]);
    });

    test('should update game state with new current player', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      const action = { type: "next-player" };
      const updatedState = evaluate([sym('update-game-state-enhanced'), [sym('quote'), initialState], [sym('quote'), action]], env);
      
      expect(updatedState[0]).toBe("game-state");
      expect(updatedState[1]).toBe(4); // player count unchanged
      expect(updatedState[2]).toBe(1); // current player advanced
      expect(updatedState[3]).toBe(null); // field cards unchanged
    });

    test('should update game state with field card changes', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      const newFieldCards = [evaluate([sym('create-card'), '♠', 'K'], env)];
      const action = { type: "set-field", cards: newFieldCards };
      const updatedState = evaluate([sym('update-game-state-enhanced'), [sym('quote'), initialState], [sym('quote'), action]], env);
      
      expect(updatedState[0]).toBe("game-state");
      expect(updatedState[1]).toBe(4);
      expect(updatedState[2]).toBe(0);
      expect(updatedState[3]).toEqual(newFieldCards);
    });

    test('should update game state with multiple actions', () => {
      const initialState = evaluate([sym('init-game-state'), 3], env);
      const action1 = { type: "next-player" };
      const action2 = { type: "next-player" };
      
      const state1 = evaluate([sym('update-game-state-enhanced'), [sym('quote'), initialState], [sym('quote'), action1]], env);
      const state2 = evaluate([sym('update-game-state-enhanced'), [sym('quote'), state1], [sym('quote'), action2]], env);
      
      expect(state2[2]).toBe(2); // current player should be 2
    });

    test('should handle wrapping current player', () => {
      const initialState = evaluate([sym('init-game-state'), 3], env);
      // Start with player 2
      const startState = ["game-state", 3, 2, null];
      const action = { type: "next-player" };
      const updatedState = evaluate([sym('update-game-state-enhanced'), [sym('quote'), startState], [sym('quote'), action]], env);
      
      expect(updatedState[2]).toBe(0); // should wrap to player 0
    });

    test('should provide helper functions for state inspection', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      const playerCount = evaluate([sym('get-player-count'), [sym('quote'), gameState]], env);
      expect(playerCount).toBe(4);
      
      const currentPlayer = evaluate([sym('get-current-player'), [sym('quote'), gameState]], env);
      expect(currentPlayer).toBe(0);
    });

    test('should support reset-field action', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      const fieldCards = [evaluate([sym('create-card'), '♠', 'K'], env)];
      const setAction = { type: "set-field", cards: fieldCards };
      const resetAction = { type: "reset-field" };
      
      const stateWithField = evaluate([sym('update-game-state-enhanced'), [sym('quote'), initialState], [sym('quote'), setAction]], env);
      expect(stateWithField[3]).toEqual(fieldCards);
      
      const resetState = evaluate([sym('update-game-state-enhanced'), [sym('quote'), stateWithField], [sym('quote'), resetAction]], env);
      expect(resetState[3]).toBe(null);
    });

    test('should handle unknown actions gracefully', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      const unknownAction = { type: "unknown-action" };
      
      const updatedState = evaluate([sym('update-game-state-enhanced'), [sym('quote'), initialState], [sym('quote'), unknownAction]], env);
      expect(updatedState).toEqual(initialState); // should return original state
    });

    // Phase 7.5 Advanced Game State Management Tests
    test('should manage complex game state with immutable operations', () => {
      const initialState = evaluate([sym('init-game-state-pure'), 4], env);
      
      // Test comprehensive state structure
      expect(initialState[0]).toBe('game-state');
      expect(initialState[1]).toBe(4); // player count
      expect(initialState[2]).toBe(0); // current player
      expect(initialState[3]).toBe(null); // field cards
      expect(initialState[4]).toBeDefined(); // game data
      expect(initialState[4].consecutivePasses).toBe(0);
      expect(initialState[4].isRevolution).toBe(false);
      expect(initialState[4].hands).toBeDefined();
      expect(initialState[4].hands.length).toBe(4);
    });

    test('should update game state with atomic immutable operations', () => {
      const initialState = evaluate([sym('init-game-state-pure'), 3], env);
      const cards = [evaluate([sym('create-card'), '♠', '5'], env)];
      
      // Test atomic state update operations
      const stateWithField = evaluate([sym('update-game-state-atomic'), 
        [sym('quote'), initialState],
        [sym('quote'), { type: 'set-field-cards', cards: cards }]
      ], env);
      
      const stateWithNextPlayer = evaluate([sym('update-game-state-atomic'),
        [sym('quote'), stateWithField], 
        [sym('quote'), { type: 'advance-player' }]
      ], env);
      
      const stateWithRevolution = evaluate([sym('update-game-state-atomic'),
        [sym('quote'), stateWithNextPlayer],
        [sym('quote'), { type: 'toggle-revolution' }]
      ], env);
      
      // Verify immutability - original state unchanged
      expect(initialState[2]).toBe(0);
      expect(initialState[3]).toBe(null);
      expect(initialState[4].isRevolution).toBe(false);
      
      // Verify final state changes
      expect(stateWithRevolution[2]).toBe(1); // player advanced
      expect(stateWithRevolution[3]).toEqual(cards); // field set
      expect(stateWithRevolution[4].isRevolution).toBe(true); // revolution toggled
    });

    test('should provide state inspection utilities with performance optimization', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 6], env);
      
      // Test optimized state inspection functions
      const playerCount = evaluate([sym('get-player-count-fast'), [sym('quote'), gameState]], env);
      const currentPlayer = evaluate([sym('get-current-player-fast'), [sym('quote'), gameState]], env);
      const fieldCards = evaluate([sym('get-field-cards-fast'), [sym('quote'), gameState]], env);
      const isRevolution = evaluate([sym('is-revolution-mode'), [sym('quote'), gameState]], env);
      const consecutivePasses = evaluate([sym('get-consecutive-passes'), [sym('quote'), gameState]], env);
      
      expect(playerCount).toBe(6);
      expect(currentPlayer).toBe(0);
      expect(fieldCards).toBe(null);
      expect(isRevolution).toBe(false);
      expect(consecutivePasses).toBe(0);
    });

    test('should handle complex state transitions with validation', () => {
      const initialState = evaluate([sym('init-game-state-pure'), 4], env);
      
      // Test state transition validation
      const invalidPlayerAction = { type: 'set-current-player', player: 5 }; // Invalid player
      const validPlayerAction = { type: 'set-current-player', player: 2 };
      
      const invalidResult = evaluate([sym('update-game-state-validated'),
        [sym('quote'), initialState],
        [sym('quote'), invalidPlayerAction]
      ], env);
      
      const validResult = evaluate([sym('update-game-state-validated'),
        [sym('quote'), initialState], 
        [sym('quote'), validPlayerAction]
      ], env);
      
      // Invalid transition should fail
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toBe('invalid-player-index');
      
      // Valid transition should succeed  
      expect(validResult.success).toBe(true);
      expect(validResult.newState[2]).toBe(2);
    });

    test('should support state snapshots and rollback operations', () => {
      const initialState = evaluate([sym('init-game-state-pure'), 3], env);
      
      // Create snapshot
      const snapshot = evaluate([sym('create-state-snapshot'), [sym('quote'), initialState]], env);
      
      // Make changes
      const modifiedState = evaluate([sym('update-game-state-atomic'),
        [sym('quote'), initialState],
        [sym('quote'), { type: 'advance-player' }]
      ], env);
      
      // Rollback to snapshot
      const rolledBackState = evaluate([sym('rollback-to-snapshot'), [sym('quote'), snapshot]], env);
      
      expect(modifiedState[2]).toBe(1); // Player advanced
      expect(rolledBackState[2]).toBe(0); // Back to original
      expect(rolledBackState).toEqual(initialState); // Complete rollback
    });
  });

  describe('Pure Lisp Turn Processing System', () => {
    test('should process card play turn', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const cards = [evaluate([sym('create-card'), '♠', '8'], env)];
      const playerAction = { type: "play", cards: cards, player: 0 };
      
      const newState = evaluate([sym('process-turn'), [sym('quote'), gameState], [sym('quote'), playerAction]], env);
      
      expect(newState[0]).toBe("game-state");
      expect(newState[2]).toBe(1); // current player should advance to 1
      expect(newState[3]).toEqual(cards); // field cards should be set
    });

    test('should process pass turn', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const passAction = { type: "pass", player: 0 };
      
      const newState = evaluate([sym('process-turn'), [sym('quote'), gameState], [sym('quote'), passAction]], env);
      
      expect(newState[0]).toBe("game-state");
      expect(newState[2]).toBe(1); // current player should advance to 1
      expect(newState[3]).toBe(null); // field cards should remain null
    });

    test('should advance turn with basic state changes', () => {
      const gameState = evaluate([sym('init-game-state'), 3], env);
      const advancedState = evaluate([sym('advance-turn'), [sym('quote'), gameState]], env);
      
      expect(advancedState[2]).toBe(1); // current player should advance from 0 to 1
    });

    test('should handle consecutive passes and clear field', () => {
      // Start with a game state where 3 players have passed
      const gameState = ["game-state", 4, 0, [evaluate([sym('create-card'), '♥', 'K'], env)], { consecutivePasses: 3 }];
      const passAction = { type: "pass", player: 0 };
      
      const newState = evaluate([sym('process-turn'), [sym('quote'), gameState], [sym('quote'), passAction]], env);
      
      // After 4th consecutive pass, field should be cleared
      expect(newState[3]).toBe(null); // field should be cleared
      expect(newState[2]).toBe(1); // turn should advance
    });

    test('should reset consecutive pass counter on card play', () => {
      // Start with some consecutive passes
      const gameState = ["game-state", 4, 0, null, { consecutivePasses: 2 }];
      const cards = [evaluate([sym('create-card'), '♦', '7'], env)];
      const playAction = { type: "play", cards: cards, player: 0 };
      
      const newState = evaluate([sym('process-turn'), [sym('quote'), gameState], [sym('quote'), playAction]], env);
      
      expect(newState[4]).toEqual({ consecutivePasses: 0 }); // pass counter should reset
      expect(newState[3]).toEqual(cards); // field cards should be set
    });

    test('should track consecutive passes accurately', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env); // Use 4 players to avoid field clearing
      const passAction1 = { type: "pass", player: 0 };
      const passAction2 = { type: "pass", player: 1 };
      
      const state1 = evaluate([sym('process-turn'), [sym('quote'), initialState], [sym('quote'), passAction1]], env);
      const state2 = evaluate([sym('process-turn'), [sym('quote'), state1], [sym('quote'), passAction2]], env);
      
      expect(state2[4]).toEqual({ consecutivePasses: 2 });
    });

    test('should determine when field should be cleared', () => {
      const gameState = ["game-state", 4, 0, [evaluate([sym('create-card'), '♠', 'A'], env)], { consecutivePasses: 3 }];
      
      const shouldClear = evaluate([sym('should-clear-field'), [sym('quote'), gameState]], env);
      expect(shouldClear).toBe(true); // 3 passes in 4-player game means next pass clears field
    });

    test('should handle turn wrapping correctly', () => {
      const gameState = ["game-state", 3, 2, null]; // player 2 in 3-player game
      const passAction = { type: "pass", player: 2 };
      
      const newState = evaluate([sym('process-turn'), [sym('quote'), gameState], [sym('quote'), passAction]], env);
      
      expect(newState[2]).toBe(0); // should wrap to player 0
    });

    test('should validate inputs and provide clear error messages', () => {
      const validState = evaluate([sym('init-game-state'), 4], env);
      
      // Test invalid game state
      expect(() => {
        evaluate([sym('process-turn'), [sym('quote'), ["invalid-state"]], [sym('quote'), { type: "pass" }]], env);
      }).toThrow('process-turn: invalid game state format');
      
      // Test invalid action
      expect(() => {
        evaluate([sym('process-turn'), [sym('quote'), validState], [sym('quote'), {}]], env);
      }).toThrow('process-turn: action must have a type property');
      
      // Test unsupported action type
      expect(() => {
        evaluate([sym('process-turn'), [sym('quote'), validState], [sym('quote'), { type: "invalid-action" }]], env);
      }).toThrow('process-turn: unsupported action type \'invalid-action\'. Supported types: \'play\', \'pass\'');
      
      // Test play action without cards
      expect(() => {
        evaluate([sym('process-turn'), [sym('quote'), validState], [sym('quote'), { type: "play" }]], env);
      }).toThrow('process-turn: play action must include cards array');
    });

    // Phase 7.6 Advanced Turn Processing Tests
    test('should process complex turn with validation and side effects', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 4], env);
      const cards = [evaluate([sym('create-card'), '♠', '8'], env)];
      
      // Test advanced turn processing with validation
      const result = evaluate([sym('process-turn-comprehensive'), 
        [sym('quote'), gameState], 
        [sym('quote'), { type: 'play', cards: cards, player: 0 }]
      ], env);
      
      expect(result.success).toBe(true);
      expect(result.newState[2]).toBe(1); // Player advanced
      expect(result.newState[3]).toEqual(cards); // Field updated
      expect(result.sideEffects).toBeDefined();
      expect(result.sideEffects.cardsPlayed).toEqual(cards);
      expect(result.sideEffects.playerAdvanced).toBe(true);
    });

    test('should handle turn processing with special rules integration', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 4], env);
      const eightCard = [evaluate([sym('create-card'), '♠', '8'], env)];
      
      // Test eight-cut special rule during turn processing
      const result = evaluate([sym('process-turn-with-rules'), 
        [sym('quote'), gameState], 
        [sym('quote'), { type: 'play', cards: eightCard, player: 0 }]
      ], env);
      
      expect(result.success).toBe(true);
      expect(result.specialRules).toContain('eight-cut');
      expect(result.newState[3]).toBe(null); // Field cleared by eight-cut
      expect(result.newState[4].specialRulesActive).toContain('eight-cut');
    });

    test('should manage turn history and rollback capabilities', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 3], env);
      
      // Process multiple turns
      const turn1 = evaluate([sym('process-turn-trackable'), 
        [sym('quote'), gameState], 
        [sym('quote'), { type: 'pass', player: 0 }]
      ], env);
      
      const turn2 = evaluate([sym('process-turn-trackable'), 
        [sym('quote'), turn1.newState], 
        [sym('quote'), { type: 'pass', player: 1 }]
      ], env);
      
      // Rollback to previous turn
      const rolledBack = evaluate([sym('rollback-turn'), [sym('quote'), turn2.newState]], env);
      
      expect(turn1.newState[2]).toBe(1); // First turn advanced to player 1
      expect(turn2.newState[2]).toBe(2); // Second turn advanced to player 2
      expect(rolledBack[2]).toBe(1); // Rolled back to player 1
      expect(rolledBack[4].turnHistory.length).toBe(turn1.newState[4].turnHistory.length);
    });

    test('should process concurrent turn validation with conflict resolution', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 4], env);
      const cards = [evaluate([sym('create-card'), '♥', '9'], env)];
      
      // Test concurrent turn processing
      const turnAction1 = { type: 'play', cards: cards, player: 0, timestamp: Date.now() };
      const turnAction2 = { type: 'pass', player: 0, timestamp: Date.now() + 1 };
      
      const result = evaluate([sym('process-concurrent-turns'), 
        [sym('quote'), gameState], 
        [sym('quote'), [turnAction1, turnAction2]]
      ], env);
      
      expect(result.conflictResolved).toBe(true);
      expect(result.chosenAction.type).toBe('pass'); // Later timestamp wins
      expect(result.rejectedActions.length).toBe(1);
    });

    test('should optimize turn processing with batch operations', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 4], env);
      
      // Test batch turn processing
      const batchActions = [
        { type: 'pass', player: 0 },
        { type: 'pass', player: 1 },
        { type: 'pass', player: 2 }
      ];
      
      const result = evaluate([sym('process-turn-batch'), 
        [sym('quote'), gameState], 
        [sym('quote'), batchActions]
      ], env);
      
      expect(result.success).toBe(true);
      expect(result.newState[2]).toBe(3); // Advanced through all players
      expect(result.newState[4].consecutivePasses).toBe(3);
      expect(result.processedCount).toBe(3);
      expect(result.optimized).toBe(true);
    });

    test('should handle turn timeout and automatic progression', () => {
      const gameState = evaluate([sym('init-game-state-pure'), 4], env);
      
      // Test turn timeout handling
      const timedAction = { 
        type: 'timed-turn', 
        player: 0, 
        timeout: 1000,
        fallbackAction: { type: 'pass' }
      };
      
      const result = evaluate([sym('process-timed-turn'), 
        [sym('quote'), gameState], 
        [sym('quote'), timedAction]
      ], env);
      
      expect(result.timedOut).toBe(false); // Should process immediately in test
      expect(result.newState[2]).toBe(1); // Player advanced
      expect(result.timeoutHandled).toBe(true);
    });
  });

  describe('Pure Lisp Hand Management System', () => {
    test('should deal cards from deck to players', () => {
      const deck = [
        evaluate([sym('create-card'), '♠', '3'], env),
        evaluate([sym('create-card'), '♥', '4'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♣', '6'], env),
        evaluate([sym('create-card'), '♠', '7'], env),
        evaluate([sym('create-card'), '♥', '8'], env)
      ];
      
      const hands = evaluate([sym('deal-cards'), [sym('quote'), deck], 3], env);
      
      expect(Array.isArray(hands)).toBe(true);
      expect(hands.length).toBe(3); // 3 players
      
      // Each player should have 2 cards (6 cards / 3 players)
      hands.forEach(hand => {
        expect(Array.isArray(hand)).toBe(true);
        expect(hand.length).toBe(2);
      });
      
      // All cards should be distributed
      const totalCards = hands.flat().length;
      expect(totalCards).toBe(6);
    });

    test('should handle uneven card distribution', () => {
      const deck = [
        evaluate([sym('create-card'), '♠', '3'], env),
        evaluate([sym('create-card'), '♥', '4'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♣', '6'], env),
        evaluate([sym('create-card'), '♠', '7'], env)
      ];
      
      const hands = evaluate([sym('deal-cards'), [sym('quote'), deck], 3], env);
      
      expect(hands.length).toBe(3);
      
      // Some players may have more cards than others
      const cardCounts = hands.map(hand => hand.length);
      const totalCards = cardCounts.reduce((sum, count) => sum + count, 0);
      expect(totalCards).toBe(5);
      
      // Difference between max and min should be at most 1
      const maxCards = Math.max(...cardCounts);
      const minCards = Math.min(...cardCounts);
      expect(maxCards - minCards).toBeLessThanOrEqual(1);
    });

    test('should add cards to existing hand', () => {
      const existingHand = [
        evaluate([sym('create-card'), '♠', '3'], env),
        evaluate([sym('create-card'), '♥', '4'], env)
      ];
      const newCards = [
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♣', '6'], env)
      ];
      
      const updatedHand = evaluate([sym('add-cards-to-hand'), [sym('quote'), existingHand], [sym('quote'), newCards]], env);
      
      expect(Array.isArray(updatedHand)).toBe(true);
      expect(updatedHand.length).toBe(4);
      
      // Original cards should be preserved
      expect(updatedHand).toContain(existingHand[0]);
      expect(updatedHand).toContain(existingHand[1]);
      
      // New cards should be added
      expect(updatedHand).toContain(newCards[0]);
      expect(updatedHand).toContain(newCards[1]);
    });

    test('should remove cards from hand', () => {
      const hand = [
        evaluate([sym('create-card'), '♠', '3'], env),
        evaluate([sym('create-card'), '♥', '4'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♣', '6'], env)
      ];
      const cardsToRemove = [hand[1], hand[3]]; // Remove ♥4 and ♣6
      
      const updatedHand = evaluate([sym('remove-cards-from-hand'), [sym('quote'), hand], [sym('quote'), cardsToRemove]], env);
      
      expect(Array.isArray(updatedHand)).toBe(true);
      expect(updatedHand.length).toBe(2);
      
      // Remaining cards should be ♠3 and ♦5
      expect(updatedHand).toContain(hand[0]);
      expect(updatedHand).toContain(hand[2]);
      expect(updatedHand).not.toContain(hand[1]);
      expect(updatedHand).not.toContain(hand[3]);
    });

    test('should get cards from player hand in game state', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const playerCards = [
        evaluate([sym('create-card'), '♠', 'K'], env),
        evaluate([sym('create-card'), '♥', 'Q'], env)
      ];
      
      // Set player 0's hand
      const updatedState = evaluate([sym('set-player-hand'), [sym('quote'), gameState], 0, [sym('quote'), playerCards]], env);
      const retrievedCards = evaluate([sym('get-player-hand'), [sym('quote'), updatedState], 0], env);
      
      expect(retrievedCards).toEqual(playerCards);
    });

    test('should handle empty hands gracefully', () => {
      const emptyHand = [];
      const newCards = [evaluate([sym('create-card'), '♠', 'A'], env)];
      
      const updatedHand = evaluate([sym('add-cards-to-hand'), [sym('quote'), emptyHand], [sym('quote'), newCards]], env);
      
      expect(updatedHand).toEqual(newCards);
    });

    test('should validate hand operations with proper error handling', () => {
      // Test invalid deck for deal-cards
      expect(() => {
        evaluate([sym('deal-cards'), [sym('quote'), null], 3], env);
      }).toThrow();
      
      // Test invalid player count
      expect(() => {
        evaluate([sym('deal-cards'), [sym('quote'), []], 0], env);
      }).toThrow();
      
      // Test invalid hand for add-cards-to-hand
      expect(() => {
        evaluate([sym('add-cards-to-hand'), [sym('quote'), null], [sym('quote'), []]], env);
      }).toThrow();
    });

    test('should maintain hand order when adding cards', () => {
      const existingHand = [
        evaluate([sym('create-card'), '♠', '3'], env),
        evaluate([sym('create-card'), '♥', '4'], env)
      ];
      const newCards = [
        evaluate([sym('create-card'), '♦', '5'], env)
      ];
      
      const updatedHand = evaluate([sym('add-cards-to-hand'), [sym('quote'), existingHand], [sym('quote'), newCards]], env);
      
      // New cards should be added at the end
      expect(updatedHand[0]).toEqual(existingHand[0]);
      expect(updatedHand[1]).toEqual(existingHand[1]);
      expect(updatedHand[2]).toEqual(newCards[0]);
    });
  });

  describe('Pure Lisp Special Rules Engine Integration', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      evaluate([sym('load'), 'game-logic.lisp'], env);
    });

    test('should apply eight-cut special rule', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const eightCard = [evaluate([sym('create-card'), '♠', '8'], env)];
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), eightCard], [sym('quote'), gameState]], env);
      
      expect(result.ruleApplied).toBe('eight-cut');
      expect(result.fieldCleared).toBe(true);
      expect(result.nextPlayerGetsControl).toBe(true);
    });

    test('should apply revolution special rule', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const fourCards = [
        evaluate([sym('create-card'), '♠', '5'], env),
        evaluate([sym('create-card'), '♥', '5'], env),
        evaluate([sym('create-card'), '♦', '5'], env),
        evaluate([sym('create-card'), '♣', '5'], env)
      ];
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), fourCards], [sym('quote'), gameState]], env);
      
      expect(result.ruleApplied).toBe('revolution');
      expect(result.cardOrderReversed).toBe(true);
      expect(result.newGameState).toBeDefined();
    });

    test('should apply joker special rule', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const jokerCard = [evaluate([sym('create-joker')], env)];
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), jokerCard], [sym('quote'), gameState]], env);
      
      expect(result.ruleApplied).toBe('joker');
      expect(result.canPlayOnAnything).toBe(true);
    });

    test('should check eleven-back special rule', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const elevenCard = [evaluate([sym('create-card'), '♠', 'J'], env)];
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), elevenCard], [sym('quote'), gameState]], env);
      
      expect(result.ruleApplied).toBe('eleven-back');
      expect(result.skipNextPlayer).toBe(true);
    });

    test('should apply multiple special rules in priority order', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      // Four jokers should trigger both revolution and joker rules
      const fourJokers = [
        evaluate([sym('create-joker')], env),
        evaluate([sym('create-joker')], env),
        evaluate([sym('create-joker')], env),
        evaluate([sym('create-joker')], env)
      ];
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), fourJokers], [sym('quote'), gameState]], env);
      
      expect(result.rulesApplied).toContain('revolution');
      expect(result.rulesApplied).toContain('joker');
      expect(result.cardOrderReversed).toBe(true);
      expect(result.canPlayOnAnything).toBe(true);
    });

    test('should integrate with existing .lisp rule files', () => {
      // Test loading and executing rules from external files
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const testCards = [evaluate([sym('create-card'), '♠', '8'], env)];
      
      // Load special rules from file (if exists)
      const loadResult = evaluate([sym('load-special-rules'), 'special-rules.lisp'], env);
      expect(loadResult).toBe(true);
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), testCards], [sym('quote'), gameState]], env);
      expect(result).toBeDefined();
    });

    test('should handle rule priority and conflicts', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      const conflictCards = [evaluate([sym('create-card'), '♠', '8'], env)]; // Eight-cut card
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), conflictCards], [sym('quote'), gameState]], env);
      
      expect(result.ruleApplied).toBe('eight-cut'); // Should prioritize eight-cut
      expect(result.conflictsResolved).toBe(true);
    });

    test('should support dynamic rule loading', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Define a custom rule dynamically
      const customRule = {
        name: 'custom-test-rule',
        condition: (cards) => cards.length === 3,
        effect: { customEffect: true }
      };
      
      const registerResult = evaluate([sym('register-custom-rule'), [sym('quote'), customRule]], env);
      expect(registerResult).toBe(true);
      
      const threeCards = [
        evaluate([sym('create-card'), '♠', '6'], env),
        evaluate([sym('create-card'), '♥', '6'], env),
        evaluate([sym('create-card'), '♦', '6'], env)
      ];
      
      const result = evaluate([sym('apply-special-rules'), [sym('quote'), threeCards], [sym('quote'), gameState]], env);
      expect(result.ruleApplied).toBe('custom-test-rule');
    });

    test('should validate rule application with error handling', () => {
      const invalidGameState = ["invalid-state"];
      const cards = [evaluate([sym('create-card'), '♠', '8'], env)];
      
      expect(() => {
        evaluate([sym('apply-special-rules'), [sym('quote'), cards], [sym('quote'), invalidGameState]], env);
      }).toThrow('apply-special-rules: invalid game state format');
      
      // Test with invalid cards
      expect(() => {
        evaluate([sym('apply-special-rules'), [sym('quote'), null], [sym('quote'), evaluate([sym('init-game-state'), 4], env)]], env);
      }).toThrow('apply-special-rules: cards must be an array');
    });
  });

  describe('Pure Lisp Game End and Ranking System', () => {
    beforeEach(() => {
      evaluate([sym('load'), 'card-operations.lisp'], env);
      evaluate([sym('load'), 'card-comparison.lisp'], env);
      evaluate([sym('load'), 'game-logic.lisp'], env);
    });

    test('should detect game end when a player has no cards', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Set player hands - player 0 has no cards (finished)
      const stateWithHands = evaluate([sym('set-player-hand'), [sym('quote'), gameState], 0, [sym('quote'), []]], env);
      const stateWithHands2 = evaluate([sym('set-player-hand'), [sym('quote'), stateWithHands], 1, [sym('quote'), [
        evaluate([sym('create-card'), '♠', '5'], env),
        evaluate([sym('create-card'), '♥', '6'], env)
      ]]], env);
      
      const gameEndResult = evaluate([sym('check-game-end'), [sym('quote'), stateWithHands2]], env);
      
      expect(gameEndResult.gameEnded).toBe(true);
      expect(gameEndResult.winner).toBe(0);
      expect(gameEndResult.finishedPlayers).toContain(0);
    });

    test('should not detect game end when all players have cards', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Set all players to have cards
      let currentState = gameState;
      for (let i = 0; i < 4; i++) {
        currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], i, [sym('quote'), [
          evaluate([sym('create-card'), '♠', '5'], env),
          evaluate([sym('create-card'), '♥', '6'], env)
        ]]], env);
      }
      
      const gameEndResult = evaluate([sym('check-game-end'), [sym('quote'), currentState]], env);
      
      expect(gameEndResult.gameEnded).toBe(false);
      expect(gameEndResult.winner).toBe(null);
      expect(gameEndResult.finishedPlayers).toEqual([]);
    });

    test('should calculate ranking based on hand sizes and finish order', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Set different hand sizes for players
      let currentState = gameState;
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 0, [sym('quote'), []]], env); // 1st place - finished
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 1, [sym('quote'), [
        evaluate([sym('create-card'), '♠', '5'], env)
      ]]], env); // 2nd place - 1 card
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 2, [sym('quote'), [
        evaluate([sym('create-card'), '♥', '6'], env),
        evaluate([sym('create-card'), '♦', '7'], env)
      ]]], env); // 3rd place - 2 cards
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 3, [sym('quote'), [
        evaluate([sym('create-card'), '♣', '8'], env),
        evaluate([sym('create-card'), '♠', '9'], env),
        evaluate([sym('create-card'), '♥', '10'], env)
      ]]], env); // 4th place - 3 cards
      
      const ranking = evaluate([sym('calculate-ranking'), [sym('quote'), currentState]], env);
      
      expect(ranking).toHaveLength(4);
      expect(ranking[0]).toEqual({ player: 0, rank: 1, cardCount: 0, title: 'daifugo' }); // 大富豪
      expect(ranking[1]).toEqual({ player: 1, rank: 2, cardCount: 1, title: 'fugo' }); // 富豪
      expect(ranking[2]).toEqual({ player: 2, rank: 3, cardCount: 2, title: 'heimin' }); // 平民
      expect(ranking[3]).toEqual({ player: 3, rank: 4, cardCount: 3, title: 'daihinmin' }); // 大貧民
    });

    test('should handle tied rankings correctly', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Set players with same hand sizes
      let currentState = gameState;
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 0, [sym('quote'), []]], env); // 1st place
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 1, [sym('quote'), [
        evaluate([sym('create-card'), '♠', '5'], env),
        evaluate([sym('create-card'), '♥', '6'], env)
      ]]], env); // Tied for 2nd
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 2, [sym('quote'), [
        evaluate([sym('create-card'), '♦', '7'], env),
        evaluate([sym('create-card'), '♣', '8'], env)
      ]]], env); // Tied for 2nd
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 3, [sym('quote'), [
        evaluate([sym('create-card'), '♠', '9'], env)
      ]]], env); // Better than tied players
      
      const ranking = evaluate([sym('calculate-ranking'), [sym('quote'), currentState]], env);
      
      expect(ranking[0].rank).toBe(1); // Player 0 - 1st place
      expect(ranking[1].rank).toBe(2); // Player 3 - 2nd place (fewer cards)
      expect(ranking[2].rank).toBe(3); // Players 1&2 tied for 3rd
      expect(ranking[3].rank).toBe(3);
    });

    test('should assign social ranks correctly', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      let currentState = gameState;
      for (let i = 0; i < 4; i++) {
        const cardCount = i; // 0, 1, 2, 3 cards respectively
        const cards = [];
        for (let j = 0; j < cardCount; j++) {
          cards.push(evaluate([sym('create-card'), '♠', (j + 3).toString()], env));
        }
        currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], i, [sym('quote'), cards]], env);
      }
      
      const socialRanks = evaluate([sym('assign-social-ranks'), [sym('quote'), currentState]], env);
      
      expect(socialRanks[0]).toBe('daifugo'); // 大富豪 - fewest cards
      expect(socialRanks[1]).toBe('fugo'); // 富豪 
      expect(socialRanks[2]).toBe('heimin'); // 平民
      expect(socialRanks[3]).toBe('daihinmin'); // 大貧民 - most cards
    });

    test('should detect multiple winners in team mode', () => {
      const gameState = evaluate([sym('init-game-state'), 6], env); // 6 players for team mode
      
      // Two players finish simultaneously (team victory)
      let currentState = gameState;
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 0, [sym('quote'), []]], env);
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 1, [sym('quote'), []]], env);
      for (let i = 2; i < 6; i++) {
        currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], i, [sym('quote'), [
          evaluate([sym('create-card'), '♠', '5'], env)
        ]]], env);
      }
      
      const gameEndResult = evaluate([sym('check-game-end'), [sym('quote'), currentState]], env);
      
      expect(gameEndResult.gameEnded).toBe(true);
      expect(gameEndResult.multipleWinners).toBe(true);
      expect(gameEndResult.finishedPlayers).toContain(0);
      expect(gameEndResult.finishedPlayers).toContain(1);
    });

    test('should track finish order across multiple rounds', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Simulate finish order tracking
      let currentState = gameState;
      
      // Player 2 finishes first
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 2, [sym('quote'), []]], env);
      const firstFinish = evaluate([sym('update-finish-order'), [sym('quote'), currentState], 2], env);
      
      // Player 0 finishes second
      let secondState = evaluate([sym('set-player-hand'), [sym('quote'), firstFinish], 0, [sym('quote'), []]], env);
      const secondFinish = evaluate([sym('update-finish-order'), [sym('quote'), secondState], 0], env);
      
      const finishOrder = evaluate([sym('get-finish-order'), [sym('quote'), secondFinish]], env);
      
      expect(finishOrder).toEqual([2, 0]); // Player 2 first, Player 0 second
    });

    test('should determine next game setup based on rankings', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Set up a completed game state with rankings
      let currentState = gameState;
      for (let i = 0; i < 4; i++) {
        currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], i, [sym('quote'), []]], env);
      }
      
      const ranking = evaluate([sym('calculate-ranking'), [sym('quote'), currentState]], env);
      const nextGameSetup = evaluate([sym('prepare-next-game'), [sym('quote'), ranking]], env);
      
      expect(nextGameSetup.seatingOrder).toBeDefined();
      expect(nextGameSetup.cardExchangeRules).toBeDefined();
      expect(nextGameSetup.specialPrivileges).toBeDefined();
      expect(nextGameSetup.daifugo).toBe(ranking[0].player);
      expect(nextGameSetup.daihinmin).toBe(ranking[ranking.length - 1].player);
    });

    test('should validate game end conditions with error handling', () => {
      const invalidGameState = ["invalid-state"];
      
      expect(() => {
        evaluate([sym('check-game-end'), [sym('quote'), invalidGameState]], env);
      }).toThrow('check-game-end: invalid game state format');
      
      // Test with valid state but invalid player data
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      expect(() => {
        evaluate([sym('calculate-ranking'), [sym('quote'), null]], env);
      }).toThrow('calculate-ranking: gameState must be provided');
    });

    test('should support custom victory conditions', () => {
      const gameState = evaluate([sym('init-game-state'), 4], env);
      
      // Custom victory condition: game ends when total cards < threshold
      const customCondition = {
        type: 'total-cards-threshold',
        threshold: 5
      };
      
      let currentState = gameState;
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 0, [sym('quote'), [
        evaluate([sym('create-card'), '♠', '5'], env)
      ]]], env);
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 1, [sym('quote'), [
        evaluate([sym('create-card'), '♥', '6'], env)
      ]]], env);
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 2, [sym('quote'), []]], env);
      currentState = evaluate([sym('set-player-hand'), [sym('quote'), currentState], 3, [sym('quote'), []]], env);
      
      const customGameEnd = evaluate([sym('check-custom-game-end'), [sym('quote'), currentState], [sym('quote'), customCondition]], env);
      
      expect(customGameEnd.gameEnded).toBe(true);
      expect(customGameEnd.condition).toBe('total-cards-threshold');
    });
  });
});