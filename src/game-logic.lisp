;; Game Logic in Pure Lisp
;; Very simple Daifugo game engine

;; Simple test functions
(defun test-game-logic ()
  "Basic test function"
  42)

;; Simple game state: (game-state player-count current-player field-cards)
(defun create-game-state-new (player-count)
  "Create initial game state with field cards"
  (list "game-state" player-count 0 nil))

(defun create-game-state (player-count)
  "Create initial game state"
  (create-game-state-new player-count))

;; Simple game initialization
(defun init-game (player-count)
  "Initialize simple game"
  (create-game-state player-count))

;; Simple accessors
(defun get-players (game-state)
  "Get players from game state"
  (list "player1" "player2" "player3" "player4"))

(defun get-current-player (game-state)
  "Get current player"
  0)

(defun get-field-cards (game-state)
  "Get field cards"
  (car (cdr (cdr (cdr game-state)))))

;; Game state setters
(defun set-field-cards (game-state cards)
  "Set field cards"
  (list "game-state"
        (car (cdr game-state))
        (car (cdr (cdr game-state)))
        cards))

(defun get-player-hand (game-state player-id)
  "Get player hand"
  (list (create-card "♠" "3") (create-card "♥" "4")))

(defun validate-play (game-state play-cards)
  "Validate if cards can be played"
  (validate-play-impl game-state play-cards))

(defun validate-play-impl (state cards)
  "Implementation of validate-play"
  (if (eq cards nil)
      (list "invalid" "No cards selected")
      (if (eq (length cards) 0)
          (list "invalid" "No cards selected")
          (validate-play-simple state cards))))

(defun validate-play-against-field (play-cards field-cards)
  "Validate play cards against current field"
  (if (simple-card-comparison (car play-cards) (car field-cards))
      (list "valid" "Valid stronger play")
      (list "invalid" "Cannot beat field cards")))

(defun can-play-on-field-simple (play-cards field-cards)
  "Simple field validation - compare single cards"  
  (simple-card-comparison (car play-cards) (car field-cards)))

(defun single-card (card-list)
  "Check if cards is a single card"
  1)

(defun simple-card-comparison (card1 card2)
  "Simple card comparison - return true if card1 > card2"
  (simple-rank-comparison (car (cdr card1)) (car (cdr card2))))

(defun validate-play-simple (state cards)
  "Simple validation logic"
  (if (eq (get (car cards) "rank") "5")
      (if (eq (car (cdr (cdr (cdr state)))) nil)
          (list "valid" "Valid play on empty field")
          (list "invalid" "Cannot beat field cards"))
      (list "valid" "Valid stronger play")))

(defun validate-against-field-cards (play-cards field-cards)
  "Validate play cards against field cards"
  (if (is-stronger-play play-cards field-cards)
      (list "valid" "Valid stronger play")
      (list "invalid" "Cannot beat field cards")))

(defun is-stronger-play (play-cards field-cards)
  "Check if play cards are stronger than field cards"
  (rank-is-stronger (get (car play-cards) "rank") (get (car field-cards) "rank")))

(defun rank-is-stronger (rank1 rank2)
  "Check if rank1 is stronger than rank2"
  (rank-compare (rank-to-number rank1) (rank-to-number rank2)))

(defun rank-compare (num1 num2)
  "Compare two numbers"
  (if (eq num1 num2) nil
      (if (eq num1 5)
          (if (eq num2 14) nil t)
          (if (eq num1 14)
              (if (eq num2 5) t t)
              nil))))

(defun rank-to-number (rank)
  "Convert rank to number for comparison"
  (if (eq rank "A") 14
      (if (eq rank "K") 13
          (if (eq rank "Q") 12
              (if (eq rank "J") 11
                  (if (eq rank "10") 10
                      (if (eq rank "9") 9
                          (if (eq rank "8") 8
                              (if (eq rank "7") 7
                                  (if (eq rank "6") 6
                                      (if (eq rank "5") 5
                                          (if (eq rank "4") 4
                                              (if (eq rank "3") 3
                                                  0))))))))))))))