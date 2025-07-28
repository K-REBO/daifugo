;;; card-utils.lisp - カード操作ユーティリティ

(defpackage :daifugo-card-utils
  (:use :common-lisp)
  (:export #:same-rank-p
           #:same-suit-p
           #:is-sequence-p
           #:count-by-rank
           #:strongest-cards
           #:weakest-cards
           #:sort-cards
           #:filter-cards-by-rank
           #:filter-cards-by-suit))

(in-package :daifugo-card-utils)

;;; 同じランクかどうか
(defun same-rank-p (cards)
  "カードが全て同じランクかどうかを判定する"
  (when cards
    (let ((first-rank (daifugo-card-system:card-rank (first cards))))
      (every (lambda (card) 
               (eql (daifugo-card-system:card-rank card) first-rank))
             cards))))

;;; 同じスートかどうか
(defun same-suit-p (cards)
  "カードが全て同じスートかどうかを判定する"
  (when cards
    (let ((first-suit (daifugo-card-system:card-suit (first cards))))
      (every (lambda (card) 
               (eql (daifugo-card-system:card-suit card) first-suit))
             cards))))

;;; カードソート（ヘルパー関数）
(defun sort-cards (cards &optional (descending nil))
  "カードを強度順にソートする"
  (sort (copy-list cards) 
        (if descending #'> #'<)
        :key #'daifugo-card-system:card-strength))

;;; シーケンスかどうか
(defun is-sequence-p (cards)
  "カードが連続したシーケンスかどうかを判定する"
  (when (>= (length cards) 3)
    (let ((sorted-cards (sort-cards cards)))
      (every (lambda (i)
               (= (daifugo-card-system:card-strength (nth (1+ i) sorted-cards))
                  (1+ (daifugo-card-system:card-strength (nth i sorted-cards)))))
             (loop for i from 0 below (1- (length sorted-cards)) collect i)))))

;;; ランク別カウント
(defun count-by-rank (cards)
  "カードをランク別にカウントする"
  (let ((counts (make-hash-table)))
    (dolist (card cards)
      (let ((rank (daifugo-card-system:card-rank card)))
        (setf (gethash rank counts) (1+ (gethash rank counts 0)))))
    counts))

;;; 最強カード取得
(defun strongest-cards (cards count)
  "最強のカードを指定数取得する"
  (let ((sorted-cards (sort-cards cards t)))
    (subseq sorted-cards 0 (min count (length sorted-cards)))))

;;; 最弱カード取得
(defun weakest-cards (cards count)
  "最弱のカードを指定数取得する"
  (let ((sorted-cards (sort-cards cards nil)))
    (subseq sorted-cards 0 (min count (length sorted-cards)))))

;;; カードソート
;;; ランクでフィルタ
(defun filter-cards-by-rank (cards rank)
  "指定されたランクのカードをフィルタする"
  (remove-if-not (lambda (card) 
                   (eql (daifugo-card-system:card-rank card) rank))
                 cards))

;;; スートでフィルタ
(defun filter-cards-by-suit (cards suit)
  "指定されたスートのカードをフィルタする"
  (remove-if-not (lambda (card) 
                   (eql (daifugo-card-system:card-suit card) suit))
                 cards))