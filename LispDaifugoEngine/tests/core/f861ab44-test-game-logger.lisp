;;; test-game-logger.lisp - 強力なゲームロガーシステムのテスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-game-logger-test
  (:use :common-lisp))

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

;; テスト実行
(run-game-logger-tests)