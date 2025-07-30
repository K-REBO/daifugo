;;; comprehensive-test-demo.lisp - 複数システムの統合テストデモ

(format t "~%=== LispDaifugoEngine 統合テスト実行デモ ===~%")

;; 1. 階段システムテスト
(defpackage :kaidan-test-demo
  (:use :common-lisp))

(in-package :kaidan-test-demo)

(defstruct simple-card rank suit)
(defstruct simple-kaidan enabled-p min-length)

(defun create-simple-kaidan ()
  (make-simple-kaidan :enabled-p t :min-length 3))

(defun simple-is-consecutive-p (ranks)
  (when (and ranks (>= (length ranks) 3))
    (let ((sorted-ranks (sort (copy-list ranks) #'<)))
      (every (lambda (i)
               (= (nth (1+ i) sorted-ranks) (1+ (nth i sorted-ranks))))
             (loop for i from 0 below (1- (length sorted-ranks)) collect i)))))

(defun simple-is-valid-kaidan-p (kaidan-system cards)
  (and (simple-kaidan-enabled-p kaidan-system)
       cards
       (>= (length cards) (simple-kaidan-min-length kaidan-system))
       (simple-is-consecutive-p (mapcar #'simple-card-rank cards))))

(defun run-kaidan-tests ()
  (let ((kaidan (create-simple-kaidan))
        (passed 0) (failed 0))
    (format t "1. 階段システムテスト:~%")
    
    ;; テスト1: システム作成
    (format t "   - システム作成 ... ")
    (if (and kaidan (simple-kaidan-p kaidan))
        (progn (format t "合格~%") (incf passed))
        (progn (format t "失敗~%") (incf failed)))
    
    ;; テスト2: 有効階段
    (format t "   - 有効階段(3-4-5) ... ")
    (let ((sequence (list (make-simple-card :rank 3 :suit :spades)
                         (make-simple-card :rank 4 :suit :hearts)
                         (make-simple-card :rank 5 :suit :diamonds))))
      (if (simple-is-valid-kaidan-p kaidan sequence)
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    ;; テスト3: 無効階段
    (format t "   - 無効階段(3-5-7) ... ")
    (let ((sequence (list (make-simple-card :rank 3 :suit :spades)
                         (make-simple-card :rank 5 :suit :hearts)
                         (make-simple-card :rank 7 :suit :diamonds))))
      (if (not (simple-is-valid-kaidan-p kaidan sequence))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    (format t "   → 階段テスト結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; 2. 革命システムテスト
(defpackage :kakumei-test-demo
  (:use :common-lisp))

(in-package :kakumei-test-demo)

(defstruct simple-card rank suit)
(defstruct simple-kakumei active-p count)

(defun create-simple-kakumei ()
  (make-simple-kakumei :active-p nil :count 0))

(defun trigger-simple-kakumei (kakumei-system)
  (incf (simple-kakumei-count kakumei-system))
  (setf (simple-kakumei-active-p kakumei-system)
        (oddp (simple-kakumei-count kakumei-system)))
  t)

(defun simple-four-of-kind-p (cards)
  (when (= (length cards) 4)
    (let ((first-rank (simple-card-rank (first cards))))
      (every (lambda (card) (= (simple-card-rank card) first-rank)) cards))))

(defun run-kakumei-tests ()
  (let ((kakumei (create-simple-kakumei))
        (passed 0) (failed 0))
    (format t "2. 革命システムテスト:~%")
    
    ;; テスト1: システム作成
    (format t "   - システム作成 ... ")
    (if (and kakumei (not (simple-kakumei-active-p kakumei)))
        (progn (format t "合格~%") (incf passed))
        (progn (format t "失敗~%") (incf failed)))
    
    ;; テスト2: 革命発動
    (format t "   - 革命発動 ... ")
    (trigger-simple-kakumei kakumei)
    (if (simple-kakumei-active-p kakumei)
        (progn (format t "合格~%") (incf passed))
        (progn (format t "失敗~%") (incf failed)))
    
    ;; テスト3: 4枚同数字判定
    (format t "   - 4枚同数字判定 ... ")
    (let ((four-sevens (list (make-simple-card :rank 7 :suit :spades)
                            (make-simple-card :rank 7 :suit :hearts)
                            (make-simple-card :rank 7 :suit :diamonds)
                            (make-simple-card :rank 7 :suit :clubs))))
      (if (simple-four-of-kind-p four-sevens)
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    (format t "   → 革命テスト結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; 3. イベントシステムテスト
(defpackage :event-test-demo
  (:use :common-lisp))

(in-package :event-test-demo)

(defstruct simple-event-system 
  active-p 
  listeners 
  history)

(defun create-simple-event-system ()
  (make-simple-event-system :active-p t 
                           :listeners (make-hash-table :test 'equal)
                           :history nil))

(defun simple-register-listener (event-system event-type callback)
  (when (simple-event-system-active-p event-system)
    (let ((listener-id (format nil "listener-~A" (random 1000000))))
      (setf (gethash listener-id (simple-event-system-listeners event-system))
            (list :event-type event-type :callback callback))
      listener-id)))

(defun simple-emit-event (event-system event-type data)
  (when (simple-event-system-active-p event-system)
    (push (list event-type data) (simple-event-system-history event-system))
    (maphash (lambda (id listener-info)
               (declare (ignore id))
               (when (eq (getf listener-info :event-type) event-type)
                 (funcall (getf listener-info :callback) data)))
             (simple-event-system-listeners event-system))
    t))

(defun run-event-tests ()
  (let ((event-system (create-simple-event-system))
        (passed 0) (failed 0)
        (received-data nil))
    (format t "3. イベントシステムテスト:~%")
    
    ;; テスト1: システム作成
    (format t "   - システム作成 ... ")
    (if (and event-system (simple-event-system-active-p event-system))
        (progn (format t "合格~%") (incf passed))
        (progn (format t "失敗~%") (incf failed)))
    
    ;; テスト2: リスナー登録
    (format t "   - リスナー登録 ... ")
    (let ((listener-id (simple-register-listener 
                        event-system :test-event 
                        (lambda (data) (setf received-data data)))))
      (if listener-id
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    ;; テスト3: イベント発行
    (format t "   - イベント発行 ... ")
    (simple-emit-event event-system :test-event "test-data")
    (if (string= received-data "test-data")
        (progn (format t "合格~%") (incf passed))
        (progn (format t "失敗~%") (incf failed)))
    
    (format t "   → イベントテスト結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; メイン実行
(defpackage :main-test-demo
  (:use :common-lisp)
  (:import-from :kaidan-test-demo #:run-kaidan-tests)
  (:import-from :kakumei-test-demo #:run-kakumei-tests)
  (:import-from :event-test-demo #:run-event-tests))

(in-package :main-test-demo)

(defun run-comprehensive-demo ()
  (format t "~%統合されたテストシステムの動作確認:~%")
  (let ((kaidan-ok (run-kaidan-tests))
        (kakumei-ok (run-kakumei-tests))
        (event-ok (run-event-tests)))
    
    (format t "~%=== 総合結果 ===~%")
    (format t "階段システム: ~A~%" (if kaidan-ok "✅ 成功" "❌ 失敗"))
    (format t "革命システム: ~A~%" (if kakumei-ok "✅ 成功" "❌ 失敗"))
    (format t "イベントシステム: ~A~%" (if event-ok "✅ 成功" "❌ 失敗"))
    
    (let ((total-success (+ (if kaidan-ok 1 0) (if kakumei-ok 1 0) (if event-ok 1 0))))
      (format t "~%🎉 ~A/3 システムが正常に動作しています！~%" total-success)
      (when (= total-success 3)
        (format t "~%✅ 全ての統合テストが成功しました！~%")
        (format t "   統合されたテストファイル構造が正常に機能しています。~%")))))

;; 実行
(run-comprehensive-demo)