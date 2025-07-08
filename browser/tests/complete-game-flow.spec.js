import LispGameAdapter from '../js/lisp-game-adapter.js';

// Phase 8.2 完全ゲームフロー統合テスト
// TDD Red Phase: ブラウザでのPure Lispエンジンを使った完全なゲームフローをテスト

describe('Complete Game Flow Integration', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new LispGameAdapter();
    await adapter.initialize();
    await adapter.waitForReady();
  });

  describe('カード配布→プレイ→ターン進行→ゲーム終了フロー', () => {
    test('should initialize game with 4 players', () => {
      // Red: 4人ゲームの初期化
      const gameState = adapter.createGame(4);
      expect(gameState).toBeDefined();
      expect(Array.isArray(gameState)).toBe(true);
      expect(gameState[0]).toBe('game-state');
      expect(gameState[1]).toBe(4); // プレイヤー数
    });

    test('should deal complete deck to all players', () => {
      // Red: 全カードを全プレイヤーに配布
      const gameState = adapter.createGame(4);
      const deck = adapter.createDeck();
      
      // カード配布を実行
      const updatedState = adapter.processTurn(gameState, ['deal-cards', deck]);
      
      expect(updatedState).toBeDefined();
      expect(Array.isArray(updatedState)).toBe(true);
      
      // ゲーム状態が更新されていることを確認
      expect(updatedState).not.toEqual(gameState);
    });

    test('should process player turn with valid card play', () => {
      // Red: プレイヤーターンでの有効なカードプレイ処理
      const gameState = adapter.createGame(4);
      const deck = adapter.createDeck();
      const dealtState = adapter.processTurn(gameState, ['deal-cards', deck]);
      
      // プレイヤー0の手札から最初のカードを出す
      const testCard = adapter.createCard('♠', '3');
      const cardToPlay = [testCard];
      
      const playAction = ['play-cards', 0, cardToPlay];
      const newState = adapter.processTurn(dealtState, playAction);
      
      expect(newState).toBeDefined();
      expect(Array.isArray(newState)).toBe(true);
      
      // ターンが次のプレイヤーに進んでいることを確認
      const currentPlayer = adapter.getCurrentPlayer(newState);
      expect(currentPlayer).toBe(1);
    });

    test('should handle pass action and advance turn', () => {
      // Red: パスアクションとターン進行の処理
      const gameState = adapter.createGame(4);
      
      // プレイヤー0がパス
      const passAction = ['pass', 0];
      const newState = adapter.processTurn(gameState, passAction);
      
      expect(newState).toBeDefined();
      
      // ターンが次のプレイヤーに進んでいることを確認
      const currentPlayer = adapter.getCurrentPlayer(newState);
      expect(currentPlayer).toBe(1);
    });

    test('should detect game end condition', () => {
      // Red: ゲーム終了条件の検出
      const gameState = adapter.createGame(4);
      
      // ゲーム終了条件をチェック
      const gameEndResult = adapter.checkGameEnd(gameState);
      
      expect(gameEndResult).toBeDefined();
      expect(Array.isArray(gameEndResult)).toBe(true);
      
      // 初期状態ではゲームが終了していないはず
      expect(gameEndResult[0]).toBe('game-continue');
    });

    test('should calculate player rankings', () => {
      // Red: プレイヤーランキングの計算
      const gameState = adapter.createGame(4);
      
      // ランキング計算
      const rankings = adapter.calculateRanking(gameState);
      
      expect(rankings).toBeDefined();
      expect(Array.isArray(rankings)).toBe(true);
      expect(rankings.length).toBe(4); // 4人分のランキング
    });
  });

  describe('エラーハンドリングと境界ケース', () => {
    test('should handle invalid card play', () => {
      // Red: 無効なカードプレイの処理
      const gameState = adapter.createGame(4);
      const invalidCards = []; // 空のカード配列は無効
      
      const validation = adapter.validatePlay(gameState, invalidCards);
      
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
      expect(validation[0]).toBe('invalid'); // 無効なプレイとして判定
    });

    test('should handle empty hand scenario', () => {
      // Red: 手札が空の場合の処理
      const gameState = adapter.createGame(4);
      
      // 空の手札でのプレイ試行
      const emptyHand = [];
      const validation = adapter.validatePlay(gameState, emptyHand);
      
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
    });
  });

  describe('パフォーマンスとメモリ使用量', () => {
    test('should complete full game within reasonable time', () => {
      // Red: 妥当な時間内での完全ゲーム実行
      const startTime = Date.now();
      
      const gameState = adapter.createGame(4);
      const deck = adapter.createDeck();
      const dealtState = adapter.processTurn(gameState, ['deal-cards', deck]);
      
      // 各プレイヤーが1回ずつアクションを実行
      let currentState = dealtState;
      for (let turn = 0; turn < 4; turn++) {
        const passAction = ['pass', 0];
        currentState = adapter.processTurn(currentState, passAction);
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // 1秒以内で完了
    });

    test('should not leak memory during game operations', () => {
      // Red: ゲーム操作中のメモリリーク防止
      const initialStats = adapter.getStats();
      
      // 複数回のゲーム操作を実行
      for (let i = 0; i < 10; i++) {
        const gameState = adapter.createGame(4);
        const deck = adapter.createDeck();
        adapter.processTurn(gameState, ['deal-cards', deck]);
      }
      
      const finalStats = adapter.getStats();
      
      expect(finalStats.isReady).toBe(true);
      expect(finalStats.cacheSize).toBeLessThan(100); // キャッシュサイズが制限内
    });
  });
});