;; Name: 連続出し禁止
;; Description: 同じプレイヤーが連続でカードを出すことを禁止
;; Category: advanced

(define-rule no-consecutive-plays
  (when (same-player-last-two-turns)
    (deny-play)
    (log-message "連続出しは禁止されています")))