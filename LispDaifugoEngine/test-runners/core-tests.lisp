;;; core-tests.lisp - コアシステムテストランナー
;;; カードシステム、プレイヤーシステム、ゲームロジック、手札検証など

(format t "~%=== LispDaifugoEngine コアテスト実行 ===~%")

(defvar *core-test-results* '())

(defun run-single-core-test (test-file description)
  "単一のコアテストを実行"
  (format t "🧪 ~A テスト実行中...~%" description)
  (handler-case
      (progn
        (load test-file)
        (format t "✅ ~A: 合格~%" description)
        (push (list :test description :status :passed :file test-file) *core-test-results*))
    (error (e)
      (format t "❌ ~A: 失敗 - ~A~%" description e)
      (push (list :test description :status :failed :file test-file :error (format nil "~A" e)) *core-test-results*))))

(defun run-core-tests ()
  "コアシステムの全テストを実行"
  (setf *core-test-results* '())
  
  ;; 基本システムテスト
  (run-single-core-test "tests/test-project-structure.lisp" "プロジェクト構造")
  (run-single-core-test "tests/test-spec.lisp" "仕様書")
  
  ;; カードシステムテスト
  (run-single-core-test "tests/test-card-system.lisp" "カードシステム")
  (run-single-core-test "tests/test-card-utils.lisp" "カードユーティリティ")
  
  ;; プレイヤーシステムテスト
  (run-single-core-test "tests/test-player-system.lisp" "プレイヤーシステム")
  (run-single-core-test "tests/test-player-utils.lisp" "プレイヤーユーティリティ")
  
  ;; ゲームロジックテスト
  (run-single-core-test "tests/test-game-logic.lisp" "ゲームロジック")
  (run-single-core-test "tests/test-game-logic-with-implementation.lisp" "ゲームロジック（実装付き）")
  (run-single-core-test "tests/test-game-flow.lisp" "ゲームフロー")
  
  ;; 手札検証テスト
  (run-single-core-test "tests/test-hand-validation.lisp" "手札検証")
  (run-single-core-test "tests/test-hand-validation-fixed.lisp" "手札検証（修正版）")
  (run-single-core-test "tests/core/test-hand-validation.lisp" "手札検証（コア）")
  (run-single-core-test "tests/core/test-hand-validation-simple.lisp" "手札検証（簡易版）")
  
  ;; ゲームロガーテスト
  (run-single-core-test "tests/core/test-game-logger.lisp" "ゲームロガー")
  (run-single-core-test "tests/core/test-game-logger-simple.lisp" "ゲームロガー（簡易版）")
  (run-single-core-test "tests/core/test-game-logger-fixed.lisp" "ゲームロガー（修正版）")
  
  ;; AIプレイヤーテスト
  (run-single-core-test "tests/core/test-ai-players.lisp" "AIプレイヤー")
  (run-single-core-test "tests/core/test-auto-tester.lisp" "自動テスタ")
  
  ;; 結果集計
  (format t "~%📊 コアテスト結果:~%")
  (let ((passed (count-if (lambda (result) (eq (getf result :status) :passed)) *core-test-results*))
        (failed (count-if (lambda (result) (eq (getf result :status) :failed)) *core-test-results*)))
    (format t "合格: ~A, 失敗: ~A (合計: ~A)~%" passed failed (+ passed failed))
    (when (> failed 0)
      (format t "~%❌ 失敗したテスト:~%")
      (dolist (result (reverse *core-test-results*))
        (when (eq (getf result :status) :failed)
          (format t "  - ~A: ~A~%" (getf result :test) (getf result :error)))))
    (= failed 0)))

;; テスト実行
(run-core-tests)