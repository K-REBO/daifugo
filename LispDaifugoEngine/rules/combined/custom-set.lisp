;;; custom-set.lisp - カスタムルールセット

(defpackage :daifugo-custom-set
  (:use :common-lisp)
  (:export #:load-custom-rule-set))

(in-package :daifugo-custom-set)

;;; カスタムルールセット読み込み
(defun load-custom-rule-set ()
  "カスタムルールセットを読み込む"
  
  ;; 革命 + 階段出し + 11バック
  (load "rules/kakumei.lisp")
  (daifugo-kakumei:load-kakumei-rule)
  
  (load "rules/kaidan.lisp")
  (daifugo-kaidan:load-kaidan-rule)
  
  (load "rules/11back.lisp")
  (daifugo-11back:load-11back-rule)
  
  (daifugo-game-logger:log-event :rule-set-loaded 
                                 :rule-set 'custom-set
                                 :rules '(kakumei kaidan 11back)))