;;; test-hand-validation-simple.lisp - 手札出し判定のシンプルテスト（軽量版）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-hand-validation-simple-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-hand-validation-simple-tests))

(in-package :daifugo-hand-validation-simple-test)

;;; 軽量版テスト関数群（基本機能のみ）

(defun test-card-system-basics ()
  "カードシステムの基本機能テスト"
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-assert (fboundp 'daifugo-card-system:create-deck) "デッキ作成関数が定義されている")
  (test-assert (fboundp 'daifugo-card-system:make-card) "カード作成関数が定義されている"))

(defun test-basic-card-creation ()
  "基本的なカード作成テスト"
  (let ((card (daifugo-card-system:make-card :rank 7 :suit :spades)))
    (test-assert (not (null card)) "カードが作成される")
    (test-assert (eq (daifugo-card-system:card-rank card) 7) "カードランクが正しい")
    (test-assert (eq (daifugo-card-system:card-suit card) :spades) "カードスートが正しい")))

(defun test-basic-deck-creation ()
  "基本的なデッキ作成テスト"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")
    (test-assert (every (lambda (card) 
                          (and (daifugo-card-system:card-rank card)
                               (daifugo-card-system:card-suit card)))
                        deck)
                 "すべてのカードが有効な形式である")))

;;; メイン実行関数
(defun run-hand-validation-simple-tests ()
  "軽量版手札検証テストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== 手札検証テスト（軽量版）実行 ===~%")
  
  (test-card-system-basics)
  (test-basic-card-creation)
  (test-basic-deck-creation)
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))
