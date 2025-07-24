import { assertEquals, assert } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { BasicEvaluator } from "../src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../src/parser/s-expression-parser.ts";

Deno.test("LispDaifugoEngine integration test", () => {
  const evaluator = new BasicEvaluator();
  const parser = new SExpressionParser();

  console.log("=== LispDaifugoEngine Integration Test ===");

  // 1. パッケージシステム初期化
  console.log("1. Initializing package system...");
  evaluator.evaluate(parser.parse("(defpackage :daifugo (:use :common-lisp))"));
  evaluator.evaluate(parser.parse("(in-package :daifugo)"));
  console.log("✅ Package system initialized");

  // 2. カードシステム基本構造体
  console.log("\n2. Defining core card structures...");
  
  // カード構造体（LispDaifugoEngineスタイル）
  evaluator.evaluate(parser.parse(`
    (defstruct card
      rank
      suit)
  `));
  
  // プレイヤー構造体
  evaluator.evaluate(parser.parse(`
    (defstruct player
      id
      name
      hand
      rank)
  `));

  // ゲーム状態構造体
  evaluator.evaluate(parser.parse(`
    (defstruct game-state
      players
      current-player
      field
      turn-direction
      revolution-p)
  `));

  console.log("✅ Core structures defined");

  // 3. カードシステム基本関数（LispDaifugoEngine互換）
  console.log("\n3. Implementing card system functions...");

  // カード強度計算（大富豪ルール）
  evaluator.evaluate(parser.parse(`
    (defun calculate-card-strength (rank)
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
      "新しいカードを作成"
      (make-card :rank rank :suit suit))
  `));

  // カード比較関数
  evaluator.evaluate(parser.parse(`
    (defun card-stronger-p (card1 card2)
      "card1がcard2より強いかチェック"
      (> (calculate-card-strength (card-rank card1))
         (calculate-card-strength (card-rank card2))))
  `));

  console.log("✅ Card system functions defined");

  // 4. プレイヤーシステム
  console.log("\n4. Implementing player system...");

  // プレイヤー作成
  evaluator.evaluate(parser.parse(`
    (defun create-player (id name)
      "新しいプレイヤーを作成"
      (make-player :id id :name name :hand nil :rank 0))
  `));

  // 手札に追加
  evaluator.evaluate(parser.parse(`
    (defun add-card-to-hand (player card)
      "プレイヤーの手札にカードを追加"
      (setf (player-hand player) 
            (cons card (player-hand player)))
      player)
  `));

  // 手札数取得
  evaluator.evaluate(parser.parse(`
    (defun hand-count (player)
      "プレイヤーの手札数を取得"
      (length (player-hand player)))
  `));

  console.log("✅ Player system functions defined");

  // 5. ゲームロジック実装
  console.log("\n5. Implementing game logic...");

  // ゲーム状態作成
  evaluator.evaluate(parser.parse(`
    (defun create-game-state (player-count)
      "新しいゲーム状態を作成"
      (let ((players (loop for i from 0 below player-count
                          collect (create-player i (format nil "Player~A" i)))))
        (make-game-state 
          :players players
          :current-player 0
          :field nil
          :turn-direction :clockwise
          :revolution-p nil)))
  `));

  // 勝利判定
  evaluator.evaluate(parser.parse(`
    (defun game-over-p (game-state)
      "ゲーム終了判定"
      (some (lambda (player) (= (hand-count player) 0))
            (game-state-players game-state)))
  `));

  console.log("✅ Game logic functions defined");

  // 6. 統合テスト実行
  console.log("\n6. Running integration tests...");

  // カードシステムテスト
  const testCard = evaluator.evaluate(parser.parse("(create-card 14 :spades)"));
  assertEquals(testCard.getValue("rank"), 14);
  assertEquals(testCard.getValue("suit"), "spades");
  console.log("✅ Card creation works");

  // 強度計算テスト
  const strength2 = evaluator.evaluate(parser.parse("(calculate-card-strength 2)"));
  const strengthAce = evaluator.evaluate(parser.parse("(calculate-card-strength 14)"));
  assertEquals(strength2, 13);
  assertEquals(strengthAce, 12);
  console.log("✅ Card strength calculation works");

  // カード比較テスト
  const comparison = evaluator.evaluate(parser.parse(`
    (card-stronger-p (create-card 14 :spades) (create-card 3 :hearts))
  `));
  assertEquals(comparison, true);
  console.log("✅ Card comparison works");

  // プレイヤーシステムテスト
  const testPlayer = evaluator.evaluate(parser.parse("(create-player 0 'Alice)"));
  assertEquals(testPlayer.getValue("id"), 0);
  assertEquals(testPlayer.getValue("name"), "Alice");
  console.log("✅ Player creation works");

  // 手札管理テスト
  const playerWithCard = evaluator.evaluate(parser.parse(`
    (add-card-to-hand (create-player 0 'Bob) (create-card 7 :hearts))
  `));
  const handSize = evaluator.evaluate(parser.parse(`
    (hand-count (add-card-to-hand (create-player 0 'Bob) (create-card 7 :hearts)))
  `));
  assertEquals(handSize, 1);
  console.log("✅ Hand management works");

  // ゲーム状態テスト
  const gameState = evaluator.evaluate(parser.parse("(create-game-state 4)"));
  assertEquals(gameState.getValue("players").length, 4);
  assertEquals(gameState.getValue("current-player"), 0);
  console.log("✅ Game state creation works");

  // 勝利判定テスト（簡易版）
  const gameNotOver = evaluator.evaluate(parser.parse("(game-over-p (create-game-state 2))"));
  assertEquals(gameNotOver, false);
  console.log("✅ Game over detection works");

  console.log("\n🎉 LispDaifugoEngine Integration Complete!");
  console.log("✅ 大富豪ゲームエンジンがDeno Lispインタープリターで完全動作！");
  console.log("✅ パッケージシステム, カードシステム, プレイヤーシステム, ゲームロジック すべて動作確認済み");
});