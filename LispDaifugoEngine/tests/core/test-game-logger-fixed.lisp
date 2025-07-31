;;; test-game-logger-fixed.lisp - ゲームロガーシステムの修正版テスト
;;; 実在する機能のみをテストする最小限版

;; simple-test-frameworkをロード
(load "tests/simple-test-framework.lisp")

(defpackage :test-game-logger-fixed
  (:use :common-lisp :simple-test-framework))

(in-package :test-game-logger-fixed)

;;; ============================================================================
;;; 基本ロガー機能テスト（動作確認済み）
;;; ============================================================================

(test test-logger-creation
  "ロガーの作成と基本プロパティテスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (test-assert logger "ロガーが作成される")
    (test-assert (daifugo-game-logger:logger-p logger) "作成されたオブジェクトはロガーである")
    (test-assert (eq (daifugo-game-logger:logger-name logger) :test-game) "ロガー名が正しく設定される")
    (test-assert (= (daifugo-game-logger:log-count logger) 0) "初期状態でログ数は0")))

(test test-basic-logging
  "基本ログ記録機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "テスト情報メッセージ")
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "ログが1件記録される")
    
    (daifugo-game-logger:log-warn logger "テスト警告メッセージ")
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "ログが2件記録される")
    
    (daifugo-game-logger:log-error logger "テストエラーメッセージ")
    (test-assert (= (daifugo-game-logger:log-count logger) 3) "ログが3件記録される")))

(test test-log-levels
  "ログレベルフィルタリング機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    ;; デフォルトは:infoレベル
    (daifugo-game-logger:log-debug logger "デバッグメッセージ（表示されない）")
    (test-assert (= (daifugo-game-logger:log-count logger) 0) "デバッグメッセージは記録されない")
    
    (daifugo-game-logger:log-info logger "情報メッセージ（表示される）")
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "情報メッセージは記録される")
    
    ;; :warnレベルに変更
    (daifugo-game-logger:set-log-level logger :warn)
    (daifugo-game-logger:log-info logger "情報メッセージ（表示されない）")
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "レベル変更後、情報メッセージは記録されない")
    
    (daifugo-game-logger:log-warn logger "警告メッセージ（表示される）")
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "警告メッセージは記録される")))

(test test-log-clear
  "ログクリア機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "テストメッセージ1")
    (daifugo-game-logger:log-info logger "テストメッセージ2")
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "2件のログが記録される")
    
    (daifugo-game-logger:clear-logs logger)
    (test-assert (= (daifugo-game-logger:log-count logger) 0) "ログがクリアされる")))

(test test-data-context-logging
  "データとコンテキスト付きログ機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    ;; データ付きログ
    (daifugo-game-logger:log-info logger "データ付きメッセージ" '(:player-id 1 :action :play-card))
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "データ付きログが記録される")
    
    ;; コンテキスト付きログ
    (daifugo-game-logger:log-info logger "コンテキスト付きメッセージ" nil :game-turn)
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "コンテキスト付きログが記録される")
    
    ;; データとコンテキスト両方付きログ
    (daifugo-game-logger:log-info logger "完全メッセージ" '(:card-count 3) :card-play)
    (test-assert (= (daifugo-game-logger:log-count logger) 3) "データとコンテキスト付きログが記録される")))

(test test-logger-robustness
  "ロガーの堅牢性テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    ;; 空の文字列
    (daifugo-game-logger:log-info logger "")
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "空文字列ログが記録される")
    
    ;; 非文字列の自動変換
    (daifugo-game-logger:log-info logger 12345)
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "数値が文字列に変換されてログ記録される")
    
    ;; シンボルの自動変換
    (daifugo-game-logger:log-info logger :test-symbol)
    (test-assert (= (daifugo-game-logger:log-count logger) 3) "シンボルが文字列に変換されてログ記録される")))

(test test-multiple-logger-instances
  "複数ロガーインスタンステスト"
  (let ((logger1 (daifugo-game-logger:create-logger :game-1))
        (logger2 (daifugo-game-logger:create-logger :game-2)))
    (daifugo-game-logger:log-info logger1 "ゲーム1のメッセージ")
    (daifugo-game-logger:log-info logger2 "ゲーム2のメッセージ")
    
    (test-assert (= (daifugo-game-logger:log-count logger1) 1) "ロガー1に1件記録される")
    (test-assert (= (daifugo-game-logger:log-count logger2) 1) "ロガー2に1件記録される")
    (test-assert (not (eq logger1 logger2)) "ロガーインスタンスは独立している")))

;;; ============================================================================
;;; テスト実行
;;; ============================================================================

(defun run-game-logger-fixed-tests ()
  "ゲームロガーシステムの修正版テストを実行"
  (run-test-suite "ゲームロガーシステム（修正版）"
                  '(test-logger-creation
                    test-basic-logging
                    test-log-levels
                    test-log-clear
                    test-data-context-logging
                    test-logger-robustness
                    test-multiple-logger-instances)))

;; テスト実行
(run-game-logger-fixed-tests)