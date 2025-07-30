;;; card-system.lisp - カード管理システム

(defpackage :daifugo-card-system
  (:use :common-lisp)
  (:export #:card
           #:make-card
           #:create-card
           #:card-rank
           #:card-suit
           #:card-strength
           #:card-p
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
    ;; シンボルは文字列で比較してパッケージ独立にする
    ((and (symbolp rank) (string= (symbol-name rank) "J")) 9)
    ((and (symbolp rank) (string= (symbol-name rank) "Q")) 10)
    ((and (symbolp rank) (string= (symbol-name rank) "K")) 11)
    ((and (symbolp rank) (string= (symbol-name rank) "A")) 12)
    ((eql rank 2) 13)
    ((and (symbolp rank) (string= (symbol-name rank) "JOKER")) 14)
    (t 0)))

;;; カード強度の定数
(defparameter *card-strength-map*
  '((3 . 1) (4 . 2) (5 . 3) (6 . 4) (7 . 5) (8 . 6) (9 . 7) (10 . 8)
    (J . 9) (Q . 10) (K . 11) (A . 12) (2 . 13) (JOKER . 14))
  "カード強度のマップ")

;;; ランク検証
(defun valid-rank-p (rank)
  "有効なランクかどうかを判定する"
  (or (member rank '(3 4 5 6 7 8 9 10 2))
      (and (symbolp rank) 
           (member (symbol-name rank) '("J" "Q" "K" "A" "JOKER") :test #'string=))))

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
(defun create-deck (&key (joker-count 2))
  "標準的なデッキを作成する（ジョーカー枚数可変）"
  (let ((deck nil))
    ;; 通常のカード (52枚)
    (dolist (suit '(:spades :hearts :diamonds :clubs))
      (dolist (rank '(3 4 5 6 7 8 9 10 J Q K A 2))
        (push (create-card rank suit) deck)))
    ;; ジョーカー (可変枚数)
    (dotimes (i joker-count)
      (push (create-card 'JOKER :joker) deck))
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
  "デッキをプレイヤーに配布する"
  (when (< player-count 2)
    (error "プレイヤー数は2人以上である必要があります: ~A" player-count))
  
  (let ((cards-per-player (floor (length deck) player-count))
        (hands (make-list player-count :initial-element nil))
        (card-index 0))
    
    ;; ラウンドロビン方式で配布
    (dotimes (round cards-per-player)
      (dotimes (player player-count)
        (when (< card-index (length deck))
          (push (nth card-index deck) (nth player hands))
          (incf card-index))))
    
    ;; 各手札を逆順にして配布順を正す
    (mapcar #'nreverse hands)))

;;; カード比較
(defun compare-cards (card1 card2)
  "カード強度を比較する (card1 > card2 なら正値)"
  (- (card-strength card1) (card-strength card2)))

;;; ジョーカー関連
(defun joker-p (card)
  "カードがジョーカーかどうかを判定"
  (and (card-p card)
       (eq (card-suit card) :joker)
       (eq (card-rank card) 'JOKER)))

(defun create-joker ()
  "ジョーカーカードを作成"
  (create-card 'JOKER :joker))

(defun get-joker-value (card)
  "ジョーカーの値を取得（通常は14）"
  (if (joker-p card)
      14
      0))

(defun set-joker-value (card value)
  "ジョーカーの値を設定（実際はカードの強度を変更）"
  (when (joker-p card)
    (setf (card-strength card) value))
  card)

;;; カード情報取得関数（互換性のため）
(defun get-card-rank (card)
  "カードのランクを取得"
  (card-rank card))

(defun get-card-suit (card)
  "カードのスートを取得"
  (card-suit card))