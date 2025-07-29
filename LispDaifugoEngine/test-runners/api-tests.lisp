;;; api-tests.lisp - APIテストランナー
;;; JavaScript API、イベントシステムなど

(format t "~%=== LispDaifugoEngine APIテスト実行 ===~%")

(defvar *api-test-results* '())

(defun run-single-api-test (test-file description)
  "単一のAPIテストを実行"
  (format t "🧪 ~A テスト実行中...~%" description)
  (handler-case
      (progn
        (load test-file)
        (format t "✅ ~A: 合格~%" description)
        (push (list :test description :status :passed :file test-file) *api-test-results*))
    (error (e)
      (format t "❌ ~A: 失敗 - ~A~%" description e)
      (push (list :test description :status :failed :file test-file :error (format nil "~A" e)) *api-test-results*))))

(defun run-api-tests ()
  "API層の全テストを実行"
  (setf *api-test-results* '())
  
  ;; JavaScript APIテスト
  (run-single-api-test "tests/api/test-javascript-api.lisp" "JavaScript API")
  (run-single-api-test "tests/api/test-javascript-api-simple.lisp" "JavaScript API（簡易版）")
  
  ;; イベントシステムテスト
  (run-single-api-test "tests/events/test-event-system.lisp" "イベントシステム")
  (run-single-api-test "tests/events/test-event-system-simple.lisp" "イベントシステム（簡易版）")
  
  ;; 結果集計
  (format t "~%📊 APIテスト結果:~%")
  (let ((passed (count-if (lambda (result) (eq (getf result :status) :passed)) *api-test-results*))
        (failed (count-if (lambda (result) (eq (getf result :status) :failed)) *api-test-results*)))
    (format t "合格: ~A, 失敗: ~A (合計: ~A)~%" passed failed (+ passed failed))
    (when (> failed 0)
      (format t "~%❌ 失敗したテスト:~%")
      (dolist (result (reverse *api-test-results*))
        (when (eq (getf result :status) :failed)
          (format t "  - ~A: ~A~%" (getf result :test) (getf result :error)))))
    (= failed 0)))

;; テスト実行
(run-api-tests)