;;; test-game-logger.lisp - 強力なゲームロガーシステムのテスト
;;; 統合版：基本テスト（defun形式）+ 詳細テスト（simple-test-framework形式）

(load "../debug/final-test.lisp")
;; simple-test-framework も使用可能にする
(load "../simple-test-framework.lisp")

(defpackage :daifugo-game-logger-test
  (:use :common-lisp :simple-test-framework))

(in-package :daifugo-game-logger-test)

;;; ==========================================
;;; 基本ロガー機能テスト
;;; ==========================================

(defun test-logger-creation ()
  "ロガーの作成テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (and logger
         (daifugo-game-logger:logger-p logger)
         (eq (daifugo-game-logger:logger-name logger) :test-game))))

(defun test-basic-logging ()
  "基本ログ記録テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "テストメッセージ")
    (daifugo-game-logger:log-warn logger "警告メッセージ")
    (daifugo-game-logger:log-error logger "エラーメッセージ")
    (= (daifugo-game-logger:log-count logger) 3)))

(defun test-log-levels ()
  "ログレベル機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:set-log-level logger :warn)
    (daifugo-game-logger:log-debug logger "デバッグメッセージ")
    (daifugo-game-logger:log-info logger "情報メッセージ")
    (daifugo-game-logger:log-warn logger "警告メッセージ")
    (daifugo-game-logger:log-error logger "エラーメッセージ")
    ;; DEBUG, INFOは無視される、WARN, ERRORのみ記録
    (= (daifugo-game-logger:log-count logger) 2)))

;;; ==========================================
;;; ゲーム状態ロガー機能テスト
;;; ==========================================

