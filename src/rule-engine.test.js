const { evaluate, createEnvironment, sym } = require('./evaluator');
const { createRuleEngine } = require('./rule-engine');

describe('Rule Engine with defrule macro', () => {
  let env;
  let ruleEngine;
  
  beforeEach(() => {
    env = createEnvironment();
    ruleEngine = createRuleEngine(env);
  });

  test('defrule macro registers a rule', () => {
    const ruleExpr = [
      sym('defrule'), 
      sym('test-rule'),
      'A simple test rule',
      [sym('lambda'), [sym('field'), sym('play'), sym('rules')], true]
    ];
    
    evaluate(ruleExpr, env);
    
    expect(ruleEngine.hasRule('test-rule')).toBe(true);
    expect(ruleEngine.getRuleDescription('test-rule')).toBe('A simple test rule');
  });

  test('can-play? evaluates all registered rules', () => {
    // Register a rule that always returns true
    evaluate([
      sym('defrule'), 
      sym('always-true'),
      'Always allows play',
      [sym('lambda'), [sym('field'), sym('play'), sym('rules')], true]
    ], env);
    
    const result = evaluate([
      sym('can-play?'),
      { cards: [] },
      { cards: [{ suit: '♠', rank: 1 }] },
      {}
    ], env);
    
    expect(result).toBe(true);
  });

  test('can-play? fails if any rule returns false', () => {
    // Register two rules: one true, one false
    evaluate([
      sym('defrule'), 
      sym('always-true'),
      'Always allows play',
      [sym('lambda'), [sym('field'), sym('play'), sym('rules')], true]
    ], env);
    
    evaluate([
      sym('defrule'), 
      sym('always-false'),
      'Never allows play',
      [sym('lambda'), [sym('field'), sym('play'), sym('rules')], false]
    ], env);
    
    const result = evaluate([
      sym('can-play?'),
      { cards: [] },
      { cards: [{ suit: '♠', rank: 1 }] },
      {}
    ], env);
    
    expect(result).toBe(false);
  });

  test('defrule supports complex rule logic', () => {
    // Rule that checks if play has exactly 2 cards
    evaluate([
      sym('defrule'),
      sym('two-cards-only'),
      'Only allows plays with exactly 2 cards',
      [sym('lambda'), [sym('field'), sym('play'), sym('rules')],
        [sym('eq'), 
          [sym('length'), [sym('get'), sym('play'), 'cards']],
          2
        ]
      ]
    ], env);
    
    // Test with 2 cards - should pass
    const result1 = evaluate([
      sym('can-play?'),
      { cards: [] },
      { cards: [{ suit: '♠', rank: 1 }, { suit: '♥', rank: 2 }] },
      {}
    ], env);
    expect(result1).toBe(true);
    
    // Test with 1 card - should fail
    const result2 = evaluate([
      sym('can-play?'),
      { cards: [] },
      { cards: [{ suit: '♠', rank: 1 }] },
      {}
    ], env);
    expect(result2).toBe(false);
  });

  test('rules can access field, play, and rules parameters', () => {
    // Rule that checks if suit-binding is enabled in rules
    evaluate([
      sym('defrule'),
      sym('suit-binding-check'),
      'Checks if suit binding rule is enabled',
      [sym('lambda'), [sym('field'), sym('play'), sym('rules')],
        [sym('get'), sym('rules'), 'suit-binding']
      ]
    ], env);
    
    // Test with suit-binding enabled
    const result1 = evaluate([
      sym('can-play?'),
      { cards: [] },
      { cards: [{ suit: '♠', rank: 1 }] },
      { 'suit-binding': true }
    ], env);
    expect(result1).toBe(true);
    
    // Test with suit-binding disabled
    const result2 = evaluate([
      sym('can-play?'),
      { cards: [] },
      { cards: [{ suit: '♠', rank: 1 }] },
      { 'suit-binding': false }
    ], env);
    expect(result2).toBe(false);
  });
});