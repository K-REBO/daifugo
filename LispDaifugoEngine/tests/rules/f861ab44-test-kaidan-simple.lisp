;;; test-kaidan-simple.lisp - 階段出しルールの簡易テスト

(defpackage :simple-kaidan-test
  (:use :common-lisp)
  (:export #:run-simple-kaidan-tests))

(in-package :simple-kaidan-test)

;; 簡易カード構造
(defstruct simple-card rank suit)

;; 簡易階段システム構造
(defstruct simple-kaidan
  enabled-p
  min-length
  strength-mode)

;; 簡易フィールド状態構造
(defstruct simple-field
  cards
  kaidan-length
  has-kaidan-p)

;; 基本階段システム
(defun create-simple-kaidan ()
  "簡易階段システムを作成"
  (make-simple-kaidan :enabled-p t :min-length 3 :strength-mode :min-rank))

(defun create-simple-field ()
  "簡易フィールド状態を作成"
  (make-simple-field :cards nil :kaidan-length 0 :has-kaidan-p nil))

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

(defun simple-get-kaidan-min-rank (cards)
  "階段の最小ランク取得"
  (when cards
    (apply #'min (simple-get-card-ranks cards))))

(defun simple-compare-kaidan (kaidan-system kaidan1 kaidan2)
  "階段比較"
  (when (and (simple-is-valid-kaidan-p kaidan-system kaidan1)
             (simple-is-valid-kaidan-p kaidan-system kaidan2)
             (= (length kaidan1) (length kaidan2)))
    (let ((strength1 (simple-get-kaidan-min-rank kaidan1))
          (strength2 (simple-get-kaidan-min-rank kaidan2)))
      (> strength1 strength2))))

(defun simple-place-kaidan-on-field (field-state cards)
  "フィールドに階段配置"
  (when cards
    (setf (simple-field-cards field-state) cards)
    (setf (simple-field-kaidan-length field-state) (length cards))
    (setf (simple-field-has-kaidan-p field-state) t)
    t))

;; テスト関数群
(defun test-simple-kaidan-creation ()
  "階段システム作成テスト"
  (let ((kaidan (create-simple-kaidan)))
    (and kaidan
         (simple-kaidan-p kaidan)
         (simple-kaidan-enabled-p kaidan)
         (= (simple-kaidan-min-length kaidan) 3))))

(defun test-simple-basic-sequence ()
  "基本階段検出テスト"
  (let ((kaidan (create-simple-kaidan)))
    ;; 3-4-5の階段
    (let ((sequence (list (make-simple-card :rank 3 :suit :spades)
                         (make-simple-card :rank 4 :suit :hearts)
                         (make-simple-card :rank 5 :suit :diamonds))))
      (and (simple-is-valid-kaidan-p kaidan sequence)
           (= (simple-get-kaidan-min-rank sequence) 3)))))

(defun test-simple-longer-sequence ()
  "長い階段テスト"
  (let ((kaidan (create-simple-kaidan)))
    ;; 6-7-8-9の階段
    (let ((sequence (list (make-simple-card :rank 6 :suit :spades)
                         (make-simple-card :rank 7 :suit :hearts)
                         (make-simple-card :rank 8 :suit :diamonds)
                         (make-simple-card :rank 9 :suit :clubs))))
      (and (simple-is-valid-kaidan-p kaidan sequence)
           (= (length sequence) 4)))))

(defun test-simple-invalid-sequence ()
  "無効階段テスト"
  (let ((kaidan (create-simple-kaidan)))
    ;; 飛び階段（3-5-7）
    (let ((skip-sequence (list (make-simple-card :rank 3 :suit :spades)
                              (make-simple-card :rank 5 :suit :hearts)
                              (make-simple-card :rank 7 :suit :diamonds)))
          ;; 短すぎる階段
          (short-sequence (list (make-simple-card :rank 8 :suit :spades)
                               (make-simple-card :rank 9 :suit :hearts))))
      (and (not (simple-is-valid-kaidan-p kaidan skip-sequence))
           (not (simple-is-valid-kaidan-p kaidan short-sequence))))))

(defun test-simple-kaidan-comparison ()
  "階段比較テスト"
  (let ((kaidan (create-simple-kaidan)))
    ;; 4-5-6 vs 7-8-9
    (let ((weak-kaidan (list (make-simple-card :rank 4 :suit :spades)
                            (make-simple-card :rank 5 :suit :hearts)
                            (make-simple-card :rank 6 :suit :diamonds)))
          (strong-kaidan (list (make-simple-card :rank 7 :suit :clubs)
                              (make-simple-card :rank 8 :suit :spades)
                              (make-simple-card :rank 9 :suit :hearts))))
      (and (simple-compare-kaidan kaidan strong-kaidan weak-kaidan)
           (not (simple-compare-kaidan kaidan weak-kaidan strong-kaidan))))))

(defun test-simple-field-placement ()
  "フィールド配置テスト"
  (let ((field (create-simple-field)))
    (let ((kaidan (list (make-simple-card :rank 5 :suit :spades)
                       (make-simple-card :rank 6 :suit :hearts)
                       (make-simple-card :rank 7 :suit :diamonds))))
      (simple-place-kaidan-on-field field kaidan)
      (and (simple-field-has-kaidan-p field)
           (= (simple-field-kaidan-length field) 3)
           (equal (simple-field-cards field) kaidan)))))

(defun test-simple-min-length-setting ()
  "最小長さ設定テスト"
  (let ((kaidan (create-simple-kaidan)))
    ;; 最小長さを4に変更
    (setf (simple-kaidan-min-length kaidan) 4)
    (let ((short-kaidan (list (make-simple-card :rank 3 :suit :spades)
                             (make-simple-card :rank 4 :suit :hearts)
                             (make-simple-card :rank 5 :suit :diamonds)))
          (valid-kaidan (list (make-simple-card :rank 6 :suit :clubs)
                             (make-simple-card :rank 7 :suit :spades)
                             (make-simple-card :rank 8 :suit :hearts)
                             (make-simple-card :rank 9 :suit :diamonds))))
      (and (= (simple-kaidan-min-length kaidan) 4)
           (not (simple-is-valid-kaidan-p kaidan short-kaidan))
           (simple-is-valid-kaidan-p kaidan valid-kaidan)))))

(defun run-simple-kaidan-tests ()
  "簡易階段テスト実行"
  (format t "~%=== 簡易階段出しルールテスト実行 ===~%")
  
  (let ((tests '(("階段システム作成" . test-simple-kaidan-creation)
                 ("基本階段検出" . test-simple-basic-sequence)
                 ("長い階段" . test-simple-longer-sequence)
                 ("無効階段除外" . test-simple-invalid-sequence)
                 ("階段比較" . test-simple-kaidan-comparison)
                 ("フィールド配置" . test-simple-field-placement)
                 ("最小長さ設定" . test-simple-min-length-setting)))
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
(format t "~%簡易階段出しルールテスト準備完了~%")
(format t "実行: (simple-kaidan-test:run-simple-kaidan-tests)~%")