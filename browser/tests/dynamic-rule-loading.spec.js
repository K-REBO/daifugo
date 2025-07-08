import LispGameAdapter from '../js/lisp-game-adapter.js';

// Phase 8.4: 特殊ルールの動的読み込み
// TDD Red Phase: ブラウザでユーザーが.lispファイルをアップロードして特殊ルールを追加できるテストを追加し、失敗させる

describe('Dynamic Rule Loading System', () => {
  let adapter;
  let mockFileReader;

  beforeEach(async () => {
    adapter = new LispGameAdapter();
    await adapter.initialize();
    await adapter.waitForReady();

    // Mock FileReader for browser testing
    mockFileReader = {
      result: null,
      onload: null,
      onerror: null,
      readAsText: function(file) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: this.result } });
          }
        }, 10);
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);
  });

  describe('ファイルアップロード機能', () => {
    test('should handle .lisp file upload', async () => {
      // Red: .lispファイルのアップロード処理
      const mockFile = new File(['(defrule test-rule "Test rule" (lambda (cards) t))'], 'test-rule.lisp', {
        type: 'text/plain'
      });

      const uploadResult = await adapter.uploadRuleFile(mockFile);
      
      expect(uploadResult).toBeDefined();
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.fileName).toBe('test-rule.lisp');
      expect(uploadResult.ruleName).toBe('test-rule');
    });

    test('should validate file type', async () => {
      // Red: ファイル形式の検証
      const invalidFile = new File(['invalid content'], 'test.txt', {
        type: 'text/plain'
      });

      const uploadResult = await adapter.uploadRuleFile(invalidFile);
      
      expect(uploadResult).toBeDefined();
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toContain('Invalid file type');
    });

    test('should validate file size', async () => {
      // Red: ファイルサイズ制限の検証
      const largeContent = 'A'.repeat(100000); // 100KB
      const largeFile = new File([largeContent], 'large-rule.lisp', {
        type: 'text/plain'
      });

      const uploadResult = await adapter.uploadRuleFile(largeFile);
      
      expect(uploadResult).toBeDefined();
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toContain('File too large');
    });

    test('should parse and validate Lisp syntax', async () => {
      // Red: Lisp構文の検証
      const invalidLispFile = new File(['(invalid lisp syntax'], 'invalid.lisp', {
        type: 'text/plain'
      });

      mockFileReader.result = '(invalid lisp syntax';

      const uploadResult = await adapter.uploadRuleFile(invalidLispFile);
      
      expect(uploadResult).toBeDefined();
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toContain('Invalid Lisp syntax');
    });
  });

  describe('動的ルール読み込み', () => {
    test('should load rule into Lisp environment', async () => {
      // Red: Lisp環境へのルール読み込み
      const ruleContent = `
        (defrule custom-rule "Custom rule for testing"
          (lambda (cards field-state)
            (> (length cards) 2)))
      `;
      
      const ruleFile = new File([ruleContent], 'custom-rule.lisp', {
        type: 'text/plain'
      });

      mockFileReader.result = ruleContent;

      const loadResult = await adapter.loadDynamicRule(ruleFile);
      
      expect(loadResult).toBeDefined();
      expect(loadResult.success).toBe(true);
      expect(loadResult.ruleName).toBe('custom-rule');
      
      // ルールが実際に登録されているか確認
      const registeredRules = adapter.getRegisteredRules();
      expect(registeredRules).toContain('custom-rule');
    });

    test('should handle multiple rule definitions in one file', async () => {
      // Red: 複数ルール定義の処理
      const multiRuleContent = `
        (defrule rule-one "First rule"
          (lambda (cards) (> (length cards) 1)))
        
        (defrule rule-two "Second rule"
          (lambda (cards) (< (length cards) 5)))
      `;
      
      const multiRuleFile = new File([multiRuleContent], 'multi-rules.lisp', {
        type: 'text/plain'
      });

      mockFileReader.result = multiRuleContent;

      const loadResult = await adapter.loadDynamicRule(multiRuleFile);
      
      expect(loadResult).toBeDefined();
      expect(loadResult.success).toBe(true);
      expect(loadResult.rulesLoaded).toBe(2);
      expect(loadResult.ruleNames).toEqual(['rule-one', 'rule-two']);
    });

    test('should apply loaded rules in game', async () => {
      // Red: 読み込んだルールのゲーム内適用
      const gameState = adapter.createGame(4);
      
      // カスタムルールを読み込み
      const ruleContent = `
        (defrule no-single-cards "No single cards allowed"
          (lambda (cards field-state)
            (> (length cards) 1)))
      `;
      
      const ruleFile = new File([ruleContent], 'no-single.lisp', {
        type: 'text/plain'
      });

      mockFileReader.result = ruleContent;
      await adapter.loadDynamicRule(ruleFile);
      
      // シングルカードのプレイをテスト
      const singleCard = [adapter.createCard('♠', '7')];
      const validation = adapter.validatePlay(gameState, singleCard);
      
      expect(validation).toBeDefined();
      expect(validation[0]).toBe('invalid'); // カスタムルールにより無効
      expect(validation[1]).toContain('No single cards allowed');
    });

    test('should handle rule conflicts', async () => {
      // Red: ルールの競合処理
      const conflictingRuleContent = `
        (defrule conflicting-rule "Conflicts with existing rule"
          (lambda (cards field-state)
            nil)) ; 常に無効
      `;
      
      const ruleFile = new File([conflictingRuleContent], 'conflict.lisp', {
        type: 'text/plain'
      });

      mockFileReader.result = conflictingRuleContent;

      const loadResult = await adapter.loadDynamicRule(ruleFile);
      
      expect(loadResult).toBeDefined();
      expect(loadResult.success).toBe(true);
      expect(loadResult.warnings).toBeDefined();
      expect(loadResult.warnings.length).toBeGreaterThan(0);
      expect(loadResult.warnings[0]).toContain('Rule conflict detected');
    });
  });

  describe('ルール管理機能', () => {
    test('should list all registered rules', () => {
      // Red: 登録済みルール一覧の取得
      const rules = adapter.getRegisteredRules();
      
      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      
      // デフォルトルールが含まれているか確認
      expect(rules).toContain('basic-play');
      expect(rules).toContain('card-strength');
    });

    test('should get rule details', () => {
      // Red: ルール詳細情報の取得
      const ruleDetails = adapter.getRuleDetails('basic-play');
      
      expect(ruleDetails).toBeDefined();
      expect(ruleDetails.name).toBe('basic-play');
      expect(ruleDetails.description).toBeDefined();
      expect(ruleDetails.isActive).toBe(true);
      expect(ruleDetails.priority).toBeDefined();
    });

    test('should enable/disable rules', () => {
      // Red: ルールの有効/無効切り替え
      const ruleName = 'basic-play';
      
      // ルールを無効化
      const disableResult = adapter.setRuleActive(ruleName, false);
      expect(disableResult.success).toBe(true);
      
      const ruleDetails = adapter.getRuleDetails(ruleName);
      expect(ruleDetails.isActive).toBe(false);
      
      // ルールを有効化
      const enableResult = adapter.setRuleActive(ruleName, true);
      expect(enableResult.success).toBe(true);
      
      const reenabledDetails = adapter.getRuleDetails(ruleName);
      expect(reenabledDetails.isActive).toBe(true);
    });

    test('should remove dynamically loaded rules', () => {
      // Red: 動的読み込みルールの削除
      const ruleName = 'test-dynamic-rule';
      
      // まずルールを読み込み
      const ruleContent = `(defrule ${ruleName} "Test rule" (lambda (cards) t))`;
      const loadResult = adapter.loadRuleFromString(ruleContent);
      expect(loadResult.success).toBe(true);
      
      // ルールが登録されていることを確認
      const rulesBeforeRemove = adapter.getRegisteredRules();
      expect(rulesBeforeRemove).toContain(ruleName);
      
      // ルールを削除
      const removeResult = adapter.removeRule(ruleName);
      expect(removeResult.success).toBe(true);
      
      // ルールが削除されたことを確認
      const rulesAfterRemove = adapter.getRegisteredRules();
      expect(rulesAfterRemove).not.toContain(ruleName);
    });
  });

  describe('セキュリティとエラーハンドリング', () => {
    test('should sanitize malicious code', async () => {
      // Red: 悪意のあるコードのサニタイズ
      const maliciousContent = `
        (defrule malicious-rule "Malicious rule"
          (lambda (cards)
            (eval "(delete-file 'important-file')")
            t))
      `;
      
      const maliciousFile = new File([maliciousContent], 'malicious.lisp', {
        type: 'text/plain'
      });

      mockFileReader.result = maliciousContent;

      const loadResult = await adapter.loadDynamicRule(maliciousFile);
      
      expect(loadResult).toBeDefined();
      expect(loadResult.success).toBe(false);
      expect(loadResult.error).toContain('Security violation');
    });

    test('should handle file reading errors', async () => {
      // Red: ファイル読み込みエラーの処理
      const testFile = new File(['test content'], 'test.lisp', {
        type: 'text/plain'
      });

      // FileReaderエラーをシミュレート
      mockFileReader.readAsText = function(file) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('File read error'));
          }
        }, 10);
      };

      const uploadResult = await adapter.uploadRuleFile(testFile);
      
      expect(uploadResult).toBeDefined();
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toContain('Failed to read file');
    });

    test('should limit number of custom rules', async () => {
      // Red: カスタムルール数の制限
      const maxRules = 10;
      
      // 制限を超えるルールを読み込もうとする
      for (let i = 0; i < maxRules + 1; i++) {
        const ruleContent = `(defrule rule-${i} "Rule ${i}" (lambda (cards) t))`;
        const ruleFile = new File([ruleContent], `rule-${i}.lisp`, {
          type: 'text/plain'
        });

        mockFileReader.result = ruleContent;
        
        const loadResult = await adapter.loadDynamicRule(ruleFile);
        
        if (i < maxRules) {
          expect(loadResult.success).toBe(true);
        } else {
          expect(loadResult.success).toBe(false);
          expect(loadResult.error).toContain('Maximum number of custom rules exceeded');
        }
      }
    });
  });
});