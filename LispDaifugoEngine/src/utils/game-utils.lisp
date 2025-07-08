;;; game-utils.lisp - ゲーム操作ユーティリティ

(defpackage :daifugo-game-utils
  (:use :common-lisp)
  (:export #:next-player
           #:previous-player
           #:get-player-rank
           #:assign-ranks
           #:exchange-cards
           #:is-game-over
           #:calculate-game-score
           #:format-game-state
           #:validate-game-state))

(in-package :daifugo-game-utils)

;;; 次のプレイヤー
(defun next-player (current-player player-count direction)
  "次のプレイヤーを取得する"
  (case direction
    (:clockwise (mod (1+ current-player) player-count))
    (:counter-clockwise (mod (1- current-player) player-count))
    (otherwise current-player)))

;;; 前のプレイヤー
(defun previous-player (current-player player-count direction)
  "前のプレイヤーを取得する"
  (case direction
    (:clockwise (mod (1- current-player) player-count))
    (:counter-clockwise (mod (1+ current-player) player-count))
    (otherwise current-player)))

;;; プレイヤーランク取得
(defun get-player-rank (player-id finish-order)
  "プレイヤーのランクを取得する"
  (let ((position (position player-id finish-order)))
    (when position
      (case position
        (0 :daifugo)
        (1 :fugo)
        (otherwise (let ((total-players (length finish-order)))
                     (cond
                       ((= position (1- total-players)) :daihinmin)
                       ((= position (- total-players 2)) :hinmin)
                       (t :heimin))))))))

;;; ランク割り当て
(defun assign-ranks (finish-order)
  "完了順序からランクを割り当てる"
  (mapcar (lambda (player-id) 
            (cons player-id (get-player-rank player-id finish-order)))
          finish-order))

;;; カード交換
(defun exchange-cards (players)
  "階級に基づいてカード交換を行う"
  (declare (ignore players))
  ;; 実装は後で追加
  t)

;;; ゲーム終了判定
(defun is-game-over (players)
  "ゲームが終了したかどうかを判定する"
  (some #'daifugo-player-system:hand-empty-p players))

;;; ゲームスコア計算
(defun calculate-game-score (players)
  "ゲームスコアを計算する"
  (declare (ignore players))
  ;; 実装は後で追加
  nil)

;;; ゲーム状態フォーマット
(defun format-game-state (game-state)
  "ゲーム状態を読みやすい形式でフォーマットする"
  (format nil "Current Player: ~A, Phase: ~A, Revolution: ~A"
          (daifugo-game-engine:game-state-current-player game-state)
          (daifugo-game-engine:game-state-game-phase game-state)
          (daifugo-game-engine:game-state-revolution-p game-state)))

;;; ゲーム状態検証
(defun validate-game-state (game-state)
  "ゲーム状態が有効かどうかを検証する"
  (and (daifugo-game-engine:game-state-p game-state)
       (daifugo-game-engine:game-state-players game-state)
       (numberp (daifugo-game-engine:game-state-current-player game-state))))