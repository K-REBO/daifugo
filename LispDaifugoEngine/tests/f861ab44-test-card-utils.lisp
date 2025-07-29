;;; test-card-utils.lisp - カードユーティリティのテスト

(defpackage :daifugo-card-utils-test
  (:use :common-lisp)
  (:export #:run-card-utils-tests))

(in-package :daifugo-card-utils-test)

;;; カードユーティリティの機能をテストする

(defun test-valid-rank-p ()
  "ランク検証のテスト"
  (and (daifugo-card-system:valid-rank-p 'A)
       (daifugo-card-system:valid-rank-p 'JOKER)
       (daifugo-card-system:valid-rank-p 3)
       (not (daifugo-card-system:valid-rank-p 'X))
       (not (daifugo-card-system:valid-rank-p 1))))

(defun test-valid-suit-p ()
  "スート検証のテスト"
  (and (daifugo-card-system:valid-suit-p :spades)
       (daifugo-card-system:valid-suit-p :joker)
       (not (daifugo-card-system:valid-suit-p :invalid))
       (not (daifugo-card-system:valid-suit-p 'wrong))))

(defun test-card-creation-validation ()
  "カード作成時の検証のテスト"
  (handler-case
      (progn
        (daifugo-card-system:create-card 'INVALID :spades)
        nil)  ; エラーが発生しなかった場合は失敗
    (error () t)))  ; エラーが発生した場合は成功

(defun test-strength-map-consistency ()
  "強度マップの一貫性テスト"
  (let ((map daifugo-card-system:*card-strength-map*))
    (and (= (length map) 14)  ; 14種類のランク
         (= (cdr (assoc 'JOKER map)) 14)  ; ジョーカーが最強
         (= (cdr (assoc 3 map)) 1))))  ; 3が最弱

(defun run-card-utils-tests ()
  "全てのカードユーティリティテストを実行"
  (format t "~%=== カードユーティリティテスト実行 ===~%")
  
  (let ((tests '(("ランク検証" . test-valid-rank-p)
                 ("スート検証" . test-valid-suit-p)
                 ("カード作成検証" . test-card-creation-validation)
                 ("強度マップ一貫性" . test-strength-map-consistency)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (handler-case
            (if (funcall test-func)
                (progn
                  (format t "合格~%")
                  (incf passed))
                (progn
                  (format t "失敗~%")
                  (incf failed)))
          (error (e)
            (format t "エラー: ~A~%" e)
            (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; テスト実行
(run-card-utils-tests)