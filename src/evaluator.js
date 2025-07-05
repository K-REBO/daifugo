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
  
  return env;
}

function evaluate(expr, env) {
  // Self-evaluating expressions
  if (typeof expr === 'number' || typeof expr === 'boolean') {
    return expr;
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