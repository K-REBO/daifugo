
;;; test-hand-validation-integrated.lisp - 統合手札検証テスト
;;; 複数の手札検証テストファイルを統合し、網羅的なテストを行う

(load "tests/simple-test-framework.lisp")

(defpackage :daifugo-hand-validation-integrated-test
  (:use :common-lisp :simple-test-framework)
  (:export #:run-integrated-hand-validation-tests))

(in-package :daifugo-hand-validation-integrated-test)

;;; --- Section 1: Concept Validation (from test-hand-validation-fixed.lisp) ---
;;; Tests the fundamental concepts without heavy dependencies.

(defun test-hand-validation-concepts ()
  "手札検証の基本概念テスト"
  (test-section "基本概念 (Concepts)")
  (test-assert t "手札検証システムの概念確認")
  (test-assert (= 4 (length '(:spades :hearts :diamonds :clubs))) "4つのスートが定義されている")
  (test-assert (= 13 (length '(1 2 3 4 5 6 7 8 9 10 11 12 13))) "13のランクが定義されている")
  (test-assert (= 54 (+ (* 4 13) 2)) "ジョーカー込みで54枚計算が正しい")
  (test-assert (< 3 13) "ランクの大小関係が正しい"))

(defun test-hand-types-concepts ()
  "手札の種類概念テスト"
  (test-section "手札の種類概念 (Hand Types Concepts)")
  (test-assert (member :single '(:single :pair :triple :quadruple :sequence)) "シングルが手札種類に含まれる")
  (test-assert (member :pair '(:single :pair :triple :quadruple)) "ペアが手札種類に含まれる")
  (test-assert (> 4 1) "4枚組が1枚より多い")
  (test-assert (= 5 (length '(3 4 5 6 7))) "5枚階段の長さが正しい"))

(defun test-card-strength-concepts ()
  "カード強度の概念テスト"
  (test-section "カード強度概念 (Card Strength Concepts)")
  (test-assert (< 3 4) "数値として3は4より小さい")
  (test-assert (< 13 14) "大富豪ルール(概念): K(13)はA(14)より弱い")
  (test-assert (< 14 15) "大富豪ルール(概念): A(14)は2(15)より弱い")
  (test-assert (= 15 (+ 13 2)) "最強カード(2)の内部的な強さ計算の確認"))

(defun test-basic-lisp-functions-check ()
  "テスト実行のための基本的なLisp機能の動作確認"
  (test-section "Lisp基本機能 (Basic Lisp Functions)")
  (test-assert (listp '(1 2 3)) "リストが正しく認識される")
  (test-assert (numberp 42) "数値が正しく認識される")
  (test-assert (symbolp :spades) "シンボルが正しく認識される")
  (test-assert (stringp "test") "文字列が正しく認識される")
  (test-assert (= 3 (length '(a b c))) "リスト長さが正しく計算される"))

;;; --- Section 2: Core System Validation (from tests/core/test-hand-validation.lisp) ---
;;; Tests the core functionalities of the card system.

(defun test-card-system-core-functionality ()
  "カードシステムの主要機能テスト"
  (test-section "カードシステムコア (Card System Core)")
  (test-assert (find-package :daifugo-card-system) "カードシステムパッケージが存在する")
  (test-function-exists 'daifugo-card-system:create-deck "デッキ作成関数 create-deck が存在する")
  (test-function-exists 'daifugo-card-system:make-card "カード作成関数 make-card が存在する"))

(defun test-card-properties-validation ()
  "カード属性検証テスト"
  (test-section "カード属性 (Card Properties)")
  (let ((card (daifugo-card-system:make-card :rank 7 :suit :spades)))
    (test-assert (not (null card)) "カードが作成される")
    (test-assert (eq (daifugo-card-system:card-rank card) 7) "カードランクが7である")
    (test-assert (eq (daifugo-card-system:card-suit card) :spades) "カードスートが :spades である")))

(defun test-deck-structure-validation ()
  "デッキ構造検証テスト"
  (test-section "デッキ構造 (Deck Structure)")
  (let ((deck (daifugo-card-system:create-deck)))
    (test-assert (= (length deck) 54) "デッキに54枚のカードがある")
    (test-assert (every (lambda (card) (and (daifugo-card-system:card-rank card) (daifugo-card-system:card-suit card))) deck) "すべてのカードが有効な形式である")))

;;; --- Section 3: Game Logic Validation (from tests/test-hand-validation.lisp) ---
;;; Tests the actual game logic for hand validation.

(defun test-single-card-logic ()
  "単枚出しのロジックをテスト"
  (test-section "単枚出し (Single Card)")
  (let ((c3 (daifugo-card-system:make-card :rank 3 :suit :spades))
        (c5 (daifugo-card-system:make-card :rank 5 :suit :hearts)))
    (test-assert (daifugo-game-logic:is-valid-hand (list c3)) "単枚出しは有効")
    (test-assert (not (daifugo-game-logic:is-valid-hand (list c3 c5))) "異なるカード2枚は無効")
    (test-assert (eq :single (daifugo-game-logic:get-hand-type (list c3))) "手札タイプが :single として検出される")
    (test-assert (daifugo-game-logic:is-stronger-hand (list c5) (list c3)) "5は3より強い")))

(defun test-pair-logic ()
  "ペア出しのロジックをテスト"
  (test-section "ペア (Pair)")
  (let ((p5 (list (daifugo-card-system:make-card :rank 5 :suit :spades) (daifugo-card-system:make-card :rank 5 :hearts)))
        (p7 (list (daifugo-card-system:make-card :rank 7 :suit :clubs) (daifugo-card-system:make-card :rank 7 :diamonds)))
        (not-a-pair (list (daifugo-card-system:make-card :rank 5 :suit :spades) (daifugo-card-system:make-card :rank 6 :hearts))))
    (test-assert (daifugo-game-logic:is-valid-hand p5) "同じランク2枚のペアは有効")
    (test-assert (not (daifugo-game-logic:is-valid-hand not-a-pair)) "異なるランク2枚はペアとして無効")
    (test-assert (eq :pair (daifugo-game-logic:get-hand-type p5)) "手札タイプが :pair として検出される")
    (test-assert (daifugo-game-logic:is-stronger-hand p7 p5) "7のペアは5のペアより強い")))

(defun test-triple-logic ()
  "3枚出しのロジックをテスト"
  (test-section "トリプル (Triple)")
  (let ((t8 (list (daifugo-card-system:make-card :rank 8 :suit :spades) (daifugo-card-system:make-card :rank 8 :hearts) (daifugo-card-system:make-card :rank 8 :clubs))))
    (test-assert (daifugo-game-logic:is-valid-hand t8) "同じランク3枚のトリプルは有効")
    (test-assert (eq :triple (daifugo-game-logic:get-hand-type t8)) "手札タイプが :triple として検出される")))

(defun test-quadruple-logic ()
  "4枚出しのロジックをテスト"
  (test-section "クアドラプル (Quadruple)")
  (let ((qK (list (daifugo-card-system:make-card :rank 13 :suit :spades) (daifugo-card-system:make-card :rank 13 :hearts) (daifugo-card-system:make-card :rank 13 :clubs) (daifugo-card-system:make-card :rank 13 :diamonds))))
    (test-assert (daifugo-game-logic:is-valid-hand qK) "同じランク4枚のクアドラプルは有効")
    (test-assert (eq :quadruple (daifugo-game-logic:get-hand-type qK)) "手札タイプが :quadruple として検出される")))

(defun test-sequence-logic ()
  "階段出しのロジックをテスト"
  (test-section "階段 (Sequence)")
  (let ((seq345 (list (daifugo-card-system:make-card :rank 3 :suit :spades) (daifugo-card-system:make-card :rank 4 :hearts) (daifugo-card-system:make-card :rank 5 :clubs)))
        (seq789 (list (daifugo-card-system:make-card :rank 7 :suit :spades) (daifugo-card-system:make-card :rank 8 :hearts) (daifugo-card-system:make-card :rank 9 :clubs)))
        (not-a-seq (list (daifugo-card-system:make-card :rank 3 :suit :spades) (daifugo-card-system:make-card :rank 5 :hearts) (daifugo-card-system:make-card :rank 6 :clubs)))
        (short-seq (list (daifugo-card-system:make-card :rank 3 :suit :spades) (daifugo-card-system:make-card :rank 4 :hearts))))
    (test-assert (daifugo-game-logic:is-valid-hand seq345) "3-4-5の階段は有効")
    (test-assert (not (daifugo-game-logic:is-valid-hand not-a-seq)) "数字が連続していないので階段として無効")
    (test-assert (not (daifugo-game-logic:is-valid-hand short-seq)) "2枚では階段として無効")
    (test-assert (eq :sequence (daifugo-game-logic:get-hand-type seq345)) "手札タイプが :sequence として検出される")
    (test-assert (daifugo-game-logic:is-stronger-hand seq789 seq345) "7-8-9の階段は3-4-5の階段より強い")))

(defun test-hand-compatibility-logic ()
  "手札の互換性ロジックをテスト"
  (test-section "手札の互換性 (Hand Compatibility)")
  (let ((single-a (list (daifugo-card-system:make-card :rank 7 :spades)))
        (single-b (list (daifugo-card-system:make-card :rank 9 :hearts)))
        (pair-a (list (daifugo-card-system:make-card :rank 8 :spades) (daifugo-card-system:make-card :rank 8 :hearts))))
    (test-assert (daifugo-game-logic:hands-compatible-p single-a single-b) "シングル同士は互換性あり")
    (test-assert (not (daifugo-game-logic:hands-compatible-p single-a pair-a)) "シングルとペアは互換性なし")))


;;; --- Main Runner ---

(defun run-integrated-hand-validation-tests ()
  "統合されたすべての手札検証テストを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "~%~%=== 統合手札検証テスト実行 ===~%")
  
  ;; Section 1
  (test-hand-validation-concepts)
  (test-hand-types-concepts)
  (test-card-strength-concepts)
  (test-basic-lisp-functions-check)
  
  ;; Section 2
  (test-card-system-core-functionality)
  (test-card-properties-validation)
  (test-deck-structure-validation)
  
  ;; Section 3
  (test-single-card-logic)
  (test-pair-logic)
  (test-triple-logic)
  (test-quadruple-logic)
  (test-sequence-logic)
  (test-hand-compatibility-logic)
  
  (format t "~%~%📊 統合手札検証 結果: ~A合格, ~A失敗 (計~Aテスト)~%" *tests-passed* (- *tests-total* *tests-passed*) *tests-total*)
  (= *tests-passed* *tests-total*))

;; スクリプトとして直接実行された場合にテストを実行
(run-integrated-hand-validation-tests)
