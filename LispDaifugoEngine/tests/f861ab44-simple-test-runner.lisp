;;; simple-test-runner.lisp - 簡単なテストランナー

(defpackage :simple-test-runner
  (:use :common-lisp)
  (:export #:run-tests))

(in-package :simple-test-runner)

(defun test-card-system ()
  "カードシステムテスト"
  (format t "🧪 カードシステムテスト~%")
  (handler-case
    (progn
      (load "src/core/card-system.lisp")
      (load "tests/test-card-system.lisp")
      (let ((result (daifugo-card-system-test:run-card-system-tests)))
        (format t "✅ カードシステム: ~A~%" (if result "合格" "失敗"))
        result))
    (error (e)
      (format t "💥 カードシステム: エラー - ~A~%" e)
      nil)))

(defun test-player-system ()
  "プレイヤーシステムテスト"
  (format t "🧪 プレイヤーシステムテスト~%")
  (handler-case
    (progn
      (load "src/core/card-system.lisp")
      (load "src/core/player-system.lisp")
      (load "tests/test-player-system.lisp")
      (let ((result (daifugo-player-system-test:run-player-system-tests)))
        (format t "✅ プレイヤーシステム: ~A~%" (if result "合格" "失敗"))
        result))
    (error (e)
      (format t "💥 プレイヤーシステム: エラー - ~A~%" e)
      nil)))

(defun run-tests ()
  "利用可能なテストを実行"
  (format t "🚀 LispDaifugoEngine テスト開始~%")
  
  (let ((passed 0) (total 0))
    
    ;; カードシステムテスト
    (when (test-card-system)
      (incf passed))
    (incf total)
    
    ;; プレイヤーシステムテスト
    (when (test-player-system)
      (incf passed))
    (incf total)
    
    (format t "~%📊 テスト結果: ~A/~A合格 (~A%)~%" 
            passed total (if (> total 0) (round (* 100 (/ passed total))) 0))
    
    (if (= passed total)
        (format t "🎉 すべてのテストが合格しました！~%")
        (format t "⚠️  一部のテストが失敗しました。~%"))
    
    (= passed total)))

;; スクリプト実行時のエントリポイント  
(run-tests)