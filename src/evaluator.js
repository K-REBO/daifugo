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