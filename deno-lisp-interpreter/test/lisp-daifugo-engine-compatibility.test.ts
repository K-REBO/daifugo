#!/usr/bin/env -S deno test --allow-read

/**
 * LispDaifugoEngine互換性テスト
 * 
 * TDD RED フェーズ: 先にテストを書いて失敗させる
 * このテストは deno-lisp-interpreter が LispDaifugoEngine のコードを
 * 正しく実行できるかを検証する
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

class LispDaifugoEngineCompatibilityTest {
  private evaluator: BasicEvaluator;
  private parser: SExpressionParser;

  constructor() {
    this.evaluator = new BasicEvaluator();
    this.parser = new SExpressionParser();
  }

  /**
   * 基本的なdefunとdocstringのテスト
   */
  async testBasicDefunWithDocstring() {
    const lispCode = `
(defun test-function ()
  "これはテスト用の関数です"
  (+ 1 2))

(test-function)
    `;
    
    const parsed = this.parser.parse(lispCode);
    let result;
    for (const expr of parsed) {
      result = this.evaluator.evaluate(expr);
    }
    
    assertEquals(result, 3);
  }

  /**
   * defpackageとin-packageのテスト
   */
  async testPackageSystem() {
    const lispCode = `
(defpackage :test-package
  (:use :common-lisp)
  (:export #:test-function))

(in-package :test-package)

(defun test-function ()
  "パッケージテスト"
  42)

(test-function)
    `;
    
    const parsed = this.parser.parse(lispCode);
    let result;
    for (const expr of parsed) {
      result = this.evaluator.evaluate(expr);
    }
    
    assertEquals(result, 42);
  }

  /**
   * defstructのテスト（LispDaifugoEngineのカードシステム）
   */
  async testDefstruct() {
    const lispCode = `
(defstruct card
  rank
  suit
  strength)

(defun create-test-card ()
  (make-card :rank 'ace :suit 'spades :strength 14))

(let ((card (create-test-card)))
  (card-rank card))
    `;
    
    const parsed = this.parser.parse(lispCode);
    let result;
    for (const expr of parsed) {
      result = this.evaluator.evaluate(expr);
    }
    
    assertEquals(result, "ace");
  }

  /**
   * loadによるファイル読み込みテスト
   */
  async testLoadFunction() {
    // テスト用ファイルを作成
    const testFilePath = "/tmp/test-load.lisp";
    await Deno.writeTextFile(testFilePath, `
(defun loaded-function ()
  "ロードされた関数"
  99)
    `);
    
    const lispCode = `
(load "${testFilePath}")
(loaded-function)
    `;
    
    const parsed = this.parser.parse(lispCode);
    let result;
    for (const expr of parsed) {
      result = this.evaluator.evaluate(expr);
    }
    
    assertEquals(result, 99);
    
    // クリーンアップ
    await Deno.remove(testFilePath);
  }

  /**
   * 複雑なdefunテスト（複数文、docstring、load文を含む）
   */
  async testComplexDefun() {
    const lispCode = `
(defun complex-function ()
  "複雑な関数のテスト"
  
  ;; 複数の処理
  (let ((x 10)
        (y 20))
    (+ x y)))

(complex-function)
    `;
    
    const parsed = this.parser.parse(lispCode);
    let result;
    for (const expr of parsed) {
      result = this.evaluator.evaluate(expr);
    }
    
    assertEquals(result, 30);
  }

  /**
   * LispDaifugoEngine load-all.lisp の基本構造テスト
   */
  async testLoadAllStructure() {
    const lispCode = `
(defpackage :test-loader
  (:use :common-lisp)
  (:export #:load-test-engine))

(in-package :test-loader)

(defun load-test-engine ()
  "テストエンジンの読み込み"
  
  ;; 複数のload文をシミュレート（実際のファイルは作らない）
  (let ((loaded-modules '()))
    (push "core-system" loaded-modules)
    (push "game-logic" loaded-modules)
    (length loaded-modules)))

(load-test-engine)
    `;
    
    const parsed = this.parser.parse(lispCode);
    let result;
    for (const expr of parsed) {
      result = this.evaluator.evaluate(expr);
    }
    
    assertEquals(result, 2);
  }
}

// テストケース実行
Deno.test("LispDaifugoEngine互換性 - 基本defunとdocstring", async () => {
  const test = new LispDaifugoEngineCompatibilityTest();
  await test.testBasicDefunWithDocstring();
});

Deno.test("LispDaifugoEngine互換性 - パッケージシステム", async () => {
  const test = new LispDaifugoEngineCompatibilityTest();
  await test.testPackageSystem();
});

Deno.test("LispDaifugoEngine互換性 - defstruct", async () => {
  const test = new LispDaifugoEngineCompatibilityTest();
  await test.testDefstruct();
});

Deno.test("LispDaifugoEngine互換性 - load関数", async () => {
  const test = new LispDaifugoEngineCompatibilityTest();
  await test.testLoadFunction();
});

Deno.test("LispDaifugoEngine互換性 - 複雑なdefun", async () => {
  const test = new LispDaifugoEngineCompatibilityTest();
  await test.testComplexDefun();
});

Deno.test("LispDaifugoEngine互換性 - load-all構造", async () => {
  const test = new LispDaifugoEngineCompatibilityTest();
  await test.testLoadAllStructure();
});