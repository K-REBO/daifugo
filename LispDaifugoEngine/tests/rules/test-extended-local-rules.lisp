;;; test-extended-local-rules.lisp - 拡張ローカルルール（11バック・スート縛り・スペ3返し・都落ち）の包括的テスト
;;; 
;;; 本テストは以下の拡張ローカルルールをカバーします：
;;; - 11バック（イレブンバック）ルール
;;; - スート縛り（マーク縛り）ルール  
;;; - スペ3返し（スペード3返し）ルール
;;; - 都落ち（みやこおち）ルール

(load "../debug/final-test.lisp")

(defpackage :daifugo-extended-local-rules-test
  (:use :common-lisp))

(in-package :daifugo-extended-local-rules-test)

;;; ==========================================
;;; 11バック（イレブンバック）ルールテスト
;;; ==========================================

(defun test-11back-system-creation ()
  "11バックシステムの作成テスト"
  (let ((back11-system (daifugo-11back:create-11back-system)))
    (and back11-system
         (daifugo-11back:11back-system-p back11-system)
         (daifugo-11back:is-11back-enabled-p back11-system)
         (daifugo-11back:get-11back-settings back11-system))))

(defun test-11back-trigger-detection ()
  "11バックトリガー検出テスト"
  (let ((back11-system (daifugo-11back:create-11back-system)))
    (let ((jack-cards (list (daifugo-card-system:create-card 11 :spades)
                           (daifugo-card-system:create-card 11 :hearts))))
      (and (daifugo-11back:detect-11back-trigger back11-system jack-cards)
           (daifugo-11back:is-valid-11back-play-p back11-system jack-cards)
           (daifugo-11back:get-11back-type jack-cards)))))

(defun test-11back-card-strength-reversal ()
  "11バックによるカード強度逆転テスト"
  (let ((back11-system (daifugo-11back:create-11back-system)))
    ;; 11バック発動前
    (let ((before-active (daifugo-11back:compare-card-strength back11-system 
                                                               (daifugo-card-system:create-card 3 :hearts)
                                                               (daifugo-card-system:create-card 4 :spades))))
      ;; 11バック発動
      (daifugo-11back:trigger-11back back11-system :jack-pair)
      ;; 11バック発動後
      (let ((after-active (daifugo-11back:compare-card-strength back11-system 
                                                                (daifugo-card-system:create-card 3 :hearts)
                                                                (daifugo-card-system:create-card 4 :spades))))
        (and before-active after-active
             (not (eq before-active after-active)))))))

(defun test-11back-multiple-triggers ()
  "11バック複数回発動テスト"
  (let ((back11-system (daifugo-11back:create-11back-system)))
    ;; 1回目発動
    (daifugo-11back:trigger-11back back11-system :jack-single)
    (let ((first-state (daifugo-11back:is-11back-active-p back11-system)))
      ;; 2回目発動
      (daifugo-11back:trigger-11back back11-system :jack-single)
      (let ((second-state (daifugo-11back:is-11back-active-p back11-system)))
        ;; 奇数回で有効、偶数回で無効
        (and first-state (not second-state))))))

(defun test-11back-game-integration ()
  "11バックのゲーム統合テスト"
  (let ((back11-system (daifugo-11back:create-11back-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; ゲーム統合
    (daifugo-11back:integrate-with-game back11-system game-state)
    ;; 11バック機能の有効性確認
    (and (daifugo-11back:is-integrated-with-game-p back11-system game-state)
         (daifugo-11back:can-trigger-in-game-p back11-system game-state)
         (daifugo-11back:get-game-integration-status back11-system))))

(defun test-11back-history-tracking ()
  "11バック履歴追跡テスト"
  (let ((back11-system (daifugo-11back:create-11back-system)))
    ;; 履歴記録有効化
    (daifugo-11back:enable-history-tracking back11-system)
    ;; 複数回発動
    (daifugo-11back:trigger-11back back11-system :jack-single)
    (daifugo-11back:trigger-11back back11-system :jack-pair)
    (daifugo-11back:trigger-11back back11-system :jack-single)
    ;; 履歴確認
    (let ((history (daifugo-11back:get-11back-history back11-system)))
      (and history
           (= (length history) 3)
           (daifugo-11back:get-trigger-count-by-type history :jack-single)
           (daifugo-11back:get-trigger-count-by-type history :jack-pair)))))

;;; ==========================================
;;; スート縛り（マーク縛り）ルールテスト
;;; ==========================================

(defun test-suit-binding-system-creation ()
  "スート縛りシステムの作成テスト"
  (let ((suit-binding-system (daifugo-suit-binding:create-suit-binding-system)))
    (and suit-binding-system
         (daifugo-suit-binding:suit-binding-system-p suit-binding-system)
         (daifugo-suit-binding:is-suit-binding-enabled-p suit-binding-system)
         (daifugo-suit-binding:get-binding-settings suit-binding-system))))

(defun test-suit-binding-detection ()
  "スート縛り検出テスト"
  (let ((suit-binding-system (daifugo-suit-binding:create-suit-binding-system)))
    ;; 同一スートのカード群
    (let ((spade-cards (list (daifugo-card-system:create-card 3 :spades)
                           (daifugo-card-system:create-card 4 :spades)
                           (daifugo-card-system:create-card 5 :spades))))
      (and (daifugo-suit-binding:detect-suit-binding suit-binding-system spade-cards)
           (daifugo-suit-binding:is-valid-binding-play-p suit-binding-system spade-cards)
           (eq (daifugo-suit-binding:get-binding-suit spade-cards) :spades)))))

(defun test-suit-binding-enforcement ()
  "スート縛り強制テスト"
  (let ((suit-binding-system (daifugo-suit-binding:create-suit-binding-system)))
    ;; スート縛り発動
    (daifugo-suit-binding:activate-suit-binding suit-binding-system :hearts)
    ;; 縛り状態確認
    (and (daifugo-suit-binding:is-suit-binding-active-p suit-binding-system)
         (eq (daifugo-suit-binding:get-active-binding-suit suit-binding-system) :hearts)
         ;; ハート以外のカードが無効
         (not (daifugo-suit-binding:is-valid-play-under-binding suit-binding-system 
                                                                (list (daifugo-card-system:create-card 7 :spades))))
         ;; ハートのカードが有効
         (daifugo-suit-binding:is-valid-play-under-binding suit-binding-system 
                                                           (list (daifugo-card-system:create-card 7 :hearts))))))

(defun test-suit-binding-release ()
  "スート縛り解除テスト"
  (let ((suit-binding-system (daifugo-suit-binding:create-suit-binding-system)))
    ;; 縛り発動
    (daifugo-suit-binding:activate-suit-binding suit-binding-system :diamonds)
    ;; 縛り解除条件
    (daifugo-suit-binding:release-suit-binding suit-binding-system :turn-end)
    ;; 解除確認
    (and (not (daifugo-suit-binding:is-suit-binding-active-p suit-binding-system))
         (null (daifugo-suit-binding:get-active-binding-suit suit-binding-system))
         ;; 全スートが再び有効
         (daifugo-suit-binding:is-valid-play-under-binding suit-binding-system 
                                                           (list (daifugo-card-system:create-card 6 :clubs))))))

(defun test-suit-binding-multiple-cards ()
  "スート縛り複数枚テスト"
  (let ((suit-binding-system (daifugo-suit-binding:create-suit-binding-system)))
    ;; 複数枚同一スート
    (let ((club-pairs (list (daifugo-card-system:create-card 8 :clubs)
                          (daifugo-card-system:create-card 8 :clubs))))
      ;; 異スート混合
      (let ((mixed-pairs (list (daifugo-card-system:create-card 9 :hearts)
                             (daifugo-card-system:create-card 9 :spades))))
        (and (daifugo-suit-binding:detect-suit-binding suit-binding-system club-pairs)
             (not (daifugo-suit-binding:detect-suit-binding suit-binding-system mixed-pairs)))))))

(defun test-suit-binding-chain-reaction ()
  "スート縛り連鎖反応テスト"
  (let ((suit-binding-system (daifugo-suit-binding:create-suit-binding-system)))
    ;; 縛り有効化
    (daifugo-suit-binding:enable-chain-reaction suit-binding-system)
    ;; 初回縛り
    (daifugo-suit-binding:activate-suit-binding suit-binding-system :spades)
    ;; 同一スートでの追加プレイ
    (daifugo-suit-binding:process-binding-play suit-binding-system 
                                               (list (daifugo-card-system:create-card 10 :spades)))
    ;; 連鎖状態確認
    (and (daifugo-suit-binding:is-chain-reaction-active-p suit-binding-system)
         (> (daifugo-suit-binding:get-chain-count suit-binding-system) 1))))

;;; ==========================================
;;; スペ3返し（スペード3返し）ルールテスト
;;; ==========================================

(defun test-spade3-return-system-creation ()
  "スペ3返しシステムの作成テスト"
  (let ((spade3-system (daifugo-spade3-return:create-spade3-return-system)))
    (and spade3-system
         (daifugo-spade3-return:spade3-return-system-p spade3-system)
         (daifugo-spade3-return:is-spade3-return-enabled-p spade3-system)
         (daifugo-spade3-return:get-return-settings spade3-system))))

(defun test-spade3-detection ()
  "スペード3検出テスト"
  (let ((spade3-system (daifugo-spade3-return:create-spade3-return-system)))
    (let ((spade3-card (daifugo-card-system:create-card 3 :spades))
          (other-card (daifugo-card-system:create-card 3 :hearts)))
      (and (daifugo-spade3-return:is-spade3-p spade3-system spade3-card)
           (not (daifugo-spade3-return:is-spade3-p spade3-system other-card))
           (daifugo-spade3-return:detect-spade3-play spade3-system (list spade3-card))))))

(defun test-spade3-return-trigger ()
  "スペ3返し発動テスト"
  (let ((spade3-system (daifugo-spade3-return:create-spade3-return-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; ゲーム状態設定
    (daifugo-spade3-return:setup-game-context spade3-system game-state)
    ;; スペード3プレイ
    (let ((spade3-play (list (daifugo-card-system:create-card 3 :spades))))
      (daifugo-spade3-return:process-spade3-play spade3-system spade3-play)
      ;; 返し効果確認
      (and (daifugo-spade3-return:is-return-triggered-p spade3-system)
           (daifugo-spade3-return:get-return-target spade3-system)
           (daifugo-spade3-return:get-return-effect spade3-system)))))

(defun test-spade3-return-conditions ()
  "スペ3返し条件テスト"
  (let ((spade3-system (daifugo-spade3-return:create-spade3-return-system)))
    ;; 各種条件設定
    (daifugo-spade3-return:set-return-condition spade3-system :only-when-last-card t)
    (daifugo-spade3-return:set-return-condition spade3-system :skip-joker-holder t)
    (daifugo-spade3-return:set-return-condition spade3-system :double-return-on-revolution t)
    ;; 条件確認
    (and (daifugo-spade3-return:get-return-condition spade3-system :only-when-last-card)
         (daifugo-spade3-return:get-return-condition spade3-system :skip-joker-holder)
         (daifugo-spade3-return:get-return-condition spade3-system :double-return-on-revolution))))

(defun test-spade3-return-target-selection ()
  "スペ3返し対象選択テスト"
  (let ((spade3-system (daifugo-spade3-return:create-spade3-return-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; 複数プレイヤー設定
    (daifugo-spade3-return:setup-multiplayer-context spade3-system game-state 4)
    ;; 対象選択戦略設定
    (daifugo-spade3-return:set-target-strategy spade3-system :richest-player)
    ;; スペ3返し実行
    (daifugo-spade3-return:execute-spade3-return spade3-system 0)  ; Player 0がスペ3使用
    ;; 対象確認
    (let ((target (daifugo-spade3-return:get-selected-target spade3-system)))
      (and target
           (numberp target)
           (/= target 0)  ; 自分以外が対象
           (daifugo-spade3-return:is-valid-target-p spade3-system target)))))

(defun test-spade3-return-effect-application ()
  "スペ3返し効果適用テスト"
  (let ((spade3-system (daifugo-spade3-return:create-spade3-return-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; 効果タイプ設定
    (daifugo-spade3-return:set-return-effect spade3-system :hand-exchange)
    ;; 効果適用前の状態記録
    (let ((before-state (daifugo-spade3-return:capture-game-state spade3-system game-state)))
      ;; スペ3返し実行
      (daifugo-spade3-return:apply-return-effect spade3-system game-state 0 1)
      ;; 効果適用後の確認
      (let ((after-state (daifugo-spade3-return:capture-game-state spade3-system game-state)))
        (and before-state after-state
             (daifugo-spade3-return:has-state-changed-p before-state after-state)
             (daifugo-spade3-return:is-effect-applied-p spade3-system))))))

;;; ==========================================
;;; 都落ち（みやこおち）ルールテスト
;;; ==========================================

(defun test-miyako-ochi-system-creation ()
  "都落ちシステムの作成テスト"
  (let ((miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system)))
    (and miyako-system
         (daifugo-miyako-ochi:miyako-ochi-system-p miyako-system)
         (daifugo-miyako-ochi:is-miyako-ochi-enabled-p miyako-system)
         (daifugo-miyako-ochi:get-ochi-settings miyako-system))))

(defun test-miyako-ochi-trigger-conditions ()
  "都落ち発動条件テスト"
  (let ((miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; ゲーム状態設定（大富豪プレイヤー）
    (daifugo-miyako-ochi:set-player-rank game-state 0 :daifugo)
    (daifugo-miyako-ochi:set-player-rank game-state 1 :fugo)
    (daifugo-miyako-ochi:set-player-rank game-state 2 :heimin)
    (daifugo-miyako-ochi:set-player-rank game-state 3 :daihinmin)
    ;; 都落ち条件確認
    (and (daifugo-miyako-ochi:check-ochi-conditions miyako-system game-state 0)
         (daifugo-miyako-ochi:is-eligible-for-ochi-p miyako-system 0)
         (daifugo-miyako-ochi:get-ochi-trigger-type miyako-system))))

(defun test-miyako-ochi-execution ()
  "都落ち実行テスト"
  (let ((miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; 都落ち発動前の階級
    (daifugo-miyako-ochi:set-player-rank game-state 0 :daifugo)
    (let ((before-rank (daifugo-miyako-ochi:get-player-rank game-state 0)))
      ;; 都落ち実行
      (daifugo-miyako-ochi:execute-miyako-ochi miyako-system game-state 0)
      ;; 都落ち後の階級
      (let ((after-rank (daifugo-miyako-ochi:get-player-rank game-state 0)))
        (and (eq before-rank :daifugo)
             (eq after-rank :daihinmin)
             (daifugo-miyako-ochi:is-ochi-executed-p miyako-system 0))))))

(defun test-miyako-ochi-prevention ()
  "都落ち防止テスト"
  (let ((miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; 防止条件設定
    (daifugo-miyako-ochi:set-prevention-rule miyako-system :joker-protection t)
    (daifugo-miyako-ochi:set-prevention-rule miyako-system :revolution-immunity t)
    ;; プレイヤーにジョーカー付与
    (daifugo-miyako-ochi:give-joker-to-player game-state 0)
    ;; 都落ち実行試行
    (daifugo-miyako-ochi:attempt-miyako-ochi miyako-system game-state 0)
    ;; 防止確認
    (and (not (daifugo-miyako-ochi:is-ochi-executed-p miyako-system 0))
         (daifugo-miyako-ochi:is-ochi-prevented-p miyako-system 0)
         (eq (daifugo-miyako-ochi:get-prevention-reason miyako-system 0) :joker-protection))))

(defun test-miyako-ochi-compensation ()
  "都落ち補償テスト"
  (let ((miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; 補償設定有効化
    (daifugo-miyako-ochi:enable-compensation miyako-system)
    (daifugo-miyako-ochi:set-compensation-type miyako-system :card-exchange)
    ;; 都落ち実行
    (daifugo-miyako-ochi:execute-miyako-ochi miyako-system game-state 0)
    ;; 補償適用
    (daifugo-miyako-ochi:apply-compensation miyako-system game-state 0)
    ;; 補償確認
    (and (daifugo-miyako-ochi:is-compensation-applied-p miyako-system 0)
         (daifugo-miyako-ochi:get-compensation-details miyako-system 0)
         (daifugo-miyako-ochi:is-compensation-fair-p miyako-system 0))))

(defun test-miyako-ochi-statistics ()
  "都落ち統計テスト"
  (let ((miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system)))
    ;; 統計記録有効化
    (daifugo-miyako-ochi:enable-statistics miyako-system)
    ;; 複数回都落ちシミュレーション
    (dotimes (i 5)
      (let ((game-state (daifugo-game-engine:create-game-state)))
        (daifugo-miyako-ochi:simulate-ochi-scenario miyako-system game-state i)))
    ;; 統計確認
    (let ((stats (daifugo-miyako-ochi:get-ochi-statistics miyako-system)))
      (and stats
           (> (daifugo-miyako-ochi:get-total-ochi-count stats) 0)
           (daifugo-miyako-ochi:get-ochi-frequency stats)
           (daifugo-miyako-ochi:get-prevention-rate stats)))))

;;; ==========================================
;;; 統合テスト：複数ルール組み合わせ
;;; ==========================================

(defun test-multiple-rules-interaction ()
  "複数ルール相互作用テスト"
  (let ((back11-system (daifugo-11back:create-11back-system))
        (suit-binding-system (daifugo-suit-binding:create-suit-binding-system))
        (spade3-system (daifugo-spade3-return:create-spade3-return-system))
        (miyako-system (daifugo-miyako-ochi:create-miyako-ochi-system))
        (game-state (daifugo-game-engine:create-game-state)))
    ;; 全ルール統合
    (daifugo-extended-rules:integrate-all-rules game-state 
                                                back11-system 
                                                suit-binding-system 
                                                spade3-system 
                                                miyako-system)
    ;; 複合効果テスト
    (and (daifugo-extended-rules:are-rules-compatible-p back11-system suit-binding-system)
         (daifugo-extended-rules:check-rule-precedence spade3-system miyako-system)
         (daifugo-extended-rules:validate-rule-integration game-state))))

(defun test-rule-priority-resolution ()
  "ルール優先度解決テスト"
  (let ((rule-manager (daifugo-extended-rules:create-rule-manager)))
    ;; 各ルール登録
    (daifugo-extended-rules:register-rule rule-manager :11back 90)
    (daifugo-extended-rules:register-rule rule-manager :suit-binding 80)
    (daifugo-extended-rules:register-rule rule-manager :spade3-return 70)
    (daifugo-extended-rules:register-rule rule-manager :miyako-ochi 60)
    ;; 競合状況での優先度解決
    (let ((conflict-scenario (daifugo-extended-rules:create-conflict-scenario)))
      (daifugo-extended-rules:add-conflicting-rules conflict-scenario :11back :suit-binding)
      (let ((resolution (daifugo-extended-rules:resolve-rule-conflict rule-manager conflict-scenario)))
        (and resolution
             (daifugo-extended-rules:is-valid-resolution-p resolution)
             (eq (daifugo-extended-rules:get-winning-rule resolution) :11back))))))

(defun test-rule-combination_effects ()
  "ルール組み合わせ効果テスト"
  (let ((game-state (daifugo-game-engine:create-game-state)))
    ;; 11バック + スート縛り
    (daifugo-extended-rules:activate-rule-combination game-state :11back :suit-binding)
    ;; スペ3返し + 都落ち
    (daifugo-extended-rules:activate-rule-combination game-state :spade3-return :miyako-ochi)
    ;; 組み合わせ効果確認
    (and (daifugo-extended-rules:is-combination-active-p game-state :11back :suit-binding)
         (daifugo-extended-rules:get-combination-effect game-state :spade3-return :miyako-ochi)
         (daifugo-extended-rules:validate-combination-state game-state))))

;;; ==========================================
;;; パフォーマンス・ストレステスト
;;; ==========================================

(defun test-extended-rules-performance ()
  "拡張ルール性能テスト"
  (let ((rule-systems (list (daifugo-11back:create-11back-system)
                           (daifugo-suit-binding:create-suit-binding-system)
                           (daifugo-spade3-return:create-spade3-return-system)
                           (daifugo-miyako-ochi:create-miyako-ochi-system))))
    ;; 大量プレイシミュレーション
    (dotimes (i 1000)
      (let ((game-state (daifugo-game-engine:create-game-state)))
        (dolist (system rule-systems)
          (daifugo-extended-rules:process-rule-system system game-state))))
    ;; 性能メトリクス確認
    (let ((metrics (daifugo-extended-rules:get-performance-metrics)))
      (and (< (daifugo-extended-rules:get-average-processing-time metrics) 0.01)
           (= (daifugo-extended-rules:get-total-processed-games metrics) 1000)
           (< (daifugo-extended-rules:get-memory-usage metrics) 50000000)))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-extended-local-rules-tests ()
  "拡張ローカルルールの全テストを実行"
  (format t "~%=== 拡張ローカルルール（11バック・スート縛り・スペ3返し・都落ち）テスト実行 ===~%")
  
  (let ((tests '(;; 11バックルールテスト
                 ("11バックシステム作成" . test-11back-system-creation)
                 ("11バックトリガー検出" . test-11back-trigger-detection)
                 ("11バックカード強度逆転" . test-11back-card-strength-reversal)
                 ("11バック複数回発動" . test-11back-multiple-triggers)
                 ("11バックゲーム統合" . test-11back-game-integration)
                 ("11バック履歴追跡" . test-11back-history-tracking)
                 ;; スート縛りルールテスト
                 ("スート縛りシステム作成" . test-suit-binding-system-creation)
                 ("スート縛り検出" . test-suit-binding-detection)
                 ("スート縛り強制" . test-suit-binding-enforcement)
                 ("スート縛り解除" . test-suit-binding-release)
                 ("スート縛り複数枚" . test-suit-binding-multiple-cards)
                 ("スート縛り連鎖反応" . test-suit-binding-chain-reaction)
                 ;; スペ3返しルールテスト
                 ("スペ3返しシステム作成" . test-spade3-return-system-creation)
                 ("スペード3検出" . test-spade3-detection)
                 ("スペ3返し発動" . test-spade3-return-trigger)
                 ("スペ3返し条件" . test-spade3-return-conditions)
                 ("スペ3返し対象選択" . test-spade3-return-target-selection)
                 ("スペ3返し効果適用" . test-spade3-return-effect-application)
                 ;; 都落ちルールテスト
                 ("都落ちシステム作成" . test-miyako-ochi-system-creation)
                 ("都落ち発動条件" . test-miyako-ochi-trigger-conditions)
                 ("都落ち実行" . test-miyako-ochi-execution)
                 ("都落ち防止" . test-miyako-ochi-prevention)
                 ("都落ち補償" . test-miyako-ochi-compensation)
                 ("都落ち統計" . test-miyako-ochi-statistics)
                 ;; 統合テスト
                 ("複数ルール相互作用" . test-multiple-rules-interaction)
                 ("ルール優先度解決" . test-rule-priority-resolution)
                 ("ルール組み合わせ効果" . test-rule-combination_effects)
                 ("拡張ルール性能" . test-extended-rules-performance)))
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
(format t "~%拡張ローカルルール（11バック・スート縛り・スペ3返し・都落ち）のテストケース準備完了~%")
(format t "実装完了後に (run-extended-local-rules-tests) を実行してください~%")