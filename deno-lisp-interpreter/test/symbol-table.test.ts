// symbol-table.test.ts - シンボルテーブルテスト

import { assertEquals, assertThrows } from "@std/assert";

// テスト対象
import { SymbolTable } from "../src/core/symbol-table.ts";

Deno.test("Symbol table instantiation", () => {
  // シンボルテーブルクラスが存在することをテスト
  const symbolTable = new SymbolTable();
  assertEquals(typeof symbolTable.intern, "function");
  assertEquals(typeof symbolTable.lookup, "function");
  assertEquals(typeof symbolTable.define, "function");
});

Deno.test("Symbol interning", () => {
  // シンボルのインターン機能テスト
  const symbolTable = new SymbolTable();
  
  // 同じ名前のシンボルは同じインスタンスを返す
  const symbol1 = symbolTable.intern("test");
  const symbol2 = symbolTable.intern("test");
  assertEquals(symbol1, symbol2);
  assertEquals(symbol1.name, "test");
  
  // 異なる名前のシンボルは異なるインスタンス
  const symbol3 = symbolTable.intern("different");
  assertEquals(symbol3 !== symbol1, true);
  assertEquals(symbol3.name, "different");
});

Deno.test("Symbol lookup", () => {
  // シンボルのルックアップテスト
  const symbolTable = new SymbolTable();
  
  // 存在しないシンボルはnullを返す
  assertEquals(symbolTable.lookup("nonexistent"), null);
  
  // インターンされたシンボルは検索できる
  const symbol = symbolTable.intern("test-symbol");
  assertEquals(symbolTable.lookup("test-symbol"), symbol);
  
  // 大文字小文字を区別する
  assertEquals(symbolTable.lookup("TEST-SYMBOL"), null);
  assertEquals(symbolTable.lookup("Test-Symbol"), null);
});

Deno.test("Symbol definition and binding", () => {
  // シンボルの定義とバインディングテスト
  const symbolTable = new SymbolTable();
  
  // シンボルに値を定義
  const symbol = symbolTable.intern("pi");
  symbolTable.define(symbol, 3.14159);
  
  // 定義された値を取得
  assertEquals(symbolTable.getValue(symbol), 3.14159);
  
  // 文字列名でも取得可能
  assertEquals(symbolTable.getValueByName("pi"), 3.14159);
  
  // 未定義シンボルはエラーを投げる
  const undefinedSymbol = symbolTable.intern("undefined");
  assertThrows(() => symbolTable.getValue(undefinedSymbol));
});

Deno.test("Package system support", () => {
  // パッケージシステムのサポートテスト
  const symbolTable = new SymbolTable();
  
  // パッケージ修飾シンボル
  const symbol1 = symbolTable.intern("common-lisp:+");
  const symbol2 = symbolTable.intern("daifugo:create-card");
  
  assertEquals(symbol1.name, "common-lisp:+");
  assertEquals(symbol2.name, "daifugo:create-card");
  
  // 同じパッケージ修飾シンボルは同じインスタンス
  const symbol3 = symbolTable.intern("common-lisp:+");
  assertEquals(symbol1, symbol3);
});

Deno.test("Keyword symbols", () => {
  // キーワードシンボルテスト
  const symbolTable = new SymbolTable();
  
  // キーワードシンボルの作成
  const keyword1 = symbolTable.internKeyword("rank");
  const keyword2 = symbolTable.internKeyword("suit");
  
  assertEquals(keyword1.name, ":rank");
  assertEquals(keyword2.name, ":suit");
  assertEquals(keyword1.isKeyword, true);
  assertEquals(keyword2.isKeyword, true);
  
  // キーワードは自己評価する
  assertEquals(symbolTable.getValue(keyword1), keyword1);
  assertEquals(symbolTable.getValue(keyword2), keyword2);
});

Deno.test("Special symbols", () => {
  // 特殊シンボルテスト
  const symbolTable = new SymbolTable();
  
  // 特殊シンボルの定義
  const tSymbol = symbolTable.intern("t");
  const nilSymbol = symbolTable.intern("nil");
  
  symbolTable.define(tSymbol, true);
  symbolTable.define(nilSymbol, null);
  
  assertEquals(symbolTable.getValue(tSymbol), true);
  assertEquals(symbolTable.getValue(nilSymbol), null);
  
  // 真偽値の判定
  assertEquals(symbolTable.isTruthy(tSymbol), true);
  assertEquals(symbolTable.isTruthy(nilSymbol), false);
});

Deno.test("Symbol table statistics", () => {
  // シンボルテーブルの統計情報テスト
  const symbolTable = new SymbolTable();
  
  // 初期状態（特殊シンボルt, nilが既に存在）
  assertEquals(symbolTable.getSymbolCount(), 2);
  
  // シンボルを追加
  symbolTable.intern("symbol1");
  symbolTable.intern("symbol2");
  symbolTable.intern("symbol3");
  
  assertEquals(symbolTable.getSymbolCount(), 5);
  
  // 同じシンボルを再度インターンしても増えない
  symbolTable.intern("symbol1");
  assertEquals(symbolTable.getSymbolCount(), 5);
  
  // 全シンボルの一覧を取得
  const allSymbols = symbolTable.getAllSymbols();
  assertEquals(allSymbols.length, 5);
  const symbolNames = allSymbols.map(s => s.name).sort();
  assertEquals(symbolNames, ["nil", "symbol1", "symbol2", "symbol3", "t"]);
});

Deno.test("Symbol table integration with evaluator", () => {
  // 評価器との統合テスト
  const symbolTable = new SymbolTable();
  
  // 関数シンボルの定義
  const addSymbol = symbolTable.intern("+");
  const addFunction = (...args: number[]) => args.reduce((sum, n) => sum + n, 0);
  symbolTable.define(addSymbol, addFunction);
  
  // 変数シンボルの定義
  const piSymbol = symbolTable.intern("pi");
  symbolTable.define(piSymbol, 3.14159);
  
  // 統合確認
  assertEquals(typeof symbolTable.getValue(addSymbol), "function");
  assertEquals(symbolTable.getValue(piSymbol), 3.14159);
});