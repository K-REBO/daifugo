;;; miyakoochi.lisp - 都落ちルール

(defpackage :daifugo-miyakoochi
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-miyakoochi-rule))

(in-package :daifugo-miyakoochi)

;;; 都落ちルール読み込み
(defun load-miyakoochi-rule ()
  "都落ちルールを読み込む"
  
  ;; 都落ちルール
  (register-rule
   (make-rule :name 'miyakoochi
              :trigger (lambda (game-state context)
                        (let ((finish-order (getf context :finish-order))
                              (previous-daifugo (getf context :previous-daifugo)))
                          (and finish-order
                               previous-daifugo
                               ;; 前回の大富豪が1位以外で終了
                               (not (= (first finish-order) previous-daifugo)))))
              :effect (lambda (game-state context)
                       (let ((previous-daifugo (getf context :previous-daifugo)))
                         ;; 前回の大富豪を強制的に大貧民にする
                         (setf (getf context :forced-daihinmin) previous-daifugo)
                         (daifugo-game-logger:log-event :rule-triggered 
                                                        :rule 'miyakoochi
                                                        :effect (format nil "プレイヤー~Aが都落ち" previous-daifugo))))
              :description "大富豪が1位以外で終了すると大貧民に降格"
              :priority 12)))