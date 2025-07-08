;; Card Operations in Pure Lisp
;; Complete card manipulation system for Daifugo

;; Simple test function first
(defun test-basic ()
  "Basic test function"
  42)

;; Basic card creation
(defun create-card (suit rank)
  "Create a card with given suit and rank"
  (list "card" suit rank))

(defun create-joker ()
  "Create a joker card"
  (list "card" nil "JOKER"))

;; Full deck creation
(defun create-deck ()
  "Create a full 54-card deck with jokers"
  (let ((spades (list (create-card "♠" "3") (create-card "♠" "4") (create-card "♠" "5") (create-card "♠" "6")
                      (create-card "♠" "7") (create-card "♠" "8") (create-card "♠" "9") (create-card "♠" "10")
                      (create-card "♠" "J") (create-card "♠" "Q") (create-card "♠" "K") (create-card "♠" "A") (create-card "♠" "2")))
        (hearts (list (create-card "♥" "3") (create-card "♥" "4") (create-card "♥" "5") (create-card "♥" "6")
                      (create-card "♥" "7") (create-card "♥" "8") (create-card "♥" "9") (create-card "♥" "10")
                      (create-card "♥" "J") (create-card "♥" "Q") (create-card "♥" "K") (create-card "♥" "A") (create-card "♥" "2")))
        (diamonds (list (create-card "♦" "3") (create-card "♦" "4") (create-card "♦" "5") (create-card "♦" "6")
                        (create-card "♦" "7") (create-card "♦" "8") (create-card "♦" "9") (create-card "♦" "10")
                        (create-card "♦" "J") (create-card "♦" "Q") (create-card "♦" "K") (create-card "♦" "A") (create-card "♦" "2")))
        (clubs (list (create-card "♣" "3") (create-card "♣" "4") (create-card "♣" "5") (create-card "♣" "6")
                     (create-card "♣" "7") (create-card "♣" "8") (create-card "♣" "9") (create-card "♣" "10")
                     (create-card "♣" "J") (create-card "♣" "Q") (create-card "♣" "K") (create-card "♣" "A") (create-card "♣" "2")))
        (jokers (list (create-joker) (create-joker))))
    (append spades hearts diamonds clubs jokers)))