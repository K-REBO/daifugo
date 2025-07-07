class Symbol {
  constructor(name) {
    this.name = name;
  }
  
  toString() {
    return this.name;
  }
}

function sym(name) {
  return new Symbol(name);
}

class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.bindings = new Map();
  }

  define(name, value) {
    this.bindings.set(name, value);
  }

  lookup(name) {
    if (this.bindings.has(name)) {
      return this.bindings.get(name);
    }
    if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  extend() {
    return new Environment(this);
  }
}

function createEnvironment() {
  const env = new Environment();
  
  // Built-in arithmetic functions
  env.define('+', (...args) => args.reduce((a, b) => a + b, 0));
  env.define('*', (...args) => args.reduce((a, b) => a * b, 1));
  env.define('-', (a, b) => b === undefined ? -a : a - b);
  env.define('/', (a, b) => a / b);
  
  // Built-in comparison functions
  env.define('eq', (a, b) => a === b);
  env.define('>', (a, b) => a > b);
  env.define('<', (a, b) => a < b);
  env.define('>=', (a, b) => a >= b);
  env.define('<=', (a, b) => a <= b);
  
  // Built-in logical functions
  env.define('and', (...args) => args.every(Boolean));
  env.define('or', (...args) => args.some(Boolean));
  env.define('not', (a) => !a);
  
  // Built-in list functions
  env.define('every', (fn, list) => {
    if (!Array.isArray(list)) return false;
    return list.every(item => evaluate([fn, item], env));
  });
  
  env.define('get', (obj, key) => {
    if (typeof obj === 'object' && obj !== null) {
      const keyName = key instanceof Symbol ? key.name : key;
      return obj[keyName];
    }
    return null;
  });

  // Phase 7.1: Enhanced list operations (Refactored)
  const applyFunction = (fn, args, env) => {
    if (typeof fn === 'function') {
      return fn(...args);
    } else {
      return evaluate([fn, ...args], env);
    }
  };

  env.define('map', (fn, list) => {
    if (!Array.isArray(list)) {
      throw new Error('map: second argument must be a list');
    }
    return list.map(item => applyFunction(fn, [item], env));
  });

  env.define('filter', (fn, list) => {
    if (!Array.isArray(list)) {
      throw new Error('filter: second argument must be a list');
    }
    return list.filter(item => applyFunction(fn, [item], env));
  });

  env.define('reduce', (fn, initial, list) => {
    if (!Array.isArray(list)) {
      throw new Error('reduce: third argument must be a list');
    }
    return list.reduce((acc, item) => applyFunction(fn, [acc, item], env), initial);
  });

  env.define('length', (list) => {
    if (!Array.isArray(list)) {
      throw new Error('length: argument must be a list');
    }
    return list.length;
  });

  env.define('nth', (index, list) => {
    if (!Array.isArray(list)) {
      throw new Error('nth: second argument must be a list');
    }
    if (typeof index !== 'number' || index < 0) {
      throw new Error('nth: first argument must be a non-negative number');
    }
    return index < list.length ? list[index] : null;
  });

  env.define('append', (list1, list2) => {
    if (!Array.isArray(list1)) {
      throw new Error('append: first argument must be a list');
    }
    if (!Array.isArray(list2)) {
      throw new Error('append: second argument must be a list');
    }
    return [...list1, ...list2];
  });

  // Mathematical modulo operation
  env.define('%', (a, b) => a % b);

  // Phase 7.2: Card operations (Refactored)
  
  // Constants for card validation (shared across functions)
  const VALID_SUITS = Object.freeze(['♠', '♥', '♦', '♣', null]);
  const VALID_RANKS = Object.freeze(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'JOKER']);
  const REGULAR_SUITS = Object.freeze(['♠', '♥', '♦', '♣']);
  const REGULAR_RANKS = Object.freeze(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']);

  // Helper function for card validation
  const validateCard = (card, functionName) => {
    if (typeof card !== 'object' || card === null) {
      throw new Error(`${functionName}: argument must be a card object`);
    }
  };

  // Fisher-Yates shuffle algorithm for optimal randomization
  const fisherYatesShuffle = (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  env.define('create-deck', () => {
    const deck = [];
    
    // Create regular cards using pre-defined constants
    REGULAR_SUITS.forEach(suit => {
      REGULAR_RANKS.forEach(rank => {
        deck.push(Object.freeze({ suit, rank })); // Immutable card objects
      });
    });
    
    // Add immutable jokers
    deck.push(Object.freeze({ suit: null, rank: 'JOKER' }));
    deck.push(Object.freeze({ suit: null, rank: 'JOKER' }));
    
    return Object.freeze(deck); // Immutable deck
  });

  env.define('shuffle-deck', (deck) => {
    if (!Array.isArray(deck)) {
      throw new Error('shuffle-deck: argument must be a deck (array of cards)');
    }
    return fisherYatesShuffle(deck);
  });

  env.define('create-card', (suit, rank) => {
    if (!VALID_SUITS.includes(suit)) {
      throw new Error(`create-card: invalid suit '${suit}'`);
    }
    if (!VALID_RANKS.includes(rank)) {
      throw new Error(`create-card: invalid rank '${rank}'`);
    }
    return Object.freeze({ suit, rank });
  });

  env.define('create-joker', () => {
    return Object.freeze({ suit: null, rank: 'JOKER' });
  });

  env.define('card-suit', (card) => {
    validateCard(card, 'card-suit');
    return card.suit;
  });

  env.define('card-rank', (card) => {
    validateCard(card, 'card-rank');
    return card.rank;
  });

  env.define('is-joker', (card) => {
    if (typeof card !== 'object' || card === null) {
      return false;
    }
    return card.rank === 'JOKER';
  });

  env.define('valid-card', (card) => {
    if (typeof card !== 'object' || card === null) {
      return false;
    }
    return VALID_SUITS.includes(card.suit) && VALID_RANKS.includes(card.rank);
  });

  env.define('valid-suit', (suit) => {
    return VALID_SUITS.includes(suit);
  });

  env.define('valid-rank', (rank) => {
    return VALID_RANKS.includes(rank);
  });

  // Phase 7.3: Card comparison system (Refactored)
  
  // Card strength constants for normal and revolution modes (optimized)
  const CARD_STRENGTH_MAP = Object.freeze({
    normal: Object.freeze({
      '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5, '9': 6, '10': 7,
      'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12, 'JOKER': 13
    }),
    revolution: Object.freeze({
      'JOKER': 0, '2': 1, 'A': 2, 'K': 3, 'Q': 4, 'J': 5, '10': 6,
      '9': 7, '8': 8, '7': 9, '6': 10, '5': 11, '4': 12, '3': 13
    })
  });

  // Optimized card strength lookup (O(1) instead of O(n))
  const getCardStrength = (card, isRevolution = false) => {
    if (!card || typeof card !== 'object' || !card.rank) {
      throw new Error('getCardStrength: invalid card object');
    }
    
    const strengthMap = isRevolution ? CARD_STRENGTH_MAP.revolution : CARD_STRENGTH_MAP.normal;
    const strength = strengthMap[card.rank];
    
    if (strength === undefined) {
      throw new Error(`getCardStrength: unknown card rank '${card.rank}'`);
    }
    
    return strength;
  };

  // Hand type constants for performance
  const HAND_TYPES = Object.freeze({
    SINGLE: 'single',
    PAIR: 'pair', 
    TRIPLE: 'triple',
    QUAD: 'quad',
    INVALID: 'invalid'
  });

  // Optimized hand type validation
  const validateHandTypeOptimized = (cards) => {
    if (!Array.isArray(cards) || cards.length === 0 || cards.length > 4) {
      return { type: HAND_TYPES.INVALID, rank: null, count: 0 };
    }
    
    // Check if all cards have the same rank (early exit optimization)
    const firstRank = cards[0]?.rank;
    if (!firstRank) {
      return { type: HAND_TYPES.INVALID, rank: null, count: 0 };
    }
    
    for (let i = 1; i < cards.length; i++) {
      if (cards[i]?.rank !== firstRank) {
        return { type: HAND_TYPES.INVALID, rank: null, count: 0 };
      }
    }
    
    const count = cards.length;
    const typeMap = {
      1: HAND_TYPES.SINGLE,
      2: HAND_TYPES.PAIR,
      3: HAND_TYPES.TRIPLE,
      4: HAND_TYPES.QUAD
    };
    
    const type = typeMap[count] || HAND_TYPES.INVALID;
    return {
      type,
      rank: type !== HAND_TYPES.INVALID ? firstRank : null,
      count: type !== HAND_TYPES.INVALID ? count : 0
    };
  };

  env.define('compare-cards', (card1, card2) => {
    validateCard(card1, 'compare-cards');
    validateCard(card2, 'compare-cards');
    
    const strength1 = getCardStrength(card1, false);
    const strength2 = getCardStrength(card2, false);
    
    if (strength1 < strength2) return -1;
    if (strength1 > strength2) return 1;
    return 0;
  });

  env.define('compare-cards-revolution', (card1, card2) => {
    validateCard(card1, 'compare-cards-revolution');
    validateCard(card2, 'compare-cards-revolution');
    
    const strength1 = getCardStrength(card1, true);
    const strength2 = getCardStrength(card2, true);
    
    if (strength1 < strength2) return -1;
    if (strength1 > strength2) return 1;
    return 0;
  });

  env.define('get-card-strength', (card, gameState) => {
    validateCard(card, 'get-card-strength');
    if (typeof gameState !== 'object' || gameState === null) {
      throw new Error('get-card-strength: gameState must be an object');
    }
    
    return getCardStrength(card, gameState.isRevolution || false);
  });

  env.define('validate-hand-type', (cards) => {
    return validateHandTypeOptimized(cards);
  });

  env.define('is-stronger-than', (hand1, hand2) => {
    if (!Array.isArray(hand1) || !Array.isArray(hand2)) {
      return false;
    }
    
    const validateHandType = env.lookup('validate-hand-type');
    const type1 = validateHandType(hand1);
    const type2 = validateHandType(hand2);
    
    // Both hands must be valid and same type
    if (type1.type === 'invalid' || type2.type === 'invalid' || type1.type !== type2.type) {
      return false;
    }
    
    // Compare the card strengths
    const strength1 = getCardStrength({ rank: type1.rank }, false);
    const strength2 = getCardStrength({ rank: type2.rank }, false);
    
    return strength1 > strength2;
  });

  env.define('is-stronger-than-revolution', (hand1, hand2) => {
    if (!Array.isArray(hand1) || !Array.isArray(hand2)) {
      return false;
    }
    
    const validateHandType = env.lookup('validate-hand-type');
    const type1 = validateHandType(hand1);
    const type2 = validateHandType(hand2);
    
    // Both hands must be valid and same type
    if (type1.type === 'invalid' || type2.type === 'invalid' || type1.type !== type2.type) {
      return false;
    }
    
    // Compare the card strengths in revolution mode
    const strength1 = getCardStrength({ rank: type1.rank }, true);
    const strength2 = getCardStrength({ rank: type2.rank }, true);
    
    return strength1 > strength2;
  });

  env.define('compare-with-game-state', (hand1, hand2, gameState) => {
    if (typeof gameState !== 'object' || gameState === null) {
      throw new Error('compare-with-game-state: gameState must be an object');
    }
    
    if (gameState.isRevolution) {
      const isStrongerRevolution = env.lookup('is-stronger-than-revolution');
      return isStrongerRevolution(hand1, hand2);
    } else {
      const isStronger = env.lookup('is-stronger-than');
      return isStronger(hand1, hand2);
    }
  });

  env.define('can-play-on-field', (playCards, fieldCards) => {
    if (!Array.isArray(playCards) || !Array.isArray(fieldCards)) {
      return false;
    }
    
    const validateHandType = env.lookup('validate-hand-type');
    
    // Empty field means any valid play is allowed
    if (fieldCards.length === 0) {
      const playType = validateHandType(playCards);
      return playType.type !== 'invalid';
    }
    
    const playType = validateHandType(playCards);
    const fieldType = validateHandType(fieldCards);
    
    // Must be same type and stronger
    if (playType.type === 'invalid' || fieldType.type === 'invalid' || playType.type !== fieldType.type) {
      return false;
    }
    
    const isStronger = env.lookup('is-stronger-than');
    return isStronger(playCards, fieldCards);
  });

  // Unified comparison function with enhanced features
  env.define('compare-hands-unified', (hand1, hand2, gameState = null) => {
    if (!Array.isArray(hand1) || !Array.isArray(hand2)) {
      return { canCompare: false, stronger: null, reason: 'Invalid hand arrays' };
    }
    
    const type1 = validateHandTypeOptimized(hand1);
    const type2 = validateHandTypeOptimized(hand2);
    
    // Check if hands are valid
    if (type1.type === HAND_TYPES.INVALID) {
      return { canCompare: false, stronger: null, reason: 'Hand 1 is invalid' };
    }
    if (type2.type === HAND_TYPES.INVALID) {
      return { canCompare: false, stronger: null, reason: 'Hand 2 is invalid' };
    }
    
    // Check if hands are same type
    if (type1.type !== type2.type) {
      return { canCompare: false, stronger: null, reason: 'Different hand types' };
    }
    
    // Compare card strengths
    const isRevolution = gameState?.isRevolution || false;
    const strength1 = getCardStrength({ rank: type1.rank }, isRevolution);
    const strength2 = getCardStrength({ rank: type2.rank }, isRevolution);
    
    if (strength1 === strength2) {
      return { canCompare: true, stronger: 'tie', reason: 'Equal strength' };
    }
    
    return {
      canCompare: true,
      stronger: strength1 > strength2 ? 'hand1' : 'hand2',
      reason: `${type1.type} comparison`,
      strength1,
      strength2
    };
  });
  
  return env;
}

function evaluate(expr, env) {
  // Self-evaluating expressions
  if (typeof expr === 'number' || typeof expr === 'boolean') {
    return expr;
  }
  
  // null is self-evaluating
  if (expr === null) {
    return null;
  }
  
  // Strings are self-evaluating
  if (typeof expr === 'string') {
    return expr;
  }
  
  // Objects are self-evaluating (for game state data)
  if (typeof expr === 'object' && expr !== null && !Array.isArray(expr) && !(expr instanceof Symbol)) {
    return expr;
  }
  
  // Symbol (variable) lookup
  if (expr instanceof Symbol) {
    return env.lookup(expr.name);
  }
  
  // List evaluation
  if (Array.isArray(expr)) {
    if (expr.length === 0) {
      return [];
    }
    
    const [first, ...rest] = expr;
    
    // Special forms
    if ((first instanceof Symbol && first.name === 'if') || first === 'if') {
      const [, condition, thenExpr, elseExpr] = expr;
      const conditionValue = evaluate(condition, env);
      return conditionValue ? evaluate(thenExpr, env) : evaluate(elseExpr, env);
    }
    
    if ((first instanceof Symbol && first.name === 'quote') || first === 'quote') {
      return expr[1];
    }
    
    if ((first instanceof Symbol && first.name === 'lambda') || first === 'lambda') {
      const [, params, body] = expr;
      return (...args) => {
        const newEnv = env.extend();
        params.forEach((param, i) => {
          const paramName = param instanceof Symbol ? param.name : param;
          newEnv.define(paramName, args[i]);
        });
        return evaluate(body, newEnv);
      };
    }
    
    if ((first instanceof Symbol && first.name === 'let') || first === 'let') {
      const [, bindings, body] = expr;
      const newEnv = env.extend();
      bindings.forEach(([name, value]) => {
        const varName = name instanceof Symbol ? name.name : name;
        newEnv.define(varName, evaluate(value, env));
      });
      return evaluate(body, newEnv);
    }
    
    if ((first instanceof Symbol && first.name === 'defun') || first === 'defun') {
      const [, name, params, body] = expr;
      const func = (...args) => {
        const newEnv = env.extend();
        params.forEach((param, i) => {
          const paramName = param instanceof Symbol ? param.name : param;
          newEnv.define(paramName, args[i]);
        });
        return evaluate(body, newEnv);
      };
      const funcName = name instanceof Symbol ? name.name : name;
      env.define(funcName, func);
      return func;
    }
    
    if ((first instanceof Symbol && first.name === 'defrule') || first === 'defrule') {
      const [, name, description, ruleFunction] = expr;
      const evaluatedRuleFunction = evaluate(ruleFunction, env);
      const defruleFunc = env.lookup('defrule');
      return defruleFunc(name, description, evaluatedRuleFunction);
    }
    
    // Function application
    const func = evaluate(first, env);
    if (typeof func !== 'function') {
      const funcName = first instanceof Symbol ? first.name : first;
      throw new Error(`Undefined function: ${funcName}`);
    }
    
    const args = rest.map(arg => evaluate(arg, env));
    return func(...args);
  }
  
  throw new Error(`Cannot evaluate expression: ${expr}`);
}

module.exports = { evaluate, createEnvironment, Environment, Symbol, sym };