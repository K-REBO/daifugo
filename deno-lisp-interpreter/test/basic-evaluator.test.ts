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

Deno.test("Evaluate let variable bindings", () => {
  // let式の変数束縛テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // 単一変数束縛
  const simpleLetExpr = parser.parse("(let ((x 10)) x)");
  assertEquals(evaluator.evaluate(simpleLetExpr), 10);
  
  // 複数変数束縛
  const multipleLetExpr = parser.parse("(let ((x 5) (y 3)) (+ x y))");
  assertEquals(evaluator.evaluate(multipleLetExpr), 8);
  
  // ネストしたlet
  const nestedLetExpr = parser.parse("(let ((x 2)) (let ((y 3)) (+ x y)))");
  assertEquals(evaluator.evaluate(nestedLetExpr), 5);
  
  // let内での計算式
  const computedLetExpr = parser.parse("(let ((x (+ 2 3)) (y (* 2 4))) (- x y))");
  assertEquals(evaluator.evaluate(computedLetExpr), -3);
  
  // letスコープの確認（外部変数の隠蔽）
  evaluator.evaluate(parser.parse("(defparameter global-x 100)"));
  const scopeTestExpr = parser.parse("(let ((global-x 50)) global-x)");
  assertEquals(evaluator.evaluate(scopeTestExpr), 50);
  
  // let終了後に外部変数が復元されること
  const globalTestExpr = parser.parse("global-x");
  assertEquals(evaluator.evaluate(globalTestExpr), 100);
});

Deno.test("Evaluate conditional expressions - cond, when, unless", () => {
  // cond, when, unless条件分岐の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // cond式のテスト
  const condExpr = parser.parse("(cond ((> 5 3) 'greater) ((< 5 3) 'less) (t 'equal))");
  assertEquals(evaluator.evaluate(condExpr).value, "greater");
  
  const condFalseExpr = parser.parse("(cond ((< 5 3) 'less) ((> 3 5) 'greater2) (t 'default))");
  assertEquals(evaluator.evaluate(condFalseExpr).value, "default");
  
  // when式のテスト（真の場合）
  const whenTrueExpr = parser.parse("(when (> 10 5) 'executed)");
  assertEquals(evaluator.evaluate(whenTrueExpr).value, "executed");
  
  // when式のテスト（偽の場合）
  const whenFalseExpr = parser.parse("(when (< 10 5) 'not-executed)");
  assertEquals(evaluator.evaluate(whenFalseExpr), null);
  
  // unless式のテスト（偽の場合、実行される）
  const unlessFalseExpr = parser.parse("(unless (< 10 5) 'executed)");
  assertEquals(evaluator.evaluate(unlessFalseExpr).value, "executed");
  
  // unless式のテスト（真の場合、実行されない）
  const unlessTrueExpr = parser.parse("(unless (> 10 5) 'not-executed)");
  assertEquals(evaluator.evaluate(unlessTrueExpr), null);
  
  // when/unless複数式のテスト
  const whenMultipleExpr = parser.parse("(when (= 5 5) (+ 1 2) (* 3 4))");
  assertEquals(evaluator.evaluate(whenMultipleExpr), 12);
  
  const unlessMultipleExpr = parser.parse("(unless (= 5 3) (+ 10 20) (- 50 20))");
  assertEquals(evaluator.evaluate(unlessMultipleExpr), 30);
});

Deno.test("Evaluate iteration structures - dolist, dotimes", () => {
  // dolist, dotimes反復構造の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // dolistのテスト - 戻り値確認
  const dolistReturnExpr = parser.parse("(dolist (x '(a b c)) x)");
  assertEquals(evaluator.evaluate(dolistReturnExpr), null);
  
  // dotimesのテスト - 戻り値確認
  const dotimesReturnExpr = parser.parse("(dotimes (i 3) i)");
  assertEquals(evaluator.evaluate(dotimesReturnExpr), null);
  
  // dolistのテスト - 変数がスコープ内で利用可能
  const dolistVarExpr = parser.parse("(dolist (x '(1 2 3)) (+ x 1))");
  assertEquals(evaluator.evaluate(dolistVarExpr), null);
  
  // dotimesのテスト - インデックス変数が利用可能
  const dotimesVarExpr = parser.parse("(dotimes (i 3) (+ i 1))");
  assertEquals(evaluator.evaluate(dotimesVarExpr), null);
});

