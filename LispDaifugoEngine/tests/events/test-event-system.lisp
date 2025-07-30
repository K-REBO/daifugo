;;; test-event-system.lisp - イベントシステム（event-system.lisp）の包括的テスト
;;; 
;;; 本テストは以下の機能をカバーします：
;;; - ゲームイベント通知システム
;;; - イベントリスナー管理（登録・解除・実行）
;;; - イベントフィルタリング・優先度
;;; - イベント履歴・ログ機能
;;; - 非同期イベント処理
;;; - イベントバス・ブロードキャスト
;;; - イベント統計・分析

(load "../debug/final-test.lisp")

(defpackage :daifugo-event-system-integrated-test
  (:use :common-lisp)
  (:export #:run-event-system-tests #:run-simple-event-system-tests))

(in-package :daifugo-event-system-integrated-test)

;;; ==========================================
;;; イベントシステム基本機能テスト
;;; ==========================================

(defun test-event-system-creation ()
  "イベントシステムの作成テスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    (and event-system
         (daifugo-event-system:event-system-p event-system)
         (daifugo-event-system:is-event-system-active-p event-system)
         (daifugo-event-system:get-event-system-version event-system))))

(defun test-event-listener-registration ()
  "イベントリスナー登録テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (listener-called nil))
    (let ((listener-id (daifugo-event-system:register-event-listener 
                        event-system 
                        :game-state-changed
                        (lambda (event-data)
                          (setf listener-called event-data)))))
      (and listener-id
           (daifugo-event-system:is-listener-registered-p event-system listener-id)
           (daifugo-event-system:get-listener-count event-system :game-state-changed)))))

(defun test-basic-event-emission ()
  "基本的なイベント発行テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (received-data nil))
    ;; リスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :card-played
     (lambda (data) (setf received-data data)))
    ;; イベント発行
    (let ((result (daifugo-event-system:emit-event 
                   event-system 
                   :card-played 
                   (list :player-id 1 :card "3H"))))
      (and result
           received-data
           (= (getf received-data :player-id) 1)
           (string= (getf received-data :card) "3H")))))

(defun test-event-listener-unregistration ()
  "イベントリスナー解除テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (call-count 0))
    ;; リスナー登録
    (let ((listener-id (daifugo-event-system:register-event-listener 
                        event-system 
                        :turn-end
                        (lambda (data) (incf call-count)))))
      ;; イベント発行（1回目）
      (daifugo-event-system:emit-event event-system :turn-end nil)
      ;; リスナー解除
      (daifugo-event-system:unregister-event-listener event-system listener-id)
      ;; イベント発行（2回目）
      (daifugo-event-system:emit-event event-system :turn-end nil)
      ;; 1回目だけ呼び出されているか確認
      (= call-count 1))))

(defun test-multiple-listeners-same-event ()
  "同一イベントに対する複数リスナーテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (count1 0)
        (count2 0)
        (count3 0))
    ;; 複数リスナー登録
    (daifugo-event-system:register-event-listener 
     event-system :game-end (lambda (data) (incf count1)))
    (daifugo-event-system:register-event-listener 
     event-system :game-end (lambda (data) (incf count2)))
    (daifugo-event-system:register-event-listener 
     event-system :game-end (lambda (data) (incf count3)))
    ;; イベント発行
    (daifugo-event-system:emit-event event-system :game-end nil)
    ;; 全リスナーが呼び出されたか確認
    (and (= count1 1) (= count2 1) (= count3 1))))

;;; ==========================================
;;; イベントタイプ・カテゴリテスト
;;; ==========================================

