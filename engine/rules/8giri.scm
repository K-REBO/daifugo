;;; 8切り: 8 を含む役を出すと場が流れ、出した人がもう一度親になる。
;;; オプション kaidan-8giri: 階段に含まれる 8 でも流す（既定は無効）

(define (eight-trigger? st p)
  (case (play-type p)
    [(single set) (= (play-rank p) 8)]
    [(kaidan) (and (opt st 'kaidan-8giri #f)
                   (<= (play-rank p) 8 (+ (play-rank p) (- (play-n p) 1))))]
    [else #f]))

(define-rule! '8giri "8切り"
  "8を含む役を出すと場が流れ、出した人から再開する。"
  (hash 'on-play
        (lambda (st player p prev)
          (if (eight-trigger? st p)
              (request-flush (add-event st 'eight player "8切り！"))
              st)))
  '((kaidan-8giri . #f)))
