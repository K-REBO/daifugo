;; Name: 上級者向けルール
;; Description: より複雑なゲーム展開を生む上級ルール
;; Category: advanced

(define-rule advanced-combo
  ;; ストレート（連続する3枚以上）の特別効果
  (when (is-straight cards 3)
    (clear-field)
    (reverse-turn-order)
    (log-message "ストレートで場をクリア＆順番逆転！"))
  
  ;; 同スート4枚の特殊効果
  (when (and (= (length cards) 4)
             (all-same-suit cards))
    (skip-two-players)
    (log-message "同スート4枚で2人スキップ！"))
  
  ;; エースとキングの組み合わせ
  (when (and (contains-rank cards "A")
             (contains-rank cards "K"))
    (force-draw-cards all-players 1)
    (log-message "エース・キングコンボで全員1枚ドロー！")))