(defun test-game-lifecycle-events ()
  "ゲームライフサイクルイベントテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (events-received '()))
    ;; ライフサイクルイベントリスナー登録
    (dolist (event-type '(:game-created :game-started :game-paused :game-ended))
      (daifugo-event-system:register-event-listener 
       event-system 
       event-type
       (lambda (data) (push event-type events-received))))
    ;; 各イベント発行
    (daifugo-event-system:emit-event event-system :game-created (list :game-id "test-001"))
    (daifugo-event-system:emit-event event-system :game-started (list :timestamp (get-universal-time)))
    (daifugo-event-system:emit-event event-system :game-paused (list :reason "user-request"))
    (daifugo-event-system:emit-event event-system :game-ended (list :winner "Player1"))
    ;; 全イベントが受信されたか確認
    (= (length events-received) 4)))

(defun test-player-action-events ()
  "プレイヤーアクションイベントテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (action-log '()))
    ;; アクションイベントリスナー登録
    (dolist (action '(:card-played :turn-passed :hand-revealed :revolution-triggered))
      (daifugo-event-system:register-event-listener 
       event-system 
       action
       (lambda (data) (push (list action data) action-log))))
    ;; 各アクション発行
    (daifugo-event-system:emit-event event-system :card-played (list :player 0 :cards '("3H")))
    (daifugo-event-system:emit-event event-system :turn-passed (list :player 1))
    (daifugo-event-system:emit-event event-system :hand-revealed (list :player 2 :cards '("JH" "QS")))
    (daifugo-event-system:emit-event event-system :revolution-triggered (list :trigger-player 3))
    ;; 全アクションが記録されたか確認
    (= (length action-log) 4)))

(defun test-rule-system-events ()
  "ルールシステムイベントテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (rule-events '()))
    ;; ルールイベントリスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :rule-applied
     (lambda (data) (push data rule-events)))
    ;; 各ルールイベント発行
    (daifugo-event-system:emit-event event-system :rule-applied (list :rule "kakumei" :effect "strength-inverted"))
    (daifugo-event-system:emit-event event-system :rule-applied (list :rule "8kiri" :effect "field-cleared"))
    (daifugo-event-system:emit-event event-system :rule-applied (list :rule "kaidan" :effect "sequence-played"))
    ;; ルールイベントが記録されたか確認
    (= (length rule-events) 3)))

(defun test-error-warning_events ()
  "エラー・警告イベントテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (error-count 0)
        (warning-count 0))
    ;; エラー・警告リスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :error
     (lambda (data) (incf error-count)))
    (daifugo-event-system:register-event-listener 
     event-system 
     :warning
     (lambda (data) (incf warning-count)))
    ;; イベント発行
    (daifugo-event-system:emit-event event-system :error (list :message "Invalid card play"))
    (daifugo-event-system:emit-event event-system :warning (list :message "Slow response"))
    (daifugo-event-system:emit-event event-system :error (list :message "Connection lost"))
    ;; カウント確認
    (and (= error-count 2) (= warning-count 1))))

;;; ==========================================
;;; イベントフィルタリング・優先度テスト
;;; ==========================================

(defun test-event-filtering ()
  "イベントフィルタリングテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (filtered-events '())
        (all-events '()))
    ;; フィルター付きリスナー登録
    (daifugo-event-system:register-filtered-listener 
     event-system 
     :card-played
     (lambda (data) (push data filtered-events))
     (lambda (data) (= (getf data :player-id) 1)))  ; Player1のイベントのみ
    ;; 全イベントリスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :card-played
     (lambda (data) (push data all-events)))
    ;; 複数プレイヤーのイベント発行
    (daifugo-event-system:emit-event event-system :card-played (list :player-id 0 :card "3H"))
    (daifugo-event-system:emit-event event-system :card-played (list :player-id 1 :card "4S"))
    (daifugo-event-system:emit-event event-system :card-played (list :player-id 2 :card "5D"))
    ;; フィルタリング結果確認
    (and (= (length all-events) 3)
         (= (length filtered-events) 1))))

