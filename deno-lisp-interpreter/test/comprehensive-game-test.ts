import { assertEquals } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Comprehensive game functionality test", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Comprehensive Game Test ===");

  // 1. 構造体定義
  console.log("1. Defining game structures...");
  evaluator.evaluate(parser.parse("(defstruct card rank suit strength)"));
  evaluator.evaluate(parser.parse("(defstruct player id name hand rank)"));
  evaluator.evaluate(parser.parse("(defstruct game-state turn field)"));
  console.log("✅ All structures defined");

  // 2. 位置引数でのカード作成
  console.log("\n2. Testing positional arguments...");
  const card1 = evaluator.evaluate(parser.parse("(make-card 14 'spades 12)"));
  assertEquals(card1.getValue("rank"), 14);
  assertEquals(card1.getValue("suit"), "spades");
  assertEquals(card1.getValue("strength"), 12);
  console.log("✅ Positional args work");

  // 3. キーワード引数でのカード作成
  console.log("\n3. Testing keyword arguments...");
  const card2 = evaluator.evaluate(parser.parse("(make-card :rank 7 :suit 'hearts :strength 5)"));
  assertEquals(card2.getValue("rank"), 7);
  assertEquals(card2.getValue("suit"), "hearts");
  assertEquals(card2.getValue("strength"), 5);
  console.log("✅ Keyword args work");

  // 4. アクセサ関数テスト
  console.log("\n4. Testing accessor functions...");
  const rankAccess = evaluator.evaluate(parser.parse("(card-rank (make-card 3 'clubs 1))"));
  assertEquals(rankAccess, 3);
  
  const suitAccess = evaluator.evaluate(parser.parse("(card-suit (make-card 3 'clubs 1))"));
  assertEquals(suitAccess, "clubs");
  console.log("✅ Accessor functions work");

  // 5. プレイヤー作成テスト
  console.log("\n5. Testing player creation...");
  const player1 = evaluator.evaluate(parser.parse("(make-player 0 'Alice nil 0)"));
  assertEquals(player1.getValue("id"), 0);
  assertEquals(player1.getValue("name"), "Alice");
  console.log("✅ Player creation works");

  // 6. ゲーム状態管理
  console.log("\n6. Testing game state...");
  const gameState = evaluator.evaluate(parser.parse("(make-game-state 0 nil)"));
  assertEquals(gameState.getValue("turn"), 0);
  console.log("✅ Game state works");

  // 7. ゲームロジック関数
  console.log("\n7. Testing game logic functions...");
  
  // カード強度計算
  evaluator.evaluate(parser.parse(`
    (defun calculate-strength (rank)
      (cond
        ((= rank 2) 13)
        ((= rank 14) 12)
        (t rank)))
  `));

  const strength2 = evaluator.evaluate(parser.parse("(calculate-strength 2)"));
  const strengthAce = evaluator.evaluate(parser.parse("(calculate-strength 14)"));
  assertEquals(strength2, 13);
  assertEquals(strengthAce, 12);
  console.log("✅ Card strength calculation works");

  // 8. カード作成関数
  evaluator.evaluate(parser.parse(`
    (defun create-card (rank suit)
      (make-card :rank rank :suit suit :strength (calculate-strength rank)))
  `));

  const createdCard = evaluator.evaluate(parser.parse("(create-card 14 'spades)"));
  assertEquals(createdCard.getValue("rank"), 14);
  assertEquals(createdCard.getValue("suit"), "spades");
  assertEquals(createdCard.getValue("strength"), 12);
  console.log("✅ Card creation function works");

  // 9. プレイヤー作成関数
  evaluator.evaluate(parser.parse(`
    (defun create-player (id name initial-hand)
      (make-player :id id :name name :hand initial-hand :rank 0))
  `));

  const createdPlayer = evaluator.evaluate(parser.parse(`
    (create-player 1 "TestPlayer" (list (create-card 3 'hearts) (create-card 7 'spades)))
  `));
  assertEquals(createdPlayer.getValue("id"), 1);
  assertEquals(createdPlayer.getValue("name"), "TestPlayer");
  assertEquals(createdPlayer.getValue("hand").length, 2);
  console.log("✅ Player creation function works");

  // 10. 勝利条件チェック
  evaluator.evaluate(parser.parse(`
    (defun is-winner (hand-size)
      (= hand-size 0))
  `));

  const isWinner1 = evaluator.evaluate(parser.parse("(is-winner 0)"));
  const isWinner2 = evaluator.evaluate(parser.parse("(is-winner 3)"));
  assertEquals(isWinner1, true);
  assertEquals(isWinner2, false);
  console.log("✅ Win condition check works");

  console.log("\n🎉 All comprehensive tests passed!");
  console.log("✅ 完全な大富豪ゲームシステムがDeno環境で動作可能！");
});