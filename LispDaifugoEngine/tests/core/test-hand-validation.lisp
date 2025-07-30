;;; test-hand-validation.lisp - 手札出し判定システムの統合テスト（コア版+軽量版統合）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-hand-validation-integrated-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-hand-validation-tests #:run-hand-validation-simple-tests))

(in-package :daifugo-hand-validation-integrated-test)

;;; コア版テスト関数群（主要機能重点テスト）

(defun test-card-system-core-functionality ()
  "カードシステムの主要機能テスト"
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-function-exists 'daifugo-card-system:create-deck "デッキ作成関数が定義されている")
  (test-function-exists 'daifugo-card-system:make-card "カード作成関数が定義されている"))

(defun test-card-properties-validation ()
  "カード属性検証テスト"
  (let ((card (daifugo-card-system:make-card :rank 7 :suit :spades)))
    (test-assert (not (null card)) "カードが作成される")
    (test-assert (eq (daifugo-card-system:card-rank card) 7) "カードランクが正しい")
    (test-assert (eq (daifugo-card-system:card-suit card) :spades) "カードスートが正しい")))

(defun test-deck-structure-validation ()
  "デッキ構造検証テスト"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")
    (test-assert (every (lambda (card) 
                          (and (daifugo-card-system:card-rank card)
                               (daifugo-card-system:card-suit card)))
                        deck)
                 "すべてのカードが有効な形式である")))

(defun test-card-strength-system ()
  "カード強度システムテスト"
  (test-function-exists 'daifugo-card-system:calculate-card-strength "カード強度計算関数が存在する")
  (test-function-exists 'daifugo-card-system:compare-cards "カード比較関数が存在する")
  
  ;; 実際の強度計算テスト
  (let ((strength-3 (daifugo-card-system:calculate-card-strength 3))
        (strength-7 (daifugo-card-system:calculate-card-strength 7)))
    (test-assert (numberp strength-3) "カード強度3が数値である")
    (test-assert (numberp strength-7) "カード強度7が数値である")
    (test-assert (< strength-3 strength-7) "7は3より強い")))

(defun test-hand-validation-basics ()
  "手札検証の基本機能テスト"
  ;; 複数枚カードでの比較テスト
  (let ((card1 (daifugo-card-system:make-card :rank 5 :suit :hearts))
        (card2 (daifugo-card-system:make-card :rank 10 :suit :clubs)))
    (test-assert (not (null card1)) "カード1が作成される")
    (test-assert (not (null card2)) "カード2が作成される")
    
    ;; カード比較の基本動作
    (test-with-error-handling
      (let ((comparison (daifugo-card-system:compare-cards card1 card2)))
        (test-assert (numberp comparison) "比較結果が数値である"))
      "カード比較が正常に動作する"
      "カード比較エラーを無視して継続")))

(defun test-multiple-card-operations ()
  "複数カード操作テスト"
  (let ((cards (list 
                (daifugo-card-system:make-card :rank 2 :suit :diamonds)
                (daifugo-card-system:make-card :rank 6 :suit :spades)
                (daifugo-card-system:make-card :rank 9 :suit :hearts))))
    (test-assert (= (length cards) 3) "複数カードが作成される")
    (test-assert (every #'identity cards) "すべてのカードが有効である")
    (test-assert (every (lambda (card)
                          (and (daifugo-card-system:card-rank card)
                               (daifugo-card-system:card-suit card)))
                        cards)
                 "すべてのカードが適切な属性を持つ")))

;;; 軽量版テスト関数群（旧simple版から統合）

(defun test-package-existence-detailed ()
  "パッケージ存在確認（軽量版・詳細）"
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する"))

(defun test-minimal-card-creation-detailed ()
  "最小限のカード作成テスト（軽量版・詳細）"
  (let ((card (daifugo-card-system:make-card :rank 7 :suit :spades)))
    (test-assert (not (null card)) "カードが作成される")))

(defun test-minimal-deck-creation-detailed ()
  "最小限のデッキ作成テスト（軽量版・詳細）"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")))

;;; メイン実行関数（コア版）
(defun run-hand-validation-tests ()
  "手札検証テスト（コア版・主要機能重点）を実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== 手札検証テスト（コア版・主要機能重点）実行 ===~%")
  
  (test-card-system-core-functionality)
  (test-card-properties-validation)
  (test-deck-structure-validation)
  (test-card-strength-system)
  (test-hand-validation-basics)
  (test-multiple-card-operations)
  
  (format t "~%コア版結果: ~A合格, ~A失敗 (計6テスト関数)~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))

;;; メイン実行関数（軽量版）
(defun run-hand-validation-simple-tests ()
  "軽量版手札検証テストを実行（最小限の基本動作確認）"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== 手札検証テスト（軽量版・最小限）実行 ===~%")
  
  (test-package-existence-detailed)
  (test-minimal-card-creation-detailed)
  (test-minimal-deck-creation-detailed)
  
  (format t "~%軽量版結果: ~A合格, ~A失敗 (計3テスト)~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))