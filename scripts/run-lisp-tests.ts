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

    // テスト定義
    const tests = [
      {
        name: "プロジェクト構造テスト",
        script: this.createTestScript([
          '(load "tests/test-project-structure.lisp")',
          '(daifugo-structure-test:run-structure-tests)'
        ])
      },
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