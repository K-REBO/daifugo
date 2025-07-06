;; Name: デモンストレーション用ルール
;; Description: 大富豪のカスタムルールのデモ
;; Category: demo

(define-rule demo-rule
  ;; 5を出すと次のプレイヤーに追加のターンを与える
  (when (any-card-rank cards "5")
    (give-extra-turn next-player)
    (log-message "5で追加ターン！"))
  
  ;; クイーンを2枚以上出すと全員のカードが1枚ずつ減る
  (when (and (>= (length cards) 2)
             (all-same-rank cards "Q"))
    (reduce-all-hands 1)
    (log-message "クイーンの特殊効果発動！")))