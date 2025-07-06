;; Name: 7渡し
;; Description: 7を出すと次のプレイヤーは必ずカードを出さなければならない
;; Category: custom

(define-rule seven-pass
  "Seven forces next player to play"
  (lambda (current-cards field-cards game-state)
    (when (any-card-rank current-cards "7")
      (set-next-player-must-play game-state true)
      (allow-play))))

(define-trigger after-seven-play
  "Force next player to play after 7"
  (lambda (game-state)
    (when (get-next-player-must-play game-state)
      (disable-pass-button)
      (set-next-player-must-play game-state false))))

;; Usage: When 7 is played, next player cannot pass
;; Example: Player A plays 7♠, Player B must play a card or draw penalty