;;; game-engine.lisp - メインゲームエンジン

(defpackage :daifugo-game-engine
  (:use :common-lisp)
  (:export #:game-state
           #:create-game
           #:start-game
           #:play-card
           #:pass-turn
           #:get-current-player
           #:game-over-p))

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

;;; ゲーム作成
(defun create-game (player-count)
  "新しいゲームを作成する"
  (make-game-state
   :players (loop for i from 0 below player-count collect i)
   :current-player 0
   :field nil
   :deck nil
   :turn-direction :clockwise
   :game-phase :init
   :revolution-p nil
   :logs nil))

;;; ゲーム開始
(defun start-game (game-state)
  "ゲームを開始する"
  (setf (game-state-game-phase game-state) :playing)
  game-state)

;;; カードプレイ
(defun play-card (game-state player-id cards)
  "プレイヤーがカードを出す"
  (declare (ignore game-state player-id cards))
  ;; 実装は後で追加
  t)

;;; パス
(defun pass-turn (game-state player-id)
  "プレイヤーがパスする"
  (declare (ignore game-state player-id))
  ;; 実装は後で追加
  t)

;;; 現在のプレイヤー取得
(defun get-current-player (game-state)
  "現在のプレイヤーを取得する"
  (game-state-current-player game-state))

;;; ゲーム終了判定
(defun game-over-p (game-state)
  "ゲームが終了したかどうかを判定する"
  (declare (ignore game-state))
  ;; 実装は後で追加
  nil)