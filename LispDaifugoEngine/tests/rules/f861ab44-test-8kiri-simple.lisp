;;; test-8kiri-simple.lisp - 8切りルールの簡易テスト

(defpackage :simple-8kiri-test
  (:use :common-lisp)
  (:export #:run-simple-8kiri-tests))

(in-package :simple-8kiri-test)

;; 簡易カード構造
(defstruct simple-card rank suit)

;; 簡易8切りシステム構造
(defstruct simple-8kiri
  enabled-p
  count)

;; 簡易フィールド状態構造
(defstruct simple-field
  cards
  restriction
  reset-p)

;; 基本8切りシステム
(defun create-simple-8kiri ()
  "簡易8切りシステムを作成"
  (make-simple-8kiri :enabled-p t :count 0))

(defun create-simple-field ()
  "簡易フィールド状態を作成"
  (make-simple-field :cards nil :restriction :none :reset-p nil))

(defun simple-is-8-card-p (card)
  "8カード判定"
  (= (simple-card-rank card) 8))

(defun simple-detect-8kiri (kiri-system cards)
  "8切り検出"
  (and (simple-8kiri-enabled-p kiri-system)
       cards
       (every #'simple-is-8-card-p cards)))

(defun simple-execute-8kiri (kiri-system field-state cards)
  "8切り実行"
  (when (simple-detect-8kiri kiri-system cards)
    ;; フィールドをクリア
    (setf (simple-field-cards field-state) nil)
    (setf (simple-field-restriction field-state) :none)
    (setf (simple-field-reset-p field-state) t)
    ;; カウント増加
    (incf (simple-8kiri-count kiri-system))
    t))

;; テスト関数群
(defun test-simple-8kiri-creation ()
  "8切りシステム作成テスト"
  (let ((kiri (create-simple-8kiri)))
    (and kiri
         (simple-8kiri-p kiri)
         (simple-8kiri-enabled-p kiri)
         (= (simple-8kiri-count kiri) 0))))

(defun test-simple-8-detection ()
  "8カード検出テスト"
  (let ((eight-card (make-simple-card :rank 8 :suit :spades))
        (seven-card (make-simple-card :rank 7 :suit :hearts)))
    (and (simple-is-8-card-p eight-card)
         (not (simple-is-8-card-p seven-card)))))

(defun test-simple-8kiri-trigger ()
  "8切り発動テスト"
  (let ((kiri (create-simple-8kiri))
        (eight-cards (list (make-simple-card :rank 8 :suit :spades))))
    (and (simple-detect-8kiri kiri eight-cards)
         (not (simple-detect-8kiri kiri 
                                   (list (make-simple-card :rank 7 :suit :hearts)))))))

(defun test-simple-field-clear ()
  "フィールドクリアテスト"
  (let ((kiri (create-simple-8kiri))
        (field (create-simple-field)))
    ;; フィールドにカードを配置
    (setf (simple-field-cards field) 
          (list (make-simple-card :rank 10 :suit :hearts)))
    (setf (simple-field-restriction field) :suit-lock)
    
    ;; 8切り実行
    (simple-execute-8kiri kiri field 
                          (list (make-simple-card :rank 8 :suit :spades)))
    
    ;; フィールドがクリアされている
    (and (null (simple-field-cards field))
         (eq (simple-field-restriction field) :none)
         (simple-field-reset-p field)
         (= (simple-8kiri-count kiri) 1))))

(defun test-simple-multiple-8s ()
  "複数8テスト"
  (let ((kiri (create-simple-8kiri))
        (field (create-simple-field))
        (multiple-8s (list (make-simple-card :rank 8 :suit :spades)
                          (make-simple-card :rank 8 :suit :hearts))))
    (and (simple-execute-8kiri kiri field multiple-8s)
         (= (simple-8kiri-count kiri) 1)
         (simple-field-reset-p field))))

(defun test-simple-8kiri-disabled ()
  "8切り無効化テスト"
  (let ((kiri (create-simple-8kiri))
        (field (create-simple-field)))
    ;; 8切りを無効化
    (setf (simple-8kiri-enabled-p kiri) nil)
    
    ;; 8切りが発動しない
    (and (not (simple-execute-8kiri kiri field 
                                    (list (make-simple-card :rank 8 :suit :clubs))))
         (= (simple-8kiri-count kiri) 0))))

(defun run-simple-8kiri-tests ()
  "簡易8切りテスト実行"
  (format t "~%=== 簡易8切りルールテスト実行 ===~%")
  
  (let ((tests '(("8切りシステム作成" . test-simple-8kiri-creation)
                 ("8カード検出" . test-simple-8-detection)
                 ("8切り発動" . test-simple-8kiri-trigger)
                 ("フィールドクリア" . test-simple-field-clear)
                 ("複数8処理" . test-simple-multiple-8s)
                 ("8切り無効化" . test-simple-8kiri-disabled)))
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
    (= failed 0)))

;; テスト実行
(format t "~%簡易8切りルールテスト準備完了~%")
(format t "実行: (simple-8kiri-test:run-simple-8kiri-tests)~%")