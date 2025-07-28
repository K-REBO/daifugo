(defpackage :test-loader
  (:use :common-lisp))

(in-package :test-loader)

(defun test-load-function ()
  "テスト用のロード関数"
  (format t "テスト実行中~%")
  t)

(test-load-function)