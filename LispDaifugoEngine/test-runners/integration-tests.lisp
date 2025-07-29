;;; integration-tests.lisp - 統合テストランナー
;;; 統合テスト、完全テスト、大規模テストなど

(format t "~%=== LispDaifugoEngine 統合テスト実行 ===~%")

(defvar *integration-test-results* '())

(defun run-single-integration-test (test-file description)
  "単一の統合テストを実行"
  (format t "🧪 ~A テスト実行中...~%" description)
  (handler-case
      (progn
        (load test-file)
        (format t "✅ ~A: 合格~%" description)
        (push (list :test description :status :passed :file test-file) *integration-test-results*))
    (error (e)
      (format t "❌ ~A: 失敗 - ~A~%" description e)
      (push (list :test description :status :failed :file test-file :error (format nil "~A" e)) *integration-test-results*))))

(defun run-integration-tests ()
  "統合テストの全テストを実行"
  (setf *integration-test-results* '())
  
  ;; 統合テスト
  (run-single-integration-test "tests/integration/test-integration.lisp" "基本統合テスト")
  (run-single-integration-test "tests/integration/test-complete.lisp" "完全統合テスト")
  (run-single-integration-test "tests/integration/test-complete-fixed.lisp" "完全統合テスト（修正版）")
  (run-single-integration-test "tests/integration/test-large-scale.lisp" "大規模テスト")
  (run-single-integration-test "tests/integration/test-fix.lisp" "修正統合テスト")
  
  ;; パフォーマンステスト
  (run-single-integration-test "tests/performance/test-optimization.lisp" "パフォーマンス最適化テスト")
  
  ;; 結果集計
  (format t "~%📊 統合テスト結果:~%")
  (let ((passed (count-if (lambda (result) (eq (getf result :status) :passed)) *integration-test-results*))
        (failed (count-if (lambda (result) (eq (getf result :status) :failed)) *integration-test-results*)))
    (format t "合格: ~A, 失敗: ~A (合計: ~A)~%" passed failed (+ passed failed))
    (when (> failed 0)
      (format t "~%❌ 失敗したテスト:~%")
      (dolist (result (reverse *integration-test-results*))
        (when (eq (getf result :status) :failed)
          (format t "  - ~A: ~A~%" (getf result :test) (getf result :error)))))
    (= failed 0)))

;; テスト実行
(run-integration-tests)