;; AI Logic in Pure Lisp
;; Basic AI decision making for Daifugo

;; AI Player structure: (ai-player id difficulty strategy-type)
(defun create-ai-player (id difficulty)
  "Create an AI player with given difficulty"
  (list "ai-player" id difficulty "basic-strategy"))

;; Card strength evaluation
(defun evaluate-card-strength (card is-revolution)
  "Evaluate the strength of a card"
  (let ((rank (get-card-rank card)))
    (if is-revolution
        (- 15 (get-rank-strength rank))
        (get-rank-strength rank))))

;; Hand analysis functions
(defun analyze-hand (hand game-state)
  "Analyze hand and return playable options"
  (let ((field-cards (get-field-cards game-state))
        (is-revolution (get-revolution-state game-state)))
    (list "hand-analysis"
          (get-playable-cards hand field-cards)
          (get-hand-strength hand is-revolution)
          (count-cards-by-rank hand))))

(defun get-playable-cards (hand field-cards)
  "Get cards that can be played against current field"
  (if (eq field-cards nil)
      hand
      (simple-filter-playable hand field-cards)))

(defun simple-filter-playable (cards field-cards)
  "Simple filter for playable cards"
  (if (eq cards nil)
      nil
      (if (can-beat-field (car cards) field-cards)
          (cons (car cards) (simple-filter-playable (cdr cards) field-cards))
          (simple-filter-playable (cdr cards) field-cards))))

(defun can-beat-field (card field-cards)
  "Check if single card can beat field"
  (if (eq field-cards nil)
      t
      (> (get-rank-strength (get-card-rank card))
         (get-rank-strength (get-card-rank (car field-cards))))))

(defun get-hand-strength (hand is-revolution)
  "Calculate overall hand strength"
  (if (eq hand nil)
      0
      (+ (evaluate-card-strength (car hand) is-revolution)
         (get-hand-strength (cdr hand) is-revolution))))

(defun count-cards-by-rank (hand)
  "Count cards grouped by rank"
  (count-ranks hand))

(defun count-ranks (cards)
  "Simple rank counting"
  (if (eq cards nil)
      nil
      (list "rank-counts" (length cards))))

;; Basic AI decision making
(defun make-ai-decision (hand game-state difficulty)
  "Make AI decision based on hand and game state"
  (let ((analysis (analyze-hand hand game-state))
        (playable-cards (get-playable-cards hand (get-field-cards game-state))))
    (if (eq playable-cards nil)
        (make-pass-decision difficulty)
        (make-play-decision playable-cards difficulty))))

(defun make-pass-decision (difficulty)
  "Create pass decision"
  (list "ai-decision" "pass" nil (get-reasoning difficulty "pass")))

(defun make-play-decision (playable-cards difficulty)
  "Create play decision from available cards"
  (let ((chosen-card (choose-card-by-difficulty playable-cards difficulty)))
    (list "ai-decision" "play" (list chosen-card) (get-reasoning difficulty "play"))))

(defun choose-card-by-difficulty (cards difficulty)
  "Choose card based on difficulty level"
  (cond ((eq difficulty "easy") (choose-random-card cards))
        ((eq difficulty "medium") (choose-lowest-card cards))
        ((eq difficulty "hard") (choose-strategic-card cards))
        (t (choose-random-card cards))))

(defun choose-random-card (cards)
  "Choose first available card (simplified random)"
  (car cards))

(defun choose-lowest-card (cards)
  "Choose the lowest strength card"
  (find-lowest-card cards))

(defun find-lowest-card (cards)
  "Find card with lowest strength"
  (if (eq (cdr cards) nil)
      (car cards)
      (let ((current (car cards))
            (lowest-rest (find-lowest-card (cdr cards))))
        (if (< (get-rank-strength (get-card-rank current))
               (get-rank-strength (get-card-rank lowest-rest)))
            current
            lowest-rest))))

(defun choose-strategic-card (cards)
  "Choose card using strategic logic"
  (choose-lowest-card cards))  ; Simplified for now

(defun get-reasoning (difficulty action)
  "Get reasoning text for decision"
  (if (eq action "pass")
      (concat-string difficulty " AI: No valid plays available")
      (concat-string difficulty " AI: Playing strategic card")))

(defun concat-string (str1 str2)
  "Simple string concatenation"
  str2)  ; Simplified for Lisp environment

;; Game state helpers
(defun get-revolution-state (game-state)
  "Check if game is in revolution mode"
  nil)  ; Simplified - always false for now

(defun get-field-cards (game-state)
  "Get current field cards from game state"
  (car (cdr (cdr (cdr game-state)))))

;; Advanced AI strategies
(defun get-ai-strategy (hand game-state difficulty)
  "Get AI strategy analysis"
  (list "ai-strategy"
        (get-cards-to-save hand)
        (get-threat-level game-state)
        (get-play-urgency hand game-state)))

(defun get-cards-to-save (hand)
  "Identify high-value cards to save"
  (filter-high-value-cards hand))

(defun filter-high-value-cards (cards)
  "Filter cards with high strategic value"
  (if (eq cards nil)
      nil
      (let ((card (car cards))
            (rest-cards (cdr cards)))
        (if (is-high-value-card card)
            (cons card (filter-high-value-cards rest-cards))
            (filter-high-value-cards rest-cards)))))

(defun is-high-value-card (card)
  "Check if card has high strategic value"
  (let ((rank (get-card-rank card)))
    (or (eq rank "A") (eq rank "2") (eq rank "JOKER"))))

(defun get-threat-level (game-state)
  "Analyze threat level from opponents"
  (list "threat-analysis" "medium"))  ; Simplified

(defun get-play-urgency (hand game-state)
  "Calculate urgency to play cards"
  (if (< (length hand) 3)
      "high"
      "medium"))

;; Lisp AI decision interface
(defun make-lisp-ai-decision (hand game-state)
  "Main Lisp AI decision function"
  (make-ai-decision hand game-state "medium"))

;; Evaluation functions for testing
(defun evaluate-card-strength-test (card)
  "Test function for card strength evaluation"
  (evaluate-card-strength card nil))

;; AI player management
(defun set-ai-players (game-state ai-players)
  "Set AI players in game state"
  (append game-state (list ai-players)))

(defun process-ai-turn (game-state player-id difficulty)
  "Process a complete AI turn"
  (let ((hand (get-player-hand game-state player-id))
        (decision (make-ai-decision hand game-state difficulty)))
    (list "ai-turn-result" 
          game-state 
          decision 
          (get-execution-time))))

(defun get-execution-time ()
  "Get simulated execution time"
  500)  ; 500ms default

(defun make-ai-decision-with-delay (hand game-state difficulty)
  "Make AI decision with thinking delay (returns promise-like structure)"
  (list "delayed-decision" 
        (make-ai-decision hand game-state difficulty) 
        (get-thinking-time difficulty)))

(defun get-thinking-time (difficulty)
  "Get thinking time based on difficulty"
  (cond ((eq difficulty "easy") 800)
        ((eq difficulty "medium") 1200)
        ((eq difficulty "hard") 2000)
        (t 1000)))

;; Hand setting helper (simplified)
(defun set-player-hand (game-state player-id hand)
  "Set hand for specific player (simplified)"
  game-state)  ; Return unchanged for now