(defun test-game-state-logging ()
  "ゲーム状態ログ記録テスト"
  (let ((logger (daifugo-game-logger:create-logger :game-state))
        (game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-logger:log-game-state logger game)
    (daifugo-game-logger:log-game-state logger game)
    (= (daifugo-game-logger:log-count logger) 2)))

(defun test-player-action-logging ()
  "プレイヤーアクションログ記録テスト"
  (let ((logger (daifugo-game-logger:create-logger :player-actions))
        (game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((player (first (daifugo-game-engine:game-state-players game)))
          (card (first (daifugo-player-system:player-hand player))))
      (daifugo-game-logger:log-player-action logger 0 :play-card (list card))
      (daifugo-game-logger:log-player-action logger 1 :pass nil)
      (= (daifugo-game-logger:log-count logger) 2))))

(defun test-card-play-logging ()
  "カード出しログ記録テスト"
  (let ((logger (daifugo-game-logger:create-logger :card-plays))
        (game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((cards (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades))))
      (daifugo-game-logger:log-card-play logger 0 cards :single)
      (daifugo-game-logger:log-card-play logger 1 cards :revolution)
      (= (daifugo-game-logger:log-count logger) 2))))

;;; ==========================================
;;; 詳細ロガー機能テスト
;;; ==========================================

(defun test-hand-tracking ()
  "手札追跡ログテスト"
  (let ((logger (daifugo-game-logger:create-logger :hand-tracking))
        (game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-logger:log-hand-state logger game)
    (let ((player (first (daifugo-game-engine:game-state-players game)))
          (card (first (daifugo-player-system:player-hand player))))
      (daifugo-game-engine:play-card game 0 (list card))
      (daifugo-game-logger:log-hand-state logger game)
      (= (daifugo-game-logger:log-count logger) 2))))

(defun test-turn-progression-logging ()
  "ターン進行ログテスト"
  (let ((logger (daifugo-game-logger:create-logger :turn-progression))
        (game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-logger:log-turn-start logger 0)
    (daifugo-game-logger:log-turn-end logger 0)
    (daifugo-game-logger:log-turn-start logger 1)
    (daifugo-game-logger:log-turn-end logger 1)
    (= (daifugo-game-logger:log-count logger) 4)))

(defun test-rule-application-logging ()
  "ルール適用ログテスト"
  (let ((logger (daifugo-game-logger:create-logger :rule-application)))
    (daifugo-game-logger:log-rule-applied logger :revolution "4枚同じランクで革命発生")
    (daifugo-game-logger:log-rule-applied logger :eight-cut "8切りでフィールドクリア")
    (daifugo-game-logger:log-rule-applied logger :sequence "階段出し成功")
    (= (daifugo-game-logger:log-count logger) 3)))

;;; ==========================================
;;; フィルタリング・検索機能テスト
;;; ==========================================

(defun test-log-filtering ()
  "ログフィルタリングテスト"
  (let ((logger (daifugo-game-logger:create-logger :filtering-test)))
    (daifugo-game-logger:log-info logger "情報1")
    (daifugo-game-logger:log-warn logger "警告1")
    (daifugo-game-logger:log-error logger "エラー1")
    (daifugo-game-logger:log-info logger "情報2")
    (let ((warn-logs (daifugo-game-logger:filter-logs logger :level :warn))
          (error-logs (daifugo-game-logger:filter-logs logger :level :error)))
      (and (= (length warn-logs) 1)
           (= (length error-logs) 1)))))

(defun test-log-search ()
  "ログ検索テスト"
  (let ((logger (daifugo-game-logger:create-logger :search-test)))
    (daifugo-game-logger:log-info logger "プレイヤー0がカードを出しました")
    (daifugo-game-logger:log-info logger "プレイヤー1がパスしました")
    (daifugo-game-logger:log-info logger "プレイヤー0が革命を起こしました")
    (let ((player0-logs (daifugo-game-logger:search-logs logger "プレイヤー0"))
          (revolution-logs (daifugo-game-logger:search-logs logger "革命")))
      (and (= (length player0-logs) 2)
           (= (length revolution-logs) 1)))))

(defun test-temporal-queries ()
  "時間範囲クエリテスト"
  (let ((logger (daifugo-game-logger:create-logger :temporal-test)))
    (daifugo-game-logger:log-info logger "開始メッセージ")
    (sleep 0.1)
    (let ((mid-time (get-universal-time)))
      (daifugo-game-logger:log-info logger "中間メッセージ")
      (sleep 0.1)
      (daifugo-game-logger:log-info logger "終了メッセージ")
      (let ((before-mid (daifugo-game-logger:logs-before logger mid-time))
            (after-mid (daifugo-game-logger:logs-after logger mid-time)))
        (and (= (length before-mid) 1)
             (= (length after-mid) 2))))))

;;; ==========================================
;;; 出力・永続化機能テスト
;;; ==========================================

(defun test-log-formatting ()
  "ログフォーマット出力テスト"
  (let ((logger (daifugo-game-logger:create-logger :format-test)))
    (daifugo-game-logger:log-info logger "テストメッセージ")
    (daifugo-game-logger:log-warn logger "警告メッセージ")
    (let ((text-output (daifugo-game-logger:format-logs logger :text))
          (json-output (daifugo-game-logger:format-logs logger :json))
          (csv-output (daifugo-game-logger:format-logs logger :csv)))
      (and (stringp text-output)
           (stringp json-output)
           (stringp csv-output)))))

(defun test-log-persistence ()
  "ログ永続化テスト"
  (let ((logger (daifugo-game-logger:create-logger :persistence-test)))
    (daifugo-game-logger:log-info logger "永続化テストメッセージ")
    (daifugo-game-logger:save-logs logger "test-log.txt")
    (daifugo-game-logger:clear-logs logger)
    (daifugo-game-logger:load-logs logger "test-log.txt")
    (= (daifugo-game-logger:log-count logger) 1)))

;;; ==========================================
;;; 統計・分析機能テスト
;;; ==========================================

(defun test-log-statistics ()
  "ログ統計機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :stats-test)))
    (daifugo-game-logger:log-info logger "情報1")
    (daifugo-game-logger:log-info logger "情報2")
    (daifugo-game-logger:log-warn logger "警告1")
    (daifugo-game-logger:log-error logger "エラー1")
    (let ((stats (daifugo-game-logger:get-log-statistics logger)))
      (and (= (daifugo-game-logger:stat-total stats) 4)
           (= (daifugo-game-logger:stat-info-count stats) 2)
           (= (daifugo-game-logger:stat-warn-count stats) 1)
           (= (daifugo-game-logger:stat-error-count stats) 1)))))

(defun test-performance-metrics ()
  "パフォーマンス計測テスト"
  (let ((logger (daifugo-game-logger:create-logger :performance-test)))
    (daifugo-game-logger:start-timer logger :game-duration)
    (sleep 0.1)
    (daifugo-game-logger:stop-timer logger :game-duration)
    (daifugo-game-logger:start-timer logger :turn-duration)
    (sleep 0.05)
    (daifugo-game-logger:stop-timer logger :turn-duration)
    (let ((metrics (daifugo-game-logger:get-performance-metrics logger)))
      (and (daifugo-game-logger:metric-exists-p metrics :game-duration)
           (daifugo-game-logger:metric-exists-p metrics :turn-duration)))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-game-logger-tests ()
  "ゲームロガーシステムのテストを実行"
  (format t "~%=== ゲームロガーシステムテスト実行 ===~%")
  
  (let ((tests '(("ロガー作成" . test-logger-creation)
                 ("基本ログ記録" . test-basic-logging)
                 ("ログレベル" . test-log-levels)
                 ("ゲーム状態ログ" . test-game-state-logging)
                 ("プレイヤーアクションログ" . test-player-action-logging)
                 ("カード出しログ" . test-card-play-logging)
                 ("手札追跡" . test-hand-tracking)
                 ("ターン進行ログ" . test-turn-progression-logging)
                 ("ルール適用ログ" . test-rule-application-logging)
                 ("ログフィルタリング" . test-log-filtering)
                 ("ログ検索" . test-log-search)
                 ("時間範囲クエリ" . test-temporal-queries)
                 ("ログフォーマット" . test-log-formatting)
                 ("ログ永続化" . test-log-persistence)
                 ("ログ統計" . test-log-statistics)
                 ("パフォーマンス計測" . test-performance-metrics)))
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
    (= failed 0)))

;;; ==========================================
;;; 詳細テスト（simple-test-framework版）
;;; ==========================================

;;; simple版からの統合テスト - より詳細なアサーション付き

(test test-logger-creation-detailed
  "ロガーの作成と基本プロパティテスト（詳細版）"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (test-assert logger "ロガーが作成される")
    (test-assert (daifugo-game-logger:logger-p logger) "作成されたオブジェクトはロガーである")
    (test-assert (eq (daifugo-game-logger:logger-name logger) :test-game) "ロガー名が正しく設定される")
    (test-assert (= (daifugo-game-logger:log-count logger) 0) "初期状態でログ数は0")))

(test test-basic-logging-detailed
  "基本ログ記録機能テスト（詳細版）"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "テスト情報メッセージ")
    (test-assert (= (daifugo-game-logger:log-count logger) 1) "ログが1件記録される")
    
    (daifugo-game-logger:log-warn logger "テスト警告メッセージ")
    (test-assert (= (daifugo-game-logger:log-count logger) 2) "ログが2件記録される")
    
    (daifugo-game-logger:log-error logger "テストエラーメッセージ")
    (test-assert (= (daifugo-game-logger:log-count logger) 3) "ログが3件記録される")))

(test test-log-levels-detailed
  "ログレベルフィルタリング機能テスト（詳細版）"
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

(test test-log-filtering-detailed
  "ログフィルタリング機能テスト（詳細版）"
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

(test test-log-search-detailed
  "ログ検索機能テスト（詳細版）"
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

(test test-log-formatting-detailed
  "ログフォーマット出力テスト（詳細版）"
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

(test test-log-statistics-detailed
  "ログ統計機能テスト（詳細版）"
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

(test test-performance-metrics-detailed
  "パフォーマンス計測機能テスト（詳細版）"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:start-timer logger :test-duration)
    (sleep 0.01) ; 10ms待機
    (let ((duration (daifugo-game-logger:stop-timer logger :test-duration)))
      (test-assert (numberp duration) "計測時間が数値で返される")
      (test-assert (> duration 0) "計測時間が正の値である"))
    
    (let ((metrics (daifugo-game-logger:get-performance-metrics logger)))
      (test-assert (daifugo-game-logger:metric-exists-p metrics :test-duration) "メトリクスが記録される"))))

(test test-game-specific-logging-detailed
  "ゲーム専用ログ機能テスト（詳細版）"
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

;;; ==========================================
;;; 統合テスト実行関数
;;; ==========================================

(defun run-game-logger-simple-tests ()
  "詳細テスト（simple-test-framework版）を実行"
  (run-test-suite "ゲームロガーシステム（詳細テスト）"
                  '(test-logger-creation-detailed
                    test-basic-logging-detailed
                    test-log-levels-detailed
                    test-log-clear
                    test-log-filtering-detailed
                    test-log-search-detailed
                    test-log-formatting-detailed
                    test-log-statistics-detailed
                    test-performance-metrics-detailed
                    test-game-specific-logging-detailed)))

;; テスト実行
(format t "~%=== 基本テスト実行 ===~%")
(run-game-logger-tests)
(format t "~%=== 詳細テスト実行 ===~%")
(run-game-logger-simple-tests)