(defun test-event-priority ()
  "イベント優先度テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (execution-order '()))
    ;; 異なる優先度のリスナー登録
    (daifugo-event-system:register-prioritized-listener 
     event-system 
     :game-state-changed
     (lambda (data) (push :low-priority execution-order))
     :priority 10)
    (daifugo-event-system:register-prioritized-listener 
     event-system 
     :game-state-changed
     (lambda (data) (push :high-priority execution-order))
     :priority 90)
    (daifugo-event-system:register-prioritized-listener 
     event-system 
     :game-state-changed
     (lambda (data) (push :medium-priority execution-order))
     :priority 50)
    ;; イベント発行
    (daifugo-event-system:emit-event event-system :game-state-changed nil)
    ;; 優先度順に実行されたか確認（高→中→低）
    (equal execution-order '(:low-priority :medium-priority :high-priority))))

(defun test-event-propagation_control ()
  "イベント伝播制御テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (listener1-called nil)
        (listener2-called nil))
    ;; リスナー登録（1つ目は伝播停止）
    (daifugo-event-system:register-event-listener 
     event-system 
     :critical-error
     (lambda (data)
       (setf listener1-called t)
       (daifugo-event-system:stop-event-propagation)))
    ;; リスナー登録（2つ目）
    (daifugo-event-system:register-event-listener 
     event-system 
     :critical-error
     (lambda (data) (setf listener2-called t)))
    ;; イベント発行
    (daifugo-event-system:emit-event event-system :critical-error (list :severity "fatal"))
    ;; 1つ目だけ実行され、2つ目は実行されない
    (and listener1-called (not listener2-called))))

;;; ==========================================
;;; イベント履歴・ログ機能テスト
;;; ==========================================

(defun test-event-history_logging ()
  "イベント履歴ログテスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    ;; 履歴記録有効化
    (daifugo-event-system:enable-event-history event-system)
    ;; 複数イベント発行
    (daifugo-event-system:emit-event event-system :game-started (list :timestamp (get-universal-time)))
    (daifugo-event-system:emit-event event-system :card-played (list :player 0 :card "3H"))
    (daifugo-event-system:emit-event event-system :turn-passed (list :player 1))
    ;; 履歴確認
    (let ((history (daifugo-event-system:get-event-history event-system)))
      (and history
           (= (length history) 3)
           (daifugo-event-system:find-events-by-type history :card-played)
           (daifugo-event-system:find-events-by-player history 0)))))

(defun test-event-history_filtering ()
  "イベント履歴フィルタリングテスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    ;; 履歴記録有効化
    (daifugo-event-system:enable-event-history event-system)
    ;; 大量イベント発行
    (dotimes (i 10)
      (daifugo-event-system:emit-event event-system :card-played (list :player (mod i 4) :card (format nil "~AH" (+ i 3)))))
    ;; フィルタリングテスト
    (let ((history (daifugo-event-system:get-event-history event-system))
          (player0-events (daifugo-event-system:filter-events-by-player 
                           (daifugo-event-system:get-event-history event-system) 0))
          (recent-events (daifugo-event-system:get-recent-events event-system 5)))
      (and (= (length history) 10)
           (= (length player0-events) 3)  ; Player 0のイベント数
           (= (length recent-events) 5)))))

(defun test-event_replay ()
  "イベントリプレイテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (replay-events '()))
    ;; 履歴記録有効化
    (daifugo-event-system:enable-event-history event-system)
    ;; イベント発行
    (daifugo-event-system:emit-event event-system :game-started nil)
    (daifugo-event-system:emit-event event-system :card-played (list :player 0 :card "3H"))
    (daifugo-event-system:emit-event event-system :game-ended nil)
    ;; リプレイリスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :replayed-event
     (lambda (data) (push data replay-events)))
    ;; イベントリプレイ実行
    (daifugo-event-system:replay-events event-system (daifugo-event-system:get-event-history event-system))
    ;; リプレイ結果確認
    (= (length replay-events) 3)))

;;; ==========================================
;;; 非同期イベント処理テスト
;;; ==========================================

