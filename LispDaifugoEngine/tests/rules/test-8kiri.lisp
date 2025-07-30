;;; test-8kiri.lisp - 8切りルールの統合テスト（包括版+簡易版統合）
;;; 
;;; 本テストは以下の機能をカバーします：
;;; - 8切りの発動条件（8のカードでフィールドをクリア）
;;; - 8切り後の場の状態リセット
;;; - 8切りと他ルールの相互作用
;;; - 特殊ケース（複数枚の8、ジョーカー含む等）
;;; - ゲームエンジンとの統合テスト
;;; - 簡易版基本機能テスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-8kiri-integrated-test
  (:use :common-lisp)
  (:export #:run-8kiri-tests #:run-simple-8kiri-tests))

(in-package :daifugo-8kiri-integrated-test)

;;; ==========================================
;;; 8切りルール基本機能テスト
;;; ==========================================

(defun test-8kiri-rule-creation ()
  "8切りルールシステムの作成テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    (and kiri-system
         (daifugo-8kiri:8kiri-system-p kiri-system)
         (= (daifugo-8kiri:get-8kiri-count kiri-system) 0)
         (daifugo-8kiri:is-8kiri-enabled-p kiri-system))))

(defun test-single-8-detection ()
  "単一8による8切り検出テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8のカードを作成
    (let ((eight-card (daifugo-card-system:create-card 8 :spades)))
      (and (daifugo-8kiri:is-8-card-p eight-card)
           (daifugo-8kiri:detect-8kiri-trigger kiri-system (list eight-card))))))

(defun test-multiple-8s-detection ()
  "複数枚8による8切り検出テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 複数の8を作成
    (let ((multiple-8s (list (daifugo-card-system:create-card 8 :spades)
                             (daifugo-card-system:create-card 8 :hearts))))
      (and (daifugo-8kiri:detect-8kiri-trigger kiri-system multiple-8s)
           (daifugo-8kiri:is-multiple-8s-p multiple-8s)))))

(defun test-non-8-cards ()
  "8以外のカードで8切りが発動しないテスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8以外のカード
    (let ((non-8-cards (list (daifugo-card-system:create-card 7 :spades)
                             (daifugo-card-system:create-card 9 :hearts)
                             (daifugo-card-system:create-card 10 :diamonds))))
      (and (not (daifugo-8kiri:detect-8kiri-trigger kiri-system non-8-cards))
           (not (daifugo-8kiri:is-8-card-p (first non-8-cards)))))))

(defun test-8-with-other-cards ()
  "8と他のカードの混合で8切りが発動しないテスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8と他のカードの混合
    (let ((mixed-cards (list (daifugo-card-system:create-card 8 :spades)
                            (daifugo-card-system:create-card 7 :hearts))))
      (not (daifugo-8kiri:detect-8kiri-trigger kiri-system mixed-cards)))))

;;; ==========================================
;;; フィールドクリア機能テスト
;;; ==========================================

(defun test-field-clear-operation ()
  "フィールドクリア操作テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; フィールドに何らかのカードがある状態を作成
    (daifugo-8kiri:set-field-cards field-state 
                                   (list (daifugo-card-system:create-card 10 :hearts)))
    (and (> (length (daifugo-8kiri:get-field-cards field-state)) 0)
         (progn
           ;; 8切り実行
           (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                        (list (daifugo-card-system:create-card 8 :spades)))
           (= (length (daifugo-8kiri:get-field-cards field-state)) 0)))))

(defun test-field-reset-properties ()
  "フィールドリセット属性テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; フィールドに縛り状態を設定
    (daifugo-8kiri:set-field-restriction field-state :suit-lock)
    (daifugo-8kiri:set-field-min-cards field-state 2)
    ;; 8切り実行
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :clubs)))
    (and (eq (daifugo-8kiri:get-field-restriction field-state) :none)
         (= (daifugo-8kiri:get-field-min-cards field-state) 1))))

(defun test-next-player-any-card ()
  "8切り後に次プレイヤーが任意カードを出せるテスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; 8切り実行
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :diamonds)))
    ;; フィールド状態確認
    (and (daifugo-8kiri:can-play-any-card-p field-state)
         (daifugo-8kiri:is-field-reset-p field-state))))

;;; ==========================================
;;; 8切り状態管理機能テスト
;;; ==========================================

