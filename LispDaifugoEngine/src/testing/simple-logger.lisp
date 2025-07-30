;;; simple-logger.lisp - 依存関係なしの基本ロガー

(defpackage :daifugo-game-logger
  (:use :common-lisp)
  (:export #:create-logger #:logger-p #:logger-name
           #:log-info #:log-warn #:log-error #:log-debug
           #:set-log-level #:log-count #:clear-logs
           #:filter-logs #:search-logs #:get-log-statistics
           #:stat-total #:stat-info-count #:stat-warn-count #:stat-error-count
           #:start-timer #:stop-timer #:get-performance-metrics #:metric-exists-p))

(in-package :daifugo-game-logger)

(defstruct log-entry
  timestamp level message data context)

(defstruct logger
  name entries level timers performance-metrics)

(defstruct log-statistics
  total info-count warn-count error-count debug-count)

(defun create-logger (name)
  "新しいロガーインスタンスを作成"
  (make-logger :name name
               :entries nil
               :level :info
               :timers (make-hash-table :test 'equal)
               :performance-metrics (make-hash-table :test 'equal)))

(defun log-level-value (level)
  "ログレベルの数値を取得"
  (case level
    (:debug 0) (:info 1) (:warn 2) (:error 3) (otherwise 1)))

(defun should-log-p (logger level)
  "ログすべきかチェック"
  (>= (log-level-value level) (log-level-value (logger-level logger))))

(defun add-log-entry (logger level message &optional data context)
  "ログエントリを追加"
  (when (should-log-p logger level)
    (let ((entry (make-log-entry :timestamp (get-universal-time)
                                 :level level
                                 :message (format nil "~A" message)
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

(defun stat-total (stats) (log-statistics-total stats))
(defun stat-info-count (stats) (log-statistics-info-count stats))
(defun stat-warn-count (stats) (log-statistics-warn-count stats))
(defun stat-error-count (stats) (log-statistics-error-count stats))

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