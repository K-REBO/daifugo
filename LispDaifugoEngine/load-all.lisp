;;; load-all.lisp - 全モジュール読み込み

(defpackage :daifugo-loader
  (:use :common-lisp)
  (:export #:load-daifugo-engine))

(in-package :daifugo-loader)

;;; 全モジュールの読み込み
(defun load-daifugo-engine ()
  "大富豪エンジンの全モジュールを読み込む"
  
  ;; コアシステム
  (load "src/core/card-system.lisp")
  (load "src/core/player-system.lisp")
  (load "src/utils/player-utils.lisp")
  (load "src/core/game-state.lisp")
  (load "src/core/game-logic.lisp")
  (load "src/core/game-engine.lisp")
  (load "src/core/rule-engine.lisp")
  
  ;; ルールシステム
  (load "src/rules/basic-rules.lisp")
  (load "src/rules/rule-loader.lisp")
  
  ;; テストシステム
  (load "src/testing/game-logger.lisp")
  
  ;; ユーティリティ
  (load "src/utils/card-utils.lisp")
  (load "src/utils/game-utils.lisp")
  
  ;; API
  (load "src/api/javascript-api.lisp")
  
  ;; 基本ルール読み込み
  (when (find-package :daifugo-basic-rules)
    (funcall (intern "LOAD-BASIC-RULES" :daifugo-basic-rules)))
  
  (format t "大富豪エンジンの読み込み完了~%"))

;; 自動実行
(load-daifugo-engine)