;;; game-engine.lisp - メインゲームエンジン

(defpackage :daifugo-game-engine
  (:use :common-lisp)
  (:export #:game-state
           #:game-state-p
           #:game-state-players
           #:game-state-current-player
           #:game-state-field
           #:game-state-deck
           #:game-state-turn-direction
           #:game-state-game-phase
           #:game-state-revolution-p
           #:game-state-logs
           #:create-game
           #:start-game
           #:play-card
           #:pass-turn
           #:get-current-player
           #:game-over-p
           #:advance-turn
           #:add-log
           #:initialize-game-state
           #:deal-cards))

(in-package :daifugo-game-engine)

;;; ゲーム状態の定義
(defstruct game-state
  players
  current-player
  field
  deck
  turn-direction
  game-phase
  revolution-p
  logs)

;;; カード配布
(defun deal-cards (players deck)
  "プレイヤーリストにカードを配布する"
  (let ((cards-per-player (floor (length deck) (length players)))
        (shuffled-deck (daifugo-card-system:shuffle-deck deck)))
    ;; 全プレイヤーの手札を初期化
    (dolist (player players)
      (setf (daifugo-player-system:player-hand player) nil))
    ;; カードを配布
    (loop for i from 0 below (length players) do
      (let ((player (nth i players)))
        (loop for j from 0 below cards-per-player do
          (let ((card-index (+ (* i cards-per-player) j)))
            (when (< card-index (length shuffled-deck))
              (daifugo-player-system:add-card-to-hand player (nth card-index shuffled-deck)))))))))

;;; ゲーム作成
(defun create-game (player-count)
  "新しいゲームを作成する"
  (when (or (< player-count 2) (> player-count 6))
    (error "プレイヤー数は2-6人である必要があります: ~A" player-count))
  (let ((deck (daifugo-card-system:create-deck))
        (players (daifugo-player-system:create-players player-count)))
    (deal-cards players deck)
    (make-game-state
     :players players
     :current-player 0
     :field nil
     :deck deck
     :turn-direction :clockwise
     :game-phase :init
     :revolution-p nil
     :logs nil)))

;;; ゲーム開始
(defun start-game (game-state)
  "ゲームを開始する"
  (unless (eql (game-state-game-phase game-state) :init)
    (error "ゲームは既に開始されています: ~A" (game-state-game-phase game-state)))
  (setf (game-state-game-phase game-state) :playing)
  (push (format nil "ゲーム開始 - プレイヤー数: ~A" (length (game-state-players game-state)))
        (game-state-logs game-state))
  game-state)

;;; カードプレイ
(defun play-card (game-state player-id cards)
  "プレイヤーがカードを出す"
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  
  ;; ゲームロジックを使用してカード出しを処理
  (daifugo-game-logic:process-card-play game-state player-id cards)
  t)

;;; パス
(defun pass-turn (game-state player-id)
  "プレイヤーがパスする"
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  
  ;; ゲームロジックを使用してパスを処理
  (daifugo-game-logic:process-pass game-state player-id)
  t)

;;; 現在のプレイヤー取得
(defun get-current-player (game-state)
  "現在のプレイヤーを取得する"
  (game-state-current-player game-state))

;;; 次のプレイヤーに進む
(defun advance-turn (game-state)
  "次のプレイヤーにターンを進める"
  (let ((player-count (length (game-state-players game-state)))
        (current (game-state-current-player game-state))
        (direction (game-state-turn-direction game-state)))
    (setf (game-state-current-player game-state)
          (if (eql direction :clockwise)
              (mod (1+ current) player-count)
              (mod (1- current) player-count)))))

;;; ログ追加
(defun add-log (game-state message)
  "ゲームログにメッセージを追加する"
  (push message (game-state-logs game-state)))

;;; ゲーム状態の初期化
(defun initialize-game-state (game-state)
  "ゲーム状態を初期化する"
  (setf (game-state-field game-state) nil
        (game-state-revolution-p game-state) nil
        (game-state-logs game-state) nil)
  (add-log game-state "ゲーム状態を初期化しました"))

;;; ゲーム終了判定
(defun game-over-p (game-state)
  "ゲームが終了したかどうかを判定する"
  (unless (eql (game-state-game-phase game-state) :playing)
    (return-from game-over-p nil))
  ;; 手札が空のプレイヤーがいるかチェック
  (some (lambda (player)
          (daifugo-player-system:hand-empty-p player))
        (game-state-players game-state)))