(defun test-8kiri-count-tracking ()
  "8切り回数追跡テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    (and (= (daifugo-8kiri:get-8kiri-count kiri-system) 0)
         (progn
           ;; 8切り実行
           (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                        (list (daifugo-card-system:create-card 8 :spades)))
           (= (daifugo-8kiri:get-8kiri-count kiri-system) 1))
         (progn
           ;; 2回目の8切り
           (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                        (list (daifugo-card-system:create-card 8 :hearts)))
           (= (daifugo-8kiri:get-8kiri-count kiri-system) 2)))))

(defun test-8kiri-history ()
  "8切り履歴管理テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; 8切り実行
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :clubs)))
    (let ((history (daifugo-8kiri:get-8kiri-history kiri-system)))
      (and history
           (= (length history) 1)
           (daifugo-8kiri:8kiri-event-p (first history))))))

(defun test-8kiri-player-tracking ()
  "8切り実行プレイヤー追跡テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; プレイヤー1が8切り実行
    (daifugo-8kiri:execute-8kiri-by-player kiri-system field-state 1
                                           (list (daifugo-card-system:create-card 8 :spades)))
    (let ((last-event (first (daifugo-8kiri:get-8kiri-history kiri-system))))
      (and last-event
           (= (daifugo-8kiri:8kiri-event-player-id last-event) 1)))))

;;; ==========================================
;;; 特殊ケーステスト
;;; ==========================================

(defun test-8kiri-with-joker ()
  "ジョーカーを含む8切りテスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; ジョーカーが8として使われた場合
    (let ((joker-as-8 (daifugo-card-system:create-joker)))
      (daifugo-card-system:set-joker-value joker-as-8 8)
      (and (daifugo-8kiri:is-joker-8-p joker-as-8)
           (daifugo-8kiri:detect-8kiri-trigger kiri-system (list joker-as-8))))))

(defun test-four-8s-kiri ()
  "4枚の8による8切り（革命との重複）テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 4枚の8
    (let ((four-8s (list (daifugo-card-system:create-card 8 :spades)
                        (daifugo-card-system:create-card 8 :hearts)
                        (daifugo-card-system:create-card 8 :diamonds)
                        (daifugo-card-system:create-card 8 :clubs))))
      (and (daifugo-8kiri:detect-8kiri-trigger kiri-system four-8s)
           (daifugo-8kiri:is-multiple-8s-p four-8s)
           (= (length four-8s) 4)))))

(defun test-consecutive-8kiri ()
  "連続8切りテスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; 1回目の8切り
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :spades)))
    ;; 2回目の8切り（連続）
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :hearts)))
    (and (= (daifugo-8kiri:get-8kiri-count kiri-system) 2)
         (daifugo-8kiri:is-consecutive-8kiri-p 
          (daifugo-8kiri:get-8kiri-history kiri-system)))))

(defun test-8kiri-disabled ()
  "8切り無効化設定テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8切りを無効化
    (daifugo-8kiri:disable-8kiri kiri-system)
    (and (not (daifugo-8kiri:is-8kiri-enabled-p kiri-system))
         (not (daifugo-8kiri:detect-8kiri-trigger kiri-system 
                                                  (list (daifugo-card-system:create-card 8 :spades)))))))

;;; ==========================================
;;; ルール相互作用テスト
;;; ==========================================

(defun test-8kiri-with-revolution ()
  "8切りと革命の相互作用テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (kakumei-system (daifugo-kakumei:create-kakumei-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; 革命状態で8切り
    (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
    (daifugo-8kiri:execute-8kiri-with-revolution kiri-system field-state 
                                                 (list (daifugo-card-system:create-card 8 :spades))
                                                 kakumei-system)
    ;; 8切り後もフィールドはクリアされるが革命状態は継続
    (and (= (length (daifugo-8kiri:get-field-cards field-state)) 0)
         (daifugo-kakumei:is-kakumei-active-p kakumei-system))))

(defun test-8kiri-with-suit-lock ()
  "8切りとスート縛りの相互作用テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; スート縛り状態を設定
    (daifugo-8kiri:set-field-restriction field-state :suit-lock)
    (daifugo-8kiri:set-locked-suit field-state :hearts)
    ;; 8切り実行
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :spades)))
    ;; スート縛りがリセットされる
    (and (eq (daifugo-8kiri:get-field-restriction field-state) :none)
         (null (daifugo-8kiri:get-locked-suit field-state)))))

