const { evaluate, createEnvironment, sym } = require('./evaluator');
const { parse } = require('./parser');

describe('Lisp Card Operations', () => {
  let env;
  
  beforeEach(() => {
    env = createEnvironment();
  });

  // Phase 7.2: Card operations tests (RED phase)
  describe('Deck creation and manipulation', () => {
    test('create-deck should generate standard 54-card deck', () => {
      const result = evaluate([sym('create-deck')], env);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(54); // 52 regular cards + 2 jokers
      
      // Check for jokers
      const jokers = result.filter(card => card.rank === 'JOKER');
      expect(jokers.length).toBe(2);
      
      // Check for all suits
      const suits = ['♠', '♥', '♦', '♣'];
      const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
      
      suits.forEach(suit => {
        ranks.forEach(rank => {
          const found = result.find(card => card.suit === suit && card.rank === rank);
          expect(found).toBeDefined();
        });
      });
    });

    test('shuffle-deck should randomize card order', () => {
      const originalDeck = evaluate([sym('create-deck')], env);
      const shuffledDeck1 = evaluate([sym('shuffle-deck'), [sym('quote'), originalDeck]], env);
      const shuffledDeck2 = evaluate([sym('shuffle-deck'), [sym('quote'), originalDeck]], env);
      
      expect(shuffledDeck1.length).toBe(54);
      expect(shuffledDeck2.length).toBe(54);
      
      // Extremely unlikely that two shuffles produce identical order
      const identical = shuffledDeck1.every((card, i) => 
        card.suit === shuffledDeck2[i].suit && card.rank === shuffledDeck2[i].rank
      );
      expect(identical).toBe(false);
    });

    test('create-card should generate valid card object', () => {
      const card = evaluate([sym('create-card'), '♠', '8'], env);
      expect(card).toEqual(['card', '♠', '8']);
    });

    test('create-joker should generate joker card', () => {
      const joker = evaluate([sym('create-joker')], env);
      expect(joker).toEqual(['card', null, 'JOKER']);
    });
  });

  describe('Card property access', () => {
    test('card-suit should extract suit from card', () => {
      const card = { suit: '♦', rank: 'Q' };
      const suit = evaluate([sym('card-suit'), [sym('quote'), card]], env);
      expect(suit).toBe('♦');
    });

    test('card-rank should extract rank from card', () => {
      const card = { suit: '♣', rank: 'A' };
      const rank = evaluate([sym('card-rank'), [sym('quote'), card]], env);
      expect(rank).toBe('A');
    });

    test('is-joker should identify joker cards', () => {
      const joker = { suit: null, rank: 'JOKER' };
      const regularCard = { suit: '♠', rank: 'K' };
      
      expect(evaluate([sym('is-joker'), [sym('quote'), joker]], env)).toBe(true);
      expect(evaluate([sym('is-joker'), [sym('quote'), regularCard]], env)).toBe(false);
    });
  });

  describe('Card validation', () => {
    test('valid-card should validate card structure', () => {
      const validCard = { suit: '♥', rank: '7' };
      const invalidCard1 = { suit: '♥' }; // missing rank
      const invalidCard2 = { rank: '7' }; // missing suit
      const joker = { suit: null, rank: 'JOKER' };
      
      expect(evaluate([sym('valid-card'), [sym('quote'), validCard]], env)).toBe(true);
      expect(evaluate([sym('valid-card'), [sym('quote'), invalidCard1]], env)).toBe(false);
      expect(evaluate([sym('valid-card'), [sym('quote'), invalidCard2]], env)).toBe(false);
      expect(evaluate([sym('valid-card'), [sym('quote'), joker]], env)).toBe(true);
    });

    test('valid-suit should validate suit values', () => {
      expect(evaluate([sym('valid-suit'), '♠'], env)).toBe(true);
      expect(evaluate([sym('valid-suit'), '♥'], env)).toBe(true);
      expect(evaluate([sym('valid-suit'), '♦'], env)).toBe(true);
      expect(evaluate([sym('valid-suit'), '♣'], env)).toBe(true);
      expect(evaluate([sym('valid-suit'), null], env)).toBe(true); // for jokers
      expect(evaluate([sym('valid-suit'), 'invalid'], env)).toBe(false);
    });

    test('valid-rank should validate rank values', () => {
      const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'JOKER'];
      
      validRanks.forEach(rank => {
        expect(evaluate([sym('valid-rank'), rank], env)).toBe(true);
      });
      
      expect(evaluate([sym('valid-rank'), 'invalid'], env)).toBe(false);
      expect(evaluate([sym('valid-rank'), '1'], env)).toBe(false);
    });
  });
});