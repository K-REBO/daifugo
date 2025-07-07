const { evaluate, createEnvironment, sym } = require('./evaluator');
const { parse } = require('./parser');

describe('Lisp Evaluator', () => {
  let env;
  
  beforeEach(() => {
    env = createEnvironment();
  });

  test('evaluates numbers', () => {
    expect(evaluate(42, env)).toBe(42);
    expect(evaluate(0, env)).toBe(0);
    expect(evaluate(-5, env)).toBe(-5);
  });

  test('evaluates strings', () => {
    expect(evaluate(parse('"hello"'), env)).toBe('hello');
    expect(evaluate(parse('""'), env)).toBe('');
  });

  test('evaluates built-in functions', () => {
    expect(evaluate([sym('+'), 1, 2], env)).toBe(3);
    expect(evaluate([sym('+'), 1, 2, 3], env)).toBe(6);
    expect(evaluate([sym('*'), 2, 3], env)).toBe(6);
    expect(evaluate([sym('*'), 2, 3, 4], env)).toBe(24);
  });

  test('evaluates nested expressions', () => {
    expect(evaluate([sym('+'), [sym('*'), 2, 3], 4], env)).toBe(10);
    expect(evaluate([sym('*'), [sym('+'), 1, 2], [sym('+'), 3, 4]], env)).toBe(21);
  });

  test('handles lambda expressions', () => {
    const lambda = [sym('lambda'), [sym('x')], [sym('+'), sym('x'), 1]];
    const result = evaluate([lambda, 5], env);
    expect(result).toBe(6);
  });

  test('handles variable binding', () => {
    env.define('x', 10);
    expect(evaluate(sym('x'), env)).toBe(10);
    expect(evaluate([sym('+'), sym('x'), 5], env)).toBe(15);
  });

  test('supports eq comparison', () => {
    expect(evaluate([sym('eq'), 1, 1], env)).toBe(true);
    expect(evaluate([sym('eq'), 1, 2], env)).toBe(false);
    expect(evaluate([sym('eq'), 'a', 'a'], env)).toBe(true);
    expect(evaluate([sym('eq'), 'a', 'b'], env)).toBe(false);
  });

  test('supports if conditional', () => {
    expect(evaluate([sym('if'), true, 'yes', 'no'], env)).toBe('yes');
    expect(evaluate([sym('if'), false, 'yes', 'no'], env)).toBe('no');
    expect(evaluate([sym('if'), [sym('eq'), 1, 1], 'equal', 'not-equal'], env)).toBe('equal');
  });

  test('throws error for undefined variables', () => {
    expect(() => evaluate(sym('undefined-var'), env)).toThrow('Undefined variable: undefined-var');
  });

  test('throws error for invalid function calls', () => {
    expect(() => evaluate([sym('invalid-func'), 1, 2], env)).toThrow('Undefined variable: invalid-func');
  });

  // Phase 7.1: List operation functions tests (RED phase)
  describe('List operations', () => {
    test('map function should transform list elements', () => {
      const addOne = [sym('lambda'), [sym('x')], [sym('+'), sym('x'), 1]];
      const result = evaluate([sym('map'), addOne, [sym('quote'), [1, 2, 3]]], env);
      expect(result).toEqual([2, 3, 4]);
    });

    test('filter function should select matching elements', () => {
      const isEven = [sym('lambda'), [sym('x')], [sym('eq'), [sym('%'), sym('x'), 2], 0]];
      const result = evaluate([sym('filter'), isEven, [sym('quote'), [1, 2, 3, 4, 5, 6]]], env);
      expect(result).toEqual([2, 4, 6]);
    });

    test('reduce function should accumulate list values', () => {
      const add = [sym('lambda'), [sym('acc'), sym('x')], [sym('+'), sym('acc'), sym('x')]];
      const result = evaluate([sym('reduce'), add, 0, [sym('quote'), [1, 2, 3, 4]]], env);
      expect(result).toBe(10);
    });

    test('length function should return list length', () => {
      expect(evaluate([sym('length'), [sym('quote'), [1, 2, 3]]], env)).toBe(3);
      expect(evaluate([sym('length'), [sym('quote'), []]], env)).toBe(0);
    });

    test('nth function should return nth element', () => {
      expect(evaluate([sym('nth'), 0, [sym('quote'), ['a', 'b', 'c']]], env)).toBe('a');
      expect(evaluate([sym('nth'), 2, [sym('quote'), ['a', 'b', 'c']]], env)).toBe('c');
    });

    test('append function should concatenate lists', () => {
      const result = evaluate([sym('append'), [sym('quote'), [1, 2]], [sym('quote'), [3, 4]]], env);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });
});