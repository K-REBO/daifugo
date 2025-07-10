;;; test-event-system-simple.lisp - イベントシステムの簡易テスト

(defpackage :simple-event-system-test
  (:use :common-lisp)
  (:export #:run-simple-event-system-tests))

(in-package :simple-event-system-test)

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

;; テスト関数群
(defun test-simple-event-system-creation ()
  "イベントシステム作成テスト"
  (let ((event-system (create-simple-event-system)))
    (and event-system
         (simple-event-system-p event-system)
         (simple-event-system-active-p event-system)
         (string= (simple-event-system-version event-system) "1.0.0"))))

(defun test-simple-listener-registration ()
  "リスナー登録テスト"
  (let ((event-system (create-simple-event-system))
        (listener-called nil))
    (let ((listener-id (simple-register-event-listener 
                        event-system 
                        :test-event
                        (lambda (data) (setf listener-called data)))))
      (and listener-id
           (stringp listener-id)
           (= (simple-get-listener-count event-system :test-event) 1)))))

(defun test-simple-event-emission ()
  "イベント発行テスト"
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

(defun test-simple-listener-unregistration ()
  "リスナー解除テスト"
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

(defun test-simple-multiple-listeners ()
  "複数リスナーテスト"
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

(defun test-simple-event-history ()
  "イベント履歴テスト"
  (let ((event-system (create-simple-event-system)))
    ;; 複数イベント発行
    (simple-emit-event event-system :game-started nil)
    (simple-emit-event event-system :card-played (list :player 0))
    (simple-emit-event event-system :game-ended nil)
    ;; 履歴確認
    (let ((history (simple-get-event-history event-system)))
      (= (length history) 3))))

(defun test-simple-event-statistics ()
  "イベント統計テスト"
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

(defun test-simple-any-event-listener ()
  "汎用イベントリスナーテスト"
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

(defun run-simple-event-system-tests ()
  "簡易イベントシステムテスト実行"
  (format t "~%=== 簡易イベントシステムテスト実行 ===~%")
  
  (let ((tests '(("システム作成" . test-simple-event-system-creation)
                 ("リスナー登録" . test-simple-listener-registration)
                 ("イベント発行" . test-simple-event-emission)
                 ("リスナー解除" . test-simple-listener-unregistration)
                 ("複数リスナー" . test-simple-multiple-listeners)
                 ("イベント履歴" . test-simple-event-history)
                 ("イベント統計" . test-simple-event-statistics)
                 ("汎用リスナー" . test-simple-any-event-listener)))
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
(format t "~%簡易イベントシステムテスト準備完了~%")
(format t "実行: (simple-event-system-test:run-simple-event-system-tests)~%")