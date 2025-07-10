;;; game-logger.lisp - 大富豪ゲーム用強力ロガーシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 多段階ログレベル管理（DEBUG, INFO, WARN, ERROR）
;;; - ゲーム専用ログ機能（プレイヤーアクション、カード出し、ルール適用等）
;;; - 高度なフィルタリング・検索機能
;;; - 複数フォーマット出力対応（テキスト、JSON、CSV）
;;; - パフォーマンス計測機能
;;; - 統計分析機能

(defpackage :daifugo-game-logger
  (:use :common-lisp)
  (:export ;; === 基本ロガー機能 ===
           #:create-logger            ; ロガー作成
           #:logger-p                 ; ロガー判定
           #:logger-name              ; ロガー名取得
           #:log-info                 ; 情報ログ
           #:log-warn                 ; 警告ログ
           #:log-error                ; エラーログ
           #:log-debug                ; デバッグログ
           #:set-log-level            ; ログレベル設定
           #:log-count                ; ログ件数取得
           #:clear-logs               ; ログクリア
           
           ;; === ゲーム専用ログ機能 ===
           #:log-game-state           ; ゲーム状態ログ
           #:log-player-action        ; プレイヤーアクションログ
           #:log-card-play            ; カード出しログ
           #:log-hand-state           ; 手札状態ログ
           #:log-turn-start           ; ターン開始ログ
           #:log-turn-end             ; ターン終了ログ
           #:log-rule-applied         ; ルール適用ログ
           
           ;; === フィルタリング・検索機能 ===
           #:filter-logs              ; ログフィルタリング
           #:search-logs              ; ログ検索
           #:logs-before              ; 指定時刻以前ログ
           #:logs-after               ; 指定時刻以降ログ
           
           ;; === 出力・永続化機能 ===
           #:format-logs              ; ログフォーマット出力
           #:save-logs                ; ログファイル保存
           #:load-logs                ; ログファイル読み込み
           
           ;; === 統計・分析機能 ===
           #:get-log-statistics       ; ログ統計取得
           #:stat-total               ; 総ログ数
           #:stat-info-count          ; 情報ログ数
           #:stat-warn-count          ; 警告ログ数
           #:stat-error-count         ; エラーログ数
           
           ;; === パフォーマンス計測機能 ===
           #:start-timer              ; タイマー開始
           #:stop-timer               ; タイマー停止
           #:get-performance-metrics  ; パフォーマンス取得
           #:metric-exists-p))        ; メトリクス存在確認

(in-package :daifugo-game-logger)

;;; ============================================================================
;;; ロガー構造体とログエントリ
;;; ============================================================================

(defstruct log-entry
  timestamp
  level
  message
  data
  context)

(defstruct logger
  name
  entries
  level
  timers
  performance-metrics)

(defstruct log-statistics
  total
  info-count
  warn-count
  error-count
  debug-count)

;;; ============================================================================
;;; 基本ロガー機能
;;; ============================================================================

(defun create-logger (name)
  "新しいロガーインスタンスを作成
   
   引数:
     name - ロガーの識別名（シンボルまたは文字列）
   
   戻り値:
     新しく作成されたロガーオブジェクト
   
   使用例:
     (create-logger :game-main)
     (create-logger 'debug-logger)"
  (make-logger :name name
               :entries nil
               :level :info
               :timers (make-hash-table :test 'equal)
               :performance-metrics (make-hash-table :test 'equal)))

(defun log-level-value (level)
  "ログレベルの数値を取得"
  (case level
    (:debug 0)
    (:info 1)
    (:warn 2)
    (:error 3)
    (otherwise 1)))

(defun should-log-p (logger level)
  "ログすべきかチェック"
  (>= (log-level-value level) (log-level-value (logger-level logger))))

(defun add-log-entry (logger level message &optional data context)
  "ログエントリを安全に追加
   
   引数:
     logger - ロガーオブジェクト
     level - ログレベル (:debug :info :warn :error)
     message - ログメッセージ（文字列）
     data - 追加データ（オプション）
     context - コンテキスト情報（オプション）
   
   戻り値:
     追加されたログエントリ（追加されなかった場合はNIL）"
  (unless (logger-p logger)
    (error "Invalid logger object: ~A" logger))
  (unless (stringp message)
    (setf message (format nil "~A" message)))
  
  (when (should-log-p logger level)
    (let ((entry (make-log-entry :timestamp (get-universal-time)
                                 :level level
                                 :message message
                                 :data data
                                 :context context)))
      (push entry (logger-entries logger))
      entry)))

(defun log-info (logger message &optional data context)
  "情報ログを記録"
  (add-log-entry logger :info message data context))

(defun log-warn (logger message &optional data context)
  "警告ログを記録"
  (add-log-entry logger :warn message data context))

(defun log-error (logger message &optional data context)
  "エラーログを記録"
  (add-log-entry logger :error message data context))

(defun log-debug (logger message &optional data context)
  "デバッグログを記録"
  (add-log-entry logger :debug message data context))

(defun set-log-level (logger level)
  "ログレベルを設定"
  (setf (logger-level logger) level))

(defun log-count (logger)
  "ログエントリ数を取得"
  (length (logger-entries logger)))

(defun clear-logs (logger)
  "ログをクリア"
  (setf (logger-entries logger) nil))

;;; ============================================================================
;;; ゲーム専用ログ機能
;;; ============================================================================

(defun log-game-state (logger game-state)
  "ゲーム状態をログに記録"
  (let ((state-data (list :current-player (daifugo-game-engine:game-state-current-player game-state)
                          :game-phase (daifugo-game-engine:game-state-game-phase game-state)
                          :revolution-p (daifugo-game-engine:game-state-revolution-p game-state)
                          :field-count (length (daifugo-game-engine:game-state-field game-state))
                          :player-count (length (daifugo-game-engine:game-state-players game-state)))))
    (log-info logger "ゲーム状態記録" state-data :game-state)))

(defun log-player-action (logger player-id action data)
  "プレイヤーアクションをログに記録"
  (let ((action-data (list :player-id player-id :action action :data data)))
    (log-info logger (format nil "プレイヤー~A が~A を実行" player-id action) action-data :player-action)))

(defun log-card-play (logger player-id cards play-type)
  "カード出しをログに記録"
  (let ((card-data (list :player-id player-id
                         :cards cards
                         :play-type play-type
                         :card-count (length cards))))
    (log-info logger (format nil "プレイヤー~A が~A枚のカードを出しました（~A）" 
                              player-id (length cards) play-type) card-data :card-play)))

(defun log-hand-state (logger game-state)
  "手札状態をログに記録"
  (let ((hand-data (mapcar (lambda (player)
                             (list :player-id (daifugo-player-system:player-id player)
                                   :hand-count (daifugo-player-system:hand-count player)
                                   :rank (daifugo-player-system:player-rank player)))
                           (daifugo-game-engine:game-state-players game-state))))
    (log-info logger "手札状態記録" hand-data :hand-state)))

(defun log-turn-start (logger player-id)
  "ターン開始をログに記録"
  (log-info logger (format nil "プレイヤー~A のターン開始" player-id) 
            (list :player-id player-id) :turn-start))

(defun log-turn-end (logger player-id)
  "ターン終了をログに記録"
  (log-info logger (format nil "プレイヤー~A のターン終了" player-id) 
            (list :player-id player-id) :turn-end))

(defun log-rule-applied (logger rule-name description)
  "ルール適用をログに記録"
  (log-info logger (format nil "ルール適用: ~A - ~A" rule-name description)
            (list :rule-name rule-name :description description) :rule-application))

;;; ============================================================================
;;; フィルタリング・検索機能
;;; ============================================================================

(defun filter-logs (logger &key level context)
  "ログをフィルタリング"
  (let ((entries (logger-entries logger)))
    (when level
      (setf entries (remove-if-not (lambda (entry) (eq (log-entry-level entry) level)) entries)))
    (when context
      (setf entries (remove-if-not (lambda (entry) (eq (log-entry-context entry) context)) entries)))
    entries))

(defun search-logs (logger search-term)
  "ログを検索"
  (remove-if-not (lambda (entry) 
                   (search search-term (log-entry-message entry)))
                 (logger-entries logger)))

(defun logs-before (logger timestamp)
  "指定時刻以前のログを取得"
  (remove-if-not (lambda (entry) (< (log-entry-timestamp entry) timestamp))
                 (logger-entries logger)))

(defun logs-after (logger timestamp)
  "指定時刻以降のログを取得"
  (remove-if-not (lambda (entry) (>= (log-entry-timestamp entry) timestamp))
                 (logger-entries logger)))

;;; ============================================================================
;;; 出力・永続化機能
;;; ============================================================================

(defun format-timestamp (timestamp)
  "タイムスタンプをフォーマット"
  (multiple-value-bind (sec min hour date month year)
      (decode-universal-time timestamp)
    (format nil "~4,'0d-~2,'0d-~2,'0d ~2,'0d:~2,'0d:~2,'0d" 
            year month date hour min sec)))

(defun format-logs (logger format-type)
  "ログをフォーマット"
  (let ((entries (reverse (logger-entries logger))))
    (case format-type
      (:text
       (with-output-to-string (stream)
         (dolist (entry entries)
           (format stream "[~A] ~A: ~A~%" 
                   (format-timestamp (log-entry-timestamp entry))
                   (log-entry-level entry)
                   (log-entry-message entry)))))
      (:json
       (with-output-to-string (stream)
         (format stream "[~%")
         (loop for entry in entries
               for first = t then nil
               do (unless first (format stream ",~%"))
               do (format stream "  {\"timestamp\": ~A, \"level\": \"~A\", \"message\": \"~A\"}"
                          (log-entry-timestamp entry)
                          (log-entry-level entry)
                          (log-entry-message entry)))
         (format stream "~%]~%")))
      (:csv
       (with-output-to-string (stream)
         (format stream "Timestamp,Level,Message~%")
         (dolist (entry entries)
           (format stream "~A,~A,\"~A\"~%"
                   (format-timestamp (log-entry-timestamp entry))
                   (log-entry-level entry)
                   (log-entry-message entry)))))
      (otherwise
       (format nil "~A" entries)))))

(defun save-logs (logger filename)
  "ログをファイルに保存"
  (with-open-file (stream filename :direction :output :if-exists :supersede)
    (write (logger-entries logger) :stream stream))
  t)

(defun load-logs (logger filename)
  "ログをファイルから読み込み"
  (with-open-file (stream filename :direction :input)
    (setf (logger-entries logger) (read stream)))
  t)

;;; ============================================================================
;;; 統計・分析機能
;;; ============================================================================

(defun get-log-statistics (logger)
  "ログ統計を取得"
  (let ((entries (logger-entries logger))
        (stats (make-log-statistics :total 0 :info-count 0 :warn-count 0 :error-count 0 :debug-count 0)))
    (dolist (entry entries)
      (incf (log-statistics-total stats))
      (case (log-entry-level entry)
        (:info (incf (log-statistics-info-count stats)))
        (:warn (incf (log-statistics-warn-count stats)))
        (:error (incf (log-statistics-error-count stats)))
        (:debug (incf (log-statistics-debug-count stats)))))
    stats))

(defun stat-total (stats)
  "統計の総数を取得"
  (log-statistics-total stats))

(defun stat-info-count (stats)
  "情報ログ数を取得"
  (log-statistics-info-count stats))

(defun stat-warn-count (stats)
  "警告ログ数を取得"
  (log-statistics-warn-count stats))

(defun stat-error-count (stats)
  "エラーログ数を取得"
  (log-statistics-error-count stats))

;;; ============================================================================
;;; パフォーマンス計測機能
;;; ============================================================================

(defun start-timer (logger timer-name)
  "タイマーを開始"
  (setf (gethash timer-name (logger-timers logger)) (get-internal-real-time)))

(defun stop-timer (logger timer-name)
  "タイマーを停止し、結果を保存"
  (let ((start-time (gethash timer-name (logger-timers logger))))
    (when start-time
      (let ((duration (/ (- (get-internal-real-time) start-time) internal-time-units-per-second)))
        (setf (gethash timer-name (logger-performance-metrics logger)) duration)
        (remhash timer-name (logger-timers logger))
        duration))))

(defun get-performance-metrics (logger)
  "パフォーマンス計測結果を取得"
  (logger-performance-metrics logger))

(defun metric-exists-p (metrics metric-name)
  "メトリクスが存在するかチェック"
  (nth-value 1 (gethash metric-name metrics)))