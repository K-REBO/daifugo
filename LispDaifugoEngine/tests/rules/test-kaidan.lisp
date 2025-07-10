;;; test-kaidan.lisp - 階段出しルール（kaidan.lisp）の包括的テスト
;;; 
;;; 本テストは以下の機能をカバーします：
;;; - 階段（連続数字）の検出・検証
;;; - 階段の強度比較（最低数字・最高数字ベース）
;;; - 階段の長さ制限・最小枚数設定
;;; - 特殊階段（ジョーカー含む、スート混合等）
;;; - 階段と他ルールの相互作用（革命・8切り等）

(load "../debug/final-test.lisp")

(defpackage :daifugo-kaidan-test
  (:use :common-lisp))

(in-package :daifugo-kaidan-test)

;;; ==========================================
;;; 階段ルール基本機能テスト
;;; ==========================================

(defun test-kaidan-rule-creation ()
  "階段ルールシステムの作成テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    (and kaidan-system
         (daifugo-kaidan:kaidan-system-p kaidan-system)
         (daifugo-kaidan:is-kaidan-enabled-p kaidan-system)
         (= (daifugo-kaidan:get-min-kaidan-length kaidan-system) 3))))

(defun test-basic-sequence-detection ()
  "基本的な階段検出テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 3-4-5の階段
    (let ((sequence-345 (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 4 :hearts)
                             (daifugo-card-system:create-card 5 :diamonds))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system sequence-345)
           (daifugo-kaidan:detect-kaidan-pattern sequence-345)
           (= (daifugo-kaidan:get-kaidan-length sequence-345) 3)))))

(defun test-longer-sequence ()
  "長い階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 6-7-8-9-10の階段
    (let ((sequence-67890 (list (daifugo-card-system:create-card 6 :spades)
                               (daifugo-card-system:create-card 7 :hearts)
                               (daifugo-card-system:create-card 8 :diamonds)
                               (daifugo-card-system:create-card 9 :clubs)
                               (daifugo-card-system:create-card 10 :spades))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system sequence-67890)
           (= (daifugo-kaidan:get-kaidan-length sequence-67890) 5)
           (= (daifugo-kaidan:get-kaidan-min-rank sequence-67890) 6)
           (= (daifugo-kaidan:get-kaidan-max-rank sequence-67890) 10)))))

(defun test-invalid-sequences ()
  "無効な階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 飛び階段（3-5-7）
    (let ((skip-sequence (list (daifugo-card-system:create-card 3 :spades)
                              (daifugo-card-system:create-card 5 :hearts)
                              (daifugo-card-system:create-card 7 :diamonds)))
          ;; 2枚だけ（最小枚数不足）
          (too-short (list (daifugo-card-system:create-card 8 :spades)
                          (daifugo-card-system:create-card 9 :hearts)))
          ;; 同じ数字
          (same-rank (list (daifugo-card-system:create-card 5 :spades)
                          (daifugo-card-system:create-card 5 :hearts)
                          (daifugo-card-system:create-card 5 :diamonds))))
      (and (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system skip-sequence))
           (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system too-short))
           (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system same-rank))))))

(defun test-sequence-with-aces ()
  "エース（A）を含む階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; Q-K-Aの階段
    (let ((qka-sequence (list (daifugo-card-system:create-card 12 :spades)
                             (daifugo-card-system:create-card 13 :hearts)
                             (daifugo-card-system:create-card 14 :diamonds)))
          ;; A-2-3の階段（Aが1として扱われる場合）
          (a23-sequence (list (daifugo-card-system:create-card 14 :spades)
                             (daifugo-card-system:create-card 2 :hearts)
                             (daifugo-card-system:create-card 3 :diamonds))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system qka-sequence)
           ;; A-2-3はルール設定による
           (or (daifugo-kaidan:is-valid-kaidan-p kaidan-system a23-sequence)
               (not (daifugo-kaidan:allows-ace-low-p kaidan-system)))))))

;;; ==========================================
;;; 階段強度比較テスト
;;; ==========================================

(defun test-kaidan-strength_comparison ()
  "階段の強度比較テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 4-5-6 vs 7-8-9
    (let ((weak-kaidan (list (daifugo-card-system:create-card 4 :spades)
                            (daifugo-card-system:create-card 5 :hearts)
                            (daifugo-card-system:create-card 6 :diamonds)))
          (strong-kaidan (list (daifugo-card-system:create-card 7 :clubs)
                              (daifugo-card-system:create-card 8 :spades)
                              (daifugo-card-system:create-card 9 :hearts))))
      (and (daifugo-kaidan:compare-kaidan kaidan-system strong-kaidan weak-kaidan)
           (not (daifugo-kaidan:compare-kaidan kaidan-system weak-kaidan strong-kaidan))))))

(defun test-same-length-comparison ()
  "同じ長さの階段の比較テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 5-6-7-8 vs 9-10-J-Q
    (let ((lower-kaidan (list (daifugo-card-system:create-card 5 :spades)
                             (daifugo-card-system:create-card 6 :hearts)
                             (daifugo-card-system:create-card 7 :diamonds)
                             (daifugo-card-system:create-card 8 :clubs)))
          (higher-kaidan (list (daifugo-card-system:create-card 9 :spades)
                              (daifugo-card-system:create-card 10 :hearts)
                              (daifugo-card-system:create-card 11 :diamonds)
                              (daifugo-card-system:create-card 12 :clubs))))
      (and (= (daifugo-kaidan:get-kaidan-length lower-kaidan)
              (daifugo-kaidan:get-kaidan-length higher-kaidan))
           (daifugo-kaidan:compare-kaidan kaidan-system higher-kaidan lower-kaidan)))))

(defun test-different-length_comparison ()
  "異なる長さの階段の比較テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 3枚階段 vs 4枚階段
    (let ((short-kaidan (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 4 :hearts)
                             (daifugo-card-system:create-card 5 :diamonds)))
          (long-kaidan (list (daifugo-card-system:create-card 6 :clubs)
                            (daifugo-card-system:create-card 7 :spades)
                            (daifugo-card-system:create-card 8 :hearts)
                            (daifugo-card-system:create-card 9 :diamonds))))
      ;; 長さが異なる場合は比較不可能
      (not (daifugo-kaidan:can-compare-kaidan-p kaidan-system short-kaidan long-kaidan)))))

(defun test-kaidan_with_revolution ()
  "革命時の階段強度テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system))
        (kakumei-system (daifugo-kakumei:create-kakumei-system)))
    ;; 革命状態で階段比較
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
    (let ((low-kaidan (list (daifugo-card-system:create-card 3 :spades)
                           (daifugo-card-system:create-card 4 :hearts)
                           (daifugo-card-system:create-card 5 :diamonds)))
          (high-kaidan (list (daifugo-card-system:create-card 10 :clubs)
                            (daifugo-card-system:create-card 11 :spades)
                            (daifugo-card-system:create-card 12 :hearts))))
      ;; 革命時は低い階段が強い
      (daifugo-kaidan:compare-kaidan-with-revolution kaidan-system 
                                                     low-kaidan high-kaidan 
                                                     kakumei-system))))

;;; ==========================================
;;; 特殊階段処理テスト
;;; ==========================================

(defun test-kaidan-with-joker ()
  "ジョーカーを含む階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 5-joker-7 (jokerが6として機能)
    (let ((joker (daifugo-card-system:create-joker))
          (five (daifugo-card-system:create-card 5 :spades))
          (seven (daifugo-card-system:create-card 7 :hearts)))
      (daifugo-card-system:set-joker-value joker 6)
      (let ((joker-kaidan (list five joker seven)))
        (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system joker-kaidan)
             (daifugo-kaidan:contains-joker-p joker-kaidan)
             (= (daifugo-kaidan:get-kaidan-length joker-kaidan) 3))))))

(defun test-multiple-jokers ()
  "複数ジョーカーを含む階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 8-joker-joker-J (jokerが9,10として機能)
    (let ((eight (daifugo-card-system:create-card 8 :spades))
          (jack (daifugo-card-system:create-card 11 :hearts))
          (joker1 (daifugo-card-system:create-joker))
          (joker2 (daifugo-card-system:create-joker)))
      (daifugo-card-system:set-joker-value joker1 9)
      (daifugo-card-system:set-joker-value joker2 10)
      (let ((multi-joker-kaidan (list eight joker1 joker2 jack)))
        (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system multi-joker-kaidan)
             (= (daifugo-kaidan:count-jokers multi-joker-kaidan) 2))))))

(defun test-suit-mixed_kaidan ()
  "スート混合階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 異なるスートの階段
    (let ((mixed-suits (list (daifugo-card-system:create-card 6 :spades)
                            (daifugo-card-system:create-card 7 :hearts)
                            (daifugo-card-system:create-card 8 :diamonds)
                            (daifugo-card-system:create-card 9 :clubs))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system mixed-suits)
           (daifugo-kaidan:is-suit-mixed-p mixed-suits)))))

(defun test-same-suit_kaidan ()
  "同スート階段のテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 同じスートの階段
    (let ((same-suit (list (daifugo-card-system:create-card 4 :hearts)
                          (daifugo-card-system:create-card 5 :hearts)
                          (daifugo-card-system:create-card 6 :hearts))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system same-suit)
           (not (daifugo-kaidan:is-suit-mixed-p same-suit))
           (daifugo-kaidan:is-same-suit-kaidan-p same-suit)))))

;;; ==========================================
;;; 階段設定・カスタマイズテスト
;;; ==========================================

(defun test-kaidan-length_settings ()
  "階段長さ設定テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 最小長さを4に変更
    (daifugo-kaidan:set-min-kaidan-length kaidan-system 4)
    (let ((short-kaidan (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 4 :hearts)
                             (daifugo-card-system:create-card 5 :diamonds)))
          (valid-kaidan (list (daifugo-card-system:create-card 6 :clubs)
                             (daifugo-card-system:create-card 7 :spades)
                             (daifugo-card-system:create-card 8 :hearts)
                             (daifugo-card-system:create-card 9 :diamonds))))
      (and (= (daifugo-kaidan:get-min-kaidan-length kaidan-system) 4)
           (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system short-kaidan))
           (daifugo-kaidan:is-valid-kaidan-p kaidan-system valid-kaidan)))))

(defun test-kaidan-disable ()
  "階段機能無効化テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 階段を無効化
    (daifugo-kaidan:disable-kaidan kaidan-system)
    (let ((sequence (list (daifugo-card-system:create-card 5 :spades)
                         (daifugo-card-system:create-card 6 :hearts)
                         (daifugo-card-system:create-card 7 :diamonds))))
      (and (not (daifugo-kaidan:is-kaidan-enabled-p kaidan-system))
           (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system sequence))))))

(defun test-ace-handling_modes ()
  "エース処理モードテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; エースの低位使用を許可
    (daifugo-kaidan:set-ace-mode kaidan-system :allow-low)
    (let ((ace-low-sequence (list (daifugo-card-system:create-card 14 :spades)  ; A
                                 (daifugo-card-system:create-card 2 :hearts)
                                 (daifugo-card-system:create-card 3 :diamonds))))
      (and (daifugo-kaidan:allows-ace-low-p kaidan-system)
           (daifugo-kaidan:is-valid-kaidan-p kaidan-system ace-low-sequence)))))

(defun test-kaidan-strength_mode ()
  "階段強度計算モードテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 最高位ベースの強度計算に変更
    (daifugo-kaidan:set-strength-mode kaidan-system :max-rank)
    (and (eq (daifugo-kaidan:get-strength-mode kaidan-system) :max-rank)
         (daifugo-kaidan:uses-max-rank-strength-p kaidan-system))))

;;; ==========================================
;;; ルール相互作用テスト
;;; ==========================================

(defun test-kaidan-with-8kiri ()
  "階段と8切りの相互作用テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system))
        (kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8を含む階段
    (let ((kaidan-with-8 (list (daifugo-card-system:create-card 7 :spades)
                              (daifugo-card-system:create-card 8 :hearts)
                              (daifugo-card-system:create-card 9 :diamonds))))
      ;; 階段として出すか8切りとするかはプレイヤーの選択
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system kaidan-with-8)
           (daifugo-8kiri:is-8-card-p (second kaidan-with-8))
           (daifugo-kaidan:has-conflict-with-8kiri-p kaidan-with-8)))))

(defun test-kaidan-rule_priority ()
  "階段ルール優先度テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 階段ルールの優先度確認
    (and (> (daifugo-kaidan:get-rule-priority kaidan-system) 0)
         (< (daifugo-kaidan:get-rule-priority kaidan-system) 
            (daifugo-8kiri:get-rule-priority (daifugo-8kiri:create-8kiri-system))))))

(defun test-kaidan-field_interaction ()
  "階段とフィールド状態の相互作用テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system))
        (field-state (daifugo-kaidan:create-field-state)))
    ;; フィールドに階段を配置
    (let ((kaidan (list (daifugo-card-system:create-card 5 :spades)
                       (daifugo-card-system:create-card 6 :hearts)
                       (daifugo-card-system:create-card 7 :diamonds))))
      (daifugo-kaidan:place-kaidan-on-field field-state kaidan)
      (and (daifugo-kaidan:field-has-kaidan-p field-state)
           (= (daifugo-kaidan:get-field-kaidan-length field-state) 3)))))

;;; ==========================================
;;; ゲームエンジン統合テスト
;;; ==========================================

(defun test-kaidan-game_integration ()
  "階段とゲームエンジンの統合テスト"
  (let ((game-state (daifugo-game-engine:create-game-state))
        (kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; ゲームに階段システムを統合
    (daifugo-game-engine:register-rule-system game-state kaidan-system)
    (and (daifugo-game-engine:is-rule-registered-p game-state :kaidan)
         (daifugo-game-engine:get-rule-system game-state :kaidan))))

(defun test-kaidan-turn_processing ()
  "階段ターン処理テスト"
  (let ((game-state (daifugo-game-engine:create-game-state))
        (kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 階段でプレイ
    (let ((kaidan (list (daifugo-card-system:create-card 4 :spades)
                       (daifugo-card-system:create-card 5 :hearts)
                       (daifugo-card-system:create-card 6 :diamonds))))
      ;; 階段プレイが正しく処理されることを確認
      (daifugo-game-engine:process-turn game-state 0 kaidan)
      (let ((field-cards (daifugo-game-engine:get-field-cards game-state)))
        (and (= (length field-cards) 3)
             (daifugo-kaidan:is-valid-kaidan-p kaidan-system field-cards))))))

(defun test-kaidan-vs-kaidan ()
  "階段対階段の勝負テスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system))
        (field-state (daifugo-kaidan:create-field-state)))
    ;; フィールドに弱い階段
    (let ((field-kaidan (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 4 :hearts)
                             (daifugo-card-system:create-card 5 :diamonds)))
          ;; プレイヤーが強い階段
          (player-kaidan (list (daifugo-card-system:create-card 8 :clubs)
                              (daifugo-card-system:create-card 9 :spades)
                              (daifugo-card-system:create-card 10 :hearts))))
      (daifugo-kaidan:place-kaidan-on-field field-state field-kaidan)
      (and (daifugo-kaidan:can-play-kaidan-over kaidan-system player-kaidan field-state)
           (daifugo-kaidan:play-kaidan-over kaidan-system player-kaidan field-state)))))

;;; ==========================================
;;; エラーハンドリング・堅牢性テスト
;;; ==========================================

(defun test-kaidan-error_handling ()
  "階段システムのエラーハンドリングテスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 無効な入力に対するエラーハンドリング
    (and (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system nil))
         (not (daifugo-kaidan:is-valid-kaidan-p kaidan-system '()))
         (handler-case
             (progn
               (daifugo-kaidan:compare-kaidan kaidan-system nil nil)
               nil)  ; エラーが発生しなかった場合はテスト失敗
           (error () t)))))  ; エラーが発生した場合はテスト成功

(defun test-kaidan-boundary_cases ()
  "階段の境界ケーステスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    ;; 最高位での階段（Q-K-A）
    (let ((high-sequence (list (daifugo-card-system:create-card 12 :spades)
                              (daifugo-card-system:create-card 13 :hearts)
                              (daifugo-card-system:create-card 14 :diamonds)))
          ;; 最低位での階段（A-2-3、Aが1として扱われる場合）
          (low-sequence (list (daifugo-card-system:create-card 14 :spades)
                             (daifugo-card-system:create-card 2 :hearts)
                             (daifugo-card-system:create-card 3 :diamonds))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system high-sequence)
           ;; 低位Aの扱いは設定による
           (or (daifugo-kaidan:is-valid-kaidan-p kaidan-system low-sequence)
               (not (daifugo-kaidan:allows-ace-low-p kaidan-system)))))))

(defun test-kaidan-performance ()
  "階段システムのパフォーマンステスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system))
        (start-time (get-internal-real-time)))
    ;; 大量の階段検証操作
    (dotimes (i 1000)
      (let ((cards (list (daifugo-card-system:create-card (+ 3 (mod i 8)) :spades)
                        (daifugo-card-system:create-card (+ 4 (mod i 8)) :hearts)
                        (daifugo-card-system:create-card (+ 5 (mod i 8)) :diamonds))))
        (daifugo-kaidan:is-valid-kaidan-p kaidan-system cards)))
    (let ((elapsed-time (/ (- (get-internal-real-time) start-time) 
                          internal-time-units-per-second)))
      (< elapsed-time 1.0))))  ; 1秒以内での完了を期待

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-kaidan-tests ()
  "階段ルールシステムの全テストを実行"
  (format t "~%=== 階段出しルール（kaidan.lisp）テスト実行 ===~%")
  
  (let ((tests '(("階段ルールシステム作成" . test-kaidan-rule-creation)
                 ("基本階段検出" . test-basic-sequence-detection)
                 ("長い階段" . test-longer-sequence)
                 ("無効階段除外" . test-invalid-sequences)
                 ("エース含む階段" . test-sequence-with-aces)
                 ("階段強度比較" . test-kaidan-strength_comparison)
                 ("同長階段比較" . test-same-length-comparison)
                 ("異長階段比較" . test-different-length_comparison)
                 ("革命時階段強度" . test-kaidan_with-revolution)
                 ("ジョーカー階段" . test-kaidan-with-joker)
                 ("複数ジョーカー階段" . test-multiple-jokers)
                 ("スート混合階段" . test-suit-mixed_kaidan)
                 ("同スート階段" . test-same-suit_kaidan)
                 ("階段長さ設定" . test-kaidan-length_settings)
                 ("階段機能無効化" . test-kaidan-disable)
                 ("エース処理モード" . test-ace-handling_modes)
                 ("階段強度計算モード" . test-kaidan-strength_mode)
                 ("階段と8切り相互作用" . test-kaidan-with-8kiri)
                 ("階段ルール優先度" . test-kaidan-rule_priority)
                 ("階段フィールド相互作用" . test-kaidan-field_interaction)
                 ("ゲームエンジン統合" . test-kaidan-game_integration)
                 ("階段ターン処理" . test-kaidan-turn_processing)
                 ("階段対階段勝負" . test-kaidan-vs-kaidan)
                 ("エラーハンドリング" . test-kaidan-error_handling)
                 ("境界ケース" . test-kaidan-boundary_cases)
                 ("パフォーマンス" . test-kaidan-performance)))
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
(format t "~%階段出しルール（kaidan.lisp）のテストケース準備完了~%")
(format t "実装完了後に (run-kaidan-tests) を実行してください~%")