Deno.test("Evaluate lambda expressions", () => {
  // lambda無名関数の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // 基本的なlambda式の作成
  const lambdaExpr = parser.parse("(lambda (x) (+ x 1))");
  const lambdaResult = evaluator.evaluate(lambdaExpr);
  assertEquals(lambdaResult.type, "function");
  
  // lambda式の直接呼び出し
  const lambdaCallExpr = parser.parse("((lambda (x) (* x 2)) 5)");
  assertEquals(evaluator.evaluate(lambdaCallExpr), 10);
  
  // 複数パラメーターのlambda
  const multiParamLambdaExpr = parser.parse("((lambda (x y) (+ x y)) 3 4)");
  assertEquals(evaluator.evaluate(multiParamLambdaExpr), 7);
  
  // パラメーターなしのlambda
  const noParamLambdaExpr = parser.parse("((lambda () 42))");
  assertEquals(evaluator.evaluate(noParamLambdaExpr), 42);
  
  // lambdaのクロージャーテスト
  evaluator.evaluate(parser.parse("(defparameter x 10)"));
  const closureLambdaExpr = parser.parse("((lambda (y) (+ x y)) 5)");
  assertEquals(evaluator.evaluate(closureLambdaExpr), 15);
  
  // lambdaを変数に代入
  evaluator.evaluate(parser.parse("(defparameter add-func (lambda (a b) (+ a b)))"));
  const funcCallExpr = parser.parse("(add-func 2 3)");
  assertEquals(evaluator.evaluate(funcCallExpr), 5);
  
  // 高階関数でのlambda使用
  evaluator.evaluate(parser.parse("(defun apply-twice (f x) (f (f x)))"));
  const higherOrderExpr = parser.parse("(apply-twice (lambda (n) (* n 2)) 3)");
  assertEquals(evaluator.evaluate(higherOrderExpr), 12); // (3 * 2) * 2 = 12
});

Deno.test("Evaluate list manipulation functions", () => {
  // リスト操作関数の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // mapcar関数のテスト
  const mapcarExpr = parser.parse("(mapcar (lambda (x) (+ x 1)) '(1 2 3))");
  assertEquals(evaluator.evaluate(mapcarExpr), [2, 3, 4]);
  
  // mapcar複数リストのテスト
  const mapcarMultiExpr = parser.parse("(mapcar (lambda (x y) (+ x y)) '(1 2 3) '(4 5 6))");
  assertEquals(evaluator.evaluate(mapcarMultiExpr), [5, 7, 9]);
  
  // mapcar空リストのテスト
  const mapcarEmptyExpr = parser.parse("(mapcar (lambda (x) (* x 2)) '())");
  assertEquals(evaluator.evaluate(mapcarEmptyExpr), []);
  
  // every関数のテスト（すべて真）
  const everyTrueExpr = parser.parse("(every (lambda (x) (> x 0)) '(1 2 3))");
  assertEquals(evaluator.evaluate(everyTrueExpr), true);
  
  // every関数のテスト（一つでも偽）
  const everyFalseExpr = parser.parse("(every (lambda (x) (> x 1)) '(1 2 3))");
  assertEquals(evaluator.evaluate(everyFalseExpr), false);
  
  // every空リストのテスト
  const everyEmptyExpr = parser.parse("(every (lambda (x) (> x 0)) '())");
  assertEquals(evaluator.evaluate(everyEmptyExpr), true);
  
  // some関数のテスト（一つでも真）
  const someTrueExpr = parser.parse("(some (lambda (x) (> x 2)) '(1 2 3))");
  assertEquals(evaluator.evaluate(someTrueExpr), true);
  
  // some関数のテスト（すべて偽）
  const someFalseExpr = parser.parse("(some (lambda (x) (> x 5)) '(1 2 3))");
  assertEquals(evaluator.evaluate(someFalseExpr), null);
  
  // some空リストのテスト
  const someEmptyExpr = parser.parse("(some (lambda (x) (> x 0)) '())");
  assertEquals(evaluator.evaluate(someEmptyExpr), null);
  
  // remove-if関数のテスト
  const removeIfExpr = parser.parse("(remove-if (lambda (x) (> x 2)) '(1 2 3 4 1))");
  assertEquals(evaluator.evaluate(removeIfExpr), [1, 2, 1]);
  
  // remove-if空リストのテスト
  const removeIfEmptyExpr = parser.parse("(remove-if (lambda (x) (> x 0)) '())");
  assertEquals(evaluator.evaluate(removeIfEmptyExpr), []);
  
  // remove-if全削除のテスト
  const removeIfAllExpr = parser.parse("(remove-if (lambda (x) (> x 0)) '(1 2 3))");
  assertEquals(evaluator.evaluate(removeIfAllExpr), []);
  
  // 組み込み関数との組み合わせテスト
  const combinedExpr = parser.parse("(mapcar (lambda (x) (* x x)) (remove-if (lambda (x) (> x 3)) '(1 2 3 4 5)))");
  assertEquals(evaluator.evaluate(combinedExpr), [1, 4, 9]); // (1^2, 2^2, 3^2)
});