(defun test-8kiri-priority ()
  "8切りルール優先度テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8切りは他のルールより高い優先度を持つ
    (and (> (daifugo-8kiri:get-rule-priority kiri-system) 
            (daifugo-8kiri:get-standard-rule-priority))
         (daifugo-8kiri:overrides-other-rules-p kiri-system))))

;;; ==========================================
;;; ゲームエンジン統合テスト
;;; ==========================================

(defun test-8kiri-game-integration ()
  "8切りとゲームエンジンの統合テスト"
  (let ((game-state (daifugo-game-engine:create-game-state))
        (kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; ゲームに8切りシステムを統合
    (daifugo-game-engine:register-rule-system game-state kiri-system)
    (and (daifugo-game-engine:is-rule-registered-p game-state :8kiri)
         (daifugo-game-engine:get-rule-system game-state :8kiri))))

(defun test-8kiri-turn-processing ()
  "8切りターン処理テスト"
  (let ((game-state (daifugo-game-engine:create-game-state))
        (kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 8のカードでプレイ
    (let ((eight-card (daifugo-card-system:create-card 8 :hearts)))
      ;; 8切りが正しく処理され、フィールドがクリアされることを確認
      (daifugo-game-engine:process-turn game-state 0 (list eight-card))
      (let ((field-cards (daifugo-game-engine:get-field-cards game-state)))
        (= (length field-cards) 0)))))

(defun test-8kiri-chain-reaction ()
  "8切り連鎖反応テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; プレイヤー1が8切り
    (daifugo-8kiri:execute-8kiri-by-player kiri-system field-state 1
                                           (list (daifugo-card-system:create-card 8 :spades)))
    ;; プレイヤー2も8切り（連鎖）
    (daifugo-8kiri:execute-8kiri-by-player kiri-system field-state 2
                                           (list (daifugo-card-system:create-card 8 :hearts)))
    (and (= (daifugo-8kiri:get-8kiri-count kiri-system) 2)
         (daifugo-8kiri:has-chain-8kiri-p (daifugo-8kiri:get-8kiri-history kiri-system)))))

;;; ==========================================
;;; エラーハンドリング・堅牢性テスト
;;; ==========================================

(defun test-8kiri-error-handling ()
  "8切りシステムのエラーハンドリングテスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system)))
    ;; 無効な入力に対するエラーハンドリング
    (and (not (daifugo-8kiri:detect-8kiri-trigger kiri-system nil))
         (not (daifugo-8kiri:detect-8kiri-trigger kiri-system '()))
         (handler-case
             (progn
               (daifugo-8kiri:execute-8kiri kiri-system nil nil)
               nil)  ; エラーが発生しなかった場合はテスト失敗
           (error () t)))))  ; エラーが発生した場合はテスト成功

(defun test-8kiri-state-consistency ()
  "8切りシステム状態一貫性テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; 複数回8切り実行後の状態一貫性
    (dotimes (i 3)
      (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                   (list (daifugo-card-system:create-card 8 :spades))))
    (and (= (daifugo-8kiri:get-8kiri-count kiri-system) 3)
         (= (length (daifugo-8kiri:get-8kiri-history kiri-system)) 3))))

(defun test-8kiri-field-state_integrity ()
  "8切り後のフィールド状態整合性テスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    ;; 複雑なフィールド状態を設定
    (daifugo-8kiri:set-field-cards field-state 
                                   (list (daifugo-card-system:create-card 10 :hearts)
                                         (daifugo-card-system:create-card 10 :diamonds)))
    (daifugo-8kiri:set-field-restriction field-state :rank-lock)
    ;; 8切り実行
    (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                 (list (daifugo-card-system:create-card 8 :clubs)))
    ;; すべての状態がリセットされている
    (and (= (length (daifugo-8kiri:get-field-cards field-state)) 0)
         (eq (daifugo-8kiri:get-field-restriction field-state) :none)
         (= (daifugo-8kiri:get-field-min-cards field-state) 1))))

;;; ==========================================
;;; パフォーマンス・負荷テスト
;;; ==========================================

(defun test-8kiri-performance ()
  "8切りシステムのパフォーマンステスト"
  (let ((kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state))
        (start-time (get-internal-real-time)))
    ;; 大量の8切り操作
    (dotimes (i 1000)
      (daifugo-8kiri:execute-8kiri kiri-system field-state 
                                   (list (daifugo-card-system:create-card 8 :spades))))
    (let ((elapsed-time (/ (- (get-internal-real-time) start-time) 
                          internal-time-units-per-second)))
      (< elapsed-time 1.0))))  ; 1秒以内での完了を期待

;;; ==========================================
;;; 簡易版テスト（旧simple版から統合）
;;; ==========================================

;; 簡易カード構造
(defstruct simple-card-detailed rank suit)

;; 簡易8切りシステム構造
(defstruct simple-8kiri-detailed
  enabled-p
  count)

;; 簡易フィールド状態構造
(defstruct simple-field-detailed
  cards
  restriction
  reset-p)

;; 基本8切りシステム
(defun create-simple-8kiri-detailed ()
  "簡易8切りシステムを作成（詳細版）"
  (make-simple-8kiri-detailed :enabled-p t :count 0))

(defun create-simple-field-detailed ()
  "簡易フィールド状態を作成（詳細版）"
  (make-simple-field-detailed :cards nil :restriction :none :reset-p nil))

(defun simple-is-8-card-p-detailed (card)
  "8カード判定（詳細版）"
  (= (simple-card-detailed-rank card) 8))

(defun simple-detect-8kiri-detailed (kiri-system cards)
  "8切り検出（詳細版）"
  (and (simple-8kiri-detailed-enabled-p kiri-system)
       cards
       (every #'simple-is-8-card-p-detailed cards)))

(defun simple-execute-8kiri-detailed (kiri-system field-state cards)
  "8切り実行（詳細版）"
  (when (simple-detect-8kiri-detailed kiri-system cards)
    ;; フィールドをクリア
    (setf (simple-field-detailed-cards field-state) nil)
    (setf (simple-field-detailed-restriction field-state) :none)
    (setf (simple-field-detailed-reset-p field-state) t)
    ;; カウント増加
    (incf (simple-8kiri-detailed-count kiri-system))
    t))

;; 簡易版テスト関数群
(defun test-simple-8kiri-creation-detailed ()
  "8切りシステム作成テスト（詳細版）"
  (let ((kiri (create-simple-8kiri-detailed)))
    (and kiri
         (simple-8kiri-detailed-p kiri)
         (simple-8kiri-detailed-enabled-p kiri)
         (= (simple-8kiri-detailed-count kiri) 0))))

(defun test-simple-8-detection-detailed ()
  "8カード検出テスト（詳細版）"
  (let ((eight-card (make-simple-card-detailed :rank 8 :suit :spades))
        (seven-card (make-simple-card-detailed :rank 7 :suit :hearts)))
    (and (simple-is-8-card-p-detailed eight-card)
         (not (simple-is-8-card-p-detailed seven-card)))))

(defun test-simple-8kiri-trigger-detailed ()
  "8切り発動テスト（詳細版）"
  (let ((kiri (create-simple-8kiri-detailed))
        (eight-cards (list (make-simple-card-detailed :rank 8 :suit :spades))))
    (and (simple-detect-8kiri-detailed kiri eight-cards)
         (not (simple-detect-8kiri-detailed kiri 
                                           (list (make-simple-card-detailed :rank 7 :suit :hearts)))))))

(defun test-simple-field-clear-detailed ()
  "フィールドクリアテスト（詳細版）"
  (let ((kiri (create-simple-8kiri-detailed))
        (field (create-simple-field-detailed)))
    ;; フィールドにカードを配置
    (setf (simple-field-detailed-cards field) 
          (list (make-simple-card-detailed :rank 10 :suit :hearts)))
    (setf (simple-field-detailed-restriction field) :suit-lock)
    
    ;; 8切り実行
    (simple-execute-8kiri-detailed kiri field 
                          (list (make-simple-card-detailed :rank 8 :suit :spades)))
    
    ;; フィールドがクリアされている
    (and (null (simple-field-detailed-cards field))
         (eq (simple-field-detailed-restriction field) :none)
         (simple-field-detailed-reset-p field)
         (= (simple-8kiri-detailed-count kiri) 1))))

(defun test-simple-multiple-8s-detailed ()
  "複数8テスト（詳細版）"
  (let ((kiri (create-simple-8kiri-detailed))
        (field (create-simple-field-detailed))
        (multiple-8s (list (make-simple-card-detailed :rank 8 :suit :spades)
                          (make-simple-card-detailed :rank 8 :suit :hearts))))
    (and (simple-execute-8kiri-detailed kiri field multiple-8s)
         (= (simple-8kiri-detailed-count kiri) 1)
         (simple-field-detailed-reset-p field))))

(defun test-simple-8kiri-disabled-detailed ()
  "8切り無効化テスト（詳細版）"
  (let ((kiri (create-simple-8kiri-detailed))
        (field (create-simple-field-detailed)))
    ;; 8切りを無効化
    (setf (simple-8kiri-detailed-enabled-p kiri) nil)
    
    ;; 8切りが発動しない
    (and (not (simple-execute-8kiri-detailed kiri field 
                                    (list (make-simple-card-detailed :rank 8 :suit :clubs))))
         (= (simple-8kiri-detailed-count kiri) 0))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-8kiri-tests ()
  "8切りルールシステムの全テスト（包括版）を実行"
  (format t "~%=== 8切りルール（8kiri.lisp）テスト実行 ===~%")
  
  (let ((tests '(("8切りルールシステム作成" . test-8kiri-rule-creation)
                 ("単一8による8切り検出" . test-single-8-detection)
                 ("複数枚8による8切り検出" . test-multiple-8s-detection)
                 ("8以外カード除外" . test-non-8-cards)
                 ("8と他カード混合除外" . test-8-with-other-cards)
                 ("フィールドクリア操作" . test-field-clear-operation)
                 ("フィールドリセット属性" . test-field-reset-properties)
                 ("次プレイヤー任意カード" . test-next-player-any-card)
                 ("8切り回数追跡" . test-8kiri-count-tracking)
                 ("8切り履歴管理" . test-8kiri-history)
                 ("8切りプレイヤー追跡" . test-8kiri-player-tracking)
                 ("ジョーカー8切り" . test-8kiri-with-joker)
                 ("4枚8による8切り" . test-four-8s-kiri)
                 ("連続8切り" . test-consecutive-8kiri)
                 ("8切り無効化" . test-8kiri-disabled)
                 ("8切りと革命相互作用" . test-8kiri-with-revolution)
                 ("8切りとスート縛り相互作用" . test-8kiri-with-suit-lock)
                 ("8切りルール優先度" . test-8kiri-priority)
                 ("ゲームエンジン統合" . test-8kiri-game-integration)
                 ("8切りターン処理" . test-8kiri-turn-processing)
                 ("8切り連鎖反応" . test-8kiri-chain-reaction)
                 ("エラーハンドリング" . test-8kiri-error-handling)
                 ("状態一貫性" . test-8kiri-state-consistency)
                 ("フィールド状態整合性" . test-8kiri-field-state_integrity)
                 ("パフォーマンス" . test-8kiri-performance)))
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
    
    (format t "~%包括版結果: ~A合格, ~A失敗 (計25テスト関数)~%" passed failed)
    (= failed 0)))

(defun run-simple-8kiri-tests ()
  "簡易8切りテスト（軽量版）を実行"
  (format t "~%=== 簡易8切りルールテスト実行 ===~%")
  
  (let ((tests '(("8切りシステム作成" . test-simple-8kiri-creation-detailed)
                 ("8カード検出" . test-simple-8-detection-detailed)
                 ("8切り発動" . test-simple-8kiri-trigger-detailed)
                 ("フィールドクリア" . test-simple-field-clear-detailed)
                 ("複数8処理" . test-simple-multiple-8s-detailed)
                 ("8切り無効化" . test-simple-8kiri-disabled-detailed)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (if (funcall test-func)
            (progn
              (format t "合格~%")
              (incf passed))
            (progn
              (format t "失敗~%")
              (incf failed)))))
    
    (format t "~%軽量版結果: ~A合格, ~A失敗 (計6テスト)~%" passed failed)
    (= failed 0)))

;; テスト実行
(format t "~%8切りルール統合テストケース準備完了~%")
(format t "包括版実行: (run-8kiri-tests)~%")
(format t "軽量版実行: (run-simple-8kiri-tests)~%")