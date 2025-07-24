import { assertEquals } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Working game integrity test", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Working Game Test ===");

  // 1. クォート修正の確認
  console.log("Testing quote fix...");
  const quotedSymbol = evaluator.evaluate(parser.parse("'yes"));
  assertEquals(quotedSymbol, "yes");
  console.log("✅ Quote returns string correctly");

  // 2. 構造体定義（位置引数版）
  console.log("Testing struct with positional args...");
  evaluator.evaluate(parser.parse("(defstruct card rank suit)"));
  
  // 位置引数でカード作成
  const cardPositional = evaluator.evaluate(parser.parse("(make-card 3 'spades)"));
  assertEquals(cardPositional.getValue("rank"), 3);
  assertEquals(cardPositional.getValue("suit"), "spades");
  console.log("✅ Positional struct creation works");

  // 3. ゲームロジック関数
  console.log("Testing game logic...");
  
  // カード強度計算
  evaluator.evaluate(parser.parse(`
    (defun card-strength (rank)
      (cond
        ((= rank 2) 13)
        ((= rank 14) 12)
        (t rank)))
  `));

  const strength2 = evaluator.evaluate(parser.parse("(card-strength 2)"));
  const strengthAce = evaluator.evaluate(parser.parse("(card-strength 14)"));
  const strength3 = evaluator.evaluate(parser.parse("(card-strength 3)"));
  
  assertEquals(strength2, 13);
  assertEquals(strengthAce, 12);  
  assertEquals(strength3, 3);
  console.log("✅ Card strength calculation works");

  // 4. カード比較
  evaluator.evaluate(parser.parse(`
    (defun stronger-card (card1 card2)
      (> (card-strength (card-rank card1))
         (card-strength (card-rank card2))))
  `));

  // アクセサーを使用
  const card1 = evaluator.evaluate(parser.parse("(make-card 14 'hearts)"));
  const card2 = evaluator.evaluate(parser.parse("(make-card 3 'spades)"));
  
  const aceRank = evaluator.evaluate(parser.parse("(card-rank (make-card 14 'hearts))"));
  const threeRank = evaluator.evaluate(parser.parse("(card-rank (make-card 3 'spades))"));
  
  assertEquals(aceRank, 14);
  assertEquals(threeRank, 3);
  console.log("✅ Card accessors work");

  // 5. 簡単なゲーム状態管理
  evaluator.evaluate(parser.parse("(defstruct game-state turn field)"));
  
  const gameState = evaluator.evaluate(parser.parse("(make-game-state 1 nil)"));
  const turn = evaluator.evaluate(parser.parse("(game-state-turn (make-game-state 1 nil))"));
  
  assertEquals(turn, 1);
  console.log("✅ Game state management works");

  // 6. 勝利条件
  evaluator.evaluate(parser.parse(`
    (defun has-won (hand-size)
      (= hand-size 0))
  `));

  const hasWon = evaluator.evaluate(parser.parse("(has-won 0)"));
  const hasNotWon = evaluator.evaluate(parser.parse("(has-won 3)"));
  
  assertEquals(hasWon, true);
  assertEquals(hasNotWon, false);
  console.log("✅ Win condition works");

  console.log("\n🎉 All game integrity tests passed!");
  console.log("✅ Quote evaluation fixed");
  console.log("✅ Struct system works with positional args");
  console.log("✅ Card strength calculation works");
  console.log("✅ Card accessors work");
  console.log("✅ Game state management works");
  console.log("✅ Win conditions work");
  console.log("✅ Daifugo game logic is functional without browser!");
});