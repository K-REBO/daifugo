;;; player-utils.lisp - プレイヤーユーティリティ

(defpackage :daifugo-player-utils
  (:use :common-lisp)
  (:export #:rank-to-string
           #:string-to-rank
           #:rank-order
           #:higher-rank-p
           #:count-players-by-rank
           #:find-players-by-rank
           #:sort-players-by-rank
           #:get-next-rank
           #:get-previous-rank))

(in-package :daifugo-player-utils)

;;; 階級関連のユーティリティ

(defparameter *rank-order*
  '(:daihinmin :hinmin :heimin :fugo :daifugo)
  "階級の順序（低い方から高い方へ）")

(defparameter *rank-names*
  '((:daihinmin . "大貧民")
    (:hinmin . "貧民")
    (:heimin . "平民")
    (:fugo . "富豪")
    (:daifugo . "大富豪"))
  "階級名の日本語表示")

;;; 階級を文字列に変換
(defun rank-to-string (rank)
  "階級を日本語文字列に変換する"
  (cdr (assoc rank *rank-names*)))

;;; 文字列を階級に変換
(defun string-to-rank (string)
  "日本語文字列を階級に変換する"
  (car (rassoc string *rank-names* :test #'string=)))

;;; 階級の順序を取得
(defun rank-order (rank)
  "階級の順序を取得する（数値が大きいほど高い階級）"
  (position rank *rank-order*))

;;; 階級の比較
(defun higher-rank-p (rank1 rank2)
  "rank1がrank2より高い階級かどうかを判定する"
  (> (rank-order rank1) (rank-order rank2)))

;;; 階級別プレイヤー数をカウント
(defun count-players-by-rank (players rank)
  "指定された階級のプレイヤー数をカウントする"
  (count rank players :key #'daifugo-player-system:player-rank))

;;; 階級別プレイヤー検索
(defun find-players-by-rank (players rank)
  "指定された階級のプレイヤーを検索する"
  (remove-if-not (lambda (player)
                   (eql (daifugo-player-system:player-rank player) rank))
                 players))

;;; 階級順にプレイヤーをソート
(defun sort-players-by-rank (players)
  "プレイヤーを階級順にソートする（高い階級から低い階級へ）"
  (sort (copy-list players) 
        (lambda (p1 p2)
          (higher-rank-p (daifugo-player-system:player-rank p1)
                         (daifugo-player-system:player-rank p2)))))

;;; 次の階級を取得
(defun get-next-rank (rank)
  "次の階級を取得する"
  (let ((pos (position rank *rank-order*)))
    (when (and pos (< pos (1- (length *rank-order*))))
      (nth (1+ pos) *rank-order*))))

;;; 前の階級を取得
(defun get-previous-rank (rank)
  "前の階級を取得する"
  (let ((pos (position rank *rank-order*)))
    (when (and pos (> pos 0))
      (nth (1- pos) *rank-order*))))