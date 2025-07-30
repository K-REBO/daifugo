;;; tests/test-game-logic.lisp - ゲームロジックのテスト

(defpackage :daifugo-game-logic-integrated-test
  (:use :common-lisp :fiveam :daifugo-game-logic)
  (:export #:run-all-tests #:run-game-logic-tests))

(in-package :daifugo-game-logic-integrated-test)

(def-suite :daifugo-game-logic)
(in-suite :daifugo-game-logic)

;;; カード出しの基本ルールテスト
(test test-single-card-play
  "単体カード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (nth 0 (daifugo-game-engine:game-state-players game)))
           (card (first (daifugo-player-system:player-hand player))))
      (is-true (daifugo-game-logic:play-card game 0 (list card))))))

(test test-pair-card-play
  "ペア出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (nth 0 (daifugo-game-engine:game-state-players game)))
           (hand (daifugo-player-system:player-hand player)))
      ;; 手札からペアを探す（簡易的な実装）
      (let ((pair (loop for c1 in hand
                        append (loop for c2 in (cdr (member c1 hand))
                                     when (eql (daifugo-card-system:card-rank c1) (daifugo-card-system:card-rank c2))
                                     collect (list c1 c2)))))
        (when pair
          (is-true (daifugo-game-logic:play-card game 0 (first pair))))))))

(test test-sequence-card-play
  "階段出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (nth 0 (daifugo-game-engine:game-state-players game)))
           (hand (daifugo-player-system:player-hand player)))
      ;; 手札から階段を探す（簡易的な実装）
      (let ((sequence (list (daifugo-card-system:create-card 3 :spades)
                            (daifugo-card-system:create-card 4 :hearts)
                            (daifugo-card-system:create-card 5 :diamonds))))
        ;; プレイヤーの手札にこの階段が含まれていると仮定
        (setf (daifugo-player-system:player-hand player) (append sequence (cdddr hand)))
        (is-true (daifugo-game-logic:play-card game 0 sequence))))))

(test test-card-strength-validation
  "カード強度の検証テスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((weak-card (daifugo-card-system:create-card 3 :spades))
          (strong-card (daifugo-card-system:create-card 'A :hearts)))
      (daifugo-game-engine:play-card game 0 (list weak-card))
      (is-true (daifugo-game-logic:play-card game 1 (list strong-card))))))

(test test-invalid-card-play
  "無効なカード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((strong-card (daifugo-card-system:create-card 'A :spades))
          (weak-card (daifugo-card-system:create-card 3 :hearts)))
      (daifugo-game-engine:play-card game 0 (list strong-card))
      (signals error (daifugo-game-logic:play-card game 1 (list weak-card))))))

(test test-revolution-detection
  "革命判定のテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (revolution-cards (list (daifugo-card-system:create-card 3 :spades)
                               (daifugo-card-system:create-card 3 :hearts)
                               (daifugo-card-system:create-card 3 :diamonds)
                               (daifugo-card-system:create-card 3 :clubs))))
    (daifugo-game-engine:start-game game)
    (daifugo-game-logic:play-card game 0 revolution-cards)
    (is-true (daifugo-game-engine:game-state-revolution-p game))))

(test test-8cut-rule
  "8切りルールのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (eight-card (daifugo-card-system:create-card 8 :spades)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-engine:play-card game 0 (list (daifugo-card-system:create-card 'A :spades)))
    (daifugo-game-engine:play-card game 1 (list eight-card))
    (is-false (daifugo-game-engine:game-state-field game))))

(test test-pass-all-around
  "全プレイヤーパスのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-engine:play-card game 0 (list (daifugo-card-system:create-card 'A :spades)))
    (daifugo-game-engine:pass-turn game 1)
    (daifugo-game-engine:pass-turn game 2)
    (daifugo-game-engine:pass-turn game 3)
    (is-false (daifugo-game-engine:game-state-field game))
    (is (= (daifugo-game-engine:get-current-player game) 0))))

;;; ==========================================
;;; 簡易テスト関数（詳細バージョン）
;;; ==========================================

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

;;; 簡易テスト関数（詳細バージョン）
(defun test-basic-game-state-detailed ()
  "基本的なゲーム状態のテスト（詳細）"
  (test-assert (find-package :daifugo-game-state) "ゲーム状態パッケージが存在する")
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-assert (find-package :daifugo-player-system) "プレイヤーシステムパッケージが存在する"))

(defun test-card-validation-detailed ()
  "カード検証のテスト（詳細）"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")
    (test-assert (every (lambda (card) 
                          (and (daifugo-card-system:card-rank card)
                               (daifugo-card-system:card-suit card)))
                        deck)
                 "すべてのカードが有効な形式である")))

(defun test-player-creation-detailed ()
  "プレイヤー作成のテスト（詳細）"
  (let ((players (daifugo-player-system:create-players 4)))
    (test-assert (= (length players) 4) "4人のプレイヤーが作成される")
    (test-assert (every (lambda (player)
                          (eq (daifugo-player-system:player-rank player) :heimin))
                        players)
                 "すべてのプレイヤーが平民で開始する")))

(defun test-game-state-creation-detailed ()
  "ゲーム状態作成のテスト（詳細）"
  (let* ((players (daifugo-player-system:create-players 4))
         (game-state (daifugo-game-state:make-game-state 
                      :players players 
                      :current-player 0
                      :field nil
                      :game-phase :playing)))
    (test-assert (not (null game-state)) "ゲーム状態が作成される")
    (test-assert (= (daifugo-game-state:game-state-current-player game-state) 0) 
                 "現在のプレイヤーが正しく設定される")))

(defun run-game-logic-tests ()
  "ゲームロジックテストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== ゲームロジックテスト実行（詳細） ===~%")
  
  (test-basic-game-state-detailed)
  (test-card-validation-detailed)
  (test-player-creation-detailed)
  (test-game-state-creation-detailed)
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))

(test test-player-hand-management
  "プレイヤー手札管理のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (first (daifugo-game-engine:game-state-players game)))
           (initial-count (length (daifugo-player-system:player-hand player)))
           (card-to-play (first (daifugo-player-system:player-hand player))))
      (daifugo-game-logic:play-card game 0 (list card-to-play))
      (is (< (length (daifugo-player-system:player-hand player)) initial-count)))))

(defun run-all-tests ()
  (run! ':daifugo-game-logic))
