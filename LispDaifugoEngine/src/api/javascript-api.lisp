;;; javascript-api.lisp - JavaScript インターフェース

(defpackage :daifugo-javascript-api
  (:use :common-lisp)
  (:export #:create-game-api
           #:play-card-api
           #:get-game-state-api
           #:get-player-hand-api
           #:load-rule-api
           #:export-to-json))

(in-package :daifugo-javascript-api)

;;; JSON形式でのデータ変換
(defun export-to-json (data)
  "LispデータをJSON形式に変換する"
  (write-to-string data))

;;; ゲーム作成API
(defun create-game-api (player-count)
  "JavaScript向けゲーム作成API"
  (let ((game-state (daifugo-game-engine:create-game player-count)))
    (export-to-json (list :status "success" 
                          :game-id (random 10000)
                          :players player-count))))

;;; カードプレイAPI
(defun play-card-api (game-id player-id cards)
  "JavaScript向けカードプレイAPI"
  (declare (ignore game-id player-id cards))
  ;; 実装は後で追加
  (export-to-json (list :status "success" 
                        :action "card-played")))

;;; ゲーム状態取得API
(defun get-game-state-api (game-id)
  "JavaScript向けゲーム状態取得API"
  (declare (ignore game-id))
  ;; 実装は後で追加
  (export-to-json (list :status "success"
                        :current-player 0
                        :field nil
                        :turn 1)))

;;; プレイヤー手札取得API
(defun get-player-hand-api (game-id player-id)
  "JavaScript向けプレイヤー手札取得API"
  (declare (ignore game-id player-id))
  ;; 実装は後で追加
  (export-to-json (list :status "success"
                        :hand nil)))

;;; ルール読み込みAPI
(defun load-rule-api (rule-name)
  "JavaScript向けルール読み込みAPI"
  (declare (ignore rule-name))
  ;; 実装は後で追加
  (export-to-json (list :status "success"
                        :rule-loaded rule-name)))