Deno.test("Evaluate hash table operations", () => {
  // ハッシュテーブル操作の評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // ハッシュテーブル作成のテスト
  const hashExpr = parser.parse("(make-hash-table)");
  const hashTable = evaluator.evaluate(hashExpr);
  assertEquals(hashTable.type, "hash-table");
  assertEquals(hashTable.test, "eq");
  
  // ハッシュテーブルにsetf + gethash変数代入形式でのテスト
  evaluator.evaluate(parser.parse("(defparameter *my-hash* (make-hash-table))"));
  
  // setfでの値設定のテスト
  const setfExpr = parser.parse("(setf (gethash 'key1 *my-hash*) 'value1)");
  const setValue = evaluator.evaluate(setfExpr);
  assertEquals(setValue.value, "value1");
  
  // gethashでの値取得のテスト
  const getExpr = parser.parse("(gethash 'key1 *my-hash*)");
  const getValue = evaluator.evaluate(getExpr);
  assertEquals(getValue.value, "value1");
  
  // 存在しないキーのテスト
  const getMissingExpr = parser.parse("(gethash 'missing-key *my-hash*)");
  const missingValue = evaluator.evaluate(getMissingExpr);
  assertEquals(missingValue, null);
  
  // デフォルト値のテスト
  const getDefaultExpr = parser.parse("(gethash 'missing-key *my-hash* 'default-value)");
  const defaultValue = evaluator.evaluate(getDefaultExpr);
  assertEquals(defaultValue.value, "default-value");
  
  // 複数のキー・値のテスト
  evaluator.evaluate(parser.parse("(setf (gethash 'key2 *my-hash*) 42)"));
  evaluator.evaluate(parser.parse("(setf (gethash 'key3 *my-hash*) 'another-value)"));
  
  const getValue2 = evaluator.evaluate(parser.parse("(gethash 'key2 *my-hash*)"));
  assertEquals(getValue2, 42);
  
  const getValue3 = evaluator.evaluate(parser.parse("(gethash 'key3 *my-hash*)"));
  assertEquals(getValue3.value, "another-value");
  
  // 文字列キーのテスト
  evaluator.evaluate(parser.parse("(setf (gethash \"string-key\" *my-hash*) 'string-value)"));
  const stringKeyValue = evaluator.evaluate(parser.parse("(gethash \"string-key\" *my-hash*)"));
  assertEquals(stringKeyValue.value, "string-value");
  
  // 数値キーのテスト
  evaluator.evaluate(parser.parse("(setf (gethash 123 *my-hash*) 'number-key-value)"));
  const numberKeyValue = evaluator.evaluate(parser.parse("(gethash 123 *my-hash*)"));
  assertEquals(numberKeyValue.value, "number-key-value");
  
  // ハッシュテーブルの上書きテスト
  evaluator.evaluate(parser.parse("(setf (gethash 'key1 *my-hash*) 'new-value1)"));
  const overwrittenValue = evaluator.evaluate(parser.parse("(gethash 'key1 *my-hash*)"));
  assertEquals(overwrittenValue.value, "new-value1");
});

