;;; symbol-debug.lisp - シンボルの問題をデバッグ

(load "../debug/final-test.lisp")

(defpackage :symbol-debug
  (:use :common-lisp))

(in-package :symbol-debug)

(defun test-symbol-issue ()
  "シンボルの問題をテスト"
  (format t "=== シンボルデバッグ ===~%")
  
  ;; 異なる方法でAカードを作成
  (format t "方法1: 'A~%")
  (let ((card1 (daifugo-card-system:create-card 'A :hearts)))
    (format t "カード1: ~A~%" card1)
    (format t "ランク: ~A~%" (daifugo-card-system:card-rank card1))
    (format t "強度: ~A~%" (daifugo-card-system:card-strength card1))
    (format t "強度計算: ~A~%" (daifugo-card-system:calculate-card-strength 'A)))
  
  (format t "~%方法2: 'daifugo-card-system::A~%")
  (let ((card2 (daifugo-card-system:create-card 'daifugo-card-system::A :hearts)))
    (format t "カード2: ~A~%" card2)
    (format t "ランク: ~A~%" (daifugo-card-system:card-rank card2))
    (format t "強度: ~A~%" (daifugo-card-system:card-strength card2))
    (format t "強度計算: ~A~%" (daifugo-card-system:calculate-card-strength 'daifugo-card-system::A)))
  
  (format t "~%方法3: A (intern)~%")
  (let ((a-symbol (intern "A" :daifugo-card-system)))
    (format t "Aシンボル: ~A~%" a-symbol)
    (format t "強度計算: ~A~%" (daifugo-card-system:calculate-card-strength a-symbol))
    (let ((card3 (daifugo-card-system:create-card a-symbol :hearts)))
      (format t "カード3: ~A~%" card3)
      (format t "ランク: ~A~%" (daifugo-card-system:card-rank card3))
      (format t "強度: ~A~%" (daifugo-card-system:card-strength card3))))
  
  (format t "~%パッケージ確認:~%")
  (format t "'A の パッケージ: ~A~%" (symbol-package 'A))
  (format t "'daifugo-card-system::A の パッケージ: ~A~%" (symbol-package 'daifugo-card-system::A))
  (format t "(intern \"A\" :daifugo-card-system) の パッケージ: ~A~%" (symbol-package (intern "A" :daifugo-card-system))))

(test-symbol-issue)