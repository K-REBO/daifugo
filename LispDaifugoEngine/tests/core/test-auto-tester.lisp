;;; test-auto-tester.lisp - 自動テスタシステムの包括的テスト

(defpackage :daifugo-auto-tester-test
  (:use :common-lisp))

(in-package :daifugo-auto-tester-test)

;;; ==========================================
;;; 基本自動テスタ機能テスト
;;; ==========================================

(defun test-tester-creation ()
  "自動テスタの作成テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :test-tester)))
    (and tester
         (daifugo-auto-tester:auto-tester-p tester)
         (eq (daifugo-auto-tester:tester-name tester) :test-tester))))

(defun test-single-game-simulation ()
  "単一ゲームシミュレーションテスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :single-test)))
    (let ((result (daifugo-auto-tester:run-single-game tester 4)))
      (and result
           (listp result)
           (>= (length result) 3)  ; 最低限の結果データ
           (getf result :winner)
           (getf result :turns)
           (getf result :duration)))))

(defun test-bulk-game-testing ()
  "一括ゲームテストの実行"
  (let ((tester (daifugo-auto-tester:create-auto-tester :bulk-test)))
    (let ((results (daifugo-auto-tester:run-bulk-tests tester 10 4)))
      (and results
           (listp results)
           (= (length results) 10)
           (every (lambda (result)
                    (and (getf result :winner)
                         (getf result :turns)
                         (numberp (getf result :turns))))
                  results)))))

;;; ==========================================
;;; AI プレイヤー統合テスト
;;; ==========================================

(defun test-ai-player-integration ()
  "AIプレイヤー統合テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :ai-test)))
    (let ((result (daifugo-auto-tester:run-ai-game tester 
                                                   '(:random :smart :aggressive :defensive))))
      (and result
           (getf result :winner)
           (member (getf result :winner) '(0 1 2 3))
           (numberp (getf result :turns))
           (> (getf result :turns) 0)))))

(defun test-ai-performance-comparison ()
  "AI性能比較テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :ai-comparison)))
    (let ((comparison (daifugo-auto-tester:compare-ai-types 
                       tester '(:random :smart) 20)))
      (and comparison
           (listp comparison)
           (= (length comparison) 2)
           (every (lambda (ai-stats)
                    (and (getf ai-stats :ai-type)
                         (getf ai-stats :win-rate)
                         (getf ai-stats :avg-turns)))
                  comparison)))))

;;; ==========================================
;;; ゲーム統計・分析機能テスト
;;; ==========================================

(defun test-game-statistics ()
  "ゲーム統計収集テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :stats-test)))
    (daifugo-auto-tester:run-bulk-tests tester 5 4)
    (let ((stats (daifugo-auto-tester:get-test-statistics tester)))
      (and stats
           (numberp (getf stats :total-games))
           (= (getf stats :total-games) 5)
           (numberp (getf stats :avg-turns))
           (> (getf stats :avg-turns) 0)
           (numberp (getf stats :avg-duration))
           (> (getf stats :avg-duration) 0)))))

(defun test-turn-distribution-analysis ()
  "ターン数分布分析テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :distribution-test)))
    (daifugo-auto-tester:run-bulk-tests tester 15 4)
    (let ((distribution (daifugo-auto-tester:get-turn-distribution tester)))
      (and distribution
           (listp distribution)
           (> (length distribution) 0)
           (every (lambda (bucket)
                    (and (numberp (first bucket))   ; ターン数範囲
                         (numberp (second bucket))))  ; ゲーム数
                  distribution)))))

(defun test-winner-pattern-analysis ()
  "勝者パターン分析テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :winner-test)))
    (daifugo-auto-tester:run-bulk-tests tester 20 4)
    (let ((pattern (daifugo-auto-tester:analyze-winner-patterns tester)))
      (and pattern
           (listp pattern)
           (= (length pattern) 4)  ; 4プレイヤー分
           (every (lambda (player-stats)
                    (and (numberp (getf player-stats :player-id))
                         (numberp (getf player-stats :wins))
                         (numberp (getf player-stats :win-rate))))
                  pattern)))))

;;; ==========================================
;;; ルール検証・回帰テスト
;;; ==========================================

(defun test-rule-validation ()
  "ルール検証テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :rule-validation)))
    (let ((validation (daifugo-auto-tester:validate-game-rules tester)))
      (and validation
           (listp validation)
           (every (lambda (rule-result)
                    (and (getf rule-result :rule-name)
                         (not (null (getf rule-result :passed)))
                         (stringp (getf rule-result :description))))
                  validation)))))

(defun test-regression-detection ()
  "回帰検出テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :regression-test)))
    ;; ベースライン確立
    (daifugo-auto-tester:establish-baseline tester 50)
    ;; 現在の動作と比較
    (let ((regression-result (daifugo-auto-tester:detect-regressions tester 20)))
      (and regression-result
           (listp regression-result)
           (getf regression-result :baseline-compatible)
           (numberp (getf regression-result :deviation-score))))))

