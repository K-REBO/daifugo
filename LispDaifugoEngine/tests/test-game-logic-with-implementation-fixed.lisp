;;; test-game-logic-with-implementation-fixed.lisp - 実装付きゲームロジックテスト（修正版）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-game-logic-implementation-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-implementation-tests))

(in-package :daifugo-game-logic-implementation-test)

;;; 実装テスト関数群

(defun test-basic-implementation-requirements ()
  "基本的な実装要件のテスト"
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-assert (find-package :daifugo-player-system) "プレイヤーシステムパッケージが存在する")
  (test-assert (find-package :daifugo-game-state) "ゲーム状態パッケージが存在する"))

(defun test-card-creation-and-validation ()
  "カード作成と検証のテスト"
  (let ((card (daifugo-card-system:make-card :rank 7 :suit :spades)))
    (test-assert (not (null card)) "カードが作成される")
    (test-assert (eq (daifugo-card-system:card-rank card) 7) "カードランクが正しい")
    (test-assert (eq (daifugo-card-system:card-suit card) :spades) "カードスートが正しい")))

(defun test-game-state-implementation ()
  "ゲーム状態実装のテスト"
  (let* ((players (daifugo-player-system:create-players 4))
         (game-state (daifugo-game-state:make-game-state 
                      :players players 
                      :current-player 0
                      :field nil
                      :game-phase :playing)))
    (test-assert (not (null game-state)) "ゲーム状態が作成される")
    (test-assert (listp (daifugo-game-state:game-state-players game-state)) "プレイヤーリストが存在する")
    (test-assert (= (length (daifugo-game-state:game-state-players game-state)) 4) "4人のプレイヤーが設定される")))

(defun test-card-dealing-implementation ()
  "カード配布実装のテスト"
  (let* ((deck (daifugo-card-system:create-deck))
         (hands (daifugo-card-system:deal-cards deck 4)))
    (test-assert (listp hands) "手札リストが作成される")
    (test-assert (= (length hands) 4) "4人分の手札が作成される")
    (test-assert (every #'listp hands) "各手札がリスト形式である")))

;;; メイン実行関数
(defun run-implementation-tests ()
  "実装テストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== 実装付きゲームロジックテスト実行 ===~%")
  
  (test-basic-implementation-requirements)
  (test-card-creation-and-validation)
  (test-game-state-implementation)
  (test-card-dealing-implementation)
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))