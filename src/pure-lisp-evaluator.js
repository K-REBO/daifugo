/**
 * Pure Lisp Evaluator - Environment Independent Version
 * 
 * This module provides a Pure Lisp evaluator that can work in any environment
 * by using the environment abstraction layer.
 */

const { Symbol, sym } = require('./symbol');
const { EnvironmentFactory } = require('./pure-lisp-environment');
const { parseMultipleExpressions } = require('./parser');

class PureEnvironment {
  constructor(parent = null, runtimeEnv = null) {
    this.parent = parent;
    this.bindings = new Map();
    // Use provided runtime environment or auto-detect
    this.runtimeEnv = runtimeEnv || EnvironmentFactory.detect();
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
    return new PureEnvironment(this, this.runtimeEnv);
  }
  
  getRuntimeEnv() {
    return this.runtimeEnv;
  }
}

function createPureEnvironment(runtimeEnv = null) {
  const env = new PureEnvironment(null, runtimeEnv);
  
  // Built-in arithmetic functions (pure)
  env.define('+', (...args) => args.reduce((a, b) => a + b, 0));
  env.define('*', (...args) => args.reduce((a, b) => a * b, 1));
  env.define('-', (a, b) => b === undefined ? -a : a - b);
  env.define('/', (a, b) => a / b);
  
  // Built-in comparison functions (pure)
  env.define('eq', (a, b) => a === b);
  env.define('>', (a, b) => a > b);
  env.define('<', (a, b) => a < b);
  env.define('>=', (a, b) => a >= b);
  env.define('<=', (a, b) => a <= b);
  
  // Built-in logical functions (pure)
  env.define('and', (...args) => args.every(Boolean));
  env.define('or', (...args) => args.some(Boolean));
  env.define('not', (a) => !a);
  
  // Pure list functions using environment abstraction
  const runtime = env.getRuntimeEnv();
  
  env.define('list', (...args) => runtime.freeze([...args]));
  
  env.define('length', (list) => {
    if (!runtime.isArray(list)) {
      throw new Error('length: argument must be a list');
    }
    return list.length;
  });
  
  env.define('car', (list) => {
    if (!runtime.isArray(list) || list.length === 0) {
      return null;
    }
    return list[0];
  });
  
  env.define('cdr', (list) => {
    if (!runtime.isArray(list) || list.length === 0) {
      return null;
    }
    return runtime.freeze(list.slice(1));
  });
  
  env.define('cons', (item, list) => {
    if (!runtime.isArray(list)) {
      list = [];
    }
    return runtime.freeze([item, ...list]);
  });
  
  env.define('append', (...lists) => {
    let result = [];
    for (const list of lists) {
      if (!runtime.isArray(list)) {
        throw new Error('append: all arguments must be lists');
      }
      result = [...result, ...list];
    }
    return runtime.freeze(result);
  });
  
  // Environment-aware operations
  env.define('get', (obj, key) => {
    if (typeof obj === 'object' && obj !== null) {
      const keyName = key instanceof Symbol ? key.name : key;
      return obj[keyName];
    }
    return null;
  });
  
  // Pure map, filter, reduce
  const applyFunction = (fn, args, env) => {
    if (typeof fn === 'function') {
      return fn(...args);
    } else {
      return pureEvaluate([fn, ...args], env);
    }
  };

  env.define('map', (fn, list) => {
    if (!runtime.isArray(list)) {
      throw new Error('map: second argument must be a list');
    }
    const result = list.map(item => applyFunction(fn, [item], env));
    return runtime.freeze(result);
  });

  env.define('filter', (fn, list) => {
    if (!runtime.isArray(list)) {
      throw new Error('filter: second argument must be a list');
    }
    const result = list.filter(item => applyFunction(fn, [item], env));
    return runtime.freeze(result);
  });

  env.define('reduce', (fn, initial, list) => {
    if (!runtime.isArray(list)) {
      throw new Error('reduce: third argument must be a list');
    }
    return list.reduce((acc, item) => applyFunction(fn, [acc, item], env), initial);
  });

  env.define('every', (fn, list) => {
    if (!runtime.isArray(list)) return false;
    return list.every(item => pureEvaluate([fn, item], env));
  });
  
  // Pure card operations (without JavaScript dependencies)
  env.define('create-card-pure', (suit, rank) => {
    return runtime.freeze(['card', suit, rank]);
  });
  
  env.define('card-suit-pure', (card) => {
    if (!runtime.isArray(card) || card.length < 3 || card[0] !== 'card') {
      throw new Error('card-suit-pure: invalid card structure');
    }
    return card[1];
  });
  
  env.define('card-rank-pure', (card) => {
    if (!runtime.isArray(card) || card.length < 3 || card[0] !== 'card') {
      throw new Error('card-rank-pure: invalid card structure');
    }
    return card[2];
  });
  
  env.define('valid-card-pure', (card) => {
    if (!runtime.isArray(card)) return false;
    if (card.length !== 3) return false;
    if (card[0] !== 'card') return false;
    
    const suit = card[1];
    const rank = card[2];
    
    // Valid suits: ♠, ♥, ♦, ♣, or null (for jokers)
    const validSuits = ['♠', '♥', '♦', '♣', null];
    if (!validSuits.includes(suit)) return false;
    
    // Valid ranks
    const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'JOKER'];
    if (!validRanks.includes(rank)) return false;
    
    // Jokers must have null suit
    if (rank === 'JOKER' && suit !== null) return false;
    if (suit === null && rank !== 'JOKER') return false;
    
    return true;
  });
  
  // Pure game state operations
  env.define('init-game-state-pure', (playerCount) => {
    const gameData = runtime.freeze({
      consecutivePasses: 0,
      hands: runtime.freeze(new Array(playerCount).fill(null).map(() => runtime.freeze([]))),
      startTime: runtime.now()
    });
    
    return runtime.freeze(['game-state', playerCount, 0, null, gameData]);
  });
  
  // Environment-aware logging functions
  env.define('debug-log', (message) => {
    runtime.debug(message);
    return null;
  });
  
  env.define('error-log', (message) => {
    runtime.error(message);
    return null;
  });
  
  // Time function
  env.define('current-time', () => {
    return runtime.now();
  });
  
  // Serialization function
  env.define('serialize', (obj) => {
    return runtime.stringify(obj);
  });

  // load-string function
  env.define('load-string', (lispString) => {
    const expressions = parseMultipleExpressions(lispString);
    let result = null;
    expressions.forEach(expr => {
      result = pureEvaluate(expr, env);
    });
    return result;
  });
  
  return env;
}

