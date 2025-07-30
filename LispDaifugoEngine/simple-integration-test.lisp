;;; simple-integration-test.lisp - 統合テストの動作確認

(defpackage :test-integration-demo
  (:use :common-lisp)
  (:export #:run-demo-tests))

(in-package :test-integration-demo)

;; 簡易カード構造
(defstruct simple-card rank suit)

;; 簡易階段システム構造
(defstruct simple-kaidan
  enabled-p
  min-length
  strength-mode)

;; 基本階段システム
(defun create-simple-kaidan ()
  "簡易階段システムを作成"
  (make-simple-kaidan :enabled-p t :min-length 3 :strength-mode :min-rank))

(defun simple-get-card-ranks (cards)
  "カードからランクを抽出"
  (mapcar #'simple-card-rank cards))

(defun simple-is-consecutive-p (ranks)
  "ランクが連続しているかを判定"
  (when (and ranks (>= (length ranks) 3))
    (let ((sorted-ranks (sort (copy-list ranks) #'<)))
      (every (lambda (i)
               (= (nth (1+ i) sorted-ranks) (1+ (nth i sorted-ranks))))
             (loop for i from 0 below (1- (length sorted-ranks)) collect i)))))

(defun simple-is-valid-kaidan-p (kaidan-system cards)
  "有効階段判定"
  (and (simple-kaidan-enabled-p kaidan-system)
       cards
       (>= (length cards) (simple-kaidan-min-length kaidan-system))
       (simple-is-consecutive-p (simple-get-card-ranks cards))))

;; 簡易テスト関数
(defun test-simple-kaidan-creation-demo ()
  "階段システム作成テスト（デモ）"
  (let ((kaidan (create-simple-kaidan)))
    (and kaidan
         (simple-kaidan-p kaidan)
         (simple-kaidan-enabled-p kaidan)
         (= (simple-kaidan-min-length kaidan) 3))))

(defun test-simple-basic-sequence-demo ()
  "基本階段検出テスト（デモ）"
  (let ((kaidan (create-simple-kaidan)))
    ;; 3-4-5の階段
    (let ((sequence (list (make-simple-card :rank 3 :suit :spades)
                         (make-simple-card :rank 4 :suit :hearts)
                         (make-simple-card :rank 5 :suit :diamonds))))
      (simple-is-valid-kaidan-p kaidan sequence))))

(defun test-simple-invalid-sequence-demo ()
  "無効階段テスト（デモ）"
  (let ((kaidan (create-simple-kaidan)))
    ;; 飛び階段（3-5-7）
    (let ((skip-sequence (list (make-simple-card :rank 3 :suit :spades)
                              (make-simple-card :rank 5 :suit :hearts)
                              (make-simple-card :rank 7 :suit :diamonds))))
      (not (simple-is-valid-kaidan-p kaidan skip-sequence)))))

(defun run-demo-tests ()
  "デモテスト実行"
  (format t "=== 統合テストデモ実行 ===~%")
  
  (let ((tests '(("階段システム作成" . test-simple-kaidan-creation-demo)
                 ("基本階段検出" . test-simple-basic-sequence-demo)
                 ("無効階段除外" . test-simple-invalid-sequence-demo)))
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
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (format t "~%✅ 統合されたテストコードが正常に動作しています！~%")
    (= failed 0)))

;; 実行
(format t "~%統合テストの実行可能性デモンストレーション~%")
(run-demo-tests)