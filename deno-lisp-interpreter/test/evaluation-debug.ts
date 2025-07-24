import { assertEquals, assert } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Evaluation process debug", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Evaluation Process Debug ===");

  // 1. 構造体定義
  console.log("1. Defining struct...");
  evaluator.evaluate(parser.parse("(defstruct card rank suit)"));

  // 2. 直接的なシンボル評価テスト
  console.log("\n2. Direct symbol evaluation test...");
  try {
    const makeCardSymbol = evaluator.evaluate(parser.parse("make-card"));
    console.log("Direct make-card evaluation:", !!makeCardSymbol);
    console.log("Type:", typeof makeCardSymbol);
  } catch (error) {
    console.log("ERROR in direct symbol evaluation:", error.message);
  }

  // 3. パーサーでのmake-card式解析
  console.log("\n3. Parser analysis of make-card expression...");
  const parsed = parser.parse("(make-card 3 'spades)");
  console.log("Parsed expression:", JSON.stringify(parsed, null, 2));

  if (Array.isArray(parsed) && parsed.length > 0) {
    console.log("First element (function name):", JSON.stringify(parsed[0]));
    
    // 4. 関数名部分だけ評価
    console.log("\n4. Function name evaluation...");
    try {
      const funcName = evaluator.evaluate(parsed[0]);
      console.log("Function name evaluated to:", funcName);
      console.log("Function type:", typeof funcName);
    } catch (error) {
      console.log("ERROR evaluating function name:", error.message);
    }
  }

  // 5. 環境での直接取得テスト
  console.log("\n5. Direct environment access test...");
  const globalEnv = (evaluator as any).globalEnv;
  try {
    const directAccess = globalEnv.get("make-card");
    console.log("Direct env access successful:", !!directAccess);
    console.log("Direct access type:", typeof directAccess);
    
    if (directAccess && typeof directAccess === "function") {
      console.log("Function can be called:", true);
    }
  } catch (error) {
    console.log("ERROR in direct env access:", error.message);
  }

  // 6. 新しいevaluatorインスタンスでの動作確認
  console.log("\n6. New evaluator instance test...");
  const newEvaluator = new BasicEvaluator();
  const newParser = new SExpressionParser();
  
  // 新しいインスタンスで構造体定義
  newEvaluator.evaluate(newParser.parse("(defstruct card rank suit)"));
  
  try {
    const newMakeCard = newEvaluator.evaluate(newParser.parse("make-card"));
    console.log("New evaluator make-card:", !!newMakeCard);
  } catch (error) {
    console.log("ERROR with new evaluator:", error.message);
  }

  console.log("\n=== Evaluation Debug Complete ===");
});