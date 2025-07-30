;;; rule-engine.lisp - ルール処理エンジン

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

;;; ルール取得
(defun get-rule (rule-name)
  "ルール名でルールを取得する"
  (find rule-name *active-rules* :key #'rule-name))

;;; ルール定義マクロ
(defmacro define-rule (name description trigger-form effect-form &optional (priority 0))
  "ルールを定義して登録するマクロ"
  `(progn
     (let ((rule (make-rule :name ',name
                           :description ,description
                           :trigger (lambda (game-state context)
                                     (declare (ignorable game-state context))
                                     ,trigger-form)
                           :effect (lambda (game-state context)
                                    (declare (ignorable game-state context))
                                    ,effect-form)
                           :priority ,priority)))
       (register-rule rule)
       rule)))