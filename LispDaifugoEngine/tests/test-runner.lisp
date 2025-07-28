;;; test-runner.lisp - LispDaifugoEngine統合テストランナー

(defpackage :daifugo-test-runner
  (:use :common-lisp)
  (:export #:run-all-tests
           #:run-core-tests
           #:run-basic-tests))

(in-package :daifugo-test-runner)

;;; テスト実行用のユーティリティ関数
(defun safe-load (filename)
  "ファイルを安全に読み込み、エラーをキャッチする"
  (handler-case
    (progn
      (load filename)
      t)
    (error (e)
      (format t "⚠️  ~A の読み込みでエラー: ~A~%" filename e)
      nil)))

(defun run-test-safely (test-name load-deps load-test test-function)
  "テストを安全に実行し、結果を返す"
  (format t "~%🧪 ~A~%" test-name)
  (handler-case
    (progn
      ;; 依存関係を読み込み
      (dolist (dep load-deps)
        (unless (safe-load dep)
          (error "依存関係の読み込みに失敗: ~A" dep)))
      
      ;; テストファイルを読み込み
      (unless (safe-load load-test)
        (error "テストファイルの読み込みに失敗: ~A" load-test))
      
      ;; テスト実行
      (let ((result (funcall test-function)))
        (if result
            (progn
              (format t "✅ ~A: 合格~%" test-name)
              t)
            (progn
              (format t "❌ ~A: 失敗~%" test-name)
              nil))))
    (error (e)
      (format t "💥 ~A: エラー - ~A~%" test-name e)
      nil)))

;;; 基本テスト実行
(defun run-basic-tests ()
  "基本的なテストのみを実行"
  (format t "🚀 LispDaifugoEngine基本テスト開始~%")
  (let ((passed 0) (total 0))
    
    ;; 1. プロジェクト構造テスト
    (when (run-test-safely 
           "プロジェクト構造テスト"
           '()
           "tests/test-project-structure.lisp"
           (lambda () (daifugo-structure-test:run-structure-tests)))
      (incf passed))
    (incf total)
    
    ;; 2. カードシステムテスト
    (when (run-test-safely
           "カードシステムテスト"
           '("src/core/card-system.lisp")
           "tests/test-card-system.lisp"
           (lambda () (daifugo-card-system-test:run-card-system-tests)))
      (incf passed))
    (incf total)
    
    ;; 3. プレイヤーシステムテスト
    (when (run-test-safely
           "プレイヤーシステムテスト"
           '("src/core/card-system.lisp" "src/core/player-system.lisp")
           "tests/test-player-system.lisp"
           (lambda () (daifugo-player-system-test:run-player-system-tests)))
      (incf passed))
    (incf total)
    
    (format t "~%📊 基本テスト結果: ~A/~A合格 (~A%)~%" 
            passed total (if (> total 0) (round (* 100 (/ passed total))) 0))
    (= passed total)))

;;; コアテスト実行
(defun run-core-tests ()
  "コアシステムのテストを実行"
  (format t "🎯 LispDaifugoEngineコアテスト開始~%")
  (let ((basic-result (run-basic-tests)))
    
    ;; 統合テスト
    (format t "~%🔗 統合テスト実行...~%")
    (let ((integration-passed 0) (integration-total 1))
      
      ;; 簡単な統合テスト
      (handler-case
        (progn
          ;; コアシステムを読み込み
          (load "src/core/card-system.lisp")
          (load "src/core/player-system.lisp")
          (load "src/core/game-state.lisp")
          
          ;; 統合動作確認
          (let* ((deck (daifugo-card-system:create-deck))
                 (players (daifugo-player-system:create-players 4))
                 (hands (daifugo-card-system:deal-cards deck 4))
                 (game-state (daifugo-game-state:make-game-state
                              :players players
                              :current-player 0
                              :field nil
                              :game-phase :playing)))
            (format t "✅ 統合テスト: 合格~%")
            (incf integration-passed)))
        (error (e)
          (format t "💥 統合テスト: エラー - ~A~%" e)))
      
      (incf integration-total)
      (format t "📊 統合テスト結果: ~A/~A合格~%" integration-passed integration-total)
      
      (and basic-result (= integration-passed integration-total)))))

;;; 全テスト実行
(defun run-all-tests ()
  "利用可能な全てのテストを実行"
  (format t "🌟 LispDaifugoEngine全テスト開始~%")
  (let ((core-result (run-core-tests)))
    
    (format t "~%🏁 全テスト完了~%")
    (if core-result
        (format t "🎉 すべてのテストが合格しました！~%")
        (format t "⚠️  一部のテストが失敗しました。~%"))
    
    core-result))

;; スクリプトとして実行された場合のエントリポイント
(when (and (boundp '*load-pathname*) *load-pathname*)
  (run-all-tests))