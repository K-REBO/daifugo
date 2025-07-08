const { parse } = require('./parser');
const { Symbol } = require('./symbol');

describe('S-expression Parser', () => {
  test('parses simple atom', () => {
    expect(parse('42')).toEqual(42);
    expect(parse('foo')).toEqual(new Symbol('foo'));
  });

  test('parses simple list', () => {
    expect(parse('(+ 1 2)')).toEqual([new Symbol('+'), 1, 2]);
  });

  test('parses nested lists', () => {
    expect(parse('(+ (* 2 3) 4)')).toEqual([new Symbol('+'), [new Symbol('*'), 2, 3], 4]);
  });

  test('parses empty list', () => {
    expect(parse('()')).toEqual([]);
  });

  test('parses strings', () => {
    expect(parse('"hello"')).toEqual('hello');
    expect(parse('("hello" "world")')).toEqual(['hello', 'world']);
  });

  test('handles whitespace', () => {
    expect(parse('  (  +   1   2  )  ')).toEqual([new Symbol('+'), 1, 2]);
  });

  test('throws error for unmatched parentheses', () => {
    expect(() => parse('(+ 1 2')).toThrow('Unmatched parentheses');
    expect(() => parse('+ 1 2)')).toThrow('Unmatched parentheses');
  });
});