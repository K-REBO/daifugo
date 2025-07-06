;; Name: 11バック
;; Description: Jを出すと直前のカードより弱くてもOK
;; Category: advanced

(define-rule eleven-back
  "J (11) reverses the strength requirement"
  (lambda (current-cards field-cards game-state)
    (when (any-card-rank current-cards "J")
      (set-reverse-mode game-state true)
      (allow-play))))

;; Usage: When player plays Jack, temporarily reverse card strength
;; Example: If field has King, player can play Jack then 3,4,5... instead of A,2