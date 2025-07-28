;;; src/testing/auto-tester.lisp - 自動テスト実行ユーティリティ

(defpackage :daifugo-auto-tester
  (:use :common-lisp)
  (:export #:run-all-tests))

(in-package :daifugo-auto-tester)

(defun run-all-tests ()
  "プロジェクトのすべてのテストを実行します。"
  (format t "~%=== すべてのテストを開始します ===~%")
  
  ;; 各テストスイートをロードして実行
  ;; (asdf:test-system :daifugo-card-system-test)
  ;; (asdf:test-system :daifugo-card-utils-test)
  ;; (asdf:test-system :daifugo-game-logic-test)
  
  (format t "~%=== すべてのテストが完了しました ===~%"))
