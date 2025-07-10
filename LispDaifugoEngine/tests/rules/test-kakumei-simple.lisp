;;; test-kakumei-simple.lisp - 革命ルールの簡易テスト

(defpackage :simple-kakumei-test
  (:use :common-lisp)
  (:export #:run-simple-kakumei-tests))

(in-package :simple-kakumei-test)

;; 簡易カード構造
(defstruct simple-card rank suit)

;; 簡易革命システム構造
(defstruct simple-kakumei
  active-p
  count
  last-type)

;; 基本革命システム
(defun create-simple-kakumei ()
  "簡易革命システムを作成"
  (make-simple-kakumei :active-p nil :count 0 :last-type nil))

(defun trigger-simple-kakumei (kakumei-system type)
  "簡易革命発動"
  (incf (simple-kakumei-count kakumei-system))
  (setf (simple-kakumei-active-p kakumei-system)
        (oddp (simple-kakumei-count kakumei-system)))
  (setf (simple-kakumei-last-type kakumei-system) type)
  t)

(defun simple-four-of-kind-p (cards)
  "4枚同数字判定"
  (when (= (length cards) 4)
    (let ((first-rank (simple-card-rank (first cards))))
      (every (lambda (card) (= (simple-card-rank card) first-rank)) cards))))

(defun simple-same-suit-p (cards)
  "同スート4枚判定"
  (when (= (length cards) 4)
    (let ((first-suit (simple-card-suit (first cards))))
      (every (lambda (card) (eq (simple-card-suit card) first-suit)) cards))))

;; テスト関数群
(defun test-simple-kakumei-creation ()
  "革命システム作成テスト"
  (let ((kakumei (create-simple-kakumei)))
    (and kakumei
         (simple-kakumei-p kakumei)
         (not (simple-kakumei-active-p kakumei))
         (= (simple-kakumei-count kakumei) 0))))

(defun test-simple-kakumei-trigger ()
  "革命発動テスト"
  (let ((kakumei (create-simple-kakumei)))
    (and (not (simple-kakumei-active-p kakumei))
         (trigger-simple-kakumei kakumei :four-of-a-kind)
         (simple-kakumei-active-p kakumei)
         (= (simple-kakumei-count kakumei) 1))))

(defun test-simple-double-kakumei ()
  "二重革命テスト"
  (let ((kakumei (create-simple-kakumei)))
    (trigger-simple-kakumei kakumei :four-of-a-kind)  ; 1回目
    (and (simple-kakumei-active-p kakumei)
         (trigger-simple-kakumei kakumei :same-suit)   ; 2回目
         (not (simple-kakumei-active-p kakumei))       ; 打ち消し
         (= (simple-kakumei-count kakumei) 2))))

(defun test-simple-four-of-kind ()
  "4枚同数字テスト"
  (let ((four-sevens (list (make-simple-card :rank 7 :suit :spades)
                          (make-simple-card :rank 7 :suit :hearts)
                          (make-simple-card :rank 7 :suit :diamonds)
                          (make-simple-card :rank 7 :suit :clubs))))
    (simple-four-of-kind-p four-sevens)))

(defun test-simple-same-suit ()
  "同スートテスト"
  (let ((all-spades (list (make-simple-card :rank 3 :suit :spades)
                         (make-simple-card :rank 7 :suit :spades)
                         (make-simple-card :rank 10 :suit :spades)
                         (make-simple-card :rank 13 :suit :spades))))
    (simple-same-suit-p all-spades)))

(defun run-simple-kakumei-tests ()
  "簡易革命テスト実行"
  (format t "~%=== 簡易革命ルールテスト実行 ===~%")
  
  (let ((tests '(("革命システム作成" . test-simple-kakumei-creation)
                 ("革命発動" . test-simple-kakumei-trigger)
                 ("二重革命" . test-simple-double-kakumei)
                 ("4枚同数字判定" . test-simple-four-of-kind)
                 ("同スート判定" . test-simple-same-suit)))
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
(format t "~%簡易革命ルールテスト準備完了~%")
(format t "実行: (simple-kakumei-test:run-simple-kakumei-tests)~%")