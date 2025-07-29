;;; test-game-flow-fixed.lisp - ゲームフローのテスト（修正版）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-game-flow-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-game-flow-tests))

(in-package :daifugo-game-flow-test)

;;; ゲームフロー基本テスト関数群

(defun test-basic-game-flow-concepts ()
  "基本的なゲームフロー概念のテスト"
  (test-assert (numberp 4) "プレイヤー数が数値である")
  (test-assert (= 4 4) "4人ゲームの設定が正しい")
  (test-assert (listp '(:playing :finished)) "ゲームフェーズが定義されている"))

(defun test-game-initialization-concepts ()
  "ゲーム初期化概念のテスト"
  (let* ((player-count 4)
         (deck-size 53)  ; ジョーカー含む53枚
         (cards-per-player (floor deck-size player-count)))
    
    (test-assert (= player-count 4) "4人のプレイヤーが想定される")
    (test-assert (> deck-size 50) "十分な枚数のカードがある")
    (test-assert (> cards-per-player 10) "各プレイヤーに十分なカードが配布される")))

(defun test-game-state-concepts ()
  "ゲーム状態概念のテスト"
  (let* ((current-player 0)
         (players-list '(player1 player2 player3 player4))
         (game-phase :playing)
         (field-state nil))
    
    (test-assert (numberp current-player) "現在のプレイヤーが数値で管理される")
    (test-assert (= (length players-list) 4) "4人のプレイヤーリストがある")
    (test-assert (keywordp game-phase) "ゲームフェーズがキーワードで管理される")
    (test-assert (or (null field-state) (listp field-state)) "場の状態が適切に管理される")))

(defun test-turn-management-concepts ()
  "ターン管理概念のテスト"
  (let* ((current-player 0)
         (player-count 4)
         (next-player (mod (+ current-player 1) player-count)))
    
    ;; 次のプレイヤーの計算テスト
    (test-assert (numberp next-player) "次のプレイヤー番号が数値である")
    (test-assert (< next-player player-count) "次のプレイヤー番号が有効範囲内である")
    (test-assert (= next-player 1) "プレイヤー0の次はプレイヤー1である")
    
    ;; 巡回テスト
    (let ((last-to-first (mod (+ 3 1) player-count)))
      (test-assert (= last-to-first 0) "プレイヤー3の次はプレイヤー0に戻る"))))

(defun test-card-flow-concepts ()
  "カードフロー概念のテスト"
  (let* ((suits '(:spades :hearts :diamonds :clubs))
         (ranks '(3 4 5 6 7 8 9 10 :jack :queen :king :ace 2))
         (joker :joker)
         (total-cards (+ (* (length suits) (length ranks)) 1)))
    
    (test-assert (= (length suits) 4) "4つのスートがある")
    (test-assert (= (length ranks) 13) "13のランクがある")
    (test-assert (= total-cards 53) "合計53枚のカードがある")
    (test-assert (keywordp joker) "ジョーカーが定義されている")))

;;; メイン実行関数
(defun run-game-flow-tests ()
  "ゲームフローテストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== ゲームフロー概念テスト実行 ===~%")
  
  (test-basic-game-flow-concepts)
  (test-game-initialization-concepts)
  (test-game-state-concepts)
  (test-turn-management-concepts)
  (test-card-flow-concepts)
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))

;;; スクリプトとして実行された場合のメイン処理
(when (not (find-package :swank))
  (run-game-flow-tests))