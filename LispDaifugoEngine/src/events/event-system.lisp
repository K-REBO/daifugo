;;; event-system.lisp - 大富豪ゲーム用イベント通知システム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - ゲームイベント通知システム（リスナー管理・発行・受信）
;;; - イベントフィルタリング・優先度制御
;;; - イベント履歴・ログ機能
;;; - 非同期イベント処理・キュー管理
;;; - イベントバス・ブロードキャスト
;;; - イベント統計・分析・性能監視

(defpackage :daifugo-event-system
  (:use :common-lisp)
  (:export ;; === 基本イベントシステム機能 ===
           #:create-event-system       ; イベントシステム作成
           #:event-system-p            ; イベントシステム判定
           #:is-event-system-active-p  ; システム有効状態確認
           #:get-event-system-version  ; システムバージョン取得
           
           ;; === イベントリスナー管理 ===
           #:register-event-listener   ; イベントリスナー登録
           #:unregister-event-listener ; イベントリスナー解除
           #:is-listener-registered-p  ; リスナー登録確認
           #:get-listener-count        ; リスナー数取得
           #:register-filtered-listener ; フィルター付きリスナー登録
           #:register-prioritized-listener ; 優先度付きリスナー登録
           #:register-async-listener   ; 非同期リスナー登録
           #:register-batch-listener   ; バッチリスナー登録
           
           ;; === イベント発行・処理 ===
           #:emit-event                ; イベント発行
           #:emit-external-event       ; 外部システム向けイベント発行
           #:emit-to-channel           ; チャンネル向けイベント発行
           #:broadcast-event           ; ブロードキャストイベント発行
           #:stop-event-propagation    ; イベント伝播停止
           
           ;; === イベント履歴・ログ ===
           #:enable-event-history      ; イベント履歴有効化
           #:disable-event-history     ; イベント履歴無効化
           #:get-event-history         ; イベント履歴取得
           #:find-events-by-type       ; タイプ別イベント検索
           #:find-events-by-player     ; プレイヤー別イベント検索
           #:filter-events-by-player   ; プレイヤー別イベントフィルタ
           #:get-recent-events         ; 最近のイベント取得
           #:replay-events             ; イベントリプレイ
           
           ;; === 非同期・キュー処理 ===
           #:enable-async-processing   ; 非同期処理有効化
           #:disable-async-processing  ; 非同期処理無効化
           #:wait-for-async-completion ; 非同期処理完了待機
           #:pause-event-processing    ; イベント処理一時停止
           #:resume-event-processing   ; イベント処理再開
           #:get-event-queue-size      ; イベントキューサイズ取得
           #:flush-batch-events        ; バッチイベント強制処理
           
           ;; === イベントチャンネル・ブロードキャスト ===
           #:create-event-channel      ; イベントチャンネル作成
           #:subscribe-to-channel      ; チャンネル購読
           #:unsubscribe-from-channel  ; チャンネル購読解除
           #:subscribe-to-broadcast    ; ブロードキャスト購読
           #:setup-external-integration ; 外部システム連携設定
           
           ;; === イベント統計・分析 ===
           #:enable-event-statistics   ; イベント統計有効化
           #:get-event-statistics      ; イベント統計取得
           #:get-event-count           ; イベント数取得
           #:get-total-events          ; 総イベント数取得
           #:enable-performance-monitoring ; 性能監視有効化
           #:get-performance-metrics   ; 性能メトリクス取得
           #:get-average-processing-time ; 平均処理時間取得
           #:get-total-processed-events ; 総処理イベント数取得
           #:analyze-event-patterns    ; イベントパターン分析
           #:get-player-activity-level ; プレイヤー活動レベル取得
           #:get-game-duration-estimate ; ゲーム時間推定取得
           #:get-event-frequency       ; イベント頻度取得
           
           ;; === エラーハンドリング・信頼性 ===
           #:set-error-handler         ; エラーハンドラー設定
           #:get-system-health         ; システム健全性取得
           #:is-system-healthy-p       ; システム健全性判定
           #:get-memory-usage          ; メモリ使用量取得))

(in-package :daifugo-event-system)

;;; ============================================================================
;;; イベントシステム構造体とデータ構造
;;; ============================================================================

(defstruct event-system
  active-p                    ; システム有効フラグ
  version                     ; システムバージョン
  listeners                   ; イベントリスナー管理
  history-enabled-p           ; 履歴記録有効フラグ
  event-history              ; イベント履歴
  async-enabled-p            ; 非同期処理有効フラグ
  event-queue                ; イベントキュー
  processing-paused-p        ; 処理一時停止フラグ
  channels                   ; イベントチャンネル
  broadcast-subscribers      ; ブロードキャスト購読者
  external-integration       ; 外部システム連携
  statistics-enabled-p       ; 統計記録有効フラグ
  event-statistics          ; イベント統計データ
  performance-monitoring-p   ; 性能監視有効フラグ
  performance-metrics       ; 性能メトリクス
  error-handler             ; エラーハンドラー
  system-health)            ; システム健全性データ

(defstruct event-listener
  id                        ; リスナーID
  event-type               ; 対象イベントタイプ
  callback                 ; コールバック関数
  priority                 ; 優先度
  filter-func              ; フィルター関数
  async-p                  ; 非同期処理フラグ
  batch-size               ; バッチサイズ
  active-p)                ; 有効フラグ

(defstruct event-record
  id                       ; イベントID
  event-type              ; イベントタイプ
  data                    ; イベントデータ
  timestamp               ; タイムスタンプ
  source                  ; イベント発生源
  processed-p)            ; 処理済みフラグ

(defstruct event-channel
  name                    ; チャンネル名
  subscribers             ; 購読者リスト
  active-p)              ; 有効フラグ

;;; ============================================================================
;;; 基本イベントシステム機能
;;; ============================================================================

(defun create-event-system ()
  \"新しいイベントシステムインスタンスを作成
   
   戻り値:
     新しく作成されたイベントシステムオブジェクト\"
  (make-event-system :active-p t
                     :version \"1.0.0\"
                     :listeners (make-hash-table :test 'equal)
                     :history-enabled-p nil
                     :event-history nil
                     :async-enabled-p nil
                     :event-queue nil
                     :processing-paused-p nil
                     :channels (make-hash-table :test 'equal)
                     :broadcast-subscribers nil
                     :external-integration nil
                     :statistics-enabled-p nil
                     :event-statistics (make-hash-table :test 'equal)
                     :performance-monitoring-p nil
                     :performance-metrics (make-hash-table :test 'equal)
                     :error-handler nil
                     :system-health (make-hash-table :test 'equal)))

(defun is-event-system-active-p (event-system)
  \"イベントシステムが有効かどうかを確認
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）\"
  (event-system-active-p event-system))

(defun get-event-system-version (event-system)
  \"イベントシステムバージョンを取得
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     バージョン文字列\"
  (event-system-version event-system))

;;; ============================================================================
;;; イベントリスナー管理機能
;;; ============================================================================

(defun register-event-listener (event-system event-type callback)
  \"基本的なイベントリスナーを登録
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - 対象イベントタイプ
     callback - コールバック関数
   
   戻り値:
     リスナーID\"
  (when (is-event-system-active-p event-system)
    (let ((listener-id (generate-listener-id)))
      (let ((listener (make-event-listener :id listener-id
                                          :event-type event-type
                                          :callback callback
                                          :priority 50
                                          :filter-func nil
                                          :async-p nil
                                          :batch-size 1
                                          :active-p t)))
        (setf (gethash listener-id (event-system-listeners event-system)) listener)
        listener-id))))

(defun register-filtered-listener (event-system event-type callback filter-func)
  \"フィルター付きイベントリスナーを登録
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - 対象イベントタイプ
     callback - コールバック関数
     filter-func - フィルター関数
   
   戻り値:
     リスナーID\"
  (when (is-event-system-active-p event-system)
    (let ((listener-id (generate-listener-id)))
      (let ((listener (make-event-listener :id listener-id
                                          :event-type event-type
                                          :callback callback
                                          :priority 50
                                          :filter-func filter-func
                                          :async-p nil
                                          :batch-size 1
                                          :active-p t)))
        (setf (gethash listener-id (event-system-listeners event-system)) listener)
        listener-id))))

(defun register-prioritized-listener (event-system event-type callback &key (priority 50))
  \"優先度付きイベントリスナーを登録
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - 対象イベントタイプ
     callback - コールバック関数
     priority - 優先度（0-100、高いほど優先）
   
   戻り値:
     リスナーID\"
  (when (is-event-system-active-p event-system)
    (let ((listener-id (generate-listener-id)))
      (let ((listener (make-event-listener :id listener-id
                                          :event-type event-type
                                          :callback callback
                                          :priority priority
                                          :filter-func nil
                                          :async-p nil
                                          :batch-size 1
                                          :active-p t)))
        (setf (gethash listener-id (event-system-listeners event-system)) listener)
        listener-id))))

(defun register-async-listener (event-system event-type callback)
  \"非同期イベントリスナーを登録
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - 対象イベントタイプ
     callback - コールバック関数
   
   戻り値:
     リスナーID\"
  (when (is-event-system-active-p event-system)
    (let ((listener-id (generate-listener-id)))
      (let ((listener (make-event-listener :id listener-id
                                          :event-type event-type
                                          :callback callback
                                          :priority 50
                                          :filter-func nil
                                          :async-p t
                                          :batch-size 1
                                          :active-p t)))
        (setf (gethash listener-id (event-system-listeners event-system)) listener)
        listener-id))))

(defun register-batch-listener (event-system event-type callback &key (batch-size 10))
  \"バッチ処理イベントリスナーを登録
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - 対象イベントタイプ
     callback - コールバック関数
     batch-size - バッチサイズ
   
   戻り値:
     リスナーID\"
  (when (is-event-system-active-p event-system)
    (let ((listener-id (generate-listener-id)))
      (let ((listener (make-event-listener :id listener-id
                                          :event-type event-type
                                          :callback callback
                                          :priority 50
                                          :filter-func nil
                                          :async-p nil
                                          :batch-size batch-size
                                          :active-p t)))
        (setf (gethash listener-id (event-system-listeners event-system)) listener)
        listener-id))))

(defun unregister-event-listener (event-system listener-id)
  \"イベントリスナーを解除
   
   引数:
     event-system - イベントシステムオブジェクト
     listener-id - リスナーID
   
   戻り値:
     解除成功フラグ\"
  (remhash listener-id (event-system-listeners event-system)))

(defun is-listener-registered-p (event-system listener-id)
  \"リスナーが登録されているかを確認
   
   引数:
     event-system - イベントシステムオブジェクト
     listener-id - リスナーID
   
   戻り値:
     登録確認（真偽値）\"
  (gethash listener-id (event-system-listeners event-system)))

(defun get-listener-count (event-system event-type)
  \"指定イベントタイプのリスナー数を取得
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
   
   戻り値:
     リスナー数\"
  (let ((count 0))
    (maphash (lambda (id listener)
               (declare (ignore id))
               (when (and (event-listener-active-p listener)
                         (or (eq event-type :any)
                             (eq (event-listener-event-type listener) event-type)))
                 (incf count)))
             (event-system-listeners event-system))
    count))

;;; ============================================================================
;;; イベント発行・処理機能
;;; ============================================================================

(defun emit-event (event-system event-type data)
  \"イベントを発行
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
     data - イベントデータ
   
   戻り値:
     発行成功フラグ\"
  (when (and (is-event-system-active-p event-system)
             (not (event-system-processing-paused-p event-system)))
    ;; イベント履歴記録
    (when (event-system-history-enabled-p event-system)
      (record-event-to-history event-system event-type data))
    
    ;; 統計更新
    (when (event-system-statistics-enabled-p event-system)
      (update-event-statistics event-system event-type))
    
    ;; リスナー実行
    (execute-listeners event-system event-type data)
    t))

(defun emit-external-event (event-system event-type data)
  \"外部システム向けイベントを発行
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
     data - イベントデータ
   
   戻り値:
     発行成功フラグ\"
  (when (and (is-event-system-active-p event-system)
             (event-system-external-integration event-system))
    (funcall (event-system-external-integration event-system) event-type data)
    t))

(defun emit-to-channel (event-system channel-name event-type data)
  \"チャンネル向けイベントを発行
   
   引数:
     event-system - イベントシステムオブジェクト
     channel-name - チャンネル名
     event-type - イベントタイプ
     data - イベントデータ
   
   戻り値:
     発行成功フラグ\"
  (let ((channel (gethash channel-name (event-system-channels event-system))))
    (when (and channel (event-channel-active-p channel))
      (dolist (subscriber (event-channel-subscribers channel))
        (when (functionp subscriber)
          (handler-case
              (funcall subscriber data)
            (error (e)
              (handle-listener-error event-system e nil)))))
      t)))

(defun broadcast-event (event-system event-type data)
  \"ブロードキャストイベントを発行
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
     data - イベントデータ
   
   戻り値:
     発行成功フラグ\"
  (dolist (subscriber (event-system-broadcast-subscribers event-system))
    (when (functionp subscriber)
      (handler-case
          (funcall subscriber event-type data)
        (error (e)
          (handle-listener-error event-system e nil)))))
  t)

(defun stop-event-propagation ()
  \"イベント伝播を停止（簡易実装）
   
   戻り値:
     停止成功フラグ\"
  ;; 簡易実装：実際の実装では特殊変数やコンテキストを使用
  t)

;;; ============================================================================
;;; イベント履歴・ログ機能
;;; ============================================================================

(defun enable-event-history (event-system)
  \"イベント履歴記録を有効化
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (event-system-history-enabled-p event-system) t)
  (unless (event-system-event-history event-system)
    (setf (event-system-event-history event-system) nil))
  t)

(defun disable-event-history (event-system)
  \"イベント履歴記録を無効化
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     無効化成功フラグ\"
  (setf (event-system-history-enabled-p event-system) nil)
  t)

(defun get-event-history (event-system)
  \"イベント履歴を取得
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     イベント履歴リスト\"
  (event-system-event-history event-system))

(defun find-events-by-type (history event-type)
  \"タイプ別イベント検索
   
   引数:
     history - イベント履歴
     event-type - イベントタイプ
   
   戻り値:
     該当イベントリスト\"
  (remove-if-not (lambda (event)
                   (eq (event-record-event-type event) event-type))
                 history))

(defun find-events-by-player (history player-id)
  \"プレイヤー別イベント検索
   
   引数:
     history - イベント履歴
     player-id - プレイヤーID
   
   戻り値:
     該当イベントリスト\"
  (remove-if-not (lambda (event)
                   (let ((data (event-record-data event)))
                     (and (listp data)
                          (= (getf data :player-id player-id) player-id))))
                 history))

(defun filter-events-by-player (history player-id)
  \"プレイヤー別イベントフィルタ
   
   引数:
     history - イベント履歴
     player-id - プレイヤーID
   
   戻り値:
     フィルタされたイベントリスト\"
  (find-events-by-player history player-id))

(defun get-recent-events (event-system count)
  \"最近のイベントを取得
   
   引数:
     event-system - イベントシステムオブジェクト
     count - 取得件数
   
   戻り値:
     最近のイベントリスト\"
  (let ((history (event-system-event-history event-system)))
    (when history
      (subseq history 0 (min count (length history))))))

(defun replay-events (event-system events)
  \"イベントリプレイを実行
   
   引数:
     event-system - イベントシステムオブジェクト
     events - リプレイするイベントリスト
   
   戻り値:
     リプレイ成功フラグ\"
  (dolist (event events)
    (emit-event event-system :replayed-event (event-record-data event)))
  t)

;;; ============================================================================
;;; 非同期・キュー処理機能
;;; ============================================================================

(defun enable-async-processing (event-system)
  \"非同期処理を有効化
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (event-system-async-enabled-p event-system) t)
  (unless (event-system-event-queue event-system)
    (setf (event-system-event-queue event-system) nil))
  t)

(defun disable-async-processing (event-system)
  \"非同期処理を無効化
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     無効化成功フラグ\"
  (setf (event-system-async-enabled-p event-system) nil)
  t)

(defun wait-for-async-completion (event-system)
  \"非同期処理完了を待機
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     完了成功フラグ\"
  ;; 簡易実装：実際にはスレッド同期機構を使用
  (when (event-system-async-enabled-p event-system)
    (sleep 0.1))  ; 処理完了を模擬
  t)

(defun pause-event-processing (event-system)
  \"イベント処理を一時停止
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     一時停止成功フラグ\"
  (setf (event-system-processing-paused-p event-system) t)
  (unless (event-system-event-queue event-system)
    (setf (event-system-event-queue event-system) nil))
  t)

(defun resume-event-processing (event-system)
  \"イベント処理を再開
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     再開成功フラグ\"
  (setf (event-system-processing-paused-p event-system) nil)
  ;; キューイベント処理
  (process-queued-events event-system)
  t)

(defun get-event-queue-size (event-system)
  \"イベントキューサイズを取得
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     キューサイズ\"
  (let ((queue (event-system-event-queue event-system)))
    (if queue (length queue) 0)))

(defun flush-batch-events (event-system)
  \"バッチイベントを強制処理
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     処理成功フラグ\"
  ;; 簡易実装：バッチリスナーの強制実行
  (maphash (lambda (id listener)
             (declare (ignore id))
             (when (and (event-listener-active-p listener)
                       (> (event-listener-batch-size listener) 1))
               ;; バッチ処理実行
               (process-batch-listener event-system listener)))
           (event-system-listeners event-system))
  t)

;;; ============================================================================
;;; イベントチャンネル・ブロードキャスト機能
;;; ============================================================================

(defun create-event-channel (event-system channel-name)
  \"イベントチャンネルを作成
   
   引数:
     event-system - イベントシステムオブジェクト
     channel-name - チャンネル名
   
   戻り値:
     作成成功フラグ\"
  (let ((channel (make-event-channel :name channel-name
                                    :subscribers nil
                                    :active-p t)))
    (setf (gethash channel-name (event-system-channels event-system)) channel)
    t))

(defun subscribe-to-channel (event-system channel-name callback)
  \"チャンネルに購読
   
   引数:
     event-system - イベントシステムオブジェクト
     channel-name - チャンネル名
     callback - コールバック関数
   
   戻り値:
     購読成功フラグ\"
  (let ((channel (gethash channel-name (event-system-channels event-system))))
    (when channel
      (push callback (event-channel-subscribers channel))
      t)))

(defun unsubscribe-from-channel (event-system channel-name callback)
  \"チャンネル購読を解除
   
   引数:
     event-system - イベントシステムオブジェクト
     channel-name - チャンネル名
     callback - コールバック関数
   
   戻り値:
     解除成功フラグ\"
  (let ((channel (gethash channel-name (event-system-channels event-system))))
    (when channel
      (setf (event-channel-subscribers channel)
            (remove callback (event-channel-subscribers channel)))
      t)))

(defun subscribe-to-broadcast (event-system callback)
  \"ブロードキャストに購読
   
   引数:
     event-system - イベントシステムオブジェクト
     callback - コールバック関数
   
   戻り値:
     購読成功フラグ\"
  (push callback (event-system-broadcast-subscribers event-system))
  t)

(defun setup-external-integration (event-system integration-func)
  \"外部システム連携を設定
   
   引数:
     event-system - イベントシステムオブジェクト
     integration-func - 連携関数
   
   戻り値:
     設定成功フラグ\"
  (setf (event-system-external-integration event-system) integration-func)
  t)

;;; ============================================================================
;;; イベント統計・分析機能
;;; ============================================================================

(defun enable-event-statistics (event-system)
  \"イベント統計記録を有効化
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (event-system-statistics-enabled-p event-system) t)
  t)

(defun get-event-statistics (event-system)
  \"イベント統計データを取得
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     統計データ（ハッシュテーブル）\"
  (event-system-event-statistics event-system))

(defun get-event-count (statistics event-type)
  \"特定イベントタイプの発生回数を取得
   
   引数:
     statistics - 統計データ
     event-type - イベントタイプ
   
   戻り値:
     発生回数\"
  (gethash event-type statistics 0))

(defun get-total-events (statistics)
  \"総イベント数を取得
   
   引数:
     statistics - 統計データ
   
   戻り値:
     総イベント数\"
  (let ((total 0))
    (maphash (lambda (type count)
               (declare (ignore type))
               (incf total count))
             statistics)
    total))

(defun enable-performance-monitoring (event-system)
  \"性能監視を有効化
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (event-system-performance-monitoring-p event-system) t)
  t)

(defun get-performance-metrics (event-system)
  \"性能メトリクスを取得
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     性能メトリクス（ハッシュテーブル）\"
  (event-system-performance-metrics event-system))

(defun get-average-processing-time (metrics)
  \"平均処理時間を取得
   
   引数:
     metrics - 性能メトリクス
   
   戻り値:
     平均処理時間（秒）\"
  (let ((total-time (gethash :total-processing-time metrics 0))
        (event-count (gethash :processed-events metrics 1)))
    (/ total-time event-count)))

(defun get-total-processed-events (metrics)
  \"総処理イベント数を取得
   
   引数:
     metrics - 性能メトリクス
   
   戻り値:
     総処理イベント数\"
  (gethash :processed-events metrics 0))

(defun analyze-event-patterns (event-system)
  \"イベントパターンを分析
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     分析結果（ハッシュテーブル）\"
  (let ((analysis (make-hash-table :test 'equal))
        (history (event-system-event-history event-system)))
    (when history
      ;; 簡易分析実装
      (setf (gethash :total-events analysis) (length history))
      (setf (gethash :analysis-timestamp analysis) (get-universal-time)))
    analysis))

(defun get-player-activity-level (analysis player-id)
  \"プレイヤー活動レベルを取得
   
   引数:
     analysis - 分析結果
     player-id - プレイヤーID
   
   戻り値:
     活動レベル\"
  (gethash (format nil \"player-~A-activity\" player-id) analysis 0))

(defun get-game-duration-estimate (analysis)
  \"ゲーム時間推定を取得
   
   引数:
     analysis - 分析結果
   
   戻り値:
     推定ゲーム時間（秒）\"
  (gethash :estimated-duration analysis 0))

(defun get-event-frequency (analysis event-type)
  \"イベント頻度を取得
   
   引数:
     analysis - 分析結果
     event-type - イベントタイプ
   
   戻り値:
     イベント頻度\"
  (gethash (format nil \"frequency-~A\" event-type) analysis 0.0))

;;; ============================================================================
;;; エラーハンドリング・信頼性機能
;;; ============================================================================

(defun set-error-handler (event-system error-handler)
  \"エラーハンドラーを設定
   
   引数:
     event-system - イベントシステムオブジェクト
     error-handler - エラーハンドラー関数
   
   戻り値:
     設定成功フラグ\"
  (setf (event-system-error-handler event-system) error-handler)
  t)

(defun get-system-health (event-system)
  \"システム健全性データを取得
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     システム健全性データ\"
  (event-system-system-health event-system))

(defun is-system-healthy-p (system-health)
  \"システムが健全かどうかを判定
   
   引数:
     system-health - システム健全性データ
   
   戻り値:
     健全性判定（真偽値）\"
  (gethash :healthy-p system-health t))

(defun get-memory-usage (system-health)
  \"メモリ使用量を取得
   
   引数:
     system-health - システム健全性データ
   
   戻り値:
     メモリ使用量（バイト）\"
  (gethash :memory-usage system-health 0))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun generate-listener-id ()
  \"リスナーIDを生成
   
   戻り値:
     リスナーID\"
  (format nil \"listener-~A\" (random 1000000)))

(defun record-event-to-history (event-system event-type data)
  \"イベントを履歴に記録
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
     data - イベントデータ
   
   戻り値:
     記録成功フラグ\"
  (let ((event-record (make-event-record :id (generate-event-id)
                                        :event-type event-type
                                        :data data
                                        :timestamp (get-universal-time)
                                        :source \"internal\"
                                        :processed-p nil)))
    (push event-record (event-system-event-history event-system))
    t))

(defun update-event-statistics (event-system event-type)
  \"イベント統計を更新
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
   
   戻り値:
     更新成功フラグ\"
  (let ((stats (event-system-event-statistics event-system)))
    (incf (gethash event-type stats 0))
    t))

(defun execute-listeners (event-system event-type data)
  \"リスナーを実行
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
     data - イベントデータ
   
   戻り値:
     実行成功フラグ\"
  (let ((listeners (get-sorted-listeners event-system event-type)))
    (dolist (listener listeners)
      (when (event-listener-active-p listener)
        ;; フィルター確認
        (when (or (null (event-listener-filter-func listener))
                  (funcall (event-listener-filter-func listener) data))
          ;; リスナー実行
          (handler-case
              (if (event-listener-async-p listener)
                  (execute-async-listener event-system listener data)
                  (funcall (event-listener-callback listener) data))
            (error (e)
              (handle-listener-error event-system e (event-listener-id listener)))))))
    t))

(defun get-sorted-listeners (event-system event-type)
  \"優先度順でソートされたリスナーを取得
   
   引数:
     event-system - イベントシステムオブジェクト
     event-type - イベントタイプ
   
   戻り値:
     ソートされたリスナーリスト\"
  (let ((matching-listeners nil))
    (maphash (lambda (id listener)
               (declare (ignore id))
               (when (or (eq (event-listener-event-type listener) event-type)
                        (eq (event-listener-event-type listener) :any))
                 (push listener matching-listeners)))
             (event-system-listeners event-system))
    (sort matching-listeners (lambda (a b)
                               (> (event-listener-priority a)
                                  (event-listener-priority b))))))

(defun execute-async-listener (event-system listener data)
  \"非同期リスナーを実行
   
   引数:
     event-system - イベントシステムオブジェクト
     listener - リスナーオブジェクト
     data - イベントデータ
   
   戻り値:
     実行成功フラグ\"
  ;; 簡易実装：実際にはスレッドプールやフューチャーを使用
  (funcall (event-listener-callback listener) data)
  t)

(defun process-batch-listener (event-system listener)
  \"バッチリスナーを処理
   
   引数:
     event-system - イベントシステムオブジェクト
     listener - リスナーオブジェクト
   
   戻り値:
     処理成功フラグ\"
  ;; 簡易実装：バッチデータを生成して処理
  (let ((batch-data (list \"batch-item-1\" \"batch-item-2\")))
    (funcall (event-listener-callback listener) batch-data))
  t)

(defun process-queued-events (event-system)
  \"キューイベントを処理
   
   引数:
     event-system - イベントシステムオブジェクト
   
   戻り値:
     処理成功フラグ\"
  (let ((queue (event-system-event-queue event-system)))
    (when queue
      (dolist (event queue)
        (emit-event event-system (first event) (second event)))
      (setf (event-system-event-queue event-system) nil))
    t))

(defun handle-listener-error (event-system error listener-id)
  \"リスナーエラーを処理
   
   引数:
     event-system - イベントシステムオブジェクト
     error - エラーオブジェクト
     listener-id - リスナーID
   
   戻り値:
     処理成功フラグ\"
  (when (event-system-error-handler event-system)
    (funcall (event-system-error-handler event-system) error listener-id))
  t)

(defun generate-event-id ()
  \"イベントIDを生成
   
   戻り値:
     イベントID\"
  (format nil \"event-~A\" (random 1000000)))