function pureEvaluate(expr, env) {
  // Handle null/undefined
  if (expr === null || expr === undefined) {
    return null;
  }
  
  // Handle literals
  if (typeof expr === 'number' || typeof expr === 'string' || typeof expr === 'boolean') {
    return expr;
  }
  
  // Handle symbols
  if (expr instanceof Symbol) {
    return env.lookup(expr.name);
  }
  
  // Handle objects (return as-is for now)
  if (typeof expr === 'object' && expr !== null && !env.getRuntimeEnv().isArray(expr) && !(expr instanceof Symbol)) {
    return expr;
  }
  
  // Handle function calls
  if (env.getRuntimeEnv().isArray(expr)) {
    if (expr.length === 0) {
      return expr;
    }
    
    const [fn, ...args] = expr;

    // Handle special forms
    if (fn instanceof Symbol) {
      switch (fn.name) {
        case 'quote':
          return args[0];
          
        case 'if':
          const [condition, thenExpr, elseExpr] = args;
          const conditionValue = pureEvaluate(condition, env);
          return conditionValue ? pureEvaluate(thenExpr, env) : pureEvaluate(elseExpr, env);
          
        case 'lambda':
          const [params, body] = args;
          return (...callArgs) => {
            const newEnv = env.extend();
            if (env.getRuntimeEnv().isArray(params)) {
              params.forEach((param, index) => {
                if (param instanceof Symbol) {
                  newEnv.define(param.name, callArgs[index]);
                }
              });
            }
            return pureEvaluate(body, newEnv);
          };
          
        case 'defun':
          const [name, parameters, bodyExpr] = args;
          const func = pureEvaluate([sym('lambda'), parameters, bodyExpr], env);
          if (name instanceof Symbol) {
            env.define(name.name, func);
          }
          return func;
          
        case 'let':
          const [bindings, letBody] = args;
          const letEnv = env.extend();
          if (env.getRuntimeEnv().isArray(bindings)) {
            bindings.forEach(binding => {
              if (env.getRuntimeEnv().isArray(binding) && binding.length === 2) {
                const [varName, value] = binding; {
                  letEnv.define(varName.name, pureEvaluate(value, env));
                }
              }
            });
          }
          return pureEvaluate(letBody, letEnv);
      }
    }
    
    // Regular function call
    let func = null;
    if (fn instanceof Symbol) {
      func = env.lookup(fn.name);
    } else {
      func = pureEvaluate(fn, env);
    }
    const evaluatedArgs = args.map(arg => pureEvaluate(arg, env));
    
    if (typeof func === 'function') {
      return func(...evaluatedArgs);
    } else {
      throw new Error(`${func} is not a function`);
    }
  }
  
  return expr;
}

module.exports = {
  PureEnvironment,
  createPureEnvironment,
  pureEvaluate,
  sym
};