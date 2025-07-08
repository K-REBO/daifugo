import LispGameAdapter from '../js/lisp-game-adapter.js';

// Phase 8.3 複数枚出し機能テスト
// TDD Red Phase: 複数枚出し（ペア、トリプル、シーケンス）の検証テスト

describe('Multi-Card Play System', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new LispGameAdapter();
    await adapter.initialize();
    await adapter.waitForReady();
  });

  describe('ペア（2枚組）プレイ', () => {
    test('should validate valid pair play', () => {
      // Red: 有効なペアプレイの検証
      const gameState = adapter.createGame(4);
      const pairCards = [
        adapter.createCard('♠', '7'),
        adapter.createCard('♥', '7')
      ];
      
      const validation = adapter.validatePlay(gameState, pairCards);
      
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
      expect(validation[0]).toBe('valid');
    });

    test('should reject invalid pair (different ranks)', () => {
      // Red: 無効なペア（異なるランク）の拒否
      const gameState = adapter.createGame(4);
      const invalidPair = [
        adapter.createCard('♠', '7'),
        adapter.createCard('♥', '8')
      ];
      
      const validation = adapter.validatePlay(gameState, invalidPair);
      
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
      expect(validation[0]).toBe('invalid');
    });

    test('should compare pair strength correctly', () => {
      // Red: ペア同士の強度比較
      const gameState = adapter.createGame(4);
      
      // 場に7のペアがある状態を作成
      const fieldPair = [
        adapter.createCard('♠', '7'),
        adapter.createCard('♥', '7')
      ];
      
      // ゲーム状態を7のペアが場にある状態に更新
      const updatedState = adapter.processTurn(gameState, {
        type: 'play',
        cards: fieldPair
      });
      
      // 8のペアで上がり
      const strongerPair = [
        adapter.createCard('♦', '8'),
        adapter.createCard('♣', '8')
      ];
      
      const validation = adapter.validatePlay(updatedState, strongerPair);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('valid');
    });
  });

  describe('トリプル（3枚組）プレイ', () => {
    test('should validate valid triple play', () => {
      // Red: 有効なトリプルプレイの検証
      const gameState = adapter.createGame(4);
      const tripleCards = [
        adapter.createCard('♠', 'Q'),
        adapter.createCard('♥', 'Q'),
        adapter.createCard('♦', 'Q')
      ];
      
      const validation = adapter.validatePlay(gameState, tripleCards);
      
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
      expect(validation[0]).toBe('valid');
    });

    test('should reject invalid triple (mixed ranks)', () => {
      // Red: 無効なトリプル（混合ランク）の拒否
      const gameState = adapter.createGame(4);
      const invalidTriple = [
        adapter.createCard('♠', 'Q'),
        adapter.createCard('♥', 'Q'),
        adapter.createCard('♦', 'K')
      ];
      
      const validation = adapter.validatePlay(gameState, invalidTriple);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('invalid');
    });

    test('should only allow triples against triples', () => {
      // Red: トリプル vs トリプルのみ許可
      const gameState = adapter.createGame(4);
      
      // 場にシングルカードがある状態
      const singleCard = [adapter.createCard('♠', '5')];
      const stateWithSingle = adapter.processTurn(gameState, {
        type: 'play',
        cards: singleCard
      });
      
      // トリプルで出そうとする
      const triple = [
        adapter.createCard('♠', '7'),
        adapter.createCard('♥', '7'),
        adapter.createCard('♦', '7')
      ];
      
      const validation = adapter.validatePlay(stateWithSingle, triple);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('invalid');
      expect(validation[1]).toContain('type mismatch');
    });
  });

  describe('シーケンス（階段）プレイ', () => {
    test('should validate valid sequence play', () => {
      // Red: 有効なシーケンスプレイの検証
      const gameState = adapter.createGame(4);
      const sequenceCards = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '6'),
        adapter.createCard('♦', '7')
      ];
      
      const validation = adapter.validatePlay(gameState, sequenceCards);
      
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
      expect(validation[0]).toBe('valid');
    });

    test('should reject non-consecutive sequence', () => {
      // Red: 非連続シーケンスの拒否
      const gameState = adapter.createGame(4);
      const nonSequence = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '7'),  // 6が抜けている
        adapter.createCard('♦', '8')
      ];
      
      const validation = adapter.validatePlay(gameState, nonSequence);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('invalid');
    });

    test('should require minimum 3 cards for sequence', () => {
      // Red: シーケンスは最低3枚必要
      const gameState = adapter.createGame(4);
      const twoCardSequence = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '6')
      ];
      
      const validation = adapter.validatePlay(gameState, twoCardSequence);
      
      expect(validation).toBeDefined();
      // 2枚はペアとして処理される（同ランクでないので無効）
      expect(validation[0]).toBe('invalid');
    });

    test('should compare sequence strength by lowest card', () => {
      // Red: シーケンスの強度は最低カードで比較
      const gameState = adapter.createGame(4);
      
      // 場に5-6-7のシーケンス
      const fieldSequence = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '6'),
        adapter.createCard('♦', '7')
      ];
      
      const stateWithSequence = adapter.processTurn(gameState, {
        type: 'play',
        cards: fieldSequence
      });
      
      // 6-7-8のシーケンスで上がり
      const strongerSequence = [
        adapter.createCard('♠', '6'),
        adapter.createCard('♥', '7'),
        adapter.createCard('♦', '8')
      ];
      
      const validation = adapter.validatePlay(stateWithSequence, strongerSequence);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('valid');
    });
  });

  describe('手札タイプ判定システム', () => {
    test('should identify hand types correctly', () => {
      // Red: 手札タイプの正確な判定
      const singleCard = [adapter.createCard('♠', '5')];
      const pair = [adapter.createCard('♠', '7'), adapter.createCard('♥', '7')];
      const triple = [adapter.createCard('♠', 'Q'), adapter.createCard('♥', 'Q'), adapter.createCard('♦', 'Q')];
      const sequence = [adapter.createCard('♠', '5'), adapter.createCard('♥', '6'), adapter.createCard('♦', '7')];
      
      expect(adapter.getHandType(singleCard)).toEqual(['single', '5', 1]);
      expect(adapter.getHandType(pair)).toEqual(['pair', '7', 2]);
      expect(adapter.getHandType(triple)).toEqual(['triple', 'Q', 3]);
      expect(adapter.getHandType(sequence)).toEqual(['sequence', '5', 3]);
    });

    test('should reject invalid card combinations', () => {
      // Red: 無効なカード組み合わせの拒否
      const mixedTwo = [adapter.createCard('♠', '5'), adapter.createCard('♥', '7')];
      const mixedThree = [adapter.createCard('♠', '5'), adapter.createCard('♥', '7'), adapter.createCard('♦', '9')];
      
      expect(adapter.getHandType(mixedTwo)).toEqual(['invalid', 'none', 0]);
      expect(adapter.getHandType(mixedThree)).toEqual(['invalid', 'none', 0]);
    });
  });

  describe('革命モードでの複数枚出し', () => {
    test('should handle multi-card plays in revolution mode', () => {
      // Red: 革命モードでの複数枚出し処理
      const gameState = adapter.createGame(4);
      
      // 革命状態を作成（4枚組を出す）
      const revolutionCards = [
        adapter.createCard('♠', '6'),
        adapter.createCard('♥', '6'),
        adapter.createCard('♦', '6'),
        adapter.createCard('♣', '6')
      ];
      
      const revolutionState = adapter.processTurn(gameState, {
        type: 'play',
        cards: revolutionCards
      });
      
      // 革命状態でペアプレイ
      const pairInRevolution = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '5')
      ];
      
      const validation = adapter.validatePlay(revolutionState, pairInRevolution);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('valid');
    });
  });
});