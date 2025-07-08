;;; kaidan.lisp - 階段出しルール

(defpackage :daifugo-kaidan
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-kaidan-rule))

(in-package :daifugo-kaidan)

;;; 階段出しルール読み込み
(defun load-kaidan-rule ()
  "階段出しルールを読み込む"
  
  ;; 階段出しルール
  (register-rule
   (make-rule :name 'kaidan
              :trigger (lambda (game-state context)
                        (declare (ignore game-state))
                        (let ((cards (getf context :cards)))
                          (and cards
                               (>= (length cards) 3)
                               (daifugo-card-utils:same-suit-p cards)
                               (daifugo-card-utils:is-sequence-p cards))))
              :effect (lambda (game-state context)
                       (declare (ignore game-state context))
                       ;; 階段出しが有効であることをログに記録
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule 'kaidan
                                                      :effect "階段出し有効"))
              :description "同じスート連続数字3枚以上で階段出し"
              :priority 4))
  
  ;; 階段応答ルール
  (register-rule
   (make-rule :name 'kaidan-response
              :trigger (lambda (game-state context)
                        (let ((field (daifugo-game-engine:game-state-field game-state))
                              (cards (getf context :cards)))
                          (and field
                               (daifugo-card-utils:is-sequence-p field)
                               cards
                               (= (length cards) (length field)))))
              :effect (lambda (game-state context)
                       (declare (ignore game-state context))
                       ;; 階段応答の検証
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule 'kaidan-response
                                                      :effect "階段応答検証"))
              :description "階段に対する応答は同じ枚数の階段"
              :priority 3)))