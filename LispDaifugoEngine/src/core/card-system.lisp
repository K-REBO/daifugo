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
           #:*card-strength-map*
           #:create-deck
           #:shuffle-deck
           #:deal-cards
           #:compare-cards
           #:valid-rank-p
           #:valid-suit-p))

(in-package :daifugo-card-system)

;;; カード構造体
(defstruct card
  rank   ; 数字 (3-10, J, Q, K, A, 2, JOKER)
  suit   ; スート (:spades :hearts :diamonds :clubs :joker)
  strength) ; 強さ (3=1, 4=2, ..., A=12, 2=13, JOKER=14)

;;; カード強度計算
(defun calculate-card-strength (rank)
  "カードの強度を計算する"
  (cond
    ((eql rank 3) 1)
    ((eql rank 4) 2)
    ((eql rank 5) 3)
    ((eql rank 6) 4)
    ((eql rank 7) 5)
    ((eql rank 8) 6)
    ((eql rank 9) 7)
    ((eql rank 10) 8)
    ((eql rank 'J) 9)
    ((eql rank 'Q) 10)
    ((eql rank 'K) 11)
    ((eql rank 'A) 12)
    ((eql rank 2) 13)
    ((eql rank 'JOKER) 14)
    (t 0)))

;;; カード強度の定数
(defparameter *card-strength-map*
  '((3 . 1) (4 . 2) (5 . 3) (6 . 4) (7 . 5) (8 . 6) (9 . 7) (10 . 8)
    (J . 9) (Q . 10) (K . 11) (A . 12) (2 . 13) (JOKER . 14))
  "カードランクと強度のマッピング")

;;; ランク検証
(defun valid-rank-p (rank)
  "有効なランクかどうかを判定する"
  (or (and (numberp rank) (or (= rank 2) (and (>= rank 3) (<= rank 10))))
      (member rank '(J Q K A JOKER))))

;;; スート検証
(defun valid-suit-p (suit)
  "有効なスートかどうかを判定する"
  (member suit '(:spades :hearts :diamonds :clubs :joker)))

;;; カード作成
(defun create-card (rank suit)
  "カードを作成する"
  (unless (valid-rank-p rank)
    (error "無効なランク: ~A" rank))
  (unless (valid-suit-p suit)
    (error "無効なスート: ~A" suit))
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
    ;; 残りのカードを順番に配布
    (loop for i from (* player-count cards-per-player) below (length deck) do
      (let ((player-id (mod i player-count)))
        (push (nth i deck) (aref hands player-id))))
    (map 'list #'identity hands)))

;;; カード比較
(defun compare-cards (card1 card2)
  "カード強度を比較する (card1 > card2 なら正値)"
  (- (card-strength card1) (card-strength card2)))