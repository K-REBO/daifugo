;;; game-state.lisp - ゲーム状態管理

(defpackage :daifugo-game-state
  (:use :common-lisp)
  (:export #:game-state
           #:make-game-state
           #:game-state-players
           #:game-state-current-player
           #:game-state-field
           #:game-state-game-phase
           #:game-state-direction
           #:game-state-rules
           #:game-state-logs
           #:game-state-round-number
           #:game-state-turn-count))

(in-package :daifugo-game-state)

;;; ゲーム状態構造体
(defstruct game-state
  "ゲーム全体の状態を管理する構造体"
  players           ; プレイヤーリスト
  current-player    ; 現在のプレイヤーID
  field            ; 場に出ているカード
  game-phase       ; ゲームフェーズ (:setup :playing :finished)
  direction        ; 回転方向 (:clockwise :counterclockwise)
  rules            ; 適用ルール
  logs             ; ゲームログ
  round-number     ; ラウンド番号
  turn-count)      ; ターン数