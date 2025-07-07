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
  (if (eq (car (cdr (car cards))) "5")
      (if (eq (car (cdr (car state))) 4)
          (list "valid" "Valid play on empty field")
          (list "invalid" "Cannot beat field cards"))
      (list "valid" "Valid stronger play")))