;;; ==========================================
;;; パフォーマンス・負荷テスト
;;; ==========================================

(defun test-performance-benchmarking ()
  "パフォーマンスベンチマークテスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :performance-test)))
    (let ((benchmark (daifugo-auto-tester:run-performance-benchmark tester 100)))
      (and benchmark
           (numberp (getf benchmark :total-time))
           (> (getf benchmark :total-time) 0)
           (numberp (getf benchmark :games-per-second))
           (> (getf benchmark :games-per-second) 0)
           (numberp (getf benchmark :avg-game-time))
           (> (getf benchmark :avg-game-time) 0)))))

(defun test-stress_testing ()
  "ストレステスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :stress-test)))
    (let ((stress-result (daifugo-auto-tester:run-stress-test tester 500)))
      (and stress-result
           (getf stress-result :success)
           (numberp (getf stress-result :completed-games))
           (= (getf stress-result :completed-games) 500)
           (numberp (getf stress-result :error-count))
           (= (getf stress-result :error-count) 0)))))

;;; ==========================================
;;; テスト結果出力・レポート機能テスト
;;; ==========================================

(defun test-report-generation ()
  "レポート生成テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :report-test)))
    (daifugo-auto-tester:run-bulk-tests tester 10 4)
    (let ((report (daifugo-auto-tester:generate-test-report tester)))
      (and report
           (stringp report)
           (> (length report) 100)  ; 実質的なレポート内容
           (search "テスト結果" report)
           (search "統計" report)))))

(defun test-csv_export ()
  "CSV出力テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :csv-test)))
    (daifugo-auto-tester:run-bulk-tests tester 5 4)
    (let ((csv-data (daifugo-auto-tester:export-results-csv tester)))
      (and csv-data
           (stringp csv-data)
           (search "ゲーム番号,勝者,ターン数,所要時間" csv-data)
           (> (length (split-string csv-data #\Newline)) 6)))))  ; ヘッダー+5ゲーム

;;; ==========================================
;;; 設定・カスタマイズ機能テスト
;;; ==========================================

(defun test-custom-test-configurations ()
  "カスタムテスト設定テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :custom-config))
        (config '(:player-count 3 
                 :ai-types (:smart :aggressive :random)
                 :max-turns 100
                 :timeout 30)))
    (daifugo-auto-tester:set-test-configuration tester config)
    (let ((result (daifugo-auto-tester:run-configured-test tester)))
      (and result
           (getf result :winner)
           (member (getf result :winner) '(0 1 2))
           (<= (getf result :turns) 100)))))

(defun test-parallel_execution ()
  "並列実行テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester :parallel-test)))
    (let ((results (daifugo-auto-tester:run-parallel-tests tester 20 4)))
      (and results
           (listp results)
           (= (length results) 20)
           (every (lambda (result)
                    (and (getf result :winner)
                         (getf result :turns)))
                  results)))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-auto-tester-tests ()
  "自動テスタシステムの全テストを実行"
  (format t "~%=== 自動テスタシステムテスト実行 ===~%")
  
  (let ((tests '(("自動テスタ作成" . test-tester-creation)
                 ("単一ゲームシミュレーション" . test-single-game-simulation)
                 ("一括ゲームテスト" . test-bulk-game-testing)
                 ("AIプレイヤー統合" . test-ai-player-integration)
                 ("AI性能比較" . test-ai-performance-comparison)
                 ("ゲーム統計収集" . test-game-statistics)
                 ("ターン数分布分析" . test-turn-distribution-analysis)
                 ("勝者パターン分析" . test-winner-pattern-analysis)
                 ("ルール検証" . test-rule-validation)
                 ("回帰検出" . test-regression-detection)
                 ("パフォーマンスベンチマーク" . test-performance-benchmarking)
                 ("ストレステスト" . test-stress_testing)
                 ("レポート生成" . test-report-generation)
                 ("CSV出力" . test-csv_export)
                 ("カスタム設定" . test-custom-test-configurations)
                 ("並列実行" . test-parallel_execution)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (handler-case
            (if (funcall test-func)
                (progn
                  (format t "合格~%")
                  (incf passed))
                (progn
                  (format t "失敗~%")
                  (incf failed)))
          (error (e)
            (format t "エラー: ~A~%" e)
            (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (zerop failed)))

;; ユーティリティ関数（簡易実装）
(defun split-string (string delimiter)
  "文字列を区切り文字で分割"
  (loop with result = nil
        with start = 0
        for pos = (position delimiter string :start start)
        do (push (subseq string start pos) result)
           (if pos
               (setf start (1+ pos))
               (return (nreverse result)))))

;; テスト実行
(format t "~%自動テスタシステムのテストケース準備完了~%")
(format t "実装完了後に (run-auto-tester-tests) を実行してください~%")