;;; test-hand-validation.lisp - 手札出し判定システムのテスト

;; 必要なモジュールをロード
(load "src/core/card-system.lisp")
(load "src/core/player-system.lisp")
(load "src/utils/player-utils.lisp")
(load "src/core/game-logic.lisp")
(load "src/core/game-engine.lisp")

(defpackage :daifugo-hand-validation-test
  (:use :common-lisp))

(in-package :daifugo-hand-validation-test)

;;; ==========================================
;;; 単枚出し判定テスト
;;; ==========================================

(defun test-single-card-validation ()
  "単枚出しの妥当性をテスト"
  (let ((card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
    ;; 単枚出しは常に妥当
    (and (daifugo-game-logic:is-valid-single-card (list card))
         (not (daifugo-game-logic:is-valid-single-card (list card card))))))

(defun test-single-card-strength ()
  "単枚カードの強度比較テスト"
  (let ((weak-card (daifugo-card-system:create-card 3 :spades))
        (strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts)))
    (daifugo-game-logic:compare-single-cards weak-card strong-card)))

;;; ==========================================
;;; ペア出し判定テスト
;;; ==========================================

(defun test-pair-validation ()
  "ペア出しの妥当性をテスト"
  (let ((pair-cards (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)
                          (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :hearts)))
        (non-pair-cards (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)
                              (daifugo-card-system:create-card (intern "Q" :daifugo-card-system) :hearts)))
        (single-card (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades))))
    (and (daifugo-game-logic:is-valid-pair pair-cards)
         (not (daifugo-game-logic:is-valid-pair non-pair-cards))
         (not (daifugo-game-logic:is-valid-pair single-card)))))

(defun test-pair-strength ()
  "ペアの強度比較テスト"
  (let ((weak-pair (list (daifugo-card-system:create-card 4 :spades)
                         (daifugo-card-system:create-card 4 :hearts)))
        (strong-pair (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)
                           (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts))))
    (daifugo-game-logic:compare-pairs weak-pair strong-pair)))

;;; ==========================================
;;; 3枚出し判定テスト
;;; ==========================================

(defun test-triple-validation ()
  "3枚出しの妥当性をテスト"
  (let ((triple-cards (list (daifugo-card-system:create-card 7 :spades)
                            (daifugo-card-system:create-card 7 :hearts)
                            (daifugo-card-system:create-card 7 :diamonds)))
        (non-triple-cards (list (daifugo-card-system:create-card 7 :spades)
                                (daifugo-card-system:create-card 7 :hearts)
                                (daifugo-card-system:create-card 8 :diamonds)))
        (pair-cards (list (daifugo-card-system:create-card 7 :spades)
                          (daifugo-card-system:create-card 7 :hearts))))
    (and (daifugo-game-logic:is-valid-triple triple-cards)
         (not (daifugo-game-logic:is-valid-triple non-triple-cards))
         (not (daifugo-game-logic:is-valid-triple pair-cards)))))

(defun test-triple-strength ()
  "3枚の強度比較テスト"
  (let ((weak-triple (list (daifugo-card-system:create-card 5 :spades)
                           (daifugo-card-system:create-card 5 :hearts)
                           (daifugo-card-system:create-card 5 :diamonds)))
        (strong-triple (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)
                             (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :hearts)
                             (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :diamonds))))
    (daifugo-game-logic:compare-triples weak-triple strong-triple)))

;;; ==========================================
;;; 4枚出し判定テスト
;;; ==========================================

(defun test-quadruple-validation ()
  "4枚出しの妥当性をテスト"
  (let ((quad-cards (list (daifugo-card-system:create-card 9 :spades)
                          (daifugo-card-system:create-card 9 :hearts)
                          (daifugo-card-system:create-card 9 :diamonds)
                          (daifugo-card-system:create-card 9 :clubs)))
        (non-quad-cards (list (daifugo-card-system:create-card 9 :spades)
                              (daifugo-card-system:create-card 9 :hearts)
                              (daifugo-card-system:create-card 9 :diamonds)
                              (daifugo-card-system:create-card 10 :clubs)))
        (triple-cards (list (daifugo-card-system:create-card 9 :spades)
                            (daifugo-card-system:create-card 9 :hearts)
                            (daifugo-card-system:create-card 9 :diamonds))))
    (and (daifugo-game-logic:is-valid-quadruple quad-cards)
         (not (daifugo-game-logic:is-valid-quadruple non-quad-cards))
         (not (daifugo-game-logic:is-valid-quadruple triple-cards)))))

(defun test-quadruple-strength ()
  "4枚の強度比較テスト"
  (let ((weak-quad (list (daifugo-card-system:create-card 6 :spades)
                         (daifugo-card-system:create-card 6 :hearts)
                         (daifugo-card-system:create-card 6 :diamonds)
                         (daifugo-card-system:create-card 6 :clubs)))
        (strong-quad (list (daifugo-card-system:create-card (intern "Q" :daifugo-card-system) :spades)
                           (daifugo-card-system:create-card (intern "Q" :daifugo-card-system) :hearts)
                           (daifugo-card-system:create-card (intern "Q" :daifugo-card-system) :diamonds)
                           (daifugo-card-system:create-card (intern "Q" :daifugo-card-system) :clubs))))
    (daifugo-game-logic:compare-quadruples weak-quad strong-quad)))

