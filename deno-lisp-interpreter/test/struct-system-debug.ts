import { assertEquals, assert } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("Detailed struct system debug", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== Phase 1: Detailed Struct System Debug ===");

  // 1. 初期状態確認
  console.log("1. Initial state check...");
  const structSystem = (evaluator as any).structSystem;
  const globalEnv = (evaluator as any).globalEnv;
  
  console.log("StructSystem exists:", !!structSystem);
  console.log("GlobalEnv exists:", !!globalEnv);

  // 2. 構造体定義プロセス詳細追跡
  console.log("\n2. Detailed struct definition process...");
  
  // defstruct実行前の状態
  try {
    const preDefMakeCard = globalEnv.get("make-card");
    console.log("make-card before defstruct:", preDefMakeCard);
  } catch (error) {
    console.log("make-card not found before defstruct (expected)");
  }

  // defstruct実行
  console.log("Executing (defstruct card rank suit)...");
  const structResult = evaluator.evaluate(parser.parse("(defstruct card rank suit)"));
  console.log("Struct definition result:", structResult);

  // defstruct実行後の状態確認
  console.log("\n3. Post-defstruct state verification...");
  console.log("Struct defined in system:", structSystem.isStructDefined("card"));
  
  // コンストラクタ取得テスト
  try {
    const constructor = structSystem.getConstructor("card");
    console.log("Constructor retrieved from StructSystem:", !!constructor);
    console.log("Constructor type:", typeof constructor);
  } catch (error) {
    console.log("ERROR getting constructor:", error.message);
  }

  // グローバル環境での確認
  try {
    const makeCard = globalEnv.get("make-card");
    console.log("make-card in global env:", !!makeCard);
    console.log("make-card type:", typeof makeCard);
    
    if (makeCard) {
      console.log("make-card function details:", makeCard.toString().substring(0, 100));
    }
  } catch (error) {
    console.log("ERROR: make-card not found in global env:", error.message);
  }

  // 4. registerStructFunctions関数実行確認
  console.log("\n4. registerStructFunctions execution trace...");
  
  // 手動でregisterStructFunctions呼び出し
  try {
    (evaluator as any).registerStructFunctions("card");
    console.log("Manual registerStructFunctions completed");
    
    const makeCardAfterManual = globalEnv.get("make-card");
    console.log("make-card after manual register:", !!makeCardAfterManual);
  } catch (error) {
    console.log("ERROR in manual registerStructFunctions:", error.message);
  }

  // 5. アクセサ関数確認
  console.log("\n5. Accessor functions verification...");
  try {
    const cardRank = globalEnv.get("card-rank");
    const cardSuit = globalEnv.get("card-suit");
    console.log("card-rank exists:", !!cardRank);
    console.log("card-suit exists:", !!cardSuit);
  } catch (error) {
    console.log("ERROR accessing accessor functions:", error.message);
  }

  // 6. 実際のコンストラクタ呼び出しテスト
  console.log("\n6. Constructor invocation test...");
  try {
    // 位置引数でのテスト
    const testCard = evaluator.evaluate(parser.parse("(make-card 3 'spades)"));
    console.log("Position args test successful:", !!testCard);
    console.log("Card rank:", testCard.getValue ? testCard.getValue("rank") : "N/A");
    console.log("Card suit:", testCard.getValue ? testCard.getValue("suit") : "N/A");
  } catch (error) {
    console.log("ERROR in position args test:", error.message);
  }

  try {
    // キーワード引数でのテスト
    const testCardKw = evaluator.evaluate(parser.parse("(make-card :rank 7 :suit 'hearts)"));
    console.log("Keyword args test successful:", !!testCardKw);
    console.log("Card rank (kw):", testCardKw.getValue ? testCardKw.getValue("rank") : "N/A");
    console.log("Card suit (kw):", testCardKw.getValue ? testCardKw.getValue("suit") : "N/A");
  } catch (error) {
    console.log("ERROR in keyword args test:", error.message);
  }

  console.log("\n=== Debug Analysis Complete ===");
});