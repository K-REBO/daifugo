;;; test-hand-validation-simple.lisp - 手札出し判定のシンプルテスト（軽量版）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-hand-validation-simple-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-hand-validation-simple-tests))

(in-package :daifugo-hand-validation-simple-test)

;;; 軽量版テスト関数群（最小限の基本動作確認のみ）

(defun test-package-existence ()
  "パッケージ存在確認（最小限）"
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する"))

(defun test-minimal-card-creation ()
  "最小限のカード作成テスト"
  (let ((card (daifugo-card-system:make-card :rank 7 :suit :spades)))
    (test-assert (not (null card)) "カードが作成される")))

(defun test-minimal-deck-creation ()
  "最小限のデッキ作成テスト"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")))

;;; メイン実行関数
(defun run-hand-validation-simple-tests ()
  "軽量版手札検証テストを実行（最小限の基本動作確認）"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== 手札検証テスト（軽量版・最小限）実行 ===~%")
  
  (test-package-existence)
  (test-minimal-card-creation)
  (test-minimal-deck-creation)
  
  (format t "~%軽量版結果: ~A合格, ~A失敗 (計3テスト)~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))
