;;; japan-official.lisp - 日本大富豪連盟公式ルール

(defpackage :daifugo-japan-official
  (:use :common-lisp)
  (:export #:load-japan-official-rules))

(in-package :daifugo-japan-official)

;;; 日本大富豪連盟公式5ルール読み込み
(defun load-japan-official-rules ()
  "日本大富豪連盟公式5ルールを読み込む"
  
  ;; 1. 革命
  (load "rules/kakumei.lisp")
  (daifugo-kakumei:load-kakumei-rule)
  
  ;; 2. 8切り
  (load "rules/8kiri.lisp")
  (daifugo-8kiri:load-8kiri-rule)
  
  ;; 3. 都落ち
  (load "rules/miyakoochi.lisp")
  (daifugo-miyakoochi:load-miyakoochi-rule)
  
  ;; 4. スート縛り
  (load "rules/sute-shibari.lisp")
  (daifugo-sute-shibari:load-sute-shibari-rule)
  
  ;; 5. スペ3返し
  (load "rules/spe3gaeshi.lisp")
  (daifugo-spe3gaeshi:load-spe3gaeshi-rule)
  
  (daifugo-game-logger:log-event :rule-set-loaded 
                                 :rule-set 'japan-official
                                 :rules '(kakumei 8kiri miyakoochi sute-shibari spe3gaeshi)))