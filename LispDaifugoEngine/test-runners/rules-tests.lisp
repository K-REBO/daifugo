;;; rules-tests.lisp - ルールシステムテストランナー
;;; ルールローダー、ルールセット、8切り、革命、階段ルールなど

(format t "~%=== LispDaifugoEngine ルールテスト実行 ===~%")

(defvar *rules-test-results* '())

(defun run-single-rules-test (test-file description)
  "単一のルールテストを実行"
  (format t "🧪 ~A テスト実行中...~%" description)
  (handler-case
      (progn
        (load test-file)
        (format t "✅ ~A: 合格~%" description)
        (push (list :test description :status :passed :file test-file) *rules-test-results*))
    (error (e)
      (format t "❌ ~A: 失敗 - ~A~%" description e)
      (push (list :test description :status :failed :file test-file :error (format nil "~A" e)) *rules-test-results*))))

(defun run-rules-tests ()
  "ルールシステムの全テストを実行"
  (setf *rules-test-results* '())
  
  ;; ルール管理システムテスト
  (run-single-rules-test "tests/rules/test-rule-loader.lisp" "ルールローダー")
  (run-single-rules-test "tests/rules/test-rule-set.lisp" "ルールセット")
  
  ;; 8切りルールテスト
  (run-single-rules-test "tests/rules/test-8kiri.lisp" "8切りルール")
  (run-single-rules-test "tests/rules/test-8kiri-simple.lisp" "8切りルール（簡易版）")
  
  ;; 革命ルールテスト
  (run-single-rules-test "tests/rules/test-kakumei.lisp" "革命ルール")
  (run-single-rules-test "tests/rules/test-kakumei-simple.lisp" "革命ルール（簡易版）")
  
  ;; 階段ルールテスト
  (run-single-rules-test "tests/rules/test-kaidan.lisp" "階段ルール")
  (run-single-rules-test "tests/rules/test-kaidan-simple.lisp" "階段ルール（簡易版）")
  
  ;; 拡張ローカルルールテスト
  (run-single-rules-test "tests/rules/test-extended-local-rules.lisp" "拡張ローカルルール")
  (run-single-rules-test "tests/rules/test-extended-rules-simple.lisp" "拡張ルール（簡易版）")
  
  ;; 結果集計
  (format t "~%📊 ルールテスト結果:~%")
  (let ((passed (count-if (lambda (result) (eq (getf result :status) :passed)) *rules-test-results*))
        (failed (count-if (lambda (result) (eq (getf result :status) :failed)) *rules-test-results*)))
    (format t "合格: ~A, 失敗: ~A (合計: ~A)~%" passed failed (+ passed failed))
    (when (> failed 0)
      (format t "~%❌ 失敗したテスト:~%")
      (dolist (result (reverse *rules-test-results*))
        (when (eq (getf result :status) :failed)
          (format t "  - ~A: ~A~%" (getf result :test) (getf result :error)))))
    (= failed 0)))

;; テスト実行
(run-rules-tests)