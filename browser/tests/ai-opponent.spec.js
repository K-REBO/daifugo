import LispGameAdapter from '../js/lisp-game-adapter.js';

// Phase 8.3 AI対戦相手テスト
// TDD Red Phase: Pure LispでのAI思考ロジック基本テスト

describe('AI Opponent System', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new LispGameAdapter();
    await adapter.initialize();
    await adapter.waitForReady();
  });

  describe('基本AI思考ロジック', () => {
    test('should create AI player instance', () => {
      // Red: AI プレイヤーインスタンス作成
      const gameState = adapter.createGame(4);
      const aiPlayer = adapter.createAIPlayer(1, 'basic');
      
      expect(aiPlayer).toBeDefined();
      expect(aiPlayer.id).toBe(1);
      expect(aiPlayer.difficulty).toBe('basic');
    });

    test('should analyze available cards', () => {
      // Red: 利用可能カードの分析
      const gameState = adapter.createGame(4);
      const hand = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '7'),
        adapter.createCard('♦', 'Q')
      ];
      
      const analysis = adapter.analyzeHand(hand, gameState);
      
      expect(analysis).toBeDefined();
      expect(analysis.playableCards).toBeDefined();
      expect(Array.isArray(analysis.playableCards)).toBe(true);
    });

    test('should make basic play decision', () => {
      // Red: 基本的なプレイ判断
      const gameState = adapter.createGame(4);
      const hand = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', '7'),
        adapter.createCard('♦', 'Q')
      ];
      
      const decision = adapter.makeAIDecision(hand, gameState, 'basic');
      
      expect(decision).toBeDefined();
      expect(decision.action).toBeDefined();
      expect(['play', 'pass'].includes(decision.action)).toBe(true);
      
      if (decision.action === 'play') {
        expect(decision.cards).toBeDefined();
        expect(Array.isArray(decision.cards)).toBe(true);
        expect(decision.cards.length).toBeGreaterThan(0);
      }
    });

    test('should pass when no valid plays available', () => {
      // Red: 有効なプレイがない場合のパス判断
      const gameState = adapter.createGame(4);
      
      // 場に強いカードがある状態を作成
      const fieldCards = [adapter.createCard('♠', 'A')];
      const stateWithField = adapter.processTurn(gameState, {
        type: 'play',
        cards: fieldCards
      });
      
      // 弱いカードしかない手札
      const weakHand = [
        adapter.createCard('♥', '3'),
        adapter.createCard('♦', '4')
      ];
      
      const decision = adapter.makeAIDecision(weakHand, stateWithField, 'basic');
      
      expect(decision).toBeDefined();
      expect(decision.action).toBe('pass');
    });
  });

  describe('AI難易度レベル', () => {
    test('should handle easy difficulty AI', () => {
      // Red: 簡単レベルAI
      const gameState = adapter.createGame(4);
      const hand = [adapter.createCard('♠', '7'), adapter.createCard('♥', '8')];
      
      const decision = adapter.makeAIDecision(hand, gameState, 'easy');
      
      expect(decision).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect(decision.reasoning).toContain('easy');
    });

    test('should handle medium difficulty AI', () => {
      // Red: 中級レベルAI
      const gameState = adapter.createGame(4);
      const hand = [adapter.createCard('♠', '7'), adapter.createCard('♥', '8')];
      
      const decision = adapter.makeAIDecision(hand, gameState, 'medium');
      
      expect(decision).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
    });

    test('should handle hard difficulty AI', () => {
      // Red: 上級レベルAI
      const gameState = adapter.createGame(4);
      const hand = [adapter.createCard('♠', '7'), adapter.createCard('♥', '8')];
      
      const decision = adapter.makeAIDecision(hand, gameState, 'hard');
      
      expect(decision).toBeDefined();
      expect(decision.strategy).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('戦略的AI判断', () => {
    test('should prioritize getting rid of low cards', () => {
      // Red: 低いカードを優先的に出す戦略
      const gameState = adapter.createGame(4);
      const hand = [
        adapter.createCard('♠', '3'),
        adapter.createCard('♥', '7'),
        adapter.createCard('♦', 'K')
      ];
      
      const decision = adapter.makeAIDecision(hand, gameState, 'medium');
      
      expect(decision).toBeDefined();
      if (decision.action === 'play') {
        // 最も低いカードを選ぶはず
        const playedCard = decision.cards[0];
        expect(playedCard[2]).toBe('3'); // ランクが3
      }
    });

    test('should save strong cards for late game', () => {
      // Red: 強いカードを終盤まで温存する戦略
      const gameState = adapter.createGame(4);
      const hand = [
        adapter.createCard('♠', '5'),
        adapter.createCard('♥', 'A'),
        adapter.createCard('♦', '2')
      ];
      
      const strategy = adapter.getAIStrategy(hand, gameState, 'hard');
      
      expect(strategy).toBeDefined();
      expect(strategy.saveCards).toBeDefined();
      expect(strategy.saveCards.some(card => card[2] === 'A' || card[2] === '2')).toBe(true);
    });

    test('should consider opponent hand sizes', () => {
      // Red: 相手の手札数を考慮した判断
      const gameState = adapter.createGame(4);
      
      // プレイヤー1の手札が少ない状況を模擬
      const gameStateWithHands = adapter.setPlayerHand(gameState, 1, [
        adapter.createCard('♠', '5')
      ]);
      
      const hand = [adapter.createCard('♥', '7'), adapter.createCard('♦', 'Q')];
      const decision = adapter.makeAIDecision(hand, gameStateWithHands, 'hard');
      
      expect(decision).toBeDefined();
      expect(decision.opponentAnalysis).toBeDefined();
      expect(decision.opponentAnalysis.threatLevel).toBeGreaterThan(0);
    });
  });

  describe('AIとゲームフローの統合', () => {
    test('should process AI turn automatically', () => {
      // Red: AIターンの自動処理
      const gameState = adapter.createGame(4);
      
      // AIプレイヤーの手札を設定
      const aiHand = [adapter.createCard('♠', '6'), adapter.createCard('♥', '9')];
      const stateWithHand = adapter.setPlayerHand(gameState, 1, aiHand);
      
      const result = adapter.processAITurn(stateWithHand, 1, 'medium');
      
      expect(result).toBeDefined();
      expect(result.newState).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.executionTime).toBeLessThan(1000); // 1秒以内
    });

    test('should handle multiple AI players', () => {
      // Red: 複数AIプレイヤーの処理
      const gameState = adapter.createGame(4);
      
      // プレイヤー1, 2, 3をAIに設定
      const aiPlayers = [
        { id: 1, difficulty: 'easy' },
        { id: 2, difficulty: 'medium' },
        { id: 3, difficulty: 'hard' }
      ];
      
      const gameWithAI = adapter.setAIPlayers(gameState, aiPlayers);
      
      expect(gameWithAI).toBeDefined();
      expect(gameWithAI.aiPlayers).toBeDefined();
      expect(gameWithAI.aiPlayers.length).toBe(3);
    });

    test('should maintain thinking time for realism', () => {
      // Red: リアルな思考時間の維持
      const gameState = adapter.createGame(4);
      const hand = [adapter.createCard('♠', '7')];
      
      const startTime = Date.now();
      const decision = adapter.makeAIDecisionWithDelay(hand, gameState, 'medium');
      
      return decision.then(result => {
        const elapsed = Date.now() - startTime;
        expect(result).toBeDefined();
        expect(elapsed).toBeGreaterThan(500); // 最低500ms
        expect(elapsed).toBeLessThan(3000); // 最大3秒
      });
    });
  });

  describe('Pure Lisp AI実装', () => {
    test('should evaluate card strength in Lisp', () => {
      // Red: Lispでのカード強度評価
      const card = adapter.createCard('♠', '7');
      const strength = adapter.evaluateCardStrength(card, false); // 通常モード
      
      expect(strength).toBeDefined();
      expect(typeof strength).toBe('number');
      expect(strength).toBeGreaterThan(0);
    });

    test('should use Lisp for decision logic', () => {
      // Red: 判断ロジックでのLisp使用
      const gameState = adapter.createGame(4);
      const hand = [adapter.createCard('♠', '5'), adapter.createCard('♥', '8')];
      
      const lispDecision = adapter.makeLispAIDecision(hand, gameState);
      
      expect(lispDecision).toBeDefined();
      expect(Array.isArray(lispDecision)).toBe(true);
      expect(lispDecision[0]).toBeDefined(); // アクション
    });
  });
});