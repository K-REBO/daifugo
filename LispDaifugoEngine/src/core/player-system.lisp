;;; player-system.lisp - プレイヤー管理システム

(defpackage :daifugo-player-system
  (:use :common-lisp)
  (:export #:player
           #:make-player
           #:create-player
           #:player-p
           #:player-id
           #:player-name
           #:player-hand
           #:player-rank
           #:player-type
           #:create-players
           #:add-card-to-hand
           #:add-cards-to-hand
           #:remove-card-from-hand
           #:remove-cards-from-hand
           #:hand-empty-p
           #:hand-count
           #:get-player-by-id
           #:player-to-string))

(in-package :daifugo-player-system)

;;; プレイヤー構造体
(defstruct player
  id       ; プレイヤーID
  name     ; プレイヤー名
  hand     ; 手札
  rank     ; 階級 (:daifugo :fugo :heimin :hinmin :daihinmin)
  type)    ; プレイヤータイプ (:human :computer)

;;; プレイヤーのデフォルト値設定
(defun create-player (&key id name (hand nil) (rank :heimin) (type :human))
  "プレイヤーを作成する（デフォルト値付き）"
  (make-player :id id
               :name name
               :hand hand
               :rank rank
               :type type))

;;; プレイヤー作成
(defun create-players (player-count)
  "指定された数のプレイヤーを作成する"
  (loop for i from 0 below player-count
        collect (create-player :id i
                               :name (format nil "Player~A" i)
                               :hand nil
                               :rank :heimin
                               :type :human)))

;;; 手札にカード追加
(defun add-card-to-hand (player card)
  "プレイヤーの手札にカードを追加する"
  (push card (player-hand player)))

;;; 手札からカード除去
(defun remove-card-from-hand (player card)
  "プレイヤーの手札からカードを除去する"
  (setf (player-hand player) 
        (remove card (player-hand player) :test #'equal)))

;;; 複数カードを手札から除去
(defun remove-cards-from-hand (player cards)
  "プレイヤーの手札から複数のカードを除去する"
  (dolist (card cards)
    (remove-card-from-hand player card)))

;;; 複数カードを手札に追加
(defun add-cards-to-hand (player cards)
  "プレイヤーの手札に複数のカードを追加する"
  (dolist (card cards)
    (add-card-to-hand player card)))

;;; 手札が空かどうか
(defun hand-empty-p (player)
  "プレイヤーの手札が空かどうかを判定する"
  (null (player-hand player)))

;;; 手札の枚数を取得
(defun hand-count (player)
  "プレイヤーの手札の枚数を取得する"
  (length (player-hand player)))

;;; プレイヤーをIDで取得
(defun get-player-by-id (players player-id)
  "プレイヤーリストからIDでプレイヤーを取得する"
  (find player-id players :key #'player-id))

;;; プレイヤーの表示
(defun player-to-string (player)
  "プレイヤーを文字列で表示する"
  (format nil "~A (ID:~A, 階級:~A, 手札:~A枚)" 
          (player-name player)
          (player-id player)
          (player-rank player)
          (hand-count player)))