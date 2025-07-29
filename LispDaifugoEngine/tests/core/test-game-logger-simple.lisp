;;; test-game-logger-simple.lisp - ゲームロガーシステムの基本機能テスト
;;; simple-test-framework使用版

;; プロジェクトルートからの相対パスでロード
(load (merge-pathnames "../simple-test-framework.lisp" *load-truename*))
(load (merge-pathnames "../../src/testing/game-logger.lisp" *load-truename*))

(defpackage :test-game-logger-simple
  (:use :common-lisp :simple-test-framework))

(in-package :test-game-logger-simple)

;;; ============================================================================
;;; 基本ロガー機能テスト
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

;;; ============================================================================
;;; フィルタリング機能テスト
;;; ============================================================================

(test test-log-filtering
  "ログフィルタリング機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "情報1")
    (daifugo-game-logger:log-warn logger "警告1") 
    (daifugo-game-logger:log-error logger "エラー1")
    (daifugo-game-logger:log-info logger "情報2")
    
    (let ((warn-logs (daifugo-game-logger:filter-logs logger :level :warn))
          (error-logs (daifugo-game-logger:filter-logs logger :level :error))
          (info-logs (daifugo-game-logger:filter-logs logger :level :info)))
      (test-assert (= (length warn-logs) 1) "警告ログが1件フィルタされる")
      (test-assert (= (length error-logs) 1) "エラーログが1件フィルタされる")
      (test-assert (= (length info-logs) 2) "情報ログが2件フィルタされる"))))

(test test-log-search
  "ログ検索機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "プレイヤー0がカードを出しました")
    (daifugo-game-logger:log-info logger "プレイヤー1がパスしました")
    (daifugo-game-logger:log-info logger "プレイヤー0が革命を起こしました")
    
    (let ((player0-logs (daifugo-game-logger:search-logs logger "プレイヤー0"))
          (card-logs (daifugo-game-logger:search-logs logger "カード"))
          (revolution-logs (daifugo-game-logger:search-logs logger "革命")))
      (test-assert (= (length player0-logs) 2) "プレイヤー0に関するログが2件検索される")
      (test-assert (= (length card-logs) 1) "カードに関するログが1件検索される")
      (test-assert (= (length revolution-logs) 1) "革命に関するログが1件検索される"))))

;;; ============================================================================
;;; 出力機能テスト
;;; ============================================================================

(test test-log-formatting
  "ログフォーマット出力テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "テストメッセージ")
    (daifugo-game-logger:log-warn logger "警告メッセージ")
    
    (let ((text-output (daifugo-game-logger:format-logs logger :text))
          (json-output (daifugo-game-logger:format-logs logger :json))
          (csv-output (daifugo-game-logger:format-logs logger :csv)))
      (test-assert (stringp text-output) "テキスト形式で出力される")
      (test-assert (stringp json-output) "JSON形式で出力される")
      (test-assert (stringp csv-output) "CSV形式で出力される")
      (test-assert (> (length text-output) 0) "テキスト出力に内容がある")
      (test-assert (> (length json-output) 0) "JSON出力に内容がある")
      (test-assert (> (length csv-output) 0) "CSV出力に内容がある"))))

;;; ============================================================================
;;; 統計機能テスト
;;; ============================================================================

(test test-log-statistics
  "ログ統計機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "情報1")
    (daifugo-game-logger:log-info logger "情報2")
    (daifugo-game-logger:log-warn logger "警告1")
    (daifugo-game-logger:log-error logger "エラー1")
    
    (let ((stats (daifugo-game-logger:get-log-statistics logger)))
      (test-assert (= (daifugo-game-logger:stat-total stats) 4) "総ログ数が4")
      (test-assert (= (daifugo-game-logger:stat-info-count stats) 2) "情報ログ数が2")
      (test-assert (= (daifugo-game-logger:stat-warn-count stats) 1) "警告ログ数が1")
      (test-assert (= (daifugo-game-logger:stat-error-count stats) 1) "エラーログ数が1"))))

;;; ============================================================================
;;; パフォーマンス機能テスト
;;; ============================================================================

(test test-performance-metrics
  "パフォーマンス計測機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:start-timer logger :test-duration)
    (sleep 0.01) ; 10ms待機
    (let ((duration (daifugo-game-logger:stop-timer logger :test-duration)))
      (test-assert (numberp duration) "計測時間が数値で返される")
      (test-assert (> duration 0) "計測時間が正の値である"))
    
    (let ((metrics (daifugo-game-logger:get-performance-metrics logger)))
      (test-assert (daifugo-game-logger:metric-exists-p metrics :test-duration) "メトリクスが記録される"))))

;;; ============================================================================
;;; ゲーム専用機能テスト（基本のみ）
;;; ============================================================================

(test test-game-specific-logging
  "ゲーム専用ログ機能テスト（基本）"
  (let ((logger (daifugo-game-logger:create-logger :game-test)))
    ;; プレイヤーアクションログ
    (daifugo-game-logger:log-player-action logger 0 :play-card '(:card-data))
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "プレイヤーアクションがログ記録される")
    
    ;; カード出しログ  
    (daifugo-game-logger:log-card-play logger 1 '(:ace :spades) :single)
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "カード出しがログ記録される")
    
    ;; ターン進行ログ
    (daifugo-game-logger:log-turn-start logger 0)
    (daifugo-game-logger:log-turn-end logger 0)
    (test-assert (= (daifugo-game-logger:log-count logger) 4) "ターン進行がログ記録される")
    
    ;; ルール適用ログ
    (daifugo-game-logger:log-rule-applied logger :revolution "4枚同じランクで革命発生")
    (test-assert (= (daifugo-game-logger:log-count logger) 5) "ルール適用がログ記録される")))

;;; ============================================================================
;;; テスト実行
;;; ============================================================================

(defun run-game-logger-simple-tests ()
  "ゲームロガーシステムの基本機能テストを実行"
  (run-test-suite "ゲームロガーシステム（基本機能）"
                  '(test-logger-creation
                    test-basic-logging
                    test-log-levels
                    test-log-clear
                    test-log-filtering
                    test-log-search
                    test-log-formatting
                    test-log-statistics
                    test-performance-metrics
                    test-game-specific-logging)))

;; テスト実行
(run-game-logger-simple-tests)