(defun test-asynchronous_event_processing ()
  "非同期イベント処理テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (processed-count 0))
    ;; 非同期処理有効化
    (daifugo-event-system:enable-async-processing event-system)
    ;; 非同期リスナー登録
    (daifugo-event-system:register-async-listener 
     event-system 
     :heavy-computation
     (lambda (data) 
       (sleep 0.1)  ; 重い処理をシミュレート
       (incf processed-count)))
    ;; 複数イベント発行
    (dotimes (i 5)
      (daifugo-event-system:emit-event event-system :heavy-computation (list :task-id i)))
    ;; 処理完了を待つ
    (daifugo-event-system:wait-for-async-completion event-system)
    ;; 全イベントが処理されたか確認
    (= processed-count 5)))

(defun test-event_queue_management ()
  "イベントキュー管理テスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    ;; キュー処理一時停止
    (daifugo-event-system:pause-event-processing event-system)
    ;; イベント発行（キューに蓄積される）
    (dotimes (i 3)
      (daifugo-event-system:emit-event event-system :queued-event (list :id i)))
    ;; キューサイズ確認
    (let ((queue-size (daifugo-event-system:get-event-queue-size event-system)))
      (and (= queue-size 3)
           ;; 処理再開
           (progn
             (daifugo-event-system:resume-event-processing event-system)
             ;; キューが空になることを確認
             (= (daifugo-event-system:get-event-queue-size event-system) 0))))))

(defun test-event_batch_processing ()
  "イベントバッチ処理テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (batch-processed 0))
    ;; バッチ処理リスナー登録
    (daifugo-event-system:register-batch-listener 
     event-system 
     :batch-update
     (lambda (events) (incf batch-processed (length events)))
     :batch-size 3)
    ;; 個別イベント発行
    (dotimes (i 5)
      (daifugo-event-system:emit-event event-system :batch-update (list :update-id i)))
    ;; バッチ処理強制実行
    (daifugo-event-system:flush-batch-events event-system)
    ;; 全イベントがバッチ処理されたか確認
    (= batch-processed 5)))

;;; ==========================================
;;; イベントバス・ブロードキャストテスト
;;; ==========================================

(defun test-event_broadcasting ()
  "イベントブロードキャストテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (subscriber-count 0))
    ;; 複数サブスクライバー登録
    (dotimes (i 5)
      (daifugo-event-system:subscribe-to-broadcast 
       event-system 
       (lambda (event-type data) (incf subscriber-count))))
    ;; ブロードキャストイベント発行
    (daifugo-event-system:broadcast-event event-system :global-announcement (list :message "System maintenance"))
    ;; 全サブスクライバーが受信したか確認
    (= subscriber-count 5)))

(defun test-channel_based_events ()
  "チャンネルベースイベントテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (game-channel-events 0)
        (admin-channel-events 0))
    ;; チャンネル作成
    (daifugo-event-system:create-event-channel event-system :game-events)
    (daifugo-event-system:create-event-channel event-system :admin-events)
    ;; チャンネル別リスナー登録
    (daifugo-event-system:subscribe-to-channel 
     event-system 
     :game-events
     (lambda (data) (incf game-channel-events)))
    (daifugo-event-system:subscribe-to-channel 
     event-system 
     :admin-events
     (lambda (data) (incf admin-channel-events)))
    ;; チャンネル別イベント発行
    (daifugo-event-system:emit-to-channel event-system :game-events :card-played (list :player 0))
    (daifugo-event-system:emit-to-channel event-system :game-events :turn-ended nil)
    (daifugo-event-system:emit-to-channel event-system :admin-events :user-banned (list :user-id 123))
    ;; チャンネル別カウント確認
    (and (= game-channel-events 2) (= admin-channel-events 1))))

