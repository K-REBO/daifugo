// s-expression-parser.test.ts - S式パーサーテスト

import { assertEquals, assertThrows } from "@std/assert";

// テスト対象（未実装なのでエラーになる）
// import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("S-expression parser basic functionality", () => {
  // パーサークラスが存在することをテスト（未実装）
  // const parser = new SExpressionParser();
  // assertEquals(typeof parser.parse, "function");
  
  // 現在は未実装なのでこのテストは失敗する（Red フェーズ）
  assertThrows(() => {
    // @ts-ignore - テスト目的で未定義クラスを参照
    new SExpressionParser();
  });
});

Deno.test("Parse simple atoms", () => {
  // シンプルなアトム（数値、シンボル、文字列）の解析テスト
  
  // 数値のテスト
  // assertEquals(parser.parse("42"), 42);
  // assertEquals(parser.parse("-17"), -17);
  // assertEquals(parser.parse("3.14"), 3.14);
  
  // シンボルのテスト  
  // assertEquals(parser.parse("hello"), { type: "symbol", value: "hello" });
  // assertEquals(parser.parse("create-card"), { type: "symbol", value: "create-card" });
  
  // 文字列のテスト
  // assertEquals(parser.parse('"test string"'), "test string");
  
  // 現在は未実装（Red フェーズ）
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Parse simple lists", () => {
  // シンプルなリストの解析テスト
  
  // 空リスト
  // assertEquals(parser.parse("()"), []);
  
  // 数値リスト
  // assertEquals(parser.parse("(1 2 3)"), [1, 2, 3]);
  
  // シンボルリスト
  // const expected = [
  //   { type: "symbol", value: "defun" },
  //   { type: "symbol", value: "test" },
  //   []
  // ];
  // assertEquals(parser.parse("(defun test ())"), expected);
  
  // 現在は未実装（Red フェーズ）
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Parse nested lists", () => {
  // ネストしたリストの解析テスト
  
  // 単純なネスト
  // assertEquals(parser.parse("((1 2) (3 4))"), [[1, 2], [3, 4]]);
  
  // 複雑なネスト（関数定義風）
  // const input = "(defun create-card (rank suit) (make-card :rank rank :suit suit))";
  // const result = parser.parse(input);
  // assertEquals(Array.isArray(result), true);
  // assertEquals(result[0], { type: "symbol", value: "defun" });
  
  // 現在は未実装（Red フェーズ）
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Parse actual Lisp code samples", () => {
  // 実際のLispコードサンプルの解析テスト
  
  const samples = [
    // defpackage
    '(defpackage :test (:use :common-lisp))',
    
    // defstruct  
    '(defstruct card rank suit)',
    
    // defun
    '(defun create-card (rank suit) (make-card :rank rank :suit suit))',
    
    // let式
    '(let ((x 10) (y 20)) (+ x y))',
    
    // cond式
    '(cond ((> x 0) "positive") ((< x 0) "negative") (t "zero"))'
  ];
  
  // 各サンプルが正常に解析されることをテスト
  // samples.forEach(sample => {
  //   const result = parser.parse(sample);
  //   assertEquals(Array.isArray(result), true);
  //   assertEquals(result.length > 0, true);
  // });
  
  // 現在は未実装（Red フェーズ）
  assertEquals(samples.length, 5); // サンプル数の確認のみ
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Parse keywords and special characters", () => {
  // キーワードと特殊文字の解析テスト
  
  // キーワード
  // assertEquals(parser.parse(":rank"), { type: "keyword", value: "rank" });
  // assertEquals(parser.parse(":suit"), { type: "keyword", value: "suit" });
  
  // クォート
  // assertEquals(parser.parse("'(1 2 3)"), { type: "quote", value: [1, 2, 3] });
  
  // 特殊文字を含むシンボル
  // assertEquals(parser.parse("make-card"), { type: "symbol", value: "make-card" });
  // assertEquals(parser.parse("card-p"), { type: "symbol", value: "card-p" });
  
  // 現在は未実装（Red フェーズ）
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Handle parsing errors", () => {
  // パースエラーのハンドリングテスト
  
  const invalidInputs = [
    "(unclosed list",     // 閉じられていないリスト
    "extra) paren",       // 余分な閉じ括弧
    '"unclosed string',   // 閉じられていない文字列
    "",                   // 空入力
    "   ",               // 空白のみ
  ];
  
  // 各無効入力でエラーが投げられることをテスト
  // invalidInputs.forEach(input => {
  //   assertThrows(() => parser.parse(input));
  // });
  
  // 現在は未実装（Red フェーズ）
  assertEquals(invalidInputs.length, 5);
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Parse real card-system.lisp snippets", () => {
  // 実際のcard-system.lispからのコード片テスト
  
  const realSnippets = [
    // パッケージ定義
    '(defpackage :daifugo-card-system (:use :common-lisp))',
    
    // 構造体定義
    '(defstruct card rank suit strength)',
    
    // 関数定義
    '(defun create-card (rank suit) (make-card :rank rank :suit suit :strength (calculate-card-strength rank)))',
    
    // 条件分岐
    '(cond ((eq rank \'A) 12) ((eq rank \'2) 13) (t (position rank *rank-order*)))'
  ];
  
  // 実際のLispDaifugoEngineコードが解析できることをテスト
  // realSnippets.forEach(snippet => {
  //   const result = parser.parse(snippet);
  //   assertEquals(Array.isArray(result), true);
  //   assertEquals(result.length > 0, true);
  // });
  
  // 現在は未実装（Red フェーズ）
  assertEquals(realSnippets.length, 4);
  assertEquals(true, false); // 意図的に失敗させる
});

Deno.test("Parser performance with large inputs", () => {
  // 大きな入力に対するパフォーマンステスト
  
  // 大きなリストの生成
  const largeList = "(" + Array.from({ length: 1000 }, (_, i) => i).join(" ") + ")";
  
  // パフォーマンス測定
  // const startTime = performance.now();
  // const result = parser.parse(largeList);
  // const endTime = performance.now();
  // const duration = endTime - startTime;
  
  // assertEquals(Array.isArray(result), true);
  // assertEquals(result.length, 1000);
  // assertEquals(duration < 100, true); // 100ms以内
  
  // 現在は未実装（Red フェーズ）
  assertEquals(largeList.length > 1000, true);
  assertEquals(true, false); // 意図的に失敗させる
});