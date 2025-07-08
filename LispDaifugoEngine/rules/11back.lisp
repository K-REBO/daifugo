;;; 11back.lisp - 11バック（逆回転）ルール

(defpackage :daifugo-11back
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-11back-rule))

(in-package :daifugo-11back)

;;; 11バックルール読み込み
(defun load-11back-rule ()
  "11バックルールを読み込む"
  
  ;; 11バックルール
  (register-rule
   (make-rule :name '11back
              :trigger (lambda (game-state context)
                        (declare (ignore game-state))
                        (let ((cards (getf context :cards)))
                          (and cards
                               (some (lambda (card)
                                       (eql (daifugo-card-system:card-rank card) 'J))
                                     cards))))
              :effect (lambda (game-state context)
                       (declare (ignore context))
                       ;; ターン方向を逆転
                       (let ((current-direction (daifugo-game-engine:game-state-turn-direction game-state)))
                         (setf (daifugo-game-engine:game-state-turn-direction game-state)
                               (case current-direction
                                 (:clockwise :counter-clockwise)
                                 (:counter-clockwise :clockwise)
                                 (otherwise :clockwise))))
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule '11back
                                                      :effect "ターン方向逆転"))
              :description "11(J)でターン方向が逆転"
              :priority 8)))