(defun test-cross_system_events ()
  "システム間イベントテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (external-events '()))
    ;; 外部システム連携設定
    (daifugo-event-system:setup-external-integration 
     event-system
     (lambda (event-type data)
       (push (list event-type data) external-events)))
    ;; 外部システム向けイベント発行
    (daifugo-event-system:emit-external-event event-system :game-completed (list :game-id "test-001"))
    (daifugo-event-system:emit-external-event event-system :player-joined (list :player-name "Alice"))
    ;; 外部システムにイベントが送信されたか確認
    (= (length external-events) 2)))

;;; ==========================================
;;; イベント統計・分析テスト
;;; ==========================================

(defun test-event_statistics ()
  "イベント統計テスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    ;; 統計記録有効化
    (daifugo-event-system:enable-event-statistics event-system)
    ;; 複数イベント発行
    (dotimes (i 10)
      (daifugo-event-system:emit-event event-system :card-played (list :player (mod i 4))))
    (dotimes (i 5)
      (daifugo-event-system:emit-event event-system :turn-passed (list :player (mod i 4))))
    ;; 統計データ取得
    (let ((stats (daifugo-event-system:get-event-statistics event-system)))
      (and stats
           (= (daifugo-event-system:get-event-count stats :card-played) 10)
           (= (daifugo-event-system:get-event-count stats :turn-passed) 5)
           (= (daifugo-event-system:get-total-events stats) 15)))))

(defun test-event_performance_metrics ()
  "イベント性能メトリクステスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    ;; 性能測定有効化
    (daifugo-event-system:enable-performance-monitoring event-system)
    ;; リスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :performance-test
     (lambda (data) (sleep 0.01)))  ; 処理時間をシミュレート
    ;; 複数イベント発行
    (dotimes (i 100)
      (daifugo-event-system:emit-event event-system :performance-test nil))
    ;; 性能メトリクス取得
    (let ((metrics (daifugo-event-system:get-performance-metrics event-system)))
      (and metrics
           (> (daifugo-event-system:get-average-processing-time metrics) 0)
           (= (daifugo-event-system:get-total-processed-events metrics) 100)))))

(defun test-event_analysis ()
  "イベント分析テスト"
  (let ((event-system (daifugo-event-system:create-event-system)))
    ;; 履歴記録有効化
    (daifugo-event-system:enable-event-history event-system)
    ;; ゲームシミュレーション
    (daifugo-event-system:emit-event event-system :game-started nil)
    (dotimes (player 4)
      (dotimes (turn 5)
        (daifugo-event-system:emit-event event-system :card-played (list :player player :turn turn))))
    (daifugo-event-system:emit-event event-system :game-ended (list :winner 0))
    ;; 分析実行
    (let ((analysis (daifugo-event-system:analyze-event-patterns event-system)))
      (and analysis
           (daifugo-event-system:get-player-activity-level analysis 0)
           (daifugo-event-system:get-game-duration-estimate analysis)
           (daifugo-event-system:get-event-frequency analysis :card-played)))))

;;; ==========================================
;;; エラーハンドリング・信頼性テスト
;;; ==========================================

(defun test-listener_error_handling ()
  "リスナーエラーハンドリングテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (successful-calls 0)
        (error-count 0))
    ;; エラーハンドラー設定
    (daifugo-event-system:set-error-handler 
     event-system
     (lambda (error listener-id) (incf error-count)))
    ;; 正常リスナーとエラーリスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :test-event
     (lambda (data) (incf successful-calls)))
    (daifugo-event-system:register-event-listener 
     event-system 
     :test-event
     (lambda (data) (error "Simulated error")))
    (daifugo-event-system:register-event-listener 
     event-system 
     :test-event
     (lambda (data) (incf successful-calls)))
    ;; イベント発行
    (daifugo-event-system:emit-event event-system :test-event nil)
    ;; エラーハンドリング確認
    (and (= successful-calls 2)
         (= error-count 1))))

