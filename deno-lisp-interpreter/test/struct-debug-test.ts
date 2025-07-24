import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Struct system debug", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Struct System Debug ===");

  // 1. 構造体定義
  console.log("Defining struct...");
  const structResult = evaluator.evaluate(parser.parse("(defstruct card rank suit)"));
  console.log("Struct result:", structResult);

  // 2. 構造体システムの状態確認
  console.log("\n--- StructSystem State ---");
  const structSystem = (evaluator as any).structSystem;
  console.log("StructSystem exists:", !!structSystem);
  
  if (structSystem) {
    console.log("Struct defined:", structSystem.isStructDefined("card"));
    
    try {
      const constructor = structSystem.getConstructor("card");
      console.log("Constructor exists:", !!constructor);
      console.log("Constructor type:", typeof constructor);
    } catch (error) {
      console.log("Constructor error:", error.message);
    }
  }

  // 3. グローバル環境の確認
  console.log("\n--- Global Environment ---");
  const globalEnv = (evaluator as any).globalEnv;
  
  try {
    const makeCard = globalEnv.get("make-card");
    console.log("make-card in env:", makeCard);
    console.log("make-card type:", typeof makeCard);
  } catch (error) {
    console.log("make-card not found:", error.message);
  }

  // 4. 手動でコンストラクタをテスト
  console.log("\n--- Manual Constructor Test ---");
  if (structSystem && structSystem.isStructDefined("card")) {
    try {
      const instance = structSystem.createInstance("card", [3, "spades"]);
      console.log("Manual instance creation:", instance);
      console.log("Instance rank:", instance.getValue("rank"));
      console.log("Instance suit:", instance.getValue("suit"));
    } catch (error) {
      console.log("Manual creation error:", error.message);
    }
  }

  console.log("=== Debug Complete ===");
});