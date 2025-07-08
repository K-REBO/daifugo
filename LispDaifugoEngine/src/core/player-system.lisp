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
           #:player-ai-type
           #:create-players
           #:add-card-to-hand
           #:remove-card-from-hand
           #:hand-empty-p
           #:get-player-by-id))

(in-package :daifugo-player-system)

;;; プレイヤー構造体
(defstruct player
  id       ; プレイヤーID
  name     ; プレイヤー名
  hand     ; 手札
  rank     ; 階級 (:daifugo :fugo :heimin :hinmin :daihinmin)
  type     ; プレイヤータイプ (:human :ai)
  ai-type) ; AIタイプ (:random :greedy :conservative :aggressive :adaptive)

;;; プレイヤー作成
(defun create-players (player-count)
  "指定された数のプレイヤーを作成する"
  (loop for i from 0 below player-count
        collect (create-player :id i
                               :name (format nil "Player~A" i)
                               :hand nil
                               :rank :heimin
                               :type :human
                               :ai-type nil)))

;;; プレイヤーのデフォルト値設定
(defun create-player (&key id name (hand nil) (rank :heimin) (type :human) (ai-type nil))
  "プレイヤーを作成する（デフォルト値付き）"
  (make-player :id id
               :name name
               :hand hand
               :rank rank
               :type type
               :ai-type ai-type))

;;; 手札にカード追加
(defun add-card-to-hand (player card)
  "プレイヤーの手札にカードを追加する"
  (push card (player-hand player)))

;;; 手札からカード除去
(defun remove-card-from-hand (player card)
  "プレイヤーの手札からカードを除去する"
  (setf (player-hand player) 
        (remove card (player-hand player) :test #'equal)))

;;; 手札が空かどうか
(defun hand-empty-p (player)
  "プレイヤーの手札が空かどうかを判定する"
  (null (player-hand player)))

;;; プレイヤーをIDで取得
(defun get-player-by-id (players player-id)
  "プレイヤーリストからIDでプレイヤーを取得する"
  (find player-id players :key #'player-id))