Deno.test("Evaluate error handling", () => {
  // エラーハンドリングの評価テスト
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // 基本的なhandler-caseのテスト（エラーなし）
  const normalExpr = parser.parse("(handler-case (+ 1 2) (error 'handled))");
  assertEquals(evaluator.evaluate(normalExpr), 3);
  
  // 基本的なhandler-caseのテスト（エラーあり）
  const errorExpr = parser.parse("(handler-case (/ 1 0) (error 'division-by-zero-handled))");
  const errorResult = evaluator.evaluate(errorExpr);
  assertEquals(errorResult.value, "division-by-zero-handled");
  
  // error関数による明示的エラー発生のテスト
  const explicitErrorExpr = parser.parse("(handler-case (error \"Custom error message\") (error 'custom-error-handled))");
  const explicitResult = evaluator.evaluate(explicitErrorExpr);
  assertEquals(explicitResult.value, "custom-error-handled");
  
  // 複数のエラーハンドラーのテスト
  const multiHandlerExpr = parser.parse(`
    (handler-case 
      (error \"test error\")
      (arithmetic-error 'arithmetic-handled)
      (error 'general-error-handled))
  `);
  const multiResult = evaluator.evaluate(multiHandlerExpr);
  assertEquals(multiResult.value, "general-error-handled");
  
  // ネストしたhandler-caseのテスト
  const nestedExpr = parser.parse(`
    (handler-case
      (handler-case
        (error \"inner error\")
        (arithmetic-error 'inner-arithmetic))
      (error 'outer-error))
  `);
  const nestedResult = evaluator.evaluate(nestedExpr);
  assertEquals(nestedResult.value, "outer-error");
  
  // handler-case内での正常処理のテスト
  const complexExpr = parser.parse(`
    (handler-case
      (let ((x 10) (y 5))
        (if (> x y) 
          (* x y)
          (error \"x should be greater than y\")))
      (error 'computation-error))
  `);
  assertEquals(evaluator.evaluate(complexExpr), 50);
  
  // エラーハンドラーなしでのhandler-case（エラーが再発生）
  const noHandlerExpr = parser.parse("(handler-case (/ 1 0))");
  assertThrows(() => evaluator.evaluate(noHandlerExpr));
  
  // エラーメッセージ付きのerror関数テスト
  const messageErrorExpr = parser.parse("(error 'symbol-error 'some-data)");
  assertThrows(() => evaluator.evaluate(messageErrorExpr));
  
  // 条件付きエラー処理のテスト
  evaluator.evaluate(parser.parse("(defparameter *error-flag* nil)"));
  const conditionalExpr = parser.parse(`
    (handler-case
      (if *error-flag*
        (error \"Conditional error\")
        'no-error)
      (error 'conditional-handled))
  `);
  assertEquals(evaluator.evaluate(conditionalExpr).value, "no-error");
  
  // フラグを設定してエラーを発生させる  
  evaluator.evaluate(parser.parse("(setf *error-flag* t)"));
  const conditionalErrorExpr = parser.parse(`
    (handler-case
      (if *error-flag*
        (error \"Conditional error\")
        'no-error)
      (error 'conditional-handled))
  `);
  const conditionalErrorResult = evaluator.evaluate(conditionalErrorExpr);
  assertEquals(conditionalErrorResult.value, "conditional-handled");
});