(defun test_event_system_resilience ()
  "イベントシステム回復力テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (processed-events 0))
    ;; リスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :resilience-test
     (lambda (data) (incf processed-events)))
    ;; システム負荷テスト
    (dotimes (i 1000)
      (daifugo-event-system:emit-event event-system :resilience-test (list :load-test-id i)))
    ;; システム状態確認
    (let ((system-health (daifugo-event-system:get-system-health event-system)))
      (and (= processed-events 1000)
           (daifugo-event-system:is-system-healthy-p system-health)
           (< (daifugo-event-system:get-memory-usage system-health) 100000000)))))  ; 100MB以下

;;; ==========================================
;;; 統合テスト
;;; ==========================================

(defun test-complete_game_event_flow ()
  "完全なゲームイベントフローテスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (game-events '()))
    ;; ゲーム全体のイベントリスナー登録
    (daifugo-event-system:register-event-listener 
     event-system 
     :any
     (lambda (data) (push data game-events)))
    ;; 完全なゲームフロー実行
    (daifugo-event-system:emit-event event-system :game-created (list :game-id "integration-test"))
    (daifugo-event-system:emit-event event-system :players-joined (list :count 4))
    (daifugo-event-system:emit-event event-system :cards-dealt nil)
    (daifugo-event-system:emit-event event-system :game-started nil)
    ;; ゲームプレイシミュレーション
    (dotimes (round 5)
      (dotimes (player 4)
        (daifugo-event-system:emit-event event-system :card-played (list :player player :round round))))
    (daifugo-event-system:emit-event event-system :game-ended (list :winner 0))
    ;; イベントフロー確認
    (> (length game-events) 20)))

;;; ==========================================
;;; 簡易テスト関数（詳細バージョン）
;;; ==========================================

;; 簡易イベントシステム構造
(defstruct simple-event-system
  active-p
  version
  listeners
  history
  statistics)

(defstruct simple-event-listener
  id
  event-type
  callback
  active-p)

