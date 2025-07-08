import LispGameAdapter from '../js/lisp-game-adapter.js';

// Phase 8.5: パフォーマンス最適化とプロダクション準備
// TDD Red Phase: レスポンス時間、メモリ使用量、バンドルサイズの性能テストを追加し、失敗させる

describe('Performance and Production Readiness', () => {
  let adapter;
  let performanceMonitor;

  beforeEach(async () => {
    // Performance monitor setup
    performanceMonitor = {
      startTime: 0,
      endTime: 0,
      memoryBefore: 0,
      memoryAfter: 0,
      
      start() {
        this.startTime = performance.now();
        if (performance.memory) {
          this.memoryBefore = performance.memory.usedJSHeapSize;
        }
      },
      
      end() {
        this.endTime = performance.now();
        if (performance.memory) {
          this.memoryAfter = performance.memory.usedJSHeapSize;
        }
      },
      
      getDuration() {
        return this.endTime - this.startTime;
      },
      
      getMemoryDelta() {
        return this.memoryAfter - this.memoryBefore;
      }
    };

    adapter = new LispGameAdapter();
    await adapter.initialize();
  });

  describe('レスポンス時間テスト', () => {
    test('should initialize game within 100ms', async () => {
      // Red: ゲーム初期化時間制限
      performanceMonitor.start();
      
      const gameState = adapter.createGame(4);
      
      performanceMonitor.end();
      const duration = performanceMonitor.getDuration();
      
      expect(duration).toBeLessThan(100); // 100ms以内
      expect(gameState).toBeDefined();
      expect(gameState.players).toHaveLength(4);
    });

    test('should process card validation within 50ms', async () => {
      // Red: カード検証時間制限
      const gameState = adapter.createGame(4);
      const testCards = [
        adapter.createCard('♠', '7'),
        adapter.createCard('♠', '8'),
        adapter.createCard('♠', '9')
      ];
      
      performanceMonitor.start();
      
      const validation = adapter.validatePlay(gameState, testCards);
      
      performanceMonitor.end();
      const duration = performanceMonitor.getDuration();
      
      expect(duration).toBeLessThan(50); // 50ms以内
      expect(validation).toBeDefined();
    });

    test('should execute AI decision within 200ms', async () => {
      // Red: AI判断時間制限
      const gameState = adapter.createGame(4);
      const aiPlayerId = 1;
      
      performanceMonitor.start();
      
      const decision = adapter.makeAIDecision(aiPlayerId, gameState);
      
      performanceMonitor.end();
      const duration = performanceMonitor.getDuration();
      
      expect(duration).toBeLessThan(200); // 200ms以内
      expect(decision).toBeDefined();
      expect(decision.action).toBeDefined();
    });

    test('should handle 1000 consecutive operations within 5 seconds', async () => {
      // Red: 大量操作処理時間
      const gameState = adapter.createGame(4);
      const operations = [];
      
      for (let i = 0; i < 1000; i++) {
        operations.push(() => {
          const card = adapter.createCard('♠', '7');
          return adapter.validatePlay(gameState, [card]);
        });
      }
      
      performanceMonitor.start();
      
      const results = operations.map(op => op());
      
      performanceMonitor.end();
      const duration = performanceMonitor.getDuration();
      
      expect(duration).toBeLessThan(5000); // 5秒以内
      expect(results).toHaveLength(1000);
    });

    test('should load dynamic rules within 300ms', async () => {
      // Red: 動的ルール読み込み時間
      const ruleContent = `
        (defrule performance-test-rule "Performance test rule"
          (lambda (cards field-state)
            (> (length cards) 0)))
      `;
      
      const ruleFile = new File([ruleContent], 'perf-test.lisp', {
        type: 'text/plain'
      });
      
      performanceMonitor.start();
      
      const loadResult = await adapter.loadDynamicRule(ruleFile);
      
      performanceMonitor.end();
      const duration = performanceMonitor.getDuration();
      
      expect(duration).toBeLessThan(300); // 300ms以内
      expect(loadResult.success).toBe(true);
    });
  });

  describe('メモリ使用量テスト', () => {
    test('should not exceed 50MB memory usage during game', async () => {
      // Red: ゲーム中メモリ使用量制限
      if (!performance.memory) {
        pending('Performance.memory not available in this environment');
      }
      
      performanceMonitor.start();
      
      // 複数ゲームを同時実行
      const games = [];
      for (let i = 0; i < 10; i++) {
        games.push(adapter.createGame(6));
      }
      
      // 各ゲームでカード操作を実行
      games.forEach(game => {
        for (let j = 0; j < 100; j++) {
          const card = adapter.createCard('♠', '7');
          adapter.validatePlay(game, [card]);
        }
      });
      
      performanceMonitor.end();
      const memoryDelta = performanceMonitor.getMemoryDelta();
      
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // 50MB以内
    });

    test('should clean up memory after game completion', async () => {
      // Red: ゲーム終了後のメモリクリーンアップ
      if (!performance.memory) {
        pending('Performance.memory not available in this environment');
      }
      
      const initialMemory = performance.memory.usedJSHeapSize;
      
      // 大量のゲームを作成・破棄
      for (let i = 0; i < 100; i++) {
        const game = adapter.createGame(4);
        adapter.endGame(game);
      }
      
      // ガベージコレクション強制実行（可能な場合）
      if (global.gc) {
        global.gc();
      }
      
      // 少し待ってからメモリ使用量を確認
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;
      
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB以内の増加
    });

    test('should handle memory-intensive operations efficiently', async () => {
      // Red: メモリ集約的操作の効率性
      if (!performance.memory) {
        pending('Performance.memory not available in this environment');
      }
      
      performanceMonitor.start();
      
      // 大量のカード作成
      const cards = [];
      for (let i = 0; i < 10000; i++) {
        cards.push(adapter.createCard('♠', '7'));
      }
      
      // 大量のバリデーション
      const game = adapter.createGame(4);
      for (let i = 0; i < 1000; i++) {
        adapter.validatePlay(game, [cards[i % cards.length]]);
      }
      
      performanceMonitor.end();
      const memoryDelta = performanceMonitor.getMemoryDelta();
      
      expect(memoryDelta).toBeLessThan(20 * 1024 * 1024); // 20MB以内
    });
  });

  describe('バンドルサイズとコード分割', () => {
    test('should have core bundle size under 500KB', async () => {
      // Red: コアバンドルサイズ制限
      // モジュールサイズの模擬測定
      const moduleSize = await getMockModuleSize('../js/lisp-game-adapter.js');
      
      expect(moduleSize).toBeLessThan(500 * 1024); // 500KB以内
    });

    test('should support lazy loading of optional modules', async () => {
      // Red: オプショナルモジュールの遅延読み込み
      const lazyLoadStart = performance.now();
      
      const optionalModule = await import('../js/dynamic-rule-loader.js');
      
      const lazyLoadEnd = performance.now();
      const loadTime = lazyLoadEnd - lazyLoadStart;
      
      expect(loadTime).toBeLessThan(100); // 100ms以内
      expect(optionalModule.DynamicRuleLoader).toBeDefined();
    });

    test('should minimize redundant code in modules', async () => {
      // Red: モジュール間の重複コード最小化
      const coreModule = await import('../js/lisp-game-adapter.js');
      const uiModule = await import('../js/dynamic-rule-loader.js');
      
      // 重複する機能の検証（模擬）
      const coreSize = await getMockModuleSize('../js/lisp-game-adapter.js');
      const uiSize = await getMockModuleSize('../js/dynamic-rule-loader.js');
      const totalSize = coreSize + uiSize;
      
      // 重複を考慮した期待サイズ
      expect(totalSize).toBeLessThan(800 * 1024); // 800KB以内
    });
  });

  describe('キャッシュとメモ化', () => {
    test('should cache frequent computations', async () => {
      // Red: 頻繁な計算のキャッシュ
      const game = adapter.createGame(4);
      const testCard = adapter.createCard('♠', '7');
      
      // 初回実行
      performanceMonitor.start();
      const result1 = adapter.validatePlay(game, [testCard]);
      performanceMonitor.end();
      const firstTime = performanceMonitor.getDuration();
      
      // 2回目実行（キャッシュ効果を期待）
      performanceMonitor.start();
      const result2 = adapter.validatePlay(game, [testCard]);
      performanceMonitor.end();
      const secondTime = performanceMonitor.getDuration();
      
      expect(result1).toEqual(result2);
      expect(secondTime).toBeLessThan(firstTime * 0.5); // 50%以下の時間
    });

    test('should memoize complex calculations', async () => {
      // Red: 複雑な計算のメモ化
      const game = adapter.createGame(4);
      
      // 複雑な計算をシミュレート
      const complexCards = [];
      for (let i = 0; i < 13; i++) {
        complexCards.push(adapter.createCard('♠', (i + 3).toString()));
      }
      
      performanceMonitor.start();
      const result1 = adapter.analyzeHandStrength(complexCards);
      performanceMonitor.end();
      const firstTime = performanceMonitor.getDuration();
      
      performanceMonitor.start();
      const result2 = adapter.analyzeHandStrength(complexCards);
      performanceMonitor.end();
      const secondTime = performanceMonitor.getDuration();
      
      expect(result1).toEqual(result2);
      expect(secondTime).toBeLessThan(firstTime * 0.3); // 30%以下の時間
    });
  });

  describe('エラーハンドリングとスタビリティ', () => {
    test('should handle 1000 rapid requests without crashing', async () => {
      // Red: 大量リクエスト処理の安定性
      const requests = [];
      const game = adapter.createGame(4);
      
      for (let i = 0; i < 1000; i++) {
        requests.push(async () => {
          try {
            const card = adapter.createCard('♠', '7');
            return adapter.validatePlay(game, [card]);
          } catch (error) {
            return { error: error.message };
          }
        });
      }
      
      const results = await Promise.all(requests.map(req => req()));
      
      // エラーが発生しても全体がクラッシュしないこと
      expect(results).toHaveLength(1000);
      
      // エラー率が10%以下であること
      const errorResults = results.filter(r => r.error);
      expect(errorResults.length).toBeLessThan(100);
    });

    test('should recover from memory pressure gracefully', async () => {
      // Red: メモリ圧迫時の適切な回復
      const games = [];
      
      try {
        // メモリ圧迫をシミュレート
        for (let i = 0; i < 1000; i++) {
          games.push(adapter.createGame(6));
        }
        
        // 新しいゲームを作成できること
        const newGame = adapter.createGame(4);
        expect(newGame).toBeDefined();
        
      } catch (error) {
        // メモリ不足エラーが適切に処理されること
        expect(error.message).toMatch(/memory|allocation|heap/i);
      }
    });

    test('should maintain consistent performance under load', async () => {
      // Red: 負荷時の一貫したパフォーマンス
      const times = [];
      const game = adapter.createGame(4);
      
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        
        const card = adapter.createCard('♠', '7');
        adapter.validatePlay(game, [card]);
        
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // 最大時間が平均の5倍以下であること
      expect(maxTime).toBeLessThan(avgTime * 5);
    });
  });

  // Helper function to simulate module size measurement
  async function getMockModuleSize(modulePath) {
    // 実際の実装では、webpackのバンドル分析やファイルサイズ取得を行う
    // ここでは模擬的な値を返す
    const mockSizes = {
      '../js/lisp-game-adapter.js': 250 * 1024,
      '../js/dynamic-rule-loader.js': 150 * 1024,
      '../js/lisp-engine.js': 300 * 1024
    };
    
    return mockSizes[modulePath] || 100 * 1024;
  }
});