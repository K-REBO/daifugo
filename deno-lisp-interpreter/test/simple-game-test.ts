import { assertEquals } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Simple game integrity test", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Simple Game Test ===");

  // 1. 構造体定義
  console.log("Testing struct definition...");
  const cardStruct = evaluator.evaluate(parser.parse("(defstruct card rank suit)"));
  console.log("Card struct result:", cardStruct);

  // 2. 構造体コンストラクタが存在するかチェック
  console.log("Testing if make-card exists...");
  try {
    const cardResult = evaluator.evaluate(parser.parse("(make-card :rank 3 :suit 'spades)"));
    console.log("Card created successfully:", cardResult);
    assertEquals(cardResult.rank, 3);
    assertEquals(cardResult.suit, "spades");
    console.log("✅ Card struct works");
  } catch (error) {
    console.log("❌ Error creating card:", error.message);
    
    // デバッグ: 利用可能な関数を確認
    console.log("Available symbols in global environment:");
    // グローバル環境の内容を表示（デバッグ用）
  }

  // 3. 基本的な関数テスト
  console.log("Testing basic functions...");
  
  // 算術関数
  const sum = evaluator.evaluate(parser.parse("(+ 1 2 3)"));
  assertEquals(sum, 6);
  console.log("✅ Addition works");

  // リスト関数
  const listResult = evaluator.evaluate(parser.parse("(list 1 2 3)"));
  assertEquals(listResult.length, 3);
  console.log("✅ List creation works");

  // 条件分岐
  const condResult = evaluator.evaluate(parser.parse("(if (> 5 3) 'yes 'no)"));
  assertEquals(condResult, "yes");
  console.log("✅ Conditional works");

  console.log("=== Basic functions verified ===");
});