;;; test-card-system.lisp - カードシステムのテスト

(defpackage :daifugo-card-system-test
  (:use :common-lisp)
  (:export #:run-card-system-tests))

(in-package :daifugo-card-system-test)

;;; カードシステムの機能をテストする

(defun test-card-creation ()
  "カード作成のテスト"
  (let ((card (daifugo-card-system:create-card 'daifugo-card-system::A :spades)))
    (and (eql (daifugo-card-system:card-rank card) 'daifugo-card-system::A)
         (eql (daifugo-card-system:card-suit card) :spades)
         (= (daifugo-card-system:card-strength card) 12))))

(defun test-card-strength-calculation ()
  "カード強度計算のテスト"
  (and (= (daifugo-card-system:calculate-card-strength 3) 1)
       (= (daifugo-card-system:calculate-card-strength 'daifugo-card-system::A) 12)
       (= (daifugo-card-system:calculate-card-strength 2) 13)
       (= (daifugo-card-system:calculate-card-strength 'daifugo-card-system::JOKER) 14)))

(defun test-deck-creation ()
  "デッキ作成のテスト"
  (let ((deck (daifugo-card-system:create-deck)))
    (and (= (length deck) 54)  ; 52枚 + ジョーカー2枚
         (= (count 'daifugo-card-system::JOKER deck :key #'daifugo-card-system:card-rank) 2))))

(defun test-deck-shuffle ()
  "デッキシャッフルのテスト"
  (let* ((deck (daifugo-card-system:create-deck))
         (shuffled (daifugo-card-system:shuffle-deck deck)))
    (and (= (length shuffled) (length deck))
         (every (lambda (card) (member card shuffled :test #'equal)) deck))))

(defun test-card-dealing ()
  "カード配布のテスト"
  (let* ((deck (daifugo-card-system:create-deck))
         (hands (daifugo-card-system:deal-cards deck 4)))
    (and (= (length hands) 4)
         (every (lambda (hand) (>= (length hand) 13)) hands))))

(defun test-card-comparison ()
  "カード比較のテスト"
  (let ((card1 (daifugo-card-system:create-card 'daifugo-card-system::A :spades))
        (card2 (daifugo-card-system:create-card 3 :hearts)))
    (and (> (daifugo-card-system:compare-cards card1 card2) 0)
         (< (daifugo-card-system:compare-cards card2 card1) 0)
         (= (daifugo-card-system:compare-cards card1 card1) 0))))

(defun test-joker-creation ()
  "ジョーカー作成のテスト"
  (let ((joker (daifugo-card-system:create-card 'daifugo-card-system::JOKER :joker)))
    (and (eql (daifugo-card-system:card-rank joker) 'daifugo-card-system::JOKER)
         (eql (daifugo-card-system:card-suit joker) :joker)
         (= (daifugo-card-system:card-strength joker) 14))))

(defun test-card-strength-order ()
  "カード強度順序のテスト"
  (let ((ranks '(3 4 5 6 7 8 9 10 daifugo-card-system::J daifugo-card-system::Q daifugo-card-system::K daifugo-card-system::A 2 daifugo-card-system::JOKER))
        (expected-strengths '(1 2 3 4 5 6 7 8 9 10 11 12 13 14)))
    (every (lambda (rank expected)
             (= (daifugo-card-system:calculate-card-strength rank) expected))
           ranks expected-strengths)))

(defun run-card-system-tests ()
  "全てのカードシステムテストを実行"
  (format t "~%=== カードシステムテスト実行 ===~%")
  
  (let ((tests '(("カード作成" . test-card-creation)
                 ("カード強度計算" . test-card-strength-calculation)
                 ("デッキ作成" . test-deck-creation)
                 ("デッキシャッフル" . test-deck-shuffle)
                 ("カード配布" . test-card-dealing)
                 ("カード比較" . test-card-comparison)
                 ("ジョーカー作成" . test-joker-creation)
                 ("カード強度順序" . test-card-strength-order)))
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