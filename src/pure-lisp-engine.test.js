const { pureEvaluate, createPureEnvironment, sym } = require('./pure-lisp-evaluator');
const { EnvironmentFactory } = require('./pure-lisp-environment');

// Environment-independent Pure Lisp Engine Tests
describe('Pure Lisp Engine - Environment Independent', () => {
  let env;
  let pureLispEnv;
  let mockEnv;
  
  beforeEach(() => {
    // Test with different environment implementations
    pureLispEnv = createPureEnvironment(EnvironmentFactory.createPureLisp());
    mockEnv = createPureEnvironment(EnvironmentFactory.createMock());
    env = pureLispEnv; // Default to pure Lisp environment
  });

  describe('Core Lisp Operations (No JS Dependencies)', () => {
    test('should perform basic arithmetic without JavaScript dependencies', () => {
      // Test pure Lisp arithmetic
      const result1 = pureEvaluate([sym('+'), 2, 3], env);
      const result2 = pureEvaluate([sym('*'), 4, 5], env);
      const result3 = pureEvaluate([sym('-'), 10, 3], env);
      const result4 = pureEvaluate([sym('/'), 15, 3], env);
      
      expect(result1).toBe(5);
      expect(result2).toBe(20);
      expect(result3).toBe(7);
      expect(result4).toBe(5);
    });

    test('should perform logical operations without JavaScript dependencies', () => {
      const result1 = pureEvaluate([sym('and'), true, true], env);
      const result2 = pureEvaluate([sym('or'), false, true], env);
      const result3 = pureEvaluate([sym('not'), false], env);
      const result4 = pureEvaluate([sym('eq'), 5, 5], env);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(result4).toBe(true);
    });

    test('should perform comparison operations without JavaScript dependencies', () => {
      const result1 = pureEvaluate([sym('>'), 5, 3], env);
      const result2 = pureEvaluate([sym('<'), 2, 8], env);
      const result3 = pureEvaluate([sym('>='), 5, 5], env);
      const result4 = pureEvaluate([sym('<='), 3, 7], env);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(result4).toBe(true);
    });
  });

  describe('Pure Lisp Card Operations (Environment Independent)', () => {
    test('should create cards using pure Lisp without JS dependencies', () => {
      // Test pure Lisp card creation
      const card = pureEvaluate([sym('create-card-pure'), '♠', '8'], env);
      
      // Test that the card structure is pure Lisp data
      expect(card).toEqual(['card', '♠', '8']);
      
      // Verify no JavaScript object methods are required
      const suit = pureEvaluate([sym('card-suit-pure'), [sym('quote'), card]], env);
      const rank = pureEvaluate([sym('card-rank-pure'), [sym('quote'), card]], env);
      
      expect(suit).toBe('♠');
      expect(rank).toBe('8');
    });

    test('should validate cards without JavaScript Array.isArray dependency', () => {
      const card = pureEvaluate([sym('create-card-pure'), '♥', 'Q'], env);
      
      // This should work with pure Lisp array checking
      const isValid = pureEvaluate([sym('valid-card-pure'), [sym('quote'), card]], env);
      expect(isValid).toBe(true);
      
      // Test with invalid card
      const invalidCard = ['not-card', '♥', 'Q'];
      const isInvalid = pureEvaluate([sym('valid-card-pure'), [sym('quote'), invalidCard]], env);
      expect(isInvalid).toBe(false);
    });

    test('should work with pure Lisp list operations', () => {
      // Test that list operations don't use JavaScript dependencies
      const list = pureEvaluate([sym('list'), 1, 2, 3], env);
      const length = pureEvaluate([sym('length'), [sym('quote'), list]], env);
      const first = pureEvaluate([sym('car'), [sym('quote'), list]], env);
      const rest = pureEvaluate([sym('cdr'), [sym('quote'), list]], env);
      
      expect(length).toBe(3);
      expect(first).toBe(1);
      expect(rest).toEqual([2, 3]);
    });
  });

  describe('Pure Lisp Game Logic (Environment Independent)', () => {
    test('should initialize game state without JavaScript dependencies', () => {
      // Test pure Lisp game state initialization
      const gameState = pureEvaluate([sym('init-game-state-pure'), 4], env);
      expect(gameState[0]).toBe('game-state');
      expect(gameState[1]).toBe(4);
      expect(gameState[2]).toBe(0); // Initial current player
      expect(gameState[3]).toBe(null); // Initial field cards
      expect(gameState[4]).toBeDefined(); // Game data should exist
    });

    test('should work with environment-aware operations', () => {
      // Test that environment abstraction works
      const logResult = pureEvaluate([sym('debug-log'), 'test message'], env);
      expect(logResult).toBe(null); // Logging returns null
      
      const time1 = pureEvaluate([sym('current-time')], env);
      const time2 = pureEvaluate([sym('current-time')], env);
      expect(time2).toBeGreaterThan(time1); // Time should advance
    });

    test('should serialize data without JavaScript JSON dependency', () => {
      const data = ['card', '♠', 'A'];
      const serialized = pureEvaluate([sym('serialize'), [sym('quote'), data]], env);
      
      // Should use pure Lisp serialization
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('card');
      expect(serialized).toContain('♠');
      expect(serialized).toContain('A');
    });
  });

  describe('Environment Independence Validation', () => {
    test('should work with different environment implementations', () => {
      // Test with Pure Lisp environment
      const pureLispTime = pureEvaluate([sym('current-time')], pureLispEnv);
      expect(typeof pureLispTime).toBe('number');
      
      // Test with Mock environment  
      const mockTime = pureEvaluate([sym('current-time')], mockEnv);
      expect(mockTime).toBe(42); // Mock always returns 42
      
      // Verify mock captured the operation
      const operations = mockEnv.getRuntimeEnv().getOperations();
      expect(operations.some(op => op.op === 'now')).toBe(true);
    });

    test('should handle logging through environment abstraction', () => {
      // Test Pure Lisp environment logging
      pureEvaluate([sym('debug-log'), 'pure lisp message'], pureLispEnv);
      const logs = pureLispEnv.getRuntimeEnv().getLogs();
      expect(logs.some(log => log.message === 'pure lisp message')).toBe(true);
      
      // Test Mock environment logging
      pureEvaluate([sym('debug-log'), 'mock message'], mockEnv);
      const operations = mockEnv.getRuntimeEnv().getOperations();
      expect(operations.some(op => op.op === 'debug' && op.args[0] === 'mock message')).toBe(true);
    });

    test('should use environment-specific serialization', () => {
      const data = ['test', 'data'];
      
      // Pure Lisp serialization
      const pureLispSerialized = pureEvaluate([sym('serialize'), [sym('quote'), data]], pureLispEnv);
      expect(pureLispSerialized).toBe('("test" "data")'); // Lisp-style with quotes
      
      // Mock serialization (uses JSON)
      const mockSerialized = pureEvaluate([sym('serialize'), [sym('quote'), data]], mockEnv);
      expect(mockSerialized).toBe('["test","data"]'); // JSON-style
    });

    test('should handle immutability through environment abstraction', () => {
      const array = [1, 2, 3];
      const frozenArray = pureLispEnv.getRuntimeEnv().freeze(array);
      
      // In pure environment, should get a copy
      expect(frozenArray).toEqual([1, 2, 3]);
      expect(frozenArray).not.toBe(array); // Should be different object in pure env
    });

    test('should validate arrays using environment-specific methods', () => {
      const testArray = [1, 2, 3];
      const testString = 'not an array';
      
      // Pure Lisp environment
      expect(pureLispEnv.getRuntimeEnv().isArray(testArray)).toBe(true);
      expect(pureLispEnv.getRuntimeEnv().isArray(testString)).toBe(false);
      
      // Mock environment
      expect(mockEnv.getRuntimeEnv().isArray(testArray)).toBe(true);
      expect(mockEnv.getRuntimeEnv().isArray(testString)).toBe(false);
    });
  });

  describe('Pure Lisp Data Structures Only', () => {
    test('should work with only Lisp lists and atoms', () => {
      // Test that basic Lisp operations work without any JavaScript objects
      const list = pureEvaluate([sym('list'), 1, 2, 3], env);
      const length = pureEvaluate([sym('length'), [sym('quote'), list]], env);
      const first = pureEvaluate([sym('car'), [sym('quote'), list]], env);
      const rest = pureEvaluate([sym('cdr'), [sym('quote'), list]], env);
      
      expect(length).toBe(3);
      expect(first).toBe(1);
      expect(rest).toEqual([2, 3]);
    });

    test('should manipulate pure Lisp card structures', () => {
      // Cards should be pure Lisp structures, not JavaScript objects
      const card = ['card', '♠', 'A'];
      const suit = pureEvaluate([sym('card-suit-pure'), [sym('quote'), card]], env);
      const rank = pureEvaluate([sym('card-rank-pure'), [sym('quote'), card]], env);
      
      // This tests that we can access card data with pure Lisp operations
      expect(suit).toBe('♠');
      expect(rank).toBe('A');
    });

    test('should handle pure Lisp special forms', () => {
      // Test if statement
      const result1 = pureEvaluate([sym('if'), true, 'yes', 'no'], env);
      const result2 = pureEvaluate([sym('if'), false, 'yes', 'no'], env);
      
      expect(result1).toBe('yes');
      expect(result2).toBe('no');
      
      // Test let binding
      const result3 = pureEvaluate([
        sym('let'),
        [[sym('x'), 10], [sym('y'), 20]],
        [sym('+'), sym('x'), sym('y')]
      ], env);
      
      expect(result3).toBe(30);
    });
  });

  describe('Environment Abstraction Layer Tests', () => {
    test('should create different environment types', () => {
      const { EnvironmentFactory } = require('./pure-lisp-environment');
      
      const jsEnv = EnvironmentFactory.createJavaScript();
      const pureLispEnv = EnvironmentFactory.createPureLisp();
      const mockEnv = EnvironmentFactory.createMock();
      
      expect(jsEnv.constructor.name).toBe('JavaScriptEnvironment');
      expect(pureLispEnv.constructor.name).toBe('PureLispEnvironment');
      expect(mockEnv.constructor.name).toBe('MockEnvironment');
    });

    test('should track operations in mock environment', () => {
      const { EnvironmentFactory } = require('./pure-lisp-environment');
      const mockRuntime = EnvironmentFactory.createMock();
      
      mockRuntime.debug('test');
      mockRuntime.now();
      mockRuntime.isArray([1, 2, 3]);
      
      const operations = mockRuntime.getOperations();
      expect(operations).toHaveLength(3);
      expect(operations[0].op).toBe('debug');
      expect(operations[1].op).toBe('now');
      expect(operations[2].op).toBe('isArray');
    });

    test('should maintain logs in pure Lisp environment', () => {
      const { EnvironmentFactory } = require('./pure-lisp-environment');
      const pureRuntime = EnvironmentFactory.createPureLisp();
      
      pureRuntime.debug('message 1');
      pureRuntime.warn('message 2');
      
      const logs = pureRuntime.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].type).toBe('debug');
      expect(logs[1].type).toBe('warn');
    });
  });
});