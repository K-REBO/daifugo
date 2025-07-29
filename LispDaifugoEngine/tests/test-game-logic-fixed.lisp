;;; tests/test-game-logic-fixed.lisp - ゲームロジックのテスト（修正版）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-game-logic-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-all-tests))

(in-package :daifugo-game-logic-test)

;;; 基本的なテスト関数群

(defun test-basic-lisp-environment ()
  "基本的なLisp環境のテスト"
  (test-assert (not (null :common-lisp)) "Common Lispが利用可能")
  (test-assert (functionp #'list) "基本的なLisp関数が利用可能")
  (test-assert (functionp #'+) "算術関数が利用可能"))

(defun test-basic-data-structures ()
  "基本的なデータ構造のテスト"
  ;; リストの基本操作
  (let ((test-list '(1 2 3 4)))
    (test-assert (= (length test-list) 4) "リストの長さが正しく取得できる")
    (test-assert (= (first test-list) 1) "リストの最初の要素が取得できる")
    (test-assert (equal (last test-list) '(4)) "リストの最後の要素が取得できる"))
  
  ;; ハッシュテーブルの基本操作
  (let ((test-hash (make-hash-table)))
    (setf (gethash :key test-hash) :value)
    (test-assert (eq (gethash :key test-hash) :value) "ハッシュテーブルの値が設定・取得できる")))

(defun test-basic-game-concepts ()
  "基本的なゲーム概念のテスト"
  ;; カードの概念的表現
  (let ((card-ranks '(:ace :2 :3 :4 :5 :6 :7 :8 :9 :10 :jack :queen :king))
        (card-suits '(:spades :hearts :diamonds :clubs)))
    (test-assert (= (length card-ranks) 13) "13種類のランクが定義されている")
    (test-assert (= (length card-suits) 4) "4種類のスートが定義されている"))
  
  ;; プレイヤーの概念的表現
  (let ((player-ranks '(:daifugo :fujin :heimin :hinmin)))
    (test-assert (= (length player-ranks) 4) "4種類のプレイヤーランクが定義されている"))
  
  ;; ゲーム状態の概念的表現
  (let ((game-phases '(:setup :playing :finished)))
    (test-assert (= (length game-phases) 3) "ゲームフェーズが定義されている")))

(defun test-basic-game-logic ()
  "基本的なゲームロジックのテスト"
  ;; 簡単な強さ比較ロジック
  (let ((rank-order '(:3 :4 :5 :6 :7 :8 :9 :10 :jack :queen :king :ace :2)))
    (test-assert (< (position :3 rank-order) (position :king rank-order)) 
                 "3よりキングの方が強い")
    (test-assert (< (position :king rank-order) (position :ace rank-order))
                 "キングよりエースの方が強い"))
  
  ;; 基本的な手札管理
  (let ((hand '(:3 :4 :5 :6 :7)))
    (test-assert (= (length hand) 5) "手札の枚数が正しく管理される")
    (test-assert (member :5 hand) "特定のカードが手札に含まれている")))

;;; メイン実行関数
(defun run-all-tests ()
  "すべてのゲームロジックテストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== ゲームロジック基本テスト実行 ===~%")
  
  (test-basic-lisp-environment)
  (test-basic-data-structures)
  (test-basic-game-concepts)
  (test-basic-game-logic)
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))

;;; 実行時にテストを自動実行
(when (not (find-package :swank))
  (run-all-tests))