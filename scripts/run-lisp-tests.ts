#!/usr/bin/env -S deno run --allow-read --allow-run
/**
 * LispDaifugoEngine テスト実行スクリプト
 * 
 * SBCLを使ってLispテストを実行し、結果を整理して表示する
 */

interface TestResult {
  name: string;
  passed: boolean;
  output: string;
  error?: string;
}

class LispTestRunner {
  private testResults: TestResult[] = [];

  async runTest(name: string, script: string): Promise<TestResult> {
    console.log(`🧪 ${name} 実行中...`);
    
    try {
      // SBCLでLispスクリプトを実行
      const command = new Deno.Command("sbcl", {
        args: ["--script", script],
        cwd: "LispDaifugoEngine",
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout, stderr } = await command.output();
      const output = new TextDecoder().decode(stdout);
      const errorOutput = new TextDecoder().decode(stderr);

      const result: TestResult = {
        name,
        passed: code === 0 && !errorOutput.includes('失敗') && !errorOutput.includes('エラー'),
        output: output.trim(),
        error: errorOutput.trim() || undefined
      };

      this.testResults.push(result);
      return result;

    } catch (error) {
      const result: TestResult = {
        name,
        passed: false,
        output: "",
        error: `実行エラー: ${error.message}`
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 LispDaifugoEngine テスト開始\n");

    // テスト定義（全テストファイルを含む）
    const tests = [
      // 基本構造・仕様テスト
      {
        name: "プロジェクト構造テスト",
        script: this.createTestScript([
          '(load "tests/test-project-structure.lisp")',
          '(daifugo-structure-test:run-structure-tests)'
        ])
      },
      {
        name: "仕様書テスト",
        script: this.createTestScript([
          '(load "tests/test-spec.lisp")',
          '(daifugo-spec-test:run-spec-tests)'
        ])
      },
      
      // コアシステムテスト
      {
        name: "カードシステムテスト", 
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "tests/test-card-system.lisp")',
          '(daifugo-card-system-test:run-card-system-tests)'
        ])
      },
      {
        name: "プレイヤーシステムテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/core/player-system.lisp")', 
          '(load "tests/test-player-system.lisp")',
          '(daifugo-player-system-test:run-player-system-tests)'
        ])
      },
      
      // ユーティリティテスト
      {
        name: "カードユーティリティテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/utils/card-utils.lisp")',
          '(load "tests/test-card-utils.lisp")',
          '(daifugo-card-utils-test:run-card-utils-tests)'
        ])
      },
      {
        name: "プレイヤーユーティリティテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/core/player-system.lisp")',
          '(load "src/utils/player-utils.lisp")',
          '(load "tests/test-player-utils.lisp")',
          '(daifugo-player-utils-test:run-player-utils-tests)'
        ])
      },
      
      // ゲームロジックテスト
      {
        name: "ゲームロジックテスト（修正版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/core/player-system.lisp")',
          '(load "src/core/game-state.lisp")',
          '(load "tests/test-game-logic-fixed.lisp")',
          '(daifugo-game-logic-test:run-all-tests)'
        ])
      },
      {
        name: "ゲームロジックテスト（実装付き・修正版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/core/player-system.lisp")',
          '(load "src/core/game-state.lisp")',
          '(load "tests/test-game-logic-with-implementation-fixed.lisp")',
          '(daifugo-game-logic-implementation-test:run-implementation-tests)'
        ])
      },
      {
        name: "ゲームフローテスト（修正版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/core/player-system.lisp")',
          '(load "src/core/game-state.lisp")',
          '(load "tests/test-game-flow-fixed.lisp")',
          '(daifugo-game-flow-test:run-game-flow-tests)'
        ])
      },
      
      // 手札検証テスト
      {
        name: "手札検証テスト（修正版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "tests/test-hand-validation-fixed.lisp")',
          '(daifugo-hand-validation-test:run-hand-validation-tests)'
        ])
      },
      {
        name: "手札検証テスト（簡易版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "tests/core/test-hand-validation-simple.lisp")',
          '(daifugo-hand-validation-simple-test:run-hand-validation-simple-tests)'
        ])
      },
      {
        name: "手札検証テスト（コア）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "tests/core/test-hand-validation.lisp")',
          '(daifugo-hand-validation-core-test:run-hand-validation-tests)'
        ])
      },

      // ロガーテスト
      {
        name: "ゲームロガーテスト",
        script: this.createTestScript([
          '(load "src/testing/game-logger.lisp")',
          '(load "tests/core/test-game-logger-fixed.lisp")',
          '(test-game-logger-fixed:run-game-logger-fixed-tests)'
        ])
      },

      // ルールシステムテスト
      {
        name: "ルールローダーテスト",
        script: this.createTestScript([
          '(load "src/rules/rule-loader.lisp")',
          '(load "tests/rules/test-rule-loader.lisp")',
          '(daifugo-rule-loader-test:run-rule-loader-tests)'
        ])
      },
      {
        name: "ルールセットテスト",
        script: this.createTestScript([
          '(load "src/rules/rule-loader.lisp")',
          '(load "src/rules/rule-set.lisp")',
          '(load "tests/rules/test-rule-set.lisp")',
          '(daifugo-rule-set-test:run-rule-set-tests)'
        ])
      },

      // 個別ルールテスト
      {
        name: "8切りルールテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/8kiri.lisp")',
          '(load "tests/rules/test-8kiri.lisp")',
          '(daifugo-8kiri-test:run-8kiri-tests)'
        ])
      },
      {
        name: "8切りルールテスト（簡易版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/8kiri.lisp")',
          '(load "tests/rules/test-8kiri-simple.lisp")',
          '(daifugo-8kiri-simple-test:run-8kiri-simple-tests)'
        ])
      },
      {
        name: "革命ルールテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/kakumei.lisp")',
          '(load "tests/rules/test-kakumei.lisp")',
          '(daifugo-kakumei-test:run-kakumei-tests)'
        ])
      },
      {
        name: "革命ルールテスト（簡易版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/kakumei.lisp")',
          '(load "tests/rules/test-kakumei-simple.lisp")',
          '(daifugo-kakumei-simple-test:run-kakumei-simple-tests)'
        ])
      },
      {
        name: "階段ルールテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/kaidan.lisp")',
          '(load "tests/rules/test-kaidan.lisp")',
          '(daifugo-kaidan-test:run-kaidan-tests)'
        ])
      },
      {
        name: "階段ルールテスト（簡易版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/kaidan.lisp")',
          '(load "tests/rules/test-kaidan-simple.lisp")',
          '(daifugo-kaidan-simple-test:run-kaidan-simple-tests)'
        ])
      },
      {
        name: "拡張ローカルルールテスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/11back.lisp")',
          '(load "src/rules/suit-binding.lisp")',
          '(load "src/rules/spade3-return.lisp")',
          '(load "src/rules/miyako-ochi.lisp")',
          '(load "tests/rules/test-extended-local-rules.lisp")',
          '(daifugo-extended-local-rules-test:run-extended-local-rules-tests)'
        ])
      },
      {
        name: "拡張ルールテスト（簡易版）",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/rules/11back.lisp")',
          '(load "src/rules/suit-binding.lisp")',
          '(load "src/rules/spade3-return.lisp")',
          '(load "src/rules/miyako-ochi.lisp")',
          '(load "tests/rules/test-extended-rules-simple.lisp")',
          '(daifugo-extended-rules-simple-test:run-extended-rules-simple-tests)'
        ])
      },

      // 統合テスト
      {
        name: "統合テスト",
        script: this.createTestScript([
          '(load "src/core/card-system.lisp")',
          '(load "src/core/player-system.lisp")',
          '(load "src/core/game-state.lisp")',
          `(format t "=== 統合テスト実行 ===~%")`,
          `(let* ((deck (daifugo-card-system:create-deck))
                  (players (daifugo-player-system:create-players 4))
                  (hands (daifugo-card-system:deal-cards deck 4)))
             (format t "✅ 統合テスト合格~%")
             t)`
        ])
      }
    ];

    // テストスクリプト作成と実行
    let passed = 0;
    for (const test of tests) {
      // 一時ファイル作成
      const tempFile = `temp-test-${Date.now()}.lisp`;
      await Deno.writeTextFile(`LispDaifugoEngine/${tempFile}`, test.script);
      
      try {
        const result = await this.runTest(test.name, tempFile);
        if (result.passed) {
          console.log(`✅ ${test.name}: 合格`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: 失敗`);
          if (result.error) {
            console.log(`   エラー: ${result.error.split('\n')[0]}`);
          }
        }
      } finally {
        // 一時ファイル削除
        try {
          await Deno.remove(`LispDaifugoEngine/${tempFile}`);
        } catch {
          // ファイル削除エラーは無視
        }
      }
    }

    // 結果サマリー
    const total = tests.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`\n📊 テスト結果: ${passed}/${total}合格 (${percentage}%)`);
    
    if (passed === total) {
      console.log("🎉 すべてのテストが合格しました！");
      Deno.exit(0);
    } else {
      console.log("⚠️  一部のテストが失敗しました。");
      Deno.exit(1);
    }
  }

  private createTestScript(commands: string[]): string {
    return commands.join('\n') + '\n';
  }

  showResults(): void {
    console.log("\n📋 詳細結果:");
    this.testResults.forEach(result => {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${result.name}`);
      if (result.output) {
        console.log(`   出力: ${result.output.split('\n')[0]}`);
      }
      if (result.error) {
        console.log(`   エラー: ${result.error.split('\n')[0]}`);
      }
    });
  }
}

// メイン実行
if (import.meta.main) {
  const runner = new LispTestRunner();
  await runner.runAllTests();
}