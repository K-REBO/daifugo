;;; tests/test-game-logic-simple.lisp - ゲームロジックの簡易テスト

(defpackage :daifugo-game-logic-test
  (:use :common-lisp)
  (:export #:run-game-logic-tests))

(in-package :daifugo-game-logic-test)

;;; 簡易テストフレームワーク
(defvar *tests-passed* 0)
(defvar *tests-total* 0)

(defmacro test-assert (condition description)
  `(progn
     (incf *tests-total*)
     (if ,condition
         (progn
           (incf *tests-passed*)
           (format t "✅ ~A~%" ,description))
         (format t "❌ ~A~%" ,description))))

;;; テスト関数
(defun test-basic-game-state ()
  "基本的なゲーム状態のテスト"
  (test-assert (find-package :daifugo-game-state) "ゲーム状態パッケージが存在する")
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-assert (find-package :daifugo-player-system) "プレイヤーシステムパッケージが存在する"))

(defun test-card-validation ()
  "カード検証のテスト"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")
    (test-assert (every (lambda (card) 
                          (and (daifugo-card-system:card-rank card)
                               (daifugo-card-system:card-suit card)))
                        deck)
                 "すべてのカードが有効な形式である")))

(defun test-player-creation ()
  "プレイヤー作成のテスト"
  (let ((players (daifugo-player-system:create-players 4)))
    (test-assert (= (length players) 4) "4人のプレイヤーが作成される")
    (test-assert (every (lambda (player)
                          (eq (daifugo-player-system:player-rank player) :heimin))
                        players)
                 "すべてのプレイヤーが平民で開始する")))

(defun test-game-state-creation ()
  "ゲーム状態作成のテスト"
  (let* ((players (daifugo-player-system:create-players 4))
         (game-state (daifugo-game-state:make-game-state 
                      :players players 
                      :current-player 0
                      :field nil
                      :game-phase :playing)))
    (test-assert (not (null game-state)) "ゲーム状態が作成される")
    (test-assert (= (daifugo-game-state:game-state-current-player game-state) 0) 
                 "現在のプレイヤーが正しく設定される")))

;;; メイン実行関数
(defun run-game-logic-tests ()
  "ゲームロジックテストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== ゲームロジックテスト実行 ===~%")
  
  (test-basic-game-state)
  (test-card-validation)
  (test-player-creation)
  (test-game-state-creation)
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))