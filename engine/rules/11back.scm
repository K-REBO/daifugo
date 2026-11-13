;;; 11バック: J のシングル・枚数出しで、場が流れるまで強さが逆転する。

(define-rule! '11back "11バック"
  "Jを出すと、その場が流れるまでカードの強さが逆転する。"
  (hash 'on-play
        (lambda (st player p prev)
          (if (and (memq (play-type p) '(single set)) (= (play-rank p) 11))
              (let ([st (st-set st 'back11 (not (st-ref st 'back11)))])
                (add-event st 'back11 player "11バック！"))
              st))
        'on-clear
        (lambda (st) (st-set st 'back11 #f))))
