import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Debug test", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Debug Test ===");

  // 1. パーサーの出力を確認
  const parsed = parser.parse("'yes");
  console.log("Parsed 'yes:", JSON.stringify(parsed, null, 2));

  // 2. 評価結果を確認
  const evaluated = evaluator.evaluate(parsed);
  console.log("Evaluated result:", JSON.stringify(evaluated, null, 2));

  // 3. 構造体定義のデバッグ
  console.log("\n--- Struct debug ---");
  const structResult = evaluator.evaluate(parser.parse("(defstruct card rank suit)"));
  console.log("Struct definition result:", JSON.stringify(structResult, null, 2));

  // 4. グローバル環境の確認
  console.log("\n--- Environment debug ---");
  try {
    const makeCardExists = evaluator.evaluate(parser.parse("make-card"));
    console.log("make-card found:", JSON.stringify(makeCardExists, null, 2));
  } catch (error) {
    console.log("make-card not found:", error.message);
  }

  console.log("=== Debug Complete ===");
});