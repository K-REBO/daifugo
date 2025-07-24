import { assertEquals, assert } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Keyword argument debug", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Keyword Argument Debug ===");

  // 1. キーワードパースのテスト
  console.log("1. Keyword parsing test...");
  const parsedKeyword = parser.parse(":rank");
  console.log("Parsed :rank:", JSON.stringify(parsedKeyword, null, 2));

  const parsed2 = parser.parse(":suit");
  console.log("Parsed :suit:", JSON.stringify(parsed2, null, 2));

  // 2. 構造体定義
  console.log("\n2. Defining struct...");
  evaluator.evaluate(parser.parse("(defstruct card rank suit)"));

  // 3. キーワード引数のパース
  console.log("\n3. Keyword args parsing...");
  const parsedCall = parser.parse("(make-card :rank 3 :suit 'spades)");
  console.log("Parsed make-card call:", JSON.stringify(parsedCall, null, 2));

  // 4. 各引数の詳細確認
  if (Array.isArray(parsedCall) && parsedCall.length > 1) {
    console.log("\n4. Individual argument analysis...");
    for (let i = 1; i < parsedCall.length; i++) {
      const arg = parsedCall[i];
      console.log(`Arg ${i}:`, JSON.stringify(arg));
      if (typeof arg === "object" && arg !== null && "type" in arg && arg.type === "keyword") {
        console.log(`  Keyword value: "${arg.value}"`);
        console.log(`  Field name (substring(1)): "${arg.value.substring(1)}"`);
      }
    }
  }

  // 5. 構造体フィールド確認
  console.log("\n5. Struct fields verification...");
  const structSystem = (evaluator as any).structSystem;
  const structDef = structSystem.getStructDefinition("card");
  const fields = structDef.getAllFields(structSystem);
  console.log("Struct fields:", fields);

  console.log("\n=== Keyword Debug Complete ===");
});