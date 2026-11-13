;;; スペ3返し: 単騎のジョーカーに対してスペードの 3 を出せる。出すと場が流れる。

(define (spade3-play? p)
  (and (eq? (play-type p) 'single)
       (equal? (card-id (car (play-cards p))) "S3")))

(define-rule! 'spade3 "スペ3返し"
  "ジョーカー1枚に対してスペードの3を出せる。出すと場が流れ、出した人から再開する。"
  (hash 'can-follow
        (lambda (st new prev)
          (if (and prev (joker-single? prev) (spade3-play? new)) 'allow #f))
        'on-play
        (lambda (st player p prev)
          (if (and prev (joker-single? prev) (spade3-play? p))
              (request-flush (add-event st 'spade3 player "スペ3返し！"))
              st))))
