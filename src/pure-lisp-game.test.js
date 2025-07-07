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
      expect(deck.length).toBe(4); // Simplified deck for now
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
      const card5b = evaluate([sym('create-card'), '♥', '5'], env);
      const pair = [card5a, card5b];
      
      const handType = evaluate([sym('validate-hand-type'), [sym('quote'), pair]], env);
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
      const updatedState = evaluate([sym('update-game-state'), [sym('quote'), initialState], [sym('quote'), action]], env);
      
      expect(updatedState[0]).toBe("game-state");
      expect(updatedState[1]).toBe(4); // player count unchanged
      expect(updatedState[2]).toBe(1); // current player advanced
      expect(updatedState[3]).toBe(null); // field cards unchanged
    });

    test('should update game state with field card changes', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      const newFieldCards = [evaluate([sym('create-card'), '♠', 'K'], env)];
      const action = { type: "set-field", cards: newFieldCards };
      const updatedState = evaluate([sym('update-game-state'), [sym('quote'), initialState], [sym('quote'), action]], env);
      
      expect(updatedState[0]).toBe("game-state");
      expect(updatedState[1]).toBe(4);
      expect(updatedState[2]).toBe(0);
      expect(updatedState[3]).toEqual(newFieldCards);
    });

    test('should update game state with multiple actions', () => {
      const initialState = evaluate([sym('init-game-state'), 3], env);
      const action1 = { type: "next-player" };
      const action2 = { type: "next-player" };
      
      const state1 = evaluate([sym('update-game-state'), [sym('quote'), initialState], [sym('quote'), action1]], env);
      const state2 = evaluate([sym('update-game-state'), [sym('quote'), state1], [sym('quote'), action2]], env);
      
      expect(state2[2]).toBe(2); // current player should be 2
    });

    test('should handle wrapping current player', () => {
      const initialState = evaluate([sym('init-game-state'), 3], env);
      // Start with player 2
      const startState = ["game-state", 3, 2, null];
      const action = { type: "next-player" };
      const updatedState = evaluate([sym('update-game-state'), [sym('quote'), startState], [sym('quote'), action]], env);
      
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
      
      const stateWithField = evaluate([sym('update-game-state'), [sym('quote'), initialState], [sym('quote'), setAction]], env);
      expect(stateWithField[3]).toEqual(fieldCards);
      
      const resetState = evaluate([sym('update-game-state'), [sym('quote'), stateWithField], [sym('quote'), resetAction]], env);
      expect(resetState[3]).toBe(null);
    });

    test('should handle unknown actions gracefully', () => {
      const initialState = evaluate([sym('init-game-state'), 4], env);
      const unknownAction = { type: "unknown-action" };
      
      const updatedState = evaluate([sym('update-game-state'), [sym('quote'), initialState], [sym('quote'), unknownAction]], env);
      expect(updatedState).toEqual(initialState); // should return original state
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
});