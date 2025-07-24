import { assertEquals, assertNotEquals, assert } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Game integrity test - Core functions", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Game Core Functions Test ===");

  // カード構造体定義
  const cardStruct = evaluator.evaluate(parser.parse("(defstruct card rank suit strength)"));
  assertEquals(cardStruct.value, "card");
  console.log("✅ Card struct defined");

  // プレイヤー構造体定義  
  const playerStruct = evaluator.evaluate(parser.parse("(defstruct player id name hand rank)"));
  assertEquals(playerStruct.value, "player");
  console.log("✅ Player struct defined");

  // カード強度計算関数
  evaluator.evaluate(parser.parse(`
    (defun calculate-strength (rank)
      (cond
        ((= rank 3) 1)
        ((= rank 4) 2)
        ((= rank 5) 3)
        ((= rank 6) 4)
        ((= rank 7) 5)
        ((= rank 8) 6)
        ((= rank 9) 7)
        ((= rank 10) 8)
        ((= rank 11) 9)
        ((= rank 12) 10)
        ((= rank 13) 11)
        ((= rank 14) 12)
        ((= rank 2) 13)
        (t 0)))
  `));

  // カード作成関数
  evaluator.evaluate(parser.parse(`
    (defun create-card (rank suit)
      (make-card :rank rank :suit suit :strength (calculate-strength rank)))
  `));

  // テスト実行
  const testCard = evaluator.evaluate(parser.parse("(create-card 14 'spades)"));
  assertEquals(testCard.rank, 14);
  assertEquals(testCard.suit, "spades");
  assertEquals(testCard.strength, 12);
  console.log("✅ Card creation works correctly");

  // カード強度テスト
  const strength3 = evaluator.evaluate(parser.parse("(calculate-strength 3)"));
  const strength2 = evaluator.evaluate(parser.parse("(calculate-strength 2)"));
  const strengthAce = evaluator.evaluate(parser.parse("(calculate-strength 14)"));
  
  assertEquals(strength3, 1);
  assertEquals(strength2, 13);
  assertEquals(strengthAce, 12);
  console.log("✅ Card strength calculation correct");

  console.log("=== All core game functions work! ===");
});

Deno.test("Game integrity test - Player management", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Player Management Test ===");

  // 構造体定義
  evaluator.evaluate(parser.parse("(defstruct player id name hand rank)"));
  evaluator.evaluate(parser.parse("(defstruct card rank suit strength)"));

  // プレイヤー作成関数
  evaluator.evaluate(parser.parse(`
    (defun create-player (id name hand)
      (make-player :id id :name name :hand hand :rank 0))
  `));

  // カード作成（簡易版）
  evaluator.evaluate(parser.parse(`
    (defun simple-card (rank)
      (make-card :rank rank :suit 'default :strength rank))
  `));

  // テスト実行
  const player1 = evaluator.evaluate(parser.parse(`
    (create-player 1 "TestPlayer" (list (simple-card 3) (simple-card 7)))
  `));

  assertEquals(player1.id, 1);
  assertEquals(player1.name, "TestPlayer");
  assertEquals(player1.hand.length, 2);
  assertEquals(player1.rank, 0);
  console.log("✅ Player creation works");

  // 手札チェック
  const handSize = evaluator.evaluate(parser.parse("(length '(1 2 3))"));
  assertEquals(handSize, 3);
  console.log("✅ Hand size calculation works");

  console.log("=== Player management test passed! ===");
});

Deno.test("Game integrity test - Game logic", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Game Logic Test ===");

  // カード比較関数
  evaluator.evaluate(parser.parse(`
    (defun compare-strength (strength1 strength2)
      (- strength1 strength2))
  `));

  // プレイ可能判定
  evaluator.evaluate(parser.parse(`
    (defun can-play (card-strength field-strength)
      (if field-strength
          (> card-strength field-strength)
          t))
  `));

  // テスト実行
  const comparison = evaluator.evaluate(parser.parse("(compare-strength 12 5)"));
  assertEquals(comparison, 7);
  console.log("✅ Card comparison works");

  const canPlay1 = evaluator.evaluate(parser.parse("(can-play 12 5)"));
  const canPlay2 = evaluator.evaluate(parser.parse("(can-play 3 8)"));
  const canPlayFirst = evaluator.evaluate(parser.parse("(can-play 5 nil)"));

  assertEquals(canPlay1, true);
  assertEquals(canPlay2, false);
  assertEquals(canPlayFirst, true);
  console.log("✅ Play validation works");

  // 勝利条件チェック
  evaluator.evaluate(parser.parse(`
    (defun is-winner (hand-size)
      (= hand-size 0))
  `));

  const isWinner1 = evaluator.evaluate(parser.parse("(is-winner 0)"));
  const isWinner2 = evaluator.evaluate(parser.parse("(is-winner 3)"));

  assertEquals(isWinner1, true);
  assertEquals(isWinner2, false);
  console.log("✅ Win condition check works");

  console.log("=== Game logic test passed! ===");
});