;; 基本イベントシステム
(defun create-simple-event-system ()
  "簡易イベントシステムを作成"
  (make-simple-event-system :active-p t
                            :version "1.0.0"
                            :listeners (make-hash-table :test 'equal)
                            :history nil
                            :statistics (make-hash-table :test 'equal)))

(defun simple-register-event-listener (event-system event-type callback)
  "簡易イベントリスナー登録"
  (when (simple-event-system-active-p event-system)
    (let ((listener-id (format nil "listener-~A" (random 1000000))))
      (let ((listener (make-simple-event-listener :id listener-id
                                                  :event-type event-type
                                                  :callback callback
                                                  :active-p t)))
        (setf (gethash listener-id (simple-event-system-listeners event-system)) listener)
        listener-id))))

(defun simple-emit-event (event-system event-type data)
  "簡易イベント発行"
  (when (simple-event-system-active-p event-system)
    ;; 履歴記録
    (push (list event-type data (get-universal-time)) (simple-event-system-history event-system))
    ;; 統計更新
    (incf (gethash event-type (simple-event-system-statistics event-system) 0))
    ;; リスナー実行
    (maphash (lambda (id listener)
               (declare (ignore id))
               (when (and (simple-event-listener-active-p listener)
                         (or (eq (simple-event-listener-event-type listener) event-type)
                             (eq (simple-event-listener-event-type listener) :any)))
                 (funcall (simple-event-listener-callback listener) data)))
             (simple-event-system-listeners event-system))
    t))

(defun simple-unregister-event-listener (event-system listener-id)
  "簡易イベントリスナー解除"
  (remhash listener-id (simple-event-system-listeners event-system)))

(defun simple-get-listener-count (event-system event-type)
  "簡易リスナー数取得"
  (let ((count 0))
    (maphash (lambda (id listener)
               (declare (ignore id))
               (when (and (simple-event-listener-active-p listener)
                         (or (eq event-type :any)
                             (eq (simple-event-listener-event-type listener) event-type)))
                 (incf count)))
             (simple-event-system-listeners event-system))
    count))

(defun simple-get-event-history (event-system)
  "簡易イベント履歴取得"
  (simple-event-system-history event-system))

(defun simple-get-event-statistics (event-system)
  "簡易イベント統計取得"
  (simple-event-system-statistics event-system))

;; 簡易テスト関数群（詳細バージョン）
(defun test-simple-event-system-creation-detailed ()
  "イベントシステム作成テスト（詳細）"
  (let ((event-system (create-simple-event-system)))
    (and event-system
         (simple-event-system-p event-system)
         (simple-event-system-active-p event-system)
         (string= (simple-event-system-version event-system) "1.0.0"))))

(defun test-simple-listener-registration-detailed ()
  "リスナー登録テスト（詳細）"
  (let ((event-system (create-simple-event-system))
        (listener-called nil))
    (let ((listener-id (simple-register-event-listener 
                        event-system 
                        :test-event
                        (lambda (data) (setf listener-called data)))))
      (and listener-id
           (stringp listener-id)
           (= (simple-get-listener-count event-system :test-event) 1)))))

(defun test-simple-event-emission-detailed ()
  "イベント発行テスト（詳細）"
  (let ((event-system (create-simple-event-system))
        (received-data nil))
    ;; リスナー登録
    (simple-register-event-listener 
     event-system 
     :card-played
     (lambda (data) (setf received-data data)))
    ;; イベント発行
    (simple-emit-event event-system :card-played (list :player-id 1 :card "3H"))
    ;; 確認
    (and received-data
         (= (getf received-data :player-id) 1)
         (string= (getf received-data :card) "3H"))))

(defun test-simple-listener-unregistration-detailed ()
  "リスナー解除テスト（詳細）"
  (let ((event-system (create-simple-event-system))
        (call-count 0))
    ;; リスナー登録
    (let ((listener-id (simple-register-event-listener 
                        event-system 
                        :test-event
                        (lambda (data) (incf call-count)))))
      ;; イベント発行（1回目）
      (simple-emit-event event-system :test-event nil)
      ;; リスナー解除
      (simple-unregister-event-listener event-system listener-id)
      ;; イベント発行（2回目）
      (simple-emit-event event-system :test-event nil)
      ;; 1回だけ呼び出されているか確認
      (= call-count 1))))

(defun test-simple-multiple-listeners-detailed ()
  "複数リスナーテスト（詳細）"
  (let ((event-system (create-simple-event-system))
        (count1 0)
        (count2 0))
    ;; 複数リスナー登録
    (simple-register-event-listener 
     event-system :multi-test (lambda (data) (incf count1)))
    (simple-register-event-listener 
     event-system :multi-test (lambda (data) (incf count2)))
    ;; イベント発行
    (simple-emit-event event-system :multi-test nil)
    ;; 両方が呼び出されたか確認
    (and (= count1 1) (= count2 1))))

(defun test-simple-event-history-detailed ()
  "イベント履歴テスト（詳細）"
  (let ((event-system (create-simple-event-system)))
    ;; 複数イベント発行
    (simple-emit-event event-system :game-started nil)
    (simple-emit-event event-system :card-played (list :player 0))
    (simple-emit-event event-system :game-ended nil)
    ;; 履歴確認
    (let ((history (simple-get-event-history event-system)))
      (= (length history) 3))))

(defun test-simple-event-statistics-detailed ()
  "イベント統計テスト（詳細）"
  (let ((event-system (create-simple-event-system)))
    ;; 複数イベント発行
    (dotimes (i 5)
      (simple-emit-event event-system :card-played (list :player i)))
    (dotimes (i 3)
      (simple-emit-event event-system :turn-passed (list :player i)))
    ;; 統計確認
    (let ((stats (simple-get-event-statistics event-system)))
      (and (= (gethash :card-played stats) 5)
           (= (gethash :turn-passed stats) 3)))))

(defun test-simple-any-event-listener-detailed ()
  "汎用イベントリスナーテスト（詳細）"
  (let ((event-system (create-simple-event-system))
        (any-events 0))
    ;; 汎用リスナー登録
    (simple-register-event-listener 
     event-system 
     :any
     (lambda (data) (incf any-events)))
    ;; 複数タイプのイベント発行
    (simple-emit-event event-system :card-played nil)
    (simple-emit-event event-system :turn-passed nil)
    (simple-emit-event event-system :game-ended nil)
    ;; 全イベントが受信されたか確認
    (= any-events 3)))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-event-system-tests ()
  "イベントシステムの全テストを実行"
  (format t "~%=== イベントシステム（event-system.lisp）テスト実行 ===~%")
  
  (let ((tests '((\"イベントシステム作成\" . test-event-system-creation)
                 (\"イベントリスナー登録\" . test-event-listener-registration)
                 (\"基本イベント発行\" . test-basic-event-emission)
                 (\"イベントリスナー解除\" . test-event-listener-unregistration)
                 (\"複数リスナー同一イベント\" . test-multiple-listeners-same-event)
                 (\"ゲームライフサイクルイベント\" . test-game-lifecycle-events)
                 (\"プレイヤーアクションイベント\" . test-player-action-events)
                 (\"ルールシステムイベント\" . test-rule-system-events)
                 (\"エラー・警告イベント\" . test-error-warning_events)
                 (\"イベントフィルタリング\" . test-event-filtering)
                 (\"イベント優先度\" . test-event-priority)
                 (\"イベント伝播制御\" . test-event-propagation_control)
                 (\"イベント履歴ログ\" . test-event-history_logging)
                 (\"イベント履歴フィルタリング\" . test-event-history_filtering)
                 (\"イベントリプレイ\" . test_event_replay)
                 (\"非同期イベント処理\" . test-asynchronous_event_processing)
                 (\"イベントキュー管理\" . test-event_queue_management)
                 (\"イベントバッチ処理\" . test-event_batch_processing)
                 (\"イベントブロードキャスト\" . test-event_broadcasting)
                 (\"チャンネルベースイベント\" . test-channel_based_events)
                 (\"システム間イベント\" . test-cross_system_events)
                 (\"イベント統計\" . test-event_statistics)
                 (\"イベント性能メトリクス\" . test-event_performance_metrics)
                 (\"イベント分析\" . test-event_analysis)
                 (\"リスナーエラーハンドリング\" . test-listener_error_handling)
                 (\"イベントシステム回復力\" . test_event_system_resilience)
                 (\"完全ゲームイベントフロー\" . test-complete_game_event_flow)))
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

(defun run-simple-event-system-tests ()
  "簡易イベントシステムテスト実行"
  (format t "~%=== 簡易イベントシステムテスト実行 ===~%")
  
  (let ((tests '(("システム作成（詳細）" . test-simple-event-system-creation-detailed)
                 ("リスナー登録（詳細）" . test-simple-listener-registration-detailed)
                 ("イベント発行（詳細）" . test-simple-event-emission-detailed)
                 ("リスナー解除（詳細）" . test-simple-listener-unregistration-detailed)
                 ("複数リスナー（詳細）" . test-simple-multiple-listeners-detailed)
                 ("イベント履歴（詳細）" . test-simple-event-history-detailed)
                 ("イベント統計（詳細）" . test-simple-event-statistics-detailed)
                 ("汎用リスナー（詳細）" . test-simple-any-event-listener-detailed)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (if (funcall test-func)
            (progn
              (format t "合格~%")
              (incf passed))
            (progn
              (format t "失敗~%")
              (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%~%" passed failed)
    (= failed 0)))

;; テスト実行
(format t "~%イベントシステム（event-system.lisp）のテストケース準備完了~%")
(format t "詳細テスト: (daifugo-event-system-integrated-test:run-event-system-tests)~%")
(format t "簡易テスト: (daifugo-event-system-integrated-test:run-simple-event-system-tests)~%")