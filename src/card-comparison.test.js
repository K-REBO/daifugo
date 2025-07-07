const { evaluate, createEnvironment, sym } = require('./evaluator');
const { parse } = require('./parser');

describe('Lisp Card Comparison System', () => {
  let env;
  
  beforeEach(() => {
    env = createEnvironment();
  });

  // Phase 7.3: Card comparison tests (RED phase)
  describe('Single card comparison', () => {
    test('compare-cards should handle basic card ordering', () => {
      const card3 = { suit: '♠', rank: '3' };
      const card4 = { suit: '♥', rank: '4' };
      const cardA = { suit: '♦', rank: 'A' };
      const card2 = { suit: '♣', rank: '2' };
      
      // Normal ordering: 3 < 4 < ... < A < 2
      expect(evaluate([sym('compare-cards'), [sym('quote'), card3], [sym('quote'), card4]], env)).toBe(-1);
      expect(evaluate([sym('compare-cards'), [sym('quote'), card4], [sym('quote'), card3]], env)).toBe(1);
      expect(evaluate([sym('compare-cards'), [sym('quote'), card3], [sym('quote'), card3]], env)).toBe(0);
      expect(evaluate([sym('compare-cards'), [sym('quote'), cardA], [sym('quote'), card2]], env)).toBe(-1);
    });

    test('compare-cards should handle jokers as strongest', () => {
      const joker = { suit: null, rank: 'JOKER' };
      const card2 = { suit: '♠', rank: '2' };
      const cardA = { suit: '♥', rank: 'A' };
      
      expect(evaluate([sym('compare-cards'), [sym('quote'), card2], [sym('quote'), joker]], env)).toBe(-1);
      expect(evaluate([sym('compare-cards'), [sym('quote'), joker], [sym('quote'), card2]], env)).toBe(1);
      expect(evaluate([sym('compare-cards'), [sym('quote'), cardA], [sym('quote'), joker]], env)).toBe(-1);
      expect(evaluate([sym('compare-cards'), [sym('quote'), joker], [sym('quote'), joker]], env)).toBe(0);
    });

    test('compare-cards should handle revolution mode', () => {
      const card3 = { suit: '♠', rank: '3' };
      const card4 = { suit: '♥', rank: '4' };
      const cardA = { suit: '♦', rank: 'A' };
      const card2 = { suit: '♣', rank: '2' };
      const joker = { suit: null, rank: 'JOKER' };
      
      // Revolution ordering: JOKER < 2 < A < ... < 4 < 3
      expect(evaluate([sym('compare-cards-revolution'), [sym('quote'), card4], [sym('quote'), card3]], env)).toBe(-1);
      expect(evaluate([sym('compare-cards-revolution'), [sym('quote'), card3], [sym('quote'), card4]], env)).toBe(1);
      expect(evaluate([sym('compare-cards-revolution'), [sym('quote'), card2], [sym('quote'), cardA]], env)).toBe(-1);
      expect(evaluate([sym('compare-cards-revolution'), [sym('quote'), joker], [sym('quote'), card2]], env)).toBe(-1);
    });
  });

  describe('Multiple cards comparison', () => {
    test('is-stronger-than should compare card hands correctly', () => {
      const hand1 = [{ suit: '♠', rank: '5' }];
      const hand2 = [{ suit: '♥', rank: '7' }];
      const hand3 = [{ suit: '♦', rank: '3' }];
      
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), hand2], [sym('quote'), hand1]], env)).toBe(true);
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), hand1], [sym('quote'), hand2]], env)).toBe(false);
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), hand1], [sym('quote'), hand3]], env)).toBe(true);
    });

    test('is-stronger-than should handle pairs correctly', () => {
      const pair5 = [{ suit: '♠', rank: '5' }, { suit: '♥', rank: '5' }];
      const pair7 = [{ suit: '♦', rank: '7' }, { suit: '♣', rank: '7' }];
      const singleA = [{ suit: '♠', rank: 'A' }];
      
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), pair7], [sym('quote'), pair5]], env)).toBe(true);
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), pair5], [sym('quote'), pair7]], env)).toBe(false);
      
      // Pairs cannot be compared to singles
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), singleA], [sym('quote'), pair5]], env)).toBe(false);
      expect(evaluate([sym('is-stronger-than'), [sym('quote'), pair5], [sym('quote'), singleA]], env)).toBe(false);
    });

    test('is-stronger-than should handle revolution mode', () => {
      const hand1 = [{ suit: '♠', rank: '5' }];
      const hand2 = [{ suit: '♥', rank: '3' }];
      
      // In revolution: 3 > 5
      expect(evaluate([sym('is-stronger-than-revolution'), [sym('quote'), hand2], [sym('quote'), hand1]], env)).toBe(true);
      expect(evaluate([sym('is-stronger-than-revolution'), [sym('quote'), hand1], [sym('quote'), hand2]], env)).toBe(false);
    });
  });

  describe('Game state aware comparison', () => {
    test('compare-with-game-state should consider revolution status', () => {
      const normalState = { isRevolution: false };
      const revolutionState = { isRevolution: true };
      const hand1 = [{ suit: '♠', rank: '5' }];
      const hand2 = [{ suit: '♥', rank: '3' }];
      
      // Normal mode: 5 > 3
      expect(evaluate([sym('compare-with-game-state'), 
        [sym('quote'), hand1], [sym('quote'), hand2], [sym('quote'), normalState]], env)).toBe(true);
      
      // Revolution mode: 3 > 5
      expect(evaluate([sym('compare-with-game-state'), 
        [sym('quote'), hand2], [sym('quote'), hand1], [sym('quote'), revolutionState]], env)).toBe(true);
    });

    test('get-card-strength should return numeric strength values', () => {
      const card3 = { suit: '♠', rank: '3' };
      const cardA = { suit: '♥', rank: 'A' };
      const joker = { suit: null, rank: 'JOKER' };
      const normalState = { isRevolution: false };
      const revolutionState = { isRevolution: true };
      
      // Normal mode strengths
      const strength3Normal = evaluate([sym('get-card-strength'), [sym('quote'), card3], [sym('quote'), normalState]], env);
      const strengthANormal = evaluate([sym('get-card-strength'), [sym('quote'), cardA], [sym('quote'), normalState]], env);
      const strengthJokerNormal = evaluate([sym('get-card-strength'), [sym('quote'), joker], [sym('quote'), normalState]], env);
      
      expect(strength3Normal).toBeLessThan(strengthANormal);
      expect(strengthANormal).toBeLessThan(strengthJokerNormal);
      
      // Revolution mode strengths (reversed)
      const strength3Revolution = evaluate([sym('get-card-strength'), [sym('quote'), card3], [sym('quote'), revolutionState]], env);
      const strengthARevolution = evaluate([sym('get-card-strength'), [sym('quote'), cardA], [sym('quote'), revolutionState]], env);
      
      expect(strength3Revolution).toBeGreaterThan(strengthARevolution);
    });
  });

  describe('Hand type validation', () => {
    test('validate-hand-type should identify hand types correctly', () => {
      const single = [{ suit: '♠', rank: '5' }];
      const pair = [{ suit: '♠', rank: '5' }, { suit: '♥', rank: '5' }];
      const triple = [{ suit: '♠', rank: '5' }, { suit: '♥', rank: '5' }, { suit: '♦', rank: '5' }];
      const quad = [{ suit: '♠', rank: '5' }, { suit: '♥', rank: '5' }, { suit: '♦', rank: '5' }, { suit: '♣', rank: '5' }];
      const invalid = [{ suit: '♠', rank: '5' }, { suit: '♥', rank: '7' }];
      
      expect(evaluate([sym('validate-hand-type'), [sym('quote'), single]], env)).toEqual({ type: 'single', rank: '5', count: 1 });
      expect(evaluate([sym('validate-hand-type'), [sym('quote'), pair]], env)).toEqual({ type: 'pair', rank: '5', count: 2 });
      expect(evaluate([sym('validate-hand-type'), [sym('quote'), triple]], env)).toEqual({ type: 'triple', rank: '5', count: 3 });
      expect(evaluate([sym('validate-hand-type'), [sym('quote'), quad]], env)).toEqual({ type: 'quad', rank: '5', count: 4 });
      expect(evaluate([sym('validate-hand-type'), [sym('quote'), invalid]], env)).toEqual({ type: 'invalid', rank: null, count: 0 });
    });

    test('can-play-on-field should validate plays against field', () => {
      const fieldSingle = [{ suit: '♠', rank: '5' }];
      const fieldPair = [{ suit: '♠', rank: '7' }, { suit: '♥', rank: '7' }];
      const playSingle6 = [{ suit: '♦', rank: '6' }];
      const playPair8 = [{ suit: '♦', rank: '8' }, { suit: '♣', rank: '8' }];
      const playPair6 = [{ suit: '♦', rank: '6' }, { suit: '♣', rank: '6' }];
      
      // Can play stronger single on single
      expect(evaluate([sym('can-play-on-field'), [sym('quote'), playSingle6], [sym('quote'), fieldSingle]], env)).toBe(true);
      
      // Can play stronger pair on pair
      expect(evaluate([sym('can-play-on-field'), [sym('quote'), playPair8], [sym('quote'), fieldPair]], env)).toBe(true);
      
      // Cannot play weaker pair on pair
      expect(evaluate([sym('can-play-on-field'), [sym('quote'), playPair6], [sym('quote'), fieldPair]], env)).toBe(false);
      
      // Cannot play single on pair
      expect(evaluate([sym('can-play-on-field'), [sym('quote'), playSingle6], [sym('quote'), fieldPair]], env)).toBe(false);
      
      // Cannot play pair on single
      expect(evaluate([sym('can-play-on-field'), [sym('quote'), playPair8], [sym('quote'), fieldSingle]], env)).toBe(false);
    });
  });
});