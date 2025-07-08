;; Card Comparison System in Pure Lisp
;; Simplified implementation for Daifugo

;; Simple card rank comparison (3 < 4 < 5 ... < A < 2 < JOKER)
(defun get-card-rank (card)
  "Get rank from card structure ['card', suit, rank]"
  (car (cdr (cdr card))))

(defun compare-cards (card1 card2)
  "Compare two cards (-1: card1 weaker, 0: equal, 1: card1 stronger)"
  (let ((rank1 (get-card-rank card1))
        (rank2 (get-card-rank card2)))
    (let ((strength1 (get-rank-strength rank1))
          (strength2 (get-rank-strength rank2)))
      (cond ((< strength1 strength2) -1)
            ((> strength1 strength2) 1)
            (t 0)))))

(defun get-rank-strength (rank)
  "Get numeric strength of rank"
  (cond ((eq rank "3") 1)
        ((eq rank "4") 2)
        ((eq rank "5") 3)
        ((eq rank "6") 4)
        ((eq rank "7") 5)
        ((eq rank "8") 6)
        ((eq rank "9") 7)
        ((eq rank "10") 8)
        ((eq rank "J") 9)
        ((eq rank "Q") 10)
        ((eq rank "K") 11)
        ((eq rank "A") 12)
        ((eq rank "2") 13)
        ((eq rank "JOKER") 14)
        (t 0)))

;; Enhanced multi-card hand type validation
(defun validate-hand-type (cards)
  "Validate hand type and return (type rank count)"
  (let ((count (length cards)))
    (cond ((eq count 0) (list "invalid" "none" 0))
          ((eq count 1) (list "single" (get-card-rank (car cards)) 1))
          ((eq count 2) (if (is-valid-pair cards)
                            (list "pair" (get-card-rank (car cards)) 2)
                            (list "invalid" "mixed-ranks" 0)))
          ((eq count 3) (cond ((is-valid-triple cards)
                               (list "triple" (get-card-rank (car cards)) 3))
                              ((is-valid-sequence cards)
                               (list "sequence" (get-card-rank (car cards)) 3))
                              (t (list "invalid" "mixed-types" 0))))
          (t (if (is-valid-sequence cards)
                 (list "sequence" (get-card-rank (car cards)) count)
                 (list "invalid" "invalid-combination" 0)))))

;; Multi-card validation functions
(defun is-valid-pair (cards)
  "Check if cards form a valid pair (2 cards same rank)"
  (and (eq (length cards) 2)
       (eq (get-card-rank (car cards))
           (get-card-rank (car (cdr cards))))))

(defun is-valid-triple (cards)
  "Check if cards form a valid triple (3 cards same rank)"
  (and (eq (length cards) 3)
       (let ((rank (get-card-rank (car cards))))
         (and (eq rank (get-card-rank (car (cdr cards))))
              (eq rank (get-card-rank (car (cdr (cdr cards)))))))))

(defun is-valid-sequence (cards)
  "Check if cards form a valid sequence (3+ consecutive ranks)"
  (and (>= (length cards) 3)
       (consecutive-ranks cards)))

(defun consecutive-ranks (cards)
  "Check if cards have consecutive ranks - simplified version"
  (consecutive-simple cards))

(defun consecutive-simple (cards)
  "Simple consecutive check for 3 cards"
  (if (eq (length cards) 3)
      (let ((rank1 (get-rank-strength (get-card-rank (car cards))))
            (rank2 (get-rank-strength (get-card-rank (car (cdr cards)))))
            (rank3 (get-rank-strength (get-card-rank (car (cdr (cdr cards)))))))
        (or (and (eq (+ rank1 1) rank2) (eq (+ rank2 1) rank3))
            (and (eq (+ rank2 1) rank1) (eq (+ rank1 1) rank3))
            (and (eq (+ rank1 1) rank3) (eq (+ rank3 1) rank2))))
      nil))

;; Enhanced multi-card comparison
(defun is-stronger-than (hand1 hand2)
  "Check if hand1 is stronger than hand2 (multi-card support)"
  (let ((type1 (validate-hand-type hand1))
        (type2 (validate-hand-type hand2)))
    (cond 
      ;; Both hands must be valid
      ((or (eq (car type1) "invalid") (eq (car type2) "invalid")) nil)
      ;; Must be same type
      ((not (eq (car type1) (car type2))) nil)
      ;; Compare by rank strength
      (t (> (get-rank-strength (car (cdr type1)))
            (get-rank-strength (car (cdr type2))))))))

(defun is-stronger-hand (hand1 hand2)
  "Alias for is-stronger-than for consistency"
  (is-stronger-than hand1 hand2))