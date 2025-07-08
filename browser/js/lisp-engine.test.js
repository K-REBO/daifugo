
/**
 * Lisp Game Engine Tests
 * Migrated to Jest
 */

// Lisp Engine をインポート (仮のパス, 後で調整が必要)
const { LispGameEngine } = require('./lisp-engine.js');

describe('LispGameEngine', () => {
    let engine;

    beforeEach(() => {
        // 各テストの前に新しいエンジンインスタンスを作成
        // LispGameEngineが未実装の場合、この行でエラーが発生する
        engine = new LispGameEngine();
    });

    test('should be created', () => {
        expect(engine).not.toBeNull();
        expect(typeof engine.eval).toBe('function');
    });

    test('should evaluate basic Lisp expressions', () => {
        const result = engine.eval('(+ 1 2)');
        expect(result).toBe(3);
    });

    test('should initialize game state', () => {
        const result = engine.eval('(init-game-state 4)'); // 4 players
        expect(result.success).toBe(true);
        expect(result.playerCount).toBe(4);
    });

    test('should create and manipulate cards', () => {
        const result = engine.eval('(create-card "♠" "8")');
        expect(result.suit).toBe('♠');
        expect(result.rank).toBe('8');
    });

    test('should validate card plays', () => {
        engine.eval('(init-game-state 4)');
        const cards = [{ suit: '♠', rank: '8' }];
        const result = engine.eval(`(validate-play ${JSON.stringify(cards)})`);
        
        expect(typeof result.valid).toBe('boolean');
        expect(typeof result.reason).toBe('string');
    });

    test('should detect 8-cut rule', () => {
        engine.eval('(init-game-state 4)');
        const cards = [{ suit: '♠', rank: '8' }];
        const result = engine.eval(`(check-special-rules ${JSON.stringify(cards)})`);
        
        expect(result).toContain('8cut');
    });

    test('should load a rule dynamically', () => {
        // Note: This requires file system access, might need adjustment for Jest environment
        // For now, we assume a mock or a way to load rules.
        const success = engine.loadRule('test-rule.lisp');
        expect(success).toBe(true);
    });

    test('should retrieve the game state', () => {
        engine.eval('(init-game-state 4)');
        const state = engine.getGameState();
        
        expect(state.players).toBeDefined();
        expect(state.currentPlayer).toBeDefined();
        expect(state.fieldCards).toBeDefined();
    });

    test('should manipulate player hands', () => {
        engine.eval('(init-game-state 4)');
        const cards = [{ suit: '♥', rank: 'Q' }, { suit: '♠', rank: 'Q' }];
        const result = engine.eval(`(add-cards-to-player 0 ${JSON.stringify(cards)})`);
        
        expect(result.success).toBe(true);
        
        const playerHand = engine.eval('(get-player-hand 0)');
        expect(playerHand.length).toBeGreaterThanOrEqual(2);
    });

    test('should be prepared for Q-bomber rule', () => {
        engine.eval('(init-game-state 4)');
        const cards = [{ suit: '♥', rank: 'Q' }, { suit: '♠', rank: 'Q' }];
        const declaredNumbers = ['3', '7'];
        
        const result = engine.eval(`(q-bomber ${JSON.stringify(cards)} ${JSON.stringify(declaredNumbers)})`);
        
        expect(result.special).toBe('q-bomber');
        expect(result.affectedNumbers).toHaveLength(2);
    });
});
