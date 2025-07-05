class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.ruleDescriptions = new Map();
  }

  registerRule(name, description, ruleFunction) {
    this.rules.set(name, ruleFunction);
    this.ruleDescriptions.set(name, description);
  }

  hasRule(name) {
    return this.rules.has(name);
  }

  getRuleDescription(name) {
    return this.ruleDescriptions.get(name);
  }

  getAllRules() {
    return Array.from(this.rules.values());
  }

  evaluateAllRules(field, play, rules) {
    for (const ruleFunction of this.rules.values()) {
      const result = ruleFunction(field, play, rules);
      if (!result) {
        return false;
      }
    }
    return true;
  }
}

function createRuleEngine(env) {
  const ruleEngine = new RuleEngine();
  
  // Add defrule macro to environment
  env.define('defrule', (name, description, ruleFunction) => {
    const ruleName = name.name || name;
    ruleEngine.registerRule(ruleName, description, ruleFunction);
    return ruleFunction;
  });
  
  // Add can-play? function to environment
  env.define('can-play?', (field, play, rules) => {
    return ruleEngine.evaluateAllRules(field, play, rules);
  });
  
  // Add length function for list operations
  env.define('length', (list) => {
    if (Array.isArray(list)) {
      return list.length;
    }
    if (list && typeof list === 'object' && list.cards) {
      return list.cards.length;
    }
    return 0;
  });
  
  return ruleEngine;
}

module.exports = { createRuleEngine, RuleEngine };