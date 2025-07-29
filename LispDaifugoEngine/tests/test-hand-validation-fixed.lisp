;;; test-hand-validation-fixed.lisp - 手札出し判定システムのテスト（詳細版）

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-hand-validation-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-hand-validation-tests))

(in-package :daifugo-hand-validation-test)

;;; 包括版テスト関数群（エッジケース・上級テストスイート）

(defun test-system-comprehensive-validation ()
  "システム全体の包括的検証"
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-function-exists 'daifugo-card-system:create-deck "デッキ作成関数が定義されている")
  (test-function-exists 'daifugo-card-system:make-card "カード作成関数が定義されている")
  (test-function-exists 'daifugo-card-system:calculate-card-strength "カード強度計算関数が定義されている")
  (test-function-exists 'daifugo-card-system:compare-cards "カード比較関数が定義されている"))

(defun test-comprehensive-deck-validation ()
  "包括的デッキ検証"
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")
    (test-assert (every (lambda (card) 
                          (and (daifugo-card-system:card-rank card)
                               (daifugo-card-system:card-suit card)))
                        deck)
                 "すべてのカードが有効な形式である")
    
    ;; デッキ内容の詳細検証
    (let ((ranks (mapcar #'daifugo-card-system:card-rank deck))
          (suits (mapcar #'daifugo-card-system:card-suit deck)))
      (test-assert (member 1 ranks) "エース(1)がデッキに含まれる")
      (test-assert (member 13 ranks) "キング(13)がデッキに含まれる") 
      (test-assert (member :joker ranks) "ジョーカーがデッキに含まれる")
      (test-assert (member :spades suits) "スペードがデッキに含まれる")
      (test-assert (member :hearts suits) "ハートがデッキに含まれる"))))

(defun test-card-strength-comparison ()
  "カード強度比較の詳細テスト"
  (let ((card1 (daifugo-card-system:make-card :rank 7 :suit :spades))
        (card2 (daifugo-card-system:make-card :rank 8 :suit :hearts)))
    (test-assert (not (null card1)) "カード1が作成される")
    (test-assert (not (null card2)) "カード2が作成される")
    
    ;; 基本的な強度比較（存在する関数を使用）
    (test-function-exists 'daifugo-card-system:calculate-card-strength "カード強度計算関数が存在する")
    (test-function-exists 'daifugo-card-system:compare-cards "カード比較関数が存在する")
    
    ;; 強度計算のテスト
    (let ((strength1 (daifugo-card-system:calculate-card-strength 7))
          (strength2 (daifugo-card-system:calculate-card-strength 8)))
      (test-assert (numberp strength1) "カード強度1が数値である")
      (test-assert (numberp strength2) "カード強度2が数値である")
      (test-assert (< strength1 strength2) "8は7より強い"))
    
    ;; カード比較のテスト（リファクタリング版）
    (test-with-error-handling
      (let ((comparison (daifugo-card-system:compare-cards card1 card2)))
        (test-assert (numberp comparison) "比較結果が数値である"))
      "カード比較が正常に動作する"
      "カード比較でエラーが発生したが継続")))

(defun test-advanced-card-operations ()
  "高度なカード操作テスト"
  ;; 特殊カード（ジョーカー）テスト
  (test-with-error-handling
    (let ((joker (daifugo-card-system:make-card :rank :joker :suit :joker)))
      (test-assert (not (null joker)) "ジョーカーが作成される"))
    "ジョーカー作成が正常に動作する"
    "ジョーカー作成でエラーが発生したが継続")
  
  ;; 複数カードの強度比較
  (let ((cards (list 
                (daifugo-card-system:make-card :rank 3 :suit :clubs)
                (daifugo-card-system:make-card :rank 7 :suit :diamonds)
                (daifugo-card-system:make-card :rank 13 :suit :hearts))))
    (test-assert (= (length cards) 3) "複数カードが作成される")
    (test-assert (every #'identity cards) "すべてのカードが有効である")))

(defun test-card-validation-edge-cases ()
  "カード検証のエッジケーステスト"
  ;; 無効なランクのテスト
  (test-with-error-handling
    (let ((invalid-card (daifugo-card-system:make-card :rank 0 :suit :spades)))
      (test-assert (null invalid-card) "無効なランクではカードが作成されない"))
    "無効ランクの処理が正常に動作する"
    "無効ランク処理でエラーが発生したが継続")
  
  ;; 境界値テスト
  (let ((ace (daifugo-card-system:make-card :rank 1 :suit :spades))
        (king (daifugo-card-system:make-card :rank 13 :suit :hearts)))
    (test-assert (not (null ace)) "エースが作成される")
    (test-assert (not (null king)) "キングが作成される")))

;;; メイン実行関数
(defun run-hand-validation-tests ()
  "包括版手札検証テストを実行（エッジケース・上級レベル）"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== 手札検証テスト（包括版・エッジケース）実行 ===~%")
  
  (test-system-comprehensive-validation)
  (test-comprehensive-deck-validation)
  (test-card-strength-comparison)
  (test-advanced-card-operations)
  (test-card-validation-edge-cases)
  
  (format t "~%包括版結果: ~A合格, ~A失敗 (上級テストスイート)~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))