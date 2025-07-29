;;; all-tests.lisp - 全テストランナー
;;; すべてのテストカテゴリを統合して実行

(format t "~%🚀 === LispDaifugoEngine 全テスト実行開始 ===~%")

(defvar *all-test-summary* '())

(defun run-test-category (runner-file category-name)
  "テストカテゴリを実行し、結果を記録"
  (format t "~%📂 ~A テストカテゴリ実行~%" category-name)
  (let ((start-time (get-internal-real-time)))
    (handler-case
        (progn
          (load runner-file)
          (let ((end-time (get-internal-real-time))
                (duration (/ (- end-time start-time) internal-time-units-per-second)))
            (format t "⏱️  ~A 実行時間: ~,2F秒~%" category-name duration)
            (push (list :category category-name :status :completed :duration duration) *all-test-summary*)))
      (error (e)
        (let ((end-time (get-internal-real-time))
              (duration (/ (- end-time start-time) internal-time-units-per-second)))
          (format t "❌ ~A エラー: ~A (実行時間: ~,2F秒)~%" category-name e duration)
          (push (list :category category-name :status :error :duration duration :error (format nil "~A" e)) *all-test-summary*))))))

(defun run-all-tests ()
  "全テストカテゴリを順次実行"
  (setf *all-test-summary* '())
  (let ((overall-start-time (get-internal-real-time)))
    
    ;; 各テストカテゴリを実行
    (run-test-category "test-runners/core-tests.lisp" "コアシステム")
    (run-test-category "test-runners/rules-tests.lisp" "ルールシステム") 
    (run-test-category "test-runners/api-tests.lisp" "API層")
    (run-test-category "test-runners/integration-tests.lisp" "統合テスト")
    
    ;; 全体結果サマリー
    (let ((overall-end-time (get-internal-real-time))
          (total-duration (/ (- overall-end-time overall-start-time) internal-time-units-per-second)))
      
      (format t "~%~%🏁 === 全テスト実行完了 ===~%")
      (format t "⏱️  総実行時間: ~,2F秒~%~%" total-duration)
      
      (format t "📊 カテゴリ別結果:~%")
      (let ((completed 0)
            (errors 0))
        (dolist (summary (reverse *all-test-summary*))
          (let ((category (getf summary :category))
                (status (getf summary :status))
                (duration (getf summary :duration)))
            (if (eq status :completed)
                (progn
                  (format t "  ✅ ~A: 完了 (~,2F秒)~%" category duration)
                  (incf completed))
                (progn
                  (format t "  ❌ ~A: エラー (~,2F秒) - ~A~%" category duration (getf summary :error))
                  (incf errors)))))
        
        (format t "~%📈 全体サマリー:~%")
        (format t "完了カテゴリ: ~A/~A~%" completed (+ completed errors))
        (format t "成功率: ~,1F%~%" (* 100 (/ completed (+ completed errors))))
        
        (= errors 0)))))

;; メイン実行
(format t "LispDaifugoEngine テストスイート~%")
(format t "復元された元のテスト要件定義を使用~%")
(run-all-tests)