;;; test-dynamic-discovery.lisp - 動的発見テスト

(defpackage :daifugo-dynamic-discovery-test
  (:use :common-lisp)
  (:export #:run-dynamic-discovery-tests))

(in-package :daifugo-dynamic-discovery-test)

(defun run-dynamic-discovery-tests ()
  "動的発見機能のテスト"
  (format t "=== 動的発見テスト実行 ===~%")
  (format t "このファイルが自動で発見されました！~%")
  t)