;;; spe3gaeshi.lisp - スペ3返しルール

(defpackage :daifugo-spe3gaeshi
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-spe3gaeshi-rule))

(in-package :daifugo-spe3gaeshi)

;;; スペ3返しルール読み込み
(defun load-spe3gaeshi-rule ()
  "スペ3返しルールを読み込む"
  
  ;; スペ3返しルール
  (register-rule
   (make-rule :name 'spe3gaeshi
              :trigger (lambda (game-state context)
                        (let ((field (daifugo-game-engine:game-state-field game-state))
                              (cards (getf context :cards)))
                          (and field
                               ;; 場にジョーカーがある
                               (some (lambda (card)
                                       (eql (daifugo-card-system:card-rank card) 'JOKER))
                                     field)
                               cards
                               ;; スペードの3を出そうとしている
                               (= (length cards) 1)
                               (let ((card (first cards)))
                                 (and (eql (daifugo-card-system:card-rank card) 3)
                                      (eql (daifugo-card-system:card-suit card) :spades))))))
              :effect (lambda (game-state context)
                       (declare (ignore context))
                       ;; ジョーカーを無効化
                       (setf (daifugo-game-engine:game-state-field game-state) nil)
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule 'spe3gaeshi
                                                      :effect "ジョーカーを無効化"))
              :description "ジョーカーにスペードの3で対抗"
              :priority 11)))