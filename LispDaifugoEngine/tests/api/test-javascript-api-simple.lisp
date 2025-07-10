;;; test-javascript-api-simple.lisp - JavaScript APIの簡易テスト

(defpackage :simple-javascript-api-test
  (:use :common-lisp)
  (:export #:run-simple-javascript-api-tests))

(in-package :simple-javascript-api-test)

;; 簡易JSON応答構造
(defstruct simple-json-response
  success
  data
  error)

;; 簡易JavaScript API構造
(defstruct simple-js-api
  active-p
  version
  games
  request-count)

;; 基本JavaScript APIシステム
(defun create-simple-js-api ()
  "簡易JavaScript APIを作成"
  (make-simple-js-api :active-p t :version "1.0.0" :games (make-hash-table :test 'equal) :request-count 0))

(defun simple-create-json-response (success data &optional error)
  "簡易JSON応答作成"
  (make-simple-json-response :success success :data data :error error))

(defun simple-get-json-field (json-obj field-name)
  "簡易JSONフィールド取得"
  (when (simple-json-response-p json-obj)
    (case (intern (string-upcase field-name) :keyword)
      (:success (simple-json-response-success json-obj))
      (:data (simple-json-response-data json-obj))
      (:error (simple-json-response-error json-obj))
      (otherwise nil))))

(defun simple-create-game-api (js-api player-count)
  "簡易ゲーム作成API"
  (when (simple-js-api-active-p js-api)
    (incf (simple-js-api-request-count js-api))
    (let ((game-id (format nil "game-~A" (random 1000000))))
      (setf (gethash game-id (simple-js-api-games js-api)) 
            (list :player-count player-count :status "created"))
      (simple-create-json-response t (list :game-id game-id :player-count player-count :status "created")))))

(defun simple-get-api-status (js-api)
  "簡易API状態取得"
  (simple-create-json-response t (list :active (simple-js-api-active-p js-api)
                                      :version (simple-js-api-version js-api)
                                      :request-count (simple-js-api-request-count js-api))))

(defun simple-to-json (data)
  "簡易JSON変換"
  (format nil "~A" data))

(defun simple-from-json (json-string)
  "簡易JSON解析"
  (handler-case
      (read-from-string json-string)
    (error () nil)))

;; テスト関数群
(defun test-simple-api-creation ()
  "API作成テスト"
  (let ((js-api (create-simple-js-api)))
    (and js-api
         (simple-js-api-p js-api)
         (simple-js-api-active-p js-api)
         (string= (simple-js-api-version js-api) "1.0.0"))))

(defun test-simple-game-creation ()
  "ゲーム作成テスト"
  (let ((js-api (create-simple-js-api)))
    (let ((result (simple-create-game-api js-api 4)))
      (and result
           (simple-json-response-p result)
           (simple-get-json-field result "success")
           (let ((data (simple-get-json-field result "data")))
             (and data
                  (getf data :game-id)
                  (= (getf data :player-count) 4)))))))

(defun test-simple-api-status ()
  "API状態テスト"
  (let ((js-api (create-simple-js-api)))
    ;; リクエスト実行
    (simple-create-game-api js-api 3)
    (let ((status (simple-get-api-status js-api)))
      (and status
           (simple-get-json-field status "success")
           (let ((data (simple-get-json-field status "data")))
             (and data
                  (getf data :active)
                  (= (getf data :request-count) 1)))))))

(defun test-simple-json-conversion ()
  "JSON変換テスト"
  (let ((data (list :player "Player1" :score 100)))
    (let ((json-string (simple-to-json data)))
      (and json-string
           (stringp json-string)
           (search "Player1" json-string)
           (search "100" json-string)))))

(defun test-simple-json-parsing ()
  "JSON解析テスト"
  (let ((json-string "(:PLAYER-ID 1 :ACTION \"play\")"))
    (let ((data (simple-from-json json-string)))
      (and data
           (listp data)
           (= (getf data :player-id) 1)
           (string= (getf data :action) "play")))))

(defun test-simple-request-counting ()
  "リクエスト数計測テスト"
  (let ((js-api (create-simple-js-api)))
    ;; 複数リクエスト実行
    (simple-create-game-api js-api 4)
    (simple-create-game-api js-api 3)
    ;; API状態取得はリクエストカウントに含まれない
    (simple-get-api-status js-api)
    ;; カウント確認
    (= (simple-js-api-request-count js-api) 2)))

(defun test-simple-game-storage ()
  "ゲーム保存テスト"
  (let ((js-api (create-simple-js-api)))
    (let ((result (simple-create-game-api js-api 4)))
      (when (simple-get-json-field result "success")
        (let ((game-id (getf (simple-get-json-field result "data") :game-id)))
          (let ((stored-game (gethash game-id (simple-js-api-games js-api))))
            (and stored-game
                 (= (getf stored-game :player-count) 4)
                 (string= (getf stored-game :status) "created"))))))))

(defun run-simple-javascript-api-tests ()
  "簡易JavaScript APIテスト実行"
  (format t "~%=== 簡易JavaScript APIテスト実行 ===~%")
  
  (let ((tests '(("API作成" . test-simple-api-creation)
                 ("ゲーム作成" . test-simple-game-creation)
                 ("API状態取得" . test-simple-api-status)
                 ("JSON変換" . test-simple-json-conversion)
                 ("JSON解析" . test-simple-json-parsing)
                 ("リクエスト数計測" . test-simple-request-counting)
                 ("ゲーム保存" . test-simple-game-storage)))
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
(format t "~%簡易JavaScript APIテスト準備完了~%")
(format t "実行: (simple-javascript-api-test:run-simple-javascript-api-tests)~%")