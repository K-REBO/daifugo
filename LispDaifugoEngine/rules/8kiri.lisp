;;; 8kiri.lisp - 8切りルール

(defpackage :daifugo-8kiri
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-8kiri-rule))

(in-package :daifugo-8kiri)

;;; 8切りルール読み込み
(defun load-8kiri-rule ()
  "8切りルールを読み込む"
  
  ;; 8切りルール
  (register-rule
   (make-rule :name '8kiri
              :trigger (lambda (game-state context)
                        (declare (ignore game-state))
                        (let ((cards (getf context :cards)))
                          (and cards
                               (some (lambda (card)
                                       (eql (daifugo-card-system:card-rank card) 8))
                                     cards)
                               ;; 階段内の8は無効
                               (not (daifugo-card-utils:is-sequence-p cards)))))
              :effect (lambda (game-state context)
                       (declare (ignore context))
                       ;; 場を流す
                       (setf (daifugo-game-engine:game-state-field game-state) nil)
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule '8kiri
                                                      :effect "場が流れる"))
              :description "8を含むカードで場が流れる"
              :priority 7)))