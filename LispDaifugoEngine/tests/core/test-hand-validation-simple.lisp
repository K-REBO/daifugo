;;; test-hand-validation-simple.lisp - 手札出し判定のシンプルテスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-hand-validation-simple
  (:use :common-lisp))

(in-package :daifugo-hand-validation-simple)

;;; 手札出し判定テスト
(defun test-hand-validation ()
  "手札出し判定システムのテスト"
  (format t "~%=== 手札出し判定システムテスト実行 ===~%")
  
  ;; テストデータ作成
  (let ((single-card (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
        (pair-cards (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)
                          (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :hearts)))
        (triple-cards (list (daifugo-card-system:create-card 7 :spades)
                            (daifugo-card-system:create-card 7 :hearts)
                            (daifugo-card-system:create-card 7 :diamonds)))
        (quad-cards (list (daifugo-card-system:create-card 9 :spades)
                          (daifugo-card-system:create-card 9 :hearts)
                          (daifugo-card-system:create-card 9 :diamonds)
                          (daifugo-card-system:create-card 9 :clubs)))
        (sequence-cards (list (daifugo-card-system:create-card 4 :spades)
                              (daifugo-card-system:create-card 5 :hearts)
                              (daifugo-card-system:create-card 6 :diamonds)))
        (invalid-cards (list (daifugo-card-system:create-card 4 :spades)
                             (daifugo-card-system:create-card 6 :hearts))))
    
    ;; 単枚出し判定テスト
    (format t "テスト: 単枚出し判定 ... ")
    (if (and (daifugo-game-logic:is-valid-single-card single-card)
             (not (daifugo-game-logic:is-valid-single-card pair-cards)))
        (format t "合格~%")
        (format t "失敗~%"))
    
    ;; ペア出し判定テスト
    (format t "テスト: ペア出し判定 ... ")
    (if (and (daifugo-game-logic:is-valid-pair pair-cards)
             (not (daifugo-game-logic:is-valid-pair single-card))
             (not (daifugo-game-logic:is-valid-pair invalid-cards)))
        (format t "合格~%")
        (format t "失敗~%"))
    
    ;; 3枚出し判定テスト
    (format t "テスト: 3枚出し判定 ... ")
    (if (and (daifugo-game-logic:is-valid-triple triple-cards)
             (not (daifugo-game-logic:is-valid-triple pair-cards)))
        (format t "合格~%")
        (format t "失敗~%"))
    
    ;; 4枚出し判定テスト
    (format t "テスト: 4枚出し判定 ... ")
    (if (and (daifugo-game-logic:is-valid-quadruple quad-cards)
             (not (daifugo-game-logic:is-valid-quadruple triple-cards)))
        (format t "合格~%")
        (format t "失敗~%"))
    
    ;; 階段出し判定テスト
    (format t "テスト: 階段出し判定 ... ")
    (if (and (daifugo-game-logic:is-valid-sequence sequence-cards)
             (not (daifugo-game-logic:is-valid-sequence invalid-cards)))
        (format t "合格~%")
        (format t "失敗~%"))
    
    ;; 手札種類検出テスト
    (format t "テスト: 手札種類検出 ... ")
    (if (and (eq (daifugo-game-logic:get-hand-type single-card) :single)
             (eq (daifugo-game-logic:get-hand-type pair-cards) :pair)
             (eq (daifugo-game-logic:get-hand-type triple-cards) :triple)
             (eq (daifugo-game-logic:get-hand-type quad-cards) :quadruple)
             (eq (daifugo-game-logic:get-hand-type sequence-cards) :sequence)
             (eq (daifugo-game-logic:get-hand-type invalid-cards) :invalid))
        (format t "合格~%")
        (format t "失敗~%"))
    
    ;; 手札適合性テスト
    (format t "テスト: 手札適合性 ... ")
    (let ((single-a (list (daifugo-card-system:create-card 5 :spades)))
          (single-b (list (daifugo-card-system:create-card 8 :hearts)))
          (pair-a (list (daifugo-card-system:create-card 10 :spades)
                        (daifugo-card-system:create-card 10 :hearts)))
          (pair-b (list (daifugo-card-system:create-card (intern "J" :daifugo-card-system) :spades)
                        (daifugo-card-system:create-card (intern "J" :daifugo-card-system) :hearts))))
      (if (and (daifugo-game-logic:hands-compatible-p single-a single-b)
               (daifugo-game-logic:hands-compatible-p pair-a pair-b)
               (not (daifugo-game-logic:hands-compatible-p single-a pair-a)))
          (format t "合格~%")
          (format t "失敗~%")))
    
    ;; 強度比較テスト
    (format t "テスト: 強度比較 ... ")
    (let ((weak-card (daifugo-card-system:create-card 3 :spades))
          (strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts)))
      (if (and (> (daifugo-game-logic:compare-single-cards strong-card weak-card) 0)
               (< (daifugo-game-logic:compare-single-cards weak-card strong-card) 0))
          (format t "合格~%")
          (format t "失敗~%")))
    
    (format t "~%手札出し判定システムテスト完了~%")))

;; テスト実行
(test-hand-validation)