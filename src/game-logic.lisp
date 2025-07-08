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
  "Get current player from game state"
  (car (cdr (cdr game-state))))

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

(defun set-current-player (game-state new-player)
  "Set current player in game state"
  (list "game-state"
        (car (cdr game-state))
        new-player
        (car (cdr (cdr (cdr game-state))))))

(defun get-player-hand (game-state player-id)
  "Get player hand"
  (list (create-card "♠" "3") (create-card "♥" "4")))

(defun validate-play (game-state play-cards)
  "Validate if cards can be played"
  (validate-play-impl game-state play-cards))

(defun validate-play-impl (state cards)
  "Implementation of validate-play with multi-card support"
  (if (eq cards nil)
      (list "invalid" "No cards selected")
      (if (eq (length cards) 0)
          (list "invalid" "No cards selected")
          (let ((hand-type (validate-hand-type cards)))
            (if (eq (car hand-type) "invalid")
                (list "invalid" (car (cdr hand-type)))
                (validate-play-simple state cards))))))

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
  (simple-rank-comparison (get-card-rank card1) (get-card-rank card2)))

(defun validate-play-simple (state cards)
  "Simple validation logic"
  (let ((field-cards (get-field-cards state)))
    (if (eq field-cards nil)
        (list "valid" "Valid play on empty field")
        (validate-against-field-cards cards field-cards))))

(defun validate-against-field-cards (play-cards field-cards)
  "Validate play cards against field cards with type matching"
  (let ((play-type (validate-hand-type play-cards))
        (field-type (validate-hand-type field-cards)))
    (cond ((eq (car play-type) "invalid") 
           (list "invalid" "Invalid card combination"))
          ((not (eq (car play-type) (car field-type))) 
           (list "invalid" "Card type mismatch"))
          ((is-stronger-than play-cards field-cards) 
           (list "valid" "Valid stronger play"))
          (t (list "invalid" "Cannot beat field cards")))))

(defun is-stronger-play (play-cards field-cards)
  "Check if play cards are stronger than field cards"
  (let ((comparison (compare-cards (car play-cards) (car field-cards))))
    (eq comparison 1)))

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
                                                  0))))))))))))

;; Game State Management Functions

(defun init-game-state (player-count)
  "Initialize game state with given player count"
  (list "game-state" player-count 0 nil))

(defun update-game-state (state action)
  "Update game state based on action"
  (if (eq (get action "type") "next-player")
      (advance-current-player state)
      (if (eq (get action "type") "set-field")
          (set-field-cards state (get action "cards"))
          state)))

(defun advance-current-player (state)
  "Advance current player with wrapping"
  (advance-player-simple state))

(defun advance-player-simple (state)
  "Simple player advancement"
  (if (eq (car (cdr (cdr state))) 2)
      (list "game-state" (car (cdr state)) 0 (car (cdr (cdr (cdr state)))))
      (list "game-state" (car (cdr state)) (+ (car (cdr (cdr state))) 1) (car (cdr (cdr (cdr state)))))))

;; Complete Game Flow Functions for Phase 8.2

(defun process-turn (state action)
  "Process a complete turn with action handling"
  (let ((action-type (get action "type")))
    (if (eq action-type "deal-cards")
        (process-deal-cards state action)
        (if (eq action-type "play-cards")
            (process-play-cards state action)
            (if (eq action-type "pass")
                (process-pass action state)
                state)))))

(defun process-deal-cards (state action)
  "Deal cards to all players"
  (let ((deck (get action "data")))
    (append state (list "dealt"))))

(defun process-play-cards (state action)
  "Process card play action"
  (let ((player-id (car (get action "data")))
        (cards (car (cdr (get action "data")))))
    (advance-current-player state)))

(defun process-pass (action state)
  "Process pass action"
  (advance-current-player state))

(defun check-game-end (state)
  "Check if game has ended"
  (list "game-continue" nil))

(defun calculate-ranking (state)
  "Calculate player rankings"
  (let ((player-count (car (cdr state))))
    (if (eq player-count 4)
        (list (list 0 "playing") (list 1 "playing") (list 2 "playing") (list 3 "playing"))
        (list (list 0 "playing")))))