;;; cards.scm — カードの表現
;;;
;;; ランクは強さ順の整数: 3..10, J=11, Q=12, K=13, A=14, 2=15, ジョーカー=16。
;;; id は UI とのやり取りに使う文字列: "S3" "HJ" "D10" "C2" "JK1" "JK2"。

(struct card (rank suit id) #:transparent)

(define SUITS '(spade heart diamond club))
(define JOKER-RANK 16)
(define MIN-RANK 3)
(define MAX-RANK 15)

(define (suit-letter s)
  (case s [(spade) "S"] [(heart) "H"] [(diamond) "D"] [(club) "C"] [else "JK"]))

(define (rank-label r)
  (case r
    [(11) "J"] [(12) "Q"] [(13) "K"] [(14) "A"] [(15) "2"] [(16) "JK"]
    [else (number->string r)]))

(define (make-card rank suit)
  (card rank suit (string-append (suit-letter suit) (rank-label rank))))

(define (make-joker k)
  (card JOKER-RANK 'joker (string-append "JK" (number->string k))))

(define (joker? c) (eq? (card-suit c) 'joker))

(define (make-deck jokers)
  (append (flat-map (lambda (s) (map (lambda (r) (make-card r s)) (range MIN-RANK (+ MAX-RANK 1))))
                    SUITS)
          (map make-joker (range 1 (+ jokers 1)))))

;; id -> card の索引（ジョーカーは最大 2 枚）
(define *card-index*
  (fold (lambda (h c) (hash-insert h (card-id c) c)) (hash) (make-deck 2)))

(define (id->card id)
  (let ([c (hash-try-get *card-index* id)])
    (if c c (error "unknown card id:" id))))

(define (suit-order s)
  (case s [(spade) 0] [(heart) 1] [(diamond) 2] [(club) 3] [else 4]))

;; 手札の表示順: 弱い順、同ランクはスート順、ジョーカーは最後
(define (card<? a b)
  (or (< (card-rank a) (card-rank b))
      (and (= (card-rank a) (card-rank b))
           (or (< (suit-order (card-suit a)) (suit-order (card-suit b)))
               (and (= (suit-order (card-suit a)) (suit-order (card-suit b)))
                    (string<? (card-id a) (card-id b)))))))

(define (sort-cards cards) (sort cards card<?))

(define (card-ids cards) (map card-id cards))

(define (has-card? cards c)
  (any? (lambda (x) (equal? (card-id x) (card-id c))) cards))

(define (remove-cards hand cards)
  (remove-if (lambda (x) (has-card? cards x)) hand))