;;; ==========================================
;;; 階段出し判定テスト
;;; ==========================================

(defun test-sequence-validation ()
  "階段出しの妥当性をテスト"
  (let ((valid-sequence (list (daifugo-card-system:create-card 4 :spades)
                              (daifugo-card-system:create-card 5 :hearts)
                              (daifugo-card-system:create-card 6 :diamonds)))
        (invalid-sequence (list (daifugo-card-system:create-card 4 :spades)
                                (daifugo-card-system:create-card 6 :hearts)
                                (daifugo-card-system:create-card 8 :diamonds)))
        (short-sequence (list (daifugo-card-system:create-card 4 :spades)
                              (daifugo-card-system:create-card 5 :hearts))))
    (and (daifugo-game-logic:is-valid-sequence valid-sequence)
         (not (daifugo-game-logic:is-valid-sequence invalid-sequence))
         (not (daifugo-game-logic:is-valid-sequence short-sequence)))))

(defun test-sequence-strength ()
  "階段の強度比較テスト"
  (let ((weak-sequence (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 4 :hearts)
                             (daifugo-card-system:create-card 5 :diamonds)))
        (strong-sequence (list (daifugo-card-system:create-card (intern "J" :daifugo-card-system) :spades)
                               (daifugo-card-system:create-card (intern "Q" :daifugo-card-system) :hearts)
                               (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :diamonds))))
    (daifugo-game-logic:compare-sequences weak-sequence strong-sequence)))

;;; ==========================================
;;; 混合出し判定テスト（エラーケース）
;;; ==========================================

(defun test-mixed-validation ()
  "混合出しの妥当性をテスト（無効ケース）"
  (let ((mixed-cards (list (daifugo-card-system:create-card 3 :spades)
                           (daifugo-card-system:create-card 4 :hearts)
                           (daifugo-card-system:create-card 4 :diamonds)))
        (empty-cards nil))
    (and (not (daifugo-game-logic:is-valid-hand mixed-cards))
         (not (daifugo-game-logic:is-valid-hand empty-cards)))))

;;; ==========================================
;;; 統合手札判定テスト
;;; ==========================================

(defun test-hand-type-detection ()
  "手札の種類検出テスト"
  (let ((single (list (daifugo-card-system:create-card 7 :spades)))
        (pair (list (daifugo-card-system:create-card 8 :spades)
                    (daifugo-card-system:create-card 8 :hearts)))
        (triple (list (daifugo-card-system:create-card 9 :spades)
                      (daifugo-card-system:create-card 9 :hearts)
                      (daifugo-card-system:create-card 9 :diamonds)))
        (quad (list (daifugo-card-system:create-card 10 :spades)
                    (daifugo-card-system:create-card 10 :hearts)
                    (daifugo-card-system:create-card 10 :diamonds)
                    (daifugo-card-system:create-card 10 :clubs)))
        (sequence (list (daifugo-card-system:create-card 5 :spades)
                        (daifugo-card-system:create-card 6 :hearts)
                        (daifugo-card-system:create-card 7 :diamonds))))
    (and (eq (daifugo-game-logic:get-hand-type single) :single)
         (eq (daifugo-game-logic:get-hand-type pair) :pair)
         (eq (daifugo-game-logic:get-hand-type triple) :triple)
         (eq (daifugo-game-logic:get-hand-type quad) :quadruple)
         (eq (daifugo-game-logic:get-hand-type sequence) :sequence))))

(defun test-hand-compatibility ()
  "手札の適合性テスト"
  (let ((single-a (list (daifugo-card-system:create-card 7 :spades)))
        (single-b (list (daifugo-card-system:create-card 9 :hearts)))
        (pair-a (list (daifugo-card-system:create-card 8 :spades)
                      (daifugo-card-system:create-card 8 :hearts)))
        (pair-b (list (daifugo-card-system:create-card 10 :spades)
                      (daifugo-card-system:create-card 10 :hearts))))
    (and (daifugo-game-logic:hands-compatible-p single-a single-b)
         (daifugo-game-logic:hands-compatible-p pair-a pair-b)
         (not (daifugo-game-logic:hands-compatible-p single-a pair-a)))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-hand-validation-tests ()
  "手札出し判定システムのテストを実行"
  (format t "~%=== 手札出し判定システムテスト実行 ===~%")
  
  (let ((tests '(("単枚出し妥当性" . test-single-card-validation)
                 ("単枚強度比較" . test-single-card-strength)
                 ("ペア出し妥当性" . test-pair-validation)
                 ("ペア強度比較" . test-pair-strength)
                 ("3枚出し妥当性" . test-triple-validation)
                 ("3枚強度比較" . test-triple-strength)
                 ("4枚出し妥当性" . test-quadruple-validation)
                 ("4枚強度比較" . test-quadruple-strength)
                 ("階段出し妥当性" . test-sequence-validation)
                 ("階段強度比較" . test-sequence-strength)
                 ("混合出し妥当性" . test-mixed-validation)
                 ("手札種類検出" . test-hand-type-detection)
                 ("手札適合性" . test-hand-compatibility)))
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
(run-hand-validation-tests)