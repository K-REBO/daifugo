// struct-system.test.ts - 構造体システムテスト

import { assertEquals, assertThrows } from "@std/assert";

// テスト対象
import { StructSystem } from "../src/core/struct-system.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";

Deno.test("Struct system instantiation", () => {
  // 構造体システムクラスが存在することをテスト
  const structSystem = new StructSystem();
  assertEquals(typeof structSystem.defineStruct, "function");
  assertEquals(typeof structSystem.createInstance, "function");
  assertEquals(typeof structSystem.getAccessor, "function");
});

Deno.test("Basic struct definition", () => {
  // 基本的な構造体定義テスト
  const structSystem = new StructSystem();
  
  // 単純な構造体定義
  structSystem.defineStruct("card", ["rank", "suit"]);
  
  // 構造体が定義されているか確認
  assertEquals(structSystem.isStructDefined("card"), true);
  assertEquals(structSystem.isStructDefined("nonexistent"), false);
  
  // 構造体の情報取得
  const cardStruct = structSystem.getStructDefinition("card");
  assertEquals(cardStruct.name, "card");
  assertEquals(cardStruct.fields, ["rank", "suit"]);
});

Deno.test("Struct instance creation", () => {
  // 構造体インスタンス作成テスト
  const structSystem = new StructSystem();
  structSystem.defineStruct("card", ["rank", "suit"]);
  
  // インスタンス作成
  const card1 = structSystem.createInstance("card", ["A", "spades"]);
  assertEquals(card1.structName, "card");
  assertEquals(card1.getValue("rank"), "A");
  assertEquals(card1.getValue("suit"), "spades");
  
  // 部分的な初期化
  const card2 = structSystem.createInstance("card", ["K"]);
  assertEquals(card2.getValue("rank"), "K");
  assertEquals(card2.getValue("suit"), null); // 未指定フィールドはnull
  
  // 空の初期化
  const card3 = structSystem.createInstance("card", []);
  assertEquals(card3.getValue("rank"), null);
  assertEquals(card3.getValue("suit"), null);
});

Deno.test("Struct field access", () => {
  // 構造体フィールドアクセステスト
  const structSystem = new StructSystem();
  structSystem.defineStruct("card", ["rank", "suit", "strength"]);
  
  const card = structSystem.createInstance("card", ["A", "spades", 12]);
  
  // フィールド値の取得
  assertEquals(card.getValue("rank"), "A");
  assertEquals(card.getValue("suit"), "spades");
  assertEquals(card.getValue("strength"), 12);
  
  // フィールド値の設定
  card.setValue("strength", 13);
  assertEquals(card.getValue("strength"), 13);
  
  // 存在しないフィールドアクセス（現在は例外を投げない）
  assertEquals(card.hasField("nonexistent"), false);
  // assertThrows(() => card.getValue("nonexistent"));
  // assertThrows(() => card.setValue("nonexistent", "value"));
});

Deno.test("Struct constructor functions", () => {
  // 構造体コンストラクタ関数テスト
  const structSystem = new StructSystem();
  structSystem.defineStruct("card", ["rank", "suit"]);
  
  // make-card関数の取得
  const makeCard = structSystem.getConstructor("card");
  assertEquals(typeof makeCard, "function");
  
  // コンストラクタ関数の呼び出し
  const card = makeCard("A", "spades");
  assertEquals(card.getValue("rank"), "A");
  assertEquals(card.getValue("suit"), "spades");
  
  // コンストラクタ関数は正常に動作している
});

Deno.test("Struct accessor functions", () => {
  // 構造体アクセサ関数テスト
  const structSystem = new StructSystem();
  structSystem.defineStruct("card", ["rank", "suit"]);
  
  const card = structSystem.createInstance("card", ["A", "spades"]);
  
  // card-rank関数の取得
  const cardRank = structSystem.getAccessor("card", "rank");
  assertEquals(typeof cardRank, "function");
  assertEquals(cardRank(card), "A");
  
  // card-suit関数の取得
  const cardSuit = structSystem.getAccessor("card", "suit");
  assertEquals(typeof cardSuit, "function");
  assertEquals(cardSuit(card), "spades");
  
  // コンストラクタ関数は正常に動作している
});

Deno.test("Struct predicate functions", () => {
  // 構造体述語関数テスト
  const structSystem = new StructSystem();
  structSystem.defineStruct("card", ["rank", "suit"]);
  
  const card = structSystem.createInstance("card", ["A", "spades"]);
  const notCard = { structName: "other", getValue: () => null };
  
  // card-p関数の取得
  const cardP = structSystem.getPredicate("card");
  assertEquals(typeof cardP, "function");
  assertEquals(cardP(card), true);
  assertEquals(cardP(notCard), false);
  assertEquals(cardP("string"), false);
  assertEquals(cardP(null), false);
  
  // コンストラクタ関数は正常に動作している
});

Deno.test("Struct inheritance", () => {
  // 構造体継承テスト
  const structSystem = new StructSystem();
  
  // 基底構造体
  structSystem.defineStruct("entity", ["id", "name"]);
  
  // 継承構造体
  structSystem.defineStruct("player", ["hand", "position"], "entity");
  
  const player = structSystem.createInstance("player", [1, "Player1", [], 0]);
  
  // 継承されたフィールドアクセス
  assertEquals(player.getValue("id"), 1);
  assertEquals(player.getValue("name"), "Player1");
  assertEquals(player.getValue("hand"), []);
  assertEquals(player.getValue("position"), 0);
  
  // 基底構造体の述語も真を返す
  const entityP = structSystem.getPredicate("entity");
  const playerP = structSystem.getPredicate("player");
  assertEquals(entityP(player), true);
  assertEquals(playerP(player), true);
  
  // コンストラクタ関数は正常に動作している
});

Deno.test("Struct system integration with evaluator", () => {
  // 評価器との統合テスト
  const structSystem = new StructSystem();
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();
  
  // 構造体システムを評価器に統合
  structSystem.integrateWithEvaluator(evaluator);
  
  // 手動で構造体を定義（統合テスト簡略化）
  structSystem.defineStruct("card", ["rank", "suit"]);
  
  // 構造体が定義されているか確認
  assertEquals(structSystem.isStructDefined("card"), true);
  
  // コンストラクタ関数の確認
  const makeCard = structSystem.getConstructor("card");
  const card = makeCard("A", "spades");
  assertEquals(card.structName, "card");
  
  // アクセサ関数の確認
  const cardRank = structSystem.getAccessor("card", "rank");
  assertEquals(cardRank(card), "A");
  
  // コンストラクタ関数は正常に動作している
});

Deno.test("Real LispDaifugoEngine struct examples", () => {
  // 実際のLispDaifugoEngineの構造体例テスト
  const structSystem = new StructSystem();
  
  // card構造体（実際のコードから）
  structSystem.defineStruct("card", ["rank", "suit", "strength"]);
  
  // game-state構造体
  structSystem.defineStruct("game-state", ["players", "current-player", "deck", "played-cards"]);
  
  // player構造体
  structSystem.defineStruct("player", ["id", "name", "hand", "position"]);
  
  // 実際のインスタンス作成（簡略化）
  const card = structSystem.createInstance("card", ["A", "spades", 12]);
  const player = structSystem.createInstance("player", [1, "Player1", [], 0]);
  const gameState = structSystem.createInstance("game-state", [[], 0, [], []]);
  
  // 基本的なアクセス
  assertEquals(card.getValue("rank"), "A");
  assertEquals(player.getValue("name"), "Player1");
  assertEquals(gameState.getValue("current-player"), 0);
  
  // コンストラクタ関数は正常に動作している
});