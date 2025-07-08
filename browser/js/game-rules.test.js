const { LispGameEngine } = require('./lisp-engine.js');

describe('Daifugo Basic Game Rules', () => {
    let engine;

    beforeEach(() => {
        engine = new LispGameEngine();
        // 4人プレイのゲームを初期化
        engine.eval('(init-game-state 4)');
    });

    // --- セクション1: カードの強さ ---
    describe('Card Strength Logic', () => {
        // テストを簡潔にするためのヘルパー関数
        const isStronger = (cardA, cardB) => {
            // Lisp関数 is-stronger が cardB の方が強い場合に true を返すと仮定
            return engine.eval(`(is-stronger "${cardA}" "${cardB}")`);
        };

        test('より強いカードを正しく判定できる', () => {
            expect(isStronger('3', '4')).toBe(true);
            expect(isStronger('K', 'A')).toBe(true);
            expect(isStronger('A', '2')).toBe(true);
        });

        test('より弱いカードを正しく判定できる', () => {
            expect(isStronger('5', '4')).toBe(false);
            expect(isStronger('A', 'K')).toBe(false);
            expect(isStronger('2', 'A')).toBe(false);
        });

        test('同じランクのカードを扱える', () => {
            expect(isStronger('K', 'K')).toBe(false);
        });

        test('ジョーカーが最強のカードであることを認識する', () => {
                        expect(isStronger('2', 'JOKER')).toBe(true);
                        expect(isStronger('JOKER', '2')).toBe(false);
        });
    });

    // --- セクション2: 基本的なプレイ ---
    describe('Basic Play Validation', () => {
        beforeEach(() => {
            // 先行プレイヤーが「8」を1枚出した状態をセットアップ
            engine.eval('(set-current-player 0)');
            const fieldCards = [{ suit: '♠', rank: '8' }];
            engine.eval(`(set-field-cards '${JSON.stringify(fieldCards)})`);
        });

        test('同じ枚数のより強いカードを出せる', () => {
            const validPlay = [{ suit: '♦', rank: '9' }];
            const result = engine.eval(`(validate-play '${JSON.stringify(validPlay)})`);
            expect(result.valid).toBe(true);
        });

        test('より弱いカードは出せない', () => {
            const invalidPlay = [{ suit: '♣', rank: '7' }];
            const result = engine.eval(`(validate-play '${JSON.stringify(invalidPlay)})`);
            expect(result.valid).toBe(false);
            // expect(result.reason).toBe('場に出ているカードより弱いです'); // reasonのメッセージは実装に依存
        });

        test('異なる枚数のカードは出せない', () => {
            const invalidPlay = [{ suit: '♥', rank: '9' }, { suit: '♣', rank: '9' }];
            const result = engine.eval(`(validate-play '${JSON.stringify(invalidPlay)})`);
            expect(result.valid).toBe(false);
            // expect(result.reason).toBe('場に出ているカードと枚数が異なります');
        });

        test('ペア（2枚出し）を正しく扱える', () => {
            // 場を「8のペア」に設定しなおす
            const fieldCards = [{ suit: '♠', rank: '8' }, { suit: '♦', rank: '8' }];
            engine.eval(`(set-field-cards '${JSON.stringify(fieldCards)})`);

            const validPlay = [{ suit: '♥', rank: '10' }, { suit: '♣', rank: '10' }];
            const result = engine.eval(`(validate-play '${JSON.stringify(validPlay)})`);
            expect(result.valid).toBe(true);

            const invalidPlay = [{ suit: '♥', rank: '7' }, { suit: '♣', rank: '7' }];
            const result2 = engine.eval(`(validate-play '${JSON.stringify(invalidPlay)})`);
            expect(result2.valid).toBe(false);
        });
    });

    // --- セクション3: パスとターン進行 ---
    describe('Turn Progression', () => {
        test('他のプレイヤー全員がパスをしたら場が流れる', () => {
            engine.eval('(set-current-player 0)');
            engine.eval(`(process-play '{"player":0, "cards":[{"suit":"♠","rank":"7"}]})`); // Player 0 が 7 を出す
            engine.eval(`(process-play '{"player":1, "action":"pass"})`); // Player 1 がパス
            engine.eval(`(process-play '{"player":2, "action":"pass"})`); // Player 2 がパス
            engine.eval(`(process-play '{"player":3, "action":"pass"})`); // Player 3 がパス

            const state = engine.getGameState();
            expect(state.fieldCards.length).toBe(0); // 場が流れている
            expect(state.currentPlayer).toBe(0);    // Player 0 が次の親になる
        });
    });
});
