// basic-evaluator.test.ts - 基本評価器テスト

import { assertEquals, assertThrows } from "@std/assert";

// テスト対象
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Basic evaluator instantiation", () => {
  // 基本評価器クラスが存在することをテスト
  const evaluator = new BasicEvaluator();
  assertEquals(typeof evaluator.evaluate, "function");
});

Deno.test("Evaluate simple literals", () => {
  // リテラル（数値、文字列）の評価テスト
  const evaluator = new BasicEvaluator();
  
  // 数値のテスト
  assertEquals(evaluator.evaluate(42), 42);
  assertEquals(evaluator.evaluate(-17), -17);
  assertEquals(evaluator.evaluate(3.14), 3.14);
  
  // 文字列のテスト
  assertEquals(evaluator.evaluate("hello"), "hello");
  assertEquals(evaluator.evaluate("test string"), "test string");
});

Deno.test("Evaluate basic arithmetic", () => {
  // 基本的な算術演算の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // 足し算
  const addExpr = parser.parse("(+ 2 3)");
  assertEquals(evaluator.evaluate(addExpr), 5);
  
  // 引き算
  const subExpr = parser.parse("(- 10 4)");
  assertEquals(evaluator.evaluate(subExpr), 6);
  
  // 掛け算
  const mulExpr = parser.parse("(* 3 4)");
  assertEquals(evaluator.evaluate(mulExpr), 12);
  
  // 割り算
  const divExpr = parser.parse("(/ 15 3)");
  assertEquals(evaluator.evaluate(divExpr), 5);
});

Deno.test("Evaluate nested arithmetic", () => {
  // ネストした算術演算の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // ネストした計算: (+ (* 2 3) (- 10 4))
  const nestedExpr = parser.parse("(+ (* 2 3) (- 10 4))");
  assertEquals(evaluator.evaluate(nestedExpr), 12); // 6 + 6 = 12
  
  // より複雑なネスト: (/ (+ 10 5) (- 8 3))
  const complexExpr = parser.parse("(/ (+ 10 5) (- 8 3))");
  assertEquals(evaluator.evaluate(complexExpr), 3); // 15 / 5 = 3
});

Deno.test("Evaluate symbols and variables", () => {
  // シンボルと変数の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // シンボルの評価（事前に定義されたシンボル）
  evaluator.defineSymbol("pi", 3.14159);
  evaluator.defineSymbol("e", 2.71828);
  
  const piSymbol = parser.parse("pi");
  assertEquals(evaluator.evaluate(piSymbol), 3.14159);
  
  const eSymbol = parser.parse("e");
  assertEquals(evaluator.evaluate(eSymbol), 2.71828);
  
  // 未定義シンボルはエラーを投げる
  const undefinedSymbol = parser.parse("undefined-symbol");
  assertThrows(() => evaluator.evaluate(undefinedSymbol));
});

Deno.test("Evaluate list operations", () => {
  // リスト操作の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // リスト作成
  const listExpr = parser.parse("(list 1 2 3)");
  assertEquals(evaluator.evaluate(listExpr), [1, 2, 3]);
  
  // 空リスト
  const emptyListExpr = parser.parse("(list)");
  assertEquals(evaluator.evaluate(emptyListExpr), []);
});

Deno.test("Evaluate conditional expressions", () => {
  // 条件式の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // if式（クォートされたシンボルは現在シンボルとして扱われる）
  const ifExpr = parser.parse("(if (> 5 3) 'yes 'no)");
  const result = evaluator.evaluate(ifExpr);
  assertEquals(result, { type: "symbol", value: "yes" });
  
  // cond式
  const condExpr = parser.parse("(cond ((> 10 5) 'big) ((< 10 5) 'small) (t 'equal))");
  const condResult = evaluator.evaluate(condExpr);
  assertEquals(condResult, { type: "symbol", value: "big" });
});

Deno.test("Evaluate function definitions", () => {
  // 関数定義の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // 関数定義
  const defunExpr = parser.parse("(defun add-one (x) (+ x 1))");
  evaluator.evaluate(defunExpr);
  
  // 関数呼び出し
  const callExpr = parser.parse("(add-one 5)");
  assertEquals(evaluator.evaluate(callExpr), 6);
});

Deno.test("Evaluate error handling", () => {
  // エラーハンドリングの評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // ゼロ除算
  const divByZeroExpr = parser.parse("(/ 10 0)");
  assertThrows(() => evaluator.evaluate(divByZeroExpr));
  
  // 未定義関数呼び出し
  const undefinedFuncExpr = parser.parse("(undefined-function 1 2)");
  assertThrows(() => evaluator.evaluate(undefinedFuncExpr));
});