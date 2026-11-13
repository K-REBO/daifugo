;;; 革命: 同じ数字 4 枚以上で強さが逆転する（ジョーカーは最強のまま）。
;;; オプション kaidan-revolution: 階段でも革命（kaidan-revolution-size 枚以上）

(define (kakumei-trigger? st p)
  (or (and (eq? (play-type p) 'set) (>= (play-n p) 4))
      (and (eq? (play-type p) 'kaidan)
           (opt st 'kaidan-revolution #f)
           (>= (play-n p) (opt st 'kaidan-revolution-size 4)))))

(define-rule! 'kakumei "革命"
  "同じ数字を4枚以上出すと、カードの強さが逆転する（ジョーカーは最強のまま）。もう一度起こすと元に戻る。"
  (hash 'on-play
        (lambda (st player p prev)
          (if (kakumei-trigger? st p)
              (let ([st (st-set st 'revolution (not (st-ref st 'revolution)))])
                (add-event st 'revolution player (if (st-ref st 'revolution) "革命！" "革命返し！")))
              st)))
  '((kaidan-revolution . #f) (kaidan-revolution-size . 4)))
