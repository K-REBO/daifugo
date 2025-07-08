;;; kakumei.lisp - 革命ルール

(defpackage :daifugo-kakumei
  (:use :common-lisp :daifugo-rule-engine)
  (:export #:load-kakumei-rule))

(in-package :daifugo-kakumei)

;;; 革命ルール読み込み
(defun load-kakumei-rule ()
  "革命ルールを読み込む"
  
  ;; 4枚出し革命ルール
  (register-rule
   (make-rule :name 'kakumei-4cards
              :trigger (lambda (game-state context)
                        (declare (ignore game-state))
                        (let ((cards (getf context :cards)))
                          (and cards
                               (= (length cards) 4)
                               (daifugo-card-utils:same-rank-p cards))))
              :effect (lambda (game-state context)
                       (declare (ignore context))
                       ;; 革命状態を切り替え
                       (setf (daifugo-game-engine:game-state-revolution-p game-state)
                             (not (daifugo-game-engine:game-state-revolution-p game-state)))
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule 'kakumei-4cards
                                                      :effect "革命状態切り替え"))
              :description "同じ数字4枚で革命発生"
              :priority 5))
  
  ;; 階段革命ルール（オプション）
  (register-rule
   (make-rule :name 'kakumei-stairs
              :trigger (lambda (game-state context)
                        (declare (ignore game-state))
                        (let ((cards (getf context :cards)))
                          (and cards
                               (>= (length cards) 4)
                               (daifugo-card-utils:is-sequence-p cards))))
              :effect (lambda (game-state context)
                       (declare (ignore context))
                       ;; 階段革命状態を切り替え
                       (setf (daifugo-game-engine:game-state-revolution-p game-state)
                             (not (daifugo-game-engine:game-state-revolution-p game-state)))
                       (daifugo-game-logger:log-event :rule-triggered 
                                                      :rule 'kakumei-stairs
                                                      :effect "階段革命状態切り替え"))
              :description "4枚以上の階段で革命発生"
              :priority 6)))