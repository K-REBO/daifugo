;; Name: 階段
;; Description: 連続した数字の組み合わせ
;; Category: advanced

(define-rule stairs
  "Allow consecutive number sequences"
  (lambda (current-cards field-cards game-state)
    (when (and (>= (length current-cards) 3)
               (consecutive-ranks current-cards))
      (allow-play))))

(define-helper consecutive-ranks
  "Check if cards form a consecutive sequence"
  (lambda (cards)
    (let ((ranks (sort (map get-rank cards) <)))
      (all-consecutive ranks))))

(define-helper all-consecutive
  "Check if numbers are consecutive"
  (lambda (numbers)
    (if (<= (length numbers) 1)
        true
        (= (- (second numbers) (first numbers)) 1)
           (all-consecutive (rest numbers)))))

;; Usage: Player can play 3-4-5, 10-J-Q-K, etc.
;; Example: 3♠ 4♥ 5♦ is a valid stairs play