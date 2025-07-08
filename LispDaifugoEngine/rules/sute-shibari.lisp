;;; sute-shibari.lisp - スート縛りルール

(defpackage :daifugo-sute-shibari
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-sute-shibari-rule))

(in-package :daifugo-sute-shibari)

;;; スート縛りルール読み込み
(defun load-sute-shibari-rule ()
  "スート縛りルールを読み込む"
  
  ;; スート縛りルール
  (register-rule
   (make-rule :name 'sute-shibari
              :trigger (lambda (game-state context)
                        (declare (ignore game-state))
                        (let ((cards (getf context :cards)))
                          (and cards
                               (> (length cards) 1)
                               (daifugo-card-utils:same-suit-p cards))))
              :effect (lambda (game-state context)
                       (let ((cards (getf context :cards)))
                         (when cards
                           ;; 縛りスートを設定
                           (setf (getf (daifugo-game-engine:game-state-field game-state) :shibari-suit)
                                 (daifugo-card-system:card-suit (first cards))))
                         (daifugo-game-logger:log-event :rule-triggered 
                                                        :rule 'sute-shibari
                                                        :effect "スート縛り発動")))
              :description "同じスートの複数枚出しで縛り発動"
              :priority 9))
  
  ;; 縛り応答ルール
  (register-rule
   (make-rule :name 'sute-shibari-response
              :trigger (lambda (game-state context)
                        (let ((field (daifugo-game-engine:game-state-field game-state))
                              (cards (getf context :cards)))
                          (and field
                               (getf field :shibari-suit)
                               cards)))
              :effect (lambda (game-state context)
                       (let ((field (daifugo-game-engine:game-state-field game-state))
                             (cards (getf context :cards)))
                         (let ((required-suit (getf field :shibari-suit)))
                           (unless (every (lambda (card)
                                            (eql (daifugo-card-system:card-suit card) required-suit))
                                          cards)
                             (error "縛り中は~Aのカードのみ出せます" required-suit))))
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule 'sute-shibari-response
                                                      :effect "縛り応答検証"))
              :description "縛り中は指定されたスートのみプレイ可能"
              :priority 10)))