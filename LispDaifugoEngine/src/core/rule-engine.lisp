;;; rule-engine.lisp - ルール処理エンジン

(defpackage :daifugo-rule-engine
  (:use :common-lisp)
  (:export #:rule
           #:make-rule
           #:rule-name
           #:rule-trigger
           #:rule-effect
           #:rule-description
           #:register-rule
           #:unregister-rule
           #:get-active-rules
           #:apply-rules
           #:validate-play))

(in-package :daifugo-rule-engine)

;;; ルール構造体
(defstruct rule
  name         ; ルール名
  trigger      ; 発動条件 (function)
  effect       ; 効果 (function)
  description  ; 説明
  priority)    ; 優先度

;;; アクティブルール管理
(defvar *active-rules* nil)

;;; ルール登録
(defun register-rule (rule)
  "ルールを登録する"
  (pushnew rule *active-rules* :key #'rule-name))

;;; ルール解除
(defun unregister-rule (rule-name)
  "ルールを解除する"
  (setf *active-rules* 
        (remove rule-name *active-rules* :key #'rule-name)))

;;; アクティブルール取得
(defun get-active-rules ()
  "アクティブなルールのリストを取得する"
  *active-rules*)

;;; ルール適用
(defun apply-rules (game-state context)
  "ゲーム状態にルールを適用する"
  (dolist (rule (sort (copy-list *active-rules*) #'> :key #'rule-priority))
    (when (funcall (rule-trigger rule) game-state context)
      (funcall (rule-effect rule) game-state context))))

;;; プレイ検証
(defun validate-play (game-state player-id cards)
  "カードプレイが有効かどうかを検証する"
  (declare (ignore game-state player-id cards))
  ;; 基本的な検証ロジック
  ;; 実装は後で追加
  t)