;;; test-kakumei.lisp - 革命ルール（kakumei.lisp）の包括的テスト
;;; 
;;; 本テストは以下の機能をカバーします：
;;; - 革命の発動条件（4枚同じ数字・同じスート4枚等）
;;; - 革命状態の管理（発動・解除・状態確認）
;;; - カード強度の逆転処理
;;; - 複数革命パターンの検証
;;; - 革命とゲームエンジンの統合テスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-kakumei-test
  (:use :common-lisp))

(in-package :daifugo-kakumei-test)

;;; ==========================================
;;; 革命ルール基本機能テスト
;;; ==========================================

(defun test-kakumei-rule-creation ()
  "革命ルールシステムの作成テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    (and kakumei-system
         (daifugo-kakumei:kakumei-system-p kakumei-system)
         (not (daifugo-kakumei:is-kakumei-active-p kakumei-system))
         (= (daifugo-kakumei:get-kakumei-count kakumei-system) 0))))

(defun test-kakumei-detection-four-of-kind ()
  "4枚同じ数字による革命検出テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 4枚の同じ数字のカードを作成
    (let ((cards (list (daifugo-card-system:create-card 7 :spades)
                      (daifugo-card-system:create-card 7 :hearts)
                      (daifugo-card-system:create-card 7 :diamonds)
                      (daifugo-card-system:create-card 7 :clubs))))
      (and (daifugo-kakumei:detect-kakumei-trigger kakumei-system cards)
           (eq (daifugo-kakumei:get-kakumei-type cards) :four-of-a-kind)))))

(defun test-kakumei-detection-same-suit ()
  "同じスート4枚による革命検出テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 同じスートの4枚のカードを作成
    (let ((cards (list (daifugo-card-system:create-card 3 :spades)
                      (daifugo-card-system:create-card 5 :spades)
                      (daifugo-card-system:create-card 8 :spades)
                      (daifugo-card-system:create-card 11 :spades))))
      (and (daifugo-kakumei:detect-kakumei-trigger kakumei-system cards)
           (eq (daifugo-kakumei:get-kakumei-type cards) :same-suit)))))

(defun test-kakumei-detection-sequence ()
  "階段4枚による革命検出テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 連続する4枚のカードを作成
    (let ((cards (list (daifugo-card-system:create-card 5 :spades)
                      (daifugo-card-system:create-card 6 :hearts)
                      (daifugo-card-system:create-card 7 :diamonds)
                      (daifugo-card-system:create-card 8 :clubs))))
      (and (daifugo-kakumei:detect-kakumei-trigger kakumei-system cards)
           (eq (daifugo-kakumei:get-kakumei-type cards) :sequence)))))

(defun test-non-kakumei-hands ()
  "革命にならない手札の検証テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命にならない様々なパターン
    (let ((random-cards (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 7 :hearts)
                             (daifugo-card-system:create-card 11 :diamonds)
                             (daifugo-card-system:create-card 13 :clubs)))
          (three-of-kind (list (daifugo-card-system:create-card 9 :spades)
                               (daifugo-card-system:create-card 9 :hearts)
                               (daifugo-card-system:create-card 9 :diamonds)
                               (daifugo-card-system:create-card 4 :clubs))))
      (and (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system random-cards))
           (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system three-of-kind))))))

;;; ==========================================
;;; 革命状態管理機能テスト
;;; ==========================================

(defun test-kakumei-activation ()
  "革命の発動・状態管理テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命発動前の状態確認
    (and (not (daifugo-kakumei:is-kakumei-active-p kakumei-system))
         (progn
           ;; 革命を発動
           (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
           (and (daifugo-kakumei:is-kakumei-active-p kakumei-system)
                (= (daifugo-kakumei:get-kakumei-count kakumei-system) 1))))))

(defun test-kakumei-deactivation ()
  "革命の解除テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命を発動
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
    (and (daifugo-kakumei:is-kakumei-active-p kakumei-system)
         (progn
           ;; 革命を解除
           (daifugo-kakumei:resolve-kakumei kakumei-system)
           (not (daifugo-kakumei:is-kakumei-active-p kakumei-system))))))

(defun test-double-kakumei ()
  "二重革命（革命の打ち消し）テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 最初の革命を発動
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
    (and (daifugo-kakumei:is-kakumei-active-p kakumei-system)
         (= (daifugo-kakumei:get-kakumei-count kakumei-system) 1)
         (progn
           ;; 二度目の革命で打ち消し
           (daifugo-kakumei:trigger-kakumei kakumei-system :same-suit)
           (and (not (daifugo-kakumei:is-kakumei-active-p kakumei-system))
                (= (daifugo-kakumei:get-kakumei-count kakumei-system) 2))))))

(defun test-kakumei-state-persistence ()
  "革命状態の永続化テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命発動
    (daifugo-kakumei:trigger-kakumei kakumei-system :sequence)
    (let ((state-snapshot (daifugo-kakumei:get-kakumei-state kakumei-system)))
      (and state-snapshot
           (getf state-snapshot :active)
           (= (getf state-snapshot :count) 1)
           (eq (getf state-snapshot :last-type) :sequence)))))

;;; ==========================================
;;; カード強度逆転機能テスト
;;; ==========================================

(defun test-normal-card-strength ()
  "通常時のカード強度テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命していない状態での強度比較
    (let ((card-3 (daifugo-card-system:create-card 3 :spades))
          (card-ace (daifugo-card-system:create-card 14 :hearts)))
      (and (not (daifugo-kakumei:is-kakumei-active-p kakumei-system))
           (< (daifugo-kakumei:calculate-card-strength kakumei-system card-3)
              (daifugo-kakumei:calculate-card-strength kakumei-system card-ace))))))

(defun test-kakumei-card-strength ()
  "革命時のカード強度逆転テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命を発動
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
    ;; 革命状態での強度比較
    (let ((card-3 (daifugo-card-system:create-card 3 :spades))
          (card-ace (daifugo-card-system:create-card 14 :hearts)))
      (and (daifugo-kakumei:is-kakumei-active-p kakumei-system)
           (> (daifugo-kakumei:calculate-card-strength kakumei-system card-3)
              (daifugo-kakumei:calculate-card-strength kakumei-system card-ace))))))

(defun test-card-comparison-normal ()
  "通常時のカード比較テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    (let ((weak-card (daifugo-card-system:create-card 4 :diamonds))
          (strong-card (daifugo-card-system:create-card 12 :clubs)))
      (and (daifugo-kakumei:compare-cards kakumei-system weak-card strong-card :normal)
           (not (daifugo-kakumei:compare-cards kakumei-system strong-card weak-card :normal))))))

(defun test-card-comparison-kakumei ()
  "革命時のカード比較テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
    (let ((weak-card (daifugo-card-system:create-card 4 :diamonds))
          (strong-card (daifugo-card-system:create-card 12 :clubs)))
      (and (daifugo-kakumei:compare-cards kakumei-system strong-card weak-card :kakumei)
           (not (daifugo-kakumei:compare-cards kakumei-system weak-card strong-card :kakumei))))))

;;; ==========================================
;;; 革命パターン検証テスト
;;; ==========================================

(defun test-kakumei-pattern-recognition ()
  "革命パターン認識の精度テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 各種革命パターンの認識テスト
    (let ((four-kings (list (daifugo-card-system:create-card 13 :spades)
                           (daifugo-card-system:create-card 13 :hearts)
                           (daifugo-card-system:create-card 13 :diamonds)
                           (daifugo-card-system:create-card 13 :clubs)))
          (all-spades (list (daifugo-card-system:create-card 5 :spades)
                           (daifugo-card-system:create-card 8 :spades)
                           (daifugo-card-system:create-card 10 :spades)
                           (daifugo-card-system:create-card 12 :spades)))
          (sequence-mixed (list (daifugo-card-system:create-card 6 :spades)
                               (daifugo-card-system:create-card 7 :hearts)
                               (daifugo-card-system:create-card 8 :diamonds)
                               (daifugo-card-system:create-card 9 :clubs))))
      (and (eq (daifugo-kakumei:get-kakumei-type four-kings) :four-of-a-kind)
           (eq (daifugo-kakumei:get-kakumei-type all-spades) :same-suit)
           (eq (daifugo-kakumei:get-kakumei-type sequence-mixed) :sequence)))))

(defun test-special-kakumei-cases ()
  "特殊革命ケースの処理テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; ジョーカーを含む革命
    (let ((with-joker (list (daifugo-card-system:create-card 7 :spades)
                           (daifugo-card-system:create-card 7 :hearts)
                           (daifugo-card-system:create-card 7 :diamonds)
                           (daifugo-card-system:create-joker))))
      (and (daifugo-kakumei:detect-kakumei-trigger kakumei-system with-joker)
           (eq (daifugo-kakumei:get-kakumei-type with-joker) :four-of-a-kind-with-joker)))))

(defun test-invalid-kakumei-patterns ()
  "無効な革命パターンの除外テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命にならないパターン
    (let ((mixed-ranks (list (daifugo-card-system:create-card 3 :spades)
                            (daifugo-card-system:create-card 7 :hearts)
                            (daifugo-card-system:create-card 11 :diamonds)
                            (daifugo-card-system:create-card 14 :clubs)))
          (three-cards (list (daifugo-card-system:create-card 9 :spades)
                            (daifugo-card-system:create-card 9 :hearts)
                            (daifugo-card-system:create-card 9 :diamonds)))
          (five-cards (list (daifugo-card-system:create-card 5 :spades)
                           (daifugo-card-system:create-card 5 :hearts)
                           (daifugo-card-system:create-card 5 :diamonds)
                           (daifugo-card-system:create-card 5 :clubs)
                           (daifugo-card-system:create-card 6 :spades))))
      (and (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system mixed-ranks))
           (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system three-cards))
           (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system five-cards))))))

;;; ==========================================
;;; ゲームエンジン統合テスト
;;; ==========================================

(defun test-kakumei-game-integration ()
  "革命とゲームエンジンの統合テスト"
  (let ((game-state (daifugo-game-engine:create-game-state))
        (kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; ゲームに革命システムを統合
    (daifugo-game-engine:register-rule-system game-state kakumei-system)
    (and (daifugo-game-engine:is-rule-registered-p game-state :kakumei)
         (daifugo-game-engine:get-rule-system game-state :kakumei))))

(defun test-kakumei-turn-integration ()
  "革命ターンでの統合動作テスト"
  (let ((game-state (daifugo-game-engine:create-game-state))
        (kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 4枚の同じ数字でプレイ
    (let ((four-aces (list (daifugo-card-system:create-card 14 :spades)
                          (daifugo-card-system:create-card 14 :hearts)
                          (daifugo-card-system:create-card 14 :diamonds)
                          (daifugo-card-system:create-card 14 :clubs))))
      ;; 革命が正しく発動し、ゲーム状態に反映されることを確認
      (daifugo-game-engine:process-turn game-state 0 four-aces)
      (daifugo-kakumei:is-kakumei-active-p 
       (daifugo-game-engine:get-rule-system game-state :kakumei)))))

(defun test-kakumei-field-interaction ()
  "革命とフィールド状態の相互作用テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 通常時にフィールドに出されたカード
    (let ((field-card (daifugo-card-system:create-card 10 :hearts))
          (player-card (daifugo-card-system:create-card 5 :spades)))
      ;; 革命前：5 < 10 なので出せない
      (and (not (daifugo-kakumei:can-play-over kakumei-system player-card field-card))
           (progn
             ;; 革命発動
             (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
             ;; 革命後：5 > 10 なので出せる
             (daifugo-kakumei:can-play-over kakumei-system player-card field-card))))))

;;; ==========================================
;;; エラーハンドリング・堅牢性テスト
;;; ==========================================

(defun test-kakumei-error-handling ()
  "革命システムのエラーハンドリングテスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 無効な入力に対するエラーハンドリング
    (and (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system nil))
         (not (daifugo-kakumei:detect-kakumei-trigger kakumei-system '()))
         (handler-case
             (progn
               (daifugo-kakumei:trigger-kakumei kakumei-system nil)
               nil)  ; エラーが発生しなかった場合はテスト失敗
           (error () t)))))  ; エラーが発生した場合はテスト成功

(defun test-kakumei-state-consistency ()
  "革命状態の一貫性テスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 複数の革命操作後の状態一貫性
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)  ; 革命発動
    (daifugo-kakumei:trigger-kakumei kakumei-system :same-suit)       ; 革命解除
    (daifugo-kakumei:trigger-kakumei kakumei-system :sequence)        ; 再び革命発動
    (and (daifugo-kakumei:is-kakumei-active-p kakumei-system)
         (= (daifugo-kakumei:get-kakumei-count kakumei-system) 3))))

;;; ==========================================
;;; パフォーマンス・負荷テスト
;;; ==========================================

(defun test-kakumei-performance ()
  "革命システムのパフォーマンステスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system))
        (start-time (get-internal-real-time)))
    ;; 大量の革命操作
    (dotimes (i 1000)
      (let ((cards (list (daifugo-card-system:create-card (+ 3 (mod i 11)) :spades)
                        (daifugo-card-system:create-card (+ 3 (mod i 11)) :hearts)
                        (daifugo-card-system:create-card (+ 3 (mod i 11)) :diamonds)
                        (daifugo-card-system:create-card (+ 3 (mod i 11)) :clubs))))
        (daifugo-kakumei:detect-kakumei-trigger kakumei-system cards)))
    (let ((elapsed-time (/ (- (get-internal-real-time) start-time) 
                          internal-time-units-per-second)))
      (< elapsed-time 1.0))))  ; 1秒以内での完了を期待

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-kakumei-tests ()
  "革命ルールシステムの全テストを実行"
  (format t "~%=== 革命ルール（kakumei.lisp）テスト実行 ===~%")
  
  (let ((tests '(("革命ルールシステム作成" . test-kakumei-rule-creation)
                 ("4枚同数字革命検出" . test-kakumei-detection-four-of-kind)
                 ("同スート4枚革命検出" . test-kakumei-detection-same-suit)
                 ("階段4枚革命検出" . test-kakumei-detection-sequence)
                 ("非革命手札検証" . test-non-kakumei-hands)
                 ("革命発動・状態管理" . test-kakumei-activation)
                 ("革命解除" . test-kakumei-deactivation)
                 ("二重革命（打ち消し）" . test-double-kakumei)
                 ("革命状態永続化" . test-kakumei-state-persistence)
                 ("通常時カード強度" . test-normal-card-strength)
                 ("革命時カード強度逆転" . test-kakumei-card-strength)
                 ("通常時カード比較" . test-card-comparison-normal)
                 ("革命時カード比較" . test-card-comparison-kakumei)
                 ("革命パターン認識" . test-kakumei-pattern-recognition)
                 ("特殊革命ケース" . test-special-kakumei-cases)
                 ("無効革命パターン除外" . test-invalid-kakumei-patterns)
                 ("ゲームエンジン統合" . test-kakumei-game-integration)
                 ("革命ターン統合動作" . test-kakumei-turn-integration)
                 ("フィールド相互作用" . test-kakumei-field-interaction)
                 ("エラーハンドリング" . test-kakumei-error-handling)
                 ("状態一貫性" . test-kakumei-state-consistency)
                 ("パフォーマンス" . test-kakumei-performance)))
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
(format t "~%革命ルール（kakumei.lisp）のテストケース準備完了~%")
(format t "実装完了後に (run-kakumei-tests) を実行してください~%")