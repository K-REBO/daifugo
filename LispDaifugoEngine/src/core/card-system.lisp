;;; card-system.lisp - カード管理システム

(defpackage :daifugo-card-system
  (:use :common-lisp)
  (:export #:card
           #:make-card
           #:create-card
           #:card-rank
           #:card-suit
           #:card-strength
           #:calculate-card-strength
           #:create-deck
           #:shuffle-deck
           #:deal-cards
           #:compare-cards))

(in-package :daifugo-card-system)

;;; カード構造体
(defstruct card
  rank   ; 数字 (3-10, J, Q, K, A, 2, JOKER)
  suit   ; スート (:spades :hearts :diamonds :clubs :joker)
  strength) ; 強さ (3=1, 4=2, ..., A=12, 2=13, JOKER=14)

;;; カード強度計算
(defun calculate-card-strength (rank)
  "カードの強度を計算する"
  (case rank
    (3 1) (4 2) (5 3) (6 4) (7 5) (8 6) (9 7) (10 8)
    (J 9) (Q 10) (K 11) (A 12) (2 13) (JOKER 14)
    (otherwise 0)))

;;; カード作成
(defun create-card (rank suit)
  "カードを作成する"
  (make-card :rank rank 
             :suit suit 
             :strength (calculate-card-strength rank)))

;;; デッキ作成
(defun create-deck ()
  "標準的な54枚デッキを作成する"
  (let ((deck nil))
    ;; 通常のカード (52枚)
    (dolist (suit '(:spades :hearts :diamonds :clubs))
      (dolist (rank '(3 4 5 6 7 8 9 10 J Q K A 2))
        (push (create-card rank suit) deck)))
    ;; ジョーカー (2枚)
    (push (create-card 'JOKER :joker) deck)
    (push (create-card 'JOKER :joker) deck)
    deck))

;;; デッキシャッフル
(defun shuffle-deck (deck)
  "デッキをシャッフルする"
  (let ((shuffled (copy-list deck)))
    (loop for i from (1- (length shuffled)) downto 1 do
      (let ((j (random (1+ i))))
        (rotatef (nth i shuffled) (nth j shuffled))))
    shuffled))

;;; カード配布
(defun deal-cards (deck player-count)
  "カードを均等に配布する"
  (let ((hands (make-array player-count :initial-element nil))
        (cards-per-player (floor (length deck) player-count)))
    (loop for i from 0 below (* player-count cards-per-player) do
      (let ((player-id (mod i player-count)))
        (push (nth i deck) (aref hands player-id))))
    (map 'list #'identity hands)))

;;; カード比較
(defun compare-cards (card1 card2)
  "カード強度を比較する (card1 > card2 なら正値)"
  (- (card-strength card1) (card-strength card2)))