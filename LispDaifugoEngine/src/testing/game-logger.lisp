;;; game-logger.lisp - ゲームロガー

(defpackage :daifugo-game-logger
  (:use :common-lisp)
  (:export #:log-event
           #:log-state-snapshot
           #:log-game-statistics
           #:export-game-log
           #:set-log-level
           #:set-log-output
           #:add-log-filter
           #:remove-log-filter))

(in-package :daifugo-game-logger)

;;; ログレベル
(defvar *log-level* :info)
(defvar *log-output* :console)
(defvar *log-filters* nil)
(defvar *game-log* nil)

;;; イベントログ記録
(defun log-event (event-type &rest event-data)
  "イベントをログに記録する"
  (let ((log-entry (list :timestamp (get-universal-time)
                         :type event-type
                         :data event-data)))
    (push log-entry *game-log*)
    (when (eq *log-output* :console)
      (format t "LOG: ~A ~A~%" event-type event-data))))

;;; 状態スナップショット記録
(defun log-state-snapshot (game-state &key turn phase)
  "ゲーム状態のスナップショットを記録する"
  (log-event :state-snapshot 
             :game-state game-state
             :turn turn
             :phase phase))

;;; ゲーム統計記録
(defun log-game-statistics (game-id duration winner final-ranks)
  "ゲーム統計を記録する"
  (log-event :game-statistics
             :game-id game-id
             :duration duration
             :winner winner
             :final-ranks final-ranks))

;;; ログ出力
(defun export-game-log (filename &key (format :json))
  "ゲームログをファイルに出力する"
  (with-open-file (stream filename :direction :output 
                          :if-exists :supersede
                          :if-does-not-exist :create)
    (case format
      (:json (format stream "~A~%" (write-to-string *game-log*)))
      (:human-readable 
       (dolist (entry (reverse *game-log*))
         (format stream "~A: ~A~%" 
                 (getf entry :type)
                 (getf entry :data)))))))

;;; ログレベル設定
(defun set-log-level (level)
  "ログレベルを設定する"
  (setf *log-level* level))

;;; ログ出力設定
(defun set-log-output (output)
  "ログ出力先を設定する"
  (setf *log-output* output))

;;; ログフィルタ追加
(defun add-log-filter (filter)
  "ログフィルタを追加する"
  (pushnew filter *log-filters*))

;;; ログフィルタ削除
(defun remove-log-filter (filter)
  "ログフィルタを削除する"
  (setf *log-filters* (remove filter *log-filters*)))