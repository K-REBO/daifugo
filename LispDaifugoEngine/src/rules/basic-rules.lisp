;;; basic-rules.lisp - 基本ルール

(defpackage :daifugo-basic-rules
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-basic-rules))

(in-package :daifugo-basic-rules)

;;; 基本ルールの読み込み
(defun load-basic-rules ()
  "基本ルールを読み込む"
  
  ;; 基本的な強度比較ルール
  (register-rule
   (make-rule :name 'basic-strength
              :trigger (lambda (game-state context) 
                        (declare (ignore game-state context))
                        t)
              :effect (lambda (game-state context)
                       (declare (ignore game-state context))
                       ;; 基本的な強度比較処理
                       nil)
              :description "基本的なカード強度比較"
              :priority 1))
  
  ;; 同じ枚数出しルール
  (register-rule
   (make-rule :name 'same-count
              :trigger (lambda (game-state context)
                        (declare (ignore game-state context))
                        t)
              :effect (lambda (game-state context)
                       (declare (ignore game-state context))
                       ;; 同じ枚数出し処理
                       nil)
              :description "同じ枚数のカードのみプレイ可能"
              :priority 2))
  
  ;; ゲーム終了判定ルール
  (register-rule
   (make-rule :name 'game-end
              :trigger (lambda (game-state context)
                        (declare (ignore game-state context))
                        ;; 手札が空のプレイヤーがいるかチェック
                        nil)
              :effect (lambda (game-state context)
                       (declare (ignore game-state context))
                       ;; ゲーム終了処理
                       nil)
              :description "ゲーム終了判定"
              :priority 10)))