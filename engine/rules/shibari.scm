;;; 縛り（スート縛り）: 直前と同じマークの組み合わせで出すと、
;;; 場が流れるまでそのマークしか出せなくなる。ジョーカーはどのマークにもなれる。

(define (no-joker? p) (= (length (play-suits p)) (play-n p)))

(define-rule! 'shibari "縛り"
  "直前の役と同じマークで出すと、場が流れるまでそのマークでしか出せなくなる。"
  (hash 'can-follow
        (lambda (st new prev)
          (let ([lock (st-ref st 'lock)])
            (if (and prev lock (not (multiset-subset? (play-suits new) lock)))
                'deny
                #f)))
        'on-play
        (lambda (st player p prev)
          (if (and prev (not (st-ref st 'lock))
                   (no-joker? p) (no-joker? prev)
                   (equal? (play-suits p) (play-suits prev)))
              (add-event (st-set st 'lock (play-suits p)) 'shibari player "縛り！")
              st))
        'on-clear
        (lambda (st) (st-set st 'lock #f))))
