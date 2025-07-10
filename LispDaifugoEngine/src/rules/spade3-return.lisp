;;; spade3-return.lisp - スペ3返し（スペード3返し）ルール実装
;;; 
;;; スペ3返しルール：
;;; - スペードの3を出すと特定プレイヤーに返し効果を発動
;;; - 対象選択は戦略に応じて決まる（最も手札の多い人、大富豪等）
;;; - 返し効果は手札交換、階級変更、特殊効果等
;;; - 特定条件下では発動しない場合もある

(defpackage :daifugo-spade3-return
  (:use :common-lisp)
  (:export ;; === 基本システム機能 ===
           #:create-spade3-return-system   ; スペ3返しシステム作成
           #:spade3-return-system-p        ; スペ3返しシステム判定
           #:is-spade3-return-enabled-p    ; スペ3返し有効状態確認
           #:get-return-settings           ; 返し設定取得
           
           ;; === スペード3検出・発動 ===
           #:is-spade3-p                   ; スペード3判定
           #:detect-spade3-play            ; スペ3プレイ検出
           #:process-spade3-play           ; スペ3プレイ処理
           #:is-return-triggered-p         ; 返し効果発動確認
           
           ;; === 返し効果制御 ===
           #:get-return-target             ; 返し対象取得
           #:get-return-effect             ; 返し効果取得
           #:set-return-condition          ; 返し条件設定
           #:get-return-condition          ; 返し条件取得
           
           ;; === 対象選択・効果適用 ===
           #:set-target-strategy           ; 対象選択戦略設定
           #:get-selected-target           ; 選択された対象取得
           #:is-valid-target-p             ; 有効対象判定
           #:execute-spade3-return         ; スペ3返し実行
           #:set-return-effect             ; 返し効果設定
           #:apply-return-effect           ; 返し効果適用
           #:is-effect-applied-p           ; 効果適用確認
           
           ;; === ゲーム統合 ===
           #:setup-game-context            ; ゲームコンテキスト設定
           #:setup-multiplayer-context     ; マルチプレイヤーコンテキスト設定
           #:capture-game-state            ; ゲーム状態キャプチャ
           #:has-state-changed-p           ; 状態変更確認))

(in-package :daifugo-spade3-return)

;;; ============================================================================
;;; スペ3返しシステム構造体
;;; ============================================================================

(defstruct spade3-return-system
  enabled-p                  ; システム有効フラグ
  return-triggered-p         ; 返し効果発動フラグ
  target-player              ; 対象プレイヤー
  return-effect-type         ; 返し効果タイプ
  target-strategy            ; 対象選択戦略
  conditions                 ; 発動条件
  game-context              ; ゲームコンテキスト
  effect-applied-p          ; 効果適用フラグ
  settings                  ; システム設定
  history                   ; 返し履歴
  statistics)               ; 統計データ

(defstruct spade3-return-record
  timestamp                 ; 発動時刻
  trigger-player           ; 発動プレイヤー
  target-player            ; 対象プレイヤー
  effect-type              ; 効果タイプ
  success-p)               ; 成功フラグ

;;; ============================================================================
;;; 基本システム機能
;;; ============================================================================

(defun create-spade3-return-system ()
  \"新しいスペ3返しシステムインスタンスを作成
   
   戻り値:
     新しく作成されたスペ3返しシステムオブジェクト\"
  (make-spade3-return-system :enabled-p t
                             :return-triggered-p nil
                             :target-player nil
                             :return-effect-type :hand-exchange
                             :target-strategy :richest-player
                             :conditions (make-hash-table :test 'equal)
                             :game-context nil
                             :effect-applied-p nil
                             :settings (make-hash-table :test 'equal)
                             :history nil
                             :statistics (make-hash-table :test 'equal)))

(defun is-spade3-return-enabled-p (spade3-system)
  \"スペ3返しシステムが有効かどうかを確認
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）\"
  (spade3-return-system-enabled-p spade3-system))

(defun get-return-settings (spade3-system)
  \"スペ3返しシステム設定を取得
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     設定ハッシュテーブル\"
  (spade3-return-system-settings spade3-system))

;;; ============================================================================
;;; スペード3検出・発動機能
;;; ============================================================================

(defun is-spade3-p (spade3-system card)
  \"カードがスペードの3かどうかを判定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     card - カードオブジェクト
   
   戻り値:
     スペード3判定（真偽値）\"
  (and (is-spade3-return-enabled-p spade3-system)
       (daifugo-card-system:card-p card)
       (= (daifugo-card-system:get-card-rank card) 3)
       (eq (daifugo-card-system:get-card-suit card) :spades)))

(defun detect-spade3-play (spade3-system cards)
  \"スペ3プレイを検出
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     スペ3プレイ検出結果（真偽値）\"
  (when (and (is-spade3-return-enabled-p spade3-system)
             cards
             (listp cards))
    ;; 単体スペード3または複数枚中にスペード3が含まれる
    (some (lambda (card)
            (is-spade3-p spade3-system card))
          cards)))

(defun process-spade3-play (spade3-system cards)
  \"スペ3プレイを処理
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     処理成功フラグ\"
  (when (detect-spade3-play spade3-system cards)
    ;; 発動条件確認
    (when (check-trigger-conditions spade3-system)
      ;; 返し効果発動
      (setf (spade3-return-system-return-triggered-p spade3-system) t)
      ;; 対象選択
      (let ((target (select-return-target spade3-system)))
        (when target
          (setf (spade3-return-system-target-player spade3-system) target)
          ;; 履歴記録
          (record-return-history spade3-system target)
          ;; 統計更新
          (update-return-statistics spade3-system)
          t)))))

(defun is-return-triggered-p (spade3-system)
  \"返し効果が発動されているかを確認
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     発動状態（真偽値）\"
  (spade3-return-system-return-triggered-p spade3-system))

;;; ============================================================================
;;; 返し効果制御機能
;;; ============================================================================

(defun get-return-target (spade3-system)
  \"返し対象を取得
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     対象プレイヤーID\"
  (spade3-return-system-target-player spade3-system))

(defun get-return-effect (spade3-system)
  \"返し効果を取得
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     返し効果タイプ\"
  (spade3-return-system-return-effect-type spade3-system))

(defun set-return-condition (spade3-system condition-key value)
  \"返し条件を設定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     condition-key - 条件キー
     value - 条件値
   
   戻り値:
     設定成功フラグ\"
  (setf (gethash condition-key (spade3-return-system-conditions spade3-system)) value)
  t)

(defun get-return-condition (spade3-system condition-key)
  \"返し条件を取得
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     condition-key - 条件キー
   
   戻り値:
     条件値\"
  (gethash condition-key (spade3-return-system-conditions spade3-system)))

;;; ============================================================================
;;; 対象選択・効果適用機能
;;; ============================================================================

(defun set-target-strategy (spade3-system strategy)
  \"対象選択戦略を設定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     strategy - 選択戦略
   
   戻り値:
     設定成功フラグ\"
  (setf (spade3-return-system-target-strategy spade3-system) strategy)
  t)

(defun get-selected-target (spade3-system)
  \"選択された対象を取得
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     選択された対象プレイヤーID\"
  (get-return-target spade3-system))

(defun is-valid-target-p (spade3-system target-player)
  \"有効な対象かどうかを判定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     target-player - 対象プレイヤーID
   
   戻り値:
     有効性判定（真偽値）\"
  (and (numberp target-player)
       (>= target-player 0)
       (<= target-player 3)  ; 4人プレイ想定
       ;; 自分自身は対象外
       (let ((context (spade3-return-system-game-context spade3-system)))
         (when context
           (not (= target-player (getf context :current-player)))))))

(defun execute-spade3-return (spade3-system trigger-player)
  \"スペ3返しを実行
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     trigger-player - 発動プレイヤーID
   
   戻り値:
     実行成功フラグ\"
  (when (is-spade3-return-enabled-p spade3-system)
    ;; 対象選択
    (let ((target (select-return-target-for-player spade3-system trigger-player)))
      (when (and target (is-valid-target-p spade3-system target))
        (setf (spade3-return-system-target-player spade3-system) target)
        (setf (spade3-return-system-return-triggered-p spade3-system) t)
        ;; 効果適用準備
        (prepare-return-effect spade3-system trigger-player target)
        t))))

(defun set-return-effect (spade3-system effect-type)
  \"返し効果を設定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     effect-type - 効果タイプ
   
   戻り値:
     設定成功フラグ\"
  (setf (spade3-return-system-return-effect-type spade3-system) effect-type)
  t)

(defun apply-return-effect (spade3-system game-state trigger-player target-player)
  \"返し効果を適用
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     game-state - ゲーム状態
     trigger-player - 発動プレイヤーID
     target-player - 対象プレイヤーID
   
   戻り値:
     適用成功フラグ\"
  (when (and (is-return-triggered-p spade3-system)
             (is-valid-target-p spade3-system target-player))
    (let ((effect-type (get-return-effect spade3-system)))
      (case effect-type
        (:hand-exchange
         (apply-hand-exchange-effect spade3-system game-state trigger-player target-player))
        (:rank-demotion
         (apply-rank-demotion-effect spade3-system game-state target-player))
        (:card-penalty
         (apply-card-penalty-effect spade3-system game-state target-player))
        (:skip-turn
         (apply-skip-turn-effect spade3-system game-state target-player))
        (otherwise nil)))))

(defun is-effect-applied-p (spade3-system)
  \"効果が適用されているかを確認
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     適用状態（真偽値）\"
  (spade3-return-system-effect-applied-p spade3-system))

;;; ============================================================================
;;; ゲーム統合機能
;;; ============================================================================

(defun setup-game-context (spade3-system game-state)
  \"ゲームコンテキストを設定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     設定成功フラグ\"
  (setf (spade3-return-system-game-context spade3-system)
        (list :game-state game-state
              :setup-time (get-universal-time)))
  t)

(defun setup-multiplayer-context (spade3-system game-state player-count)
  \"マルチプレイヤーコンテキストを設定
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     game-state - ゲーム状態
     player-count - プレイヤー数
   
   戻り値:
     設定成功フラグ\"
  (setf (spade3-return-system-game-context spade3-system)
        (list :game-state game-state
              :player-count player-count
              :setup-time (get-universal-time)))
  t)

(defun capture-game-state (spade3-system game-state)
  \"ゲーム状態をキャプチャ
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     キャプチャされた状態\"
  (when game-state
    (list :timestamp (get-universal-time)
          :player-hands (capture-player-hands game-state)
          :current-player (get-current-player game-state)
          :game-phase (get-game-phase game-state))))

(defun has-state-changed-p (before-state after-state)
  \"状態が変更されたかを確認
   
   引数:
     before-state - 変更前状態
     after-state - 変更後状態
   
   戻り値:
     変更確認（真偽値）\"
  (and before-state after-state
       (not (equal before-state after-state))))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun check-trigger-conditions (spade3-system)
  \"発動条件を確認
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     条件満足（真偽値）\"
  (let ((conditions (spade3-return-system-conditions spade3-system)))
    ;; 各種条件チェック
    (and
     ;; 最後のカード条件
     (or (not (gethash :only-when-last-card conditions))
         (is-last-card-play-p spade3-system))
     ;; ジョーカー所持者スキップ
     (or (not (gethash :skip-joker-holder conditions))
         (not (target-has-joker-p spade3-system)))
     ;; その他の条件
     t)))

(defun select-return-target (spade3-system)
  \"返し対象を選択
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
   
   戻り値:
     選択された対象プレイヤーID\"
  (let ((strategy (spade3-return-system-target-strategy spade3-system))
        (context (spade3-return-system-game-context spade3-system)))
    (case strategy
      (:richest-player (find-richest-player context))
      (:random-player (select-random-player context))
      (:highest-rank (find-highest-rank-player context))
      (:most-recent-winner (find-most-recent-winner context))
      (otherwise 0))))  ; デフォルト

(defun select-return-target-for-player (spade3-system trigger-player)
  \"特定プレイヤー用の返し対象を選択
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     trigger-player - 発動プレイヤーID
   
   戻り値:
     選択された対象プレイヤーID\"
  ;; 発動プレイヤー以外から選択
  (let ((available-targets (remove trigger-player '(0 1 2 3))))
    (when available-targets
      (first available-targets))))  ; 簡易実装

(defun prepare-return-effect (spade3-system trigger-player target-player)
  \"返し効果を準備
   
   引数:
     spade3-system - スペ3返しシステムオブジェクト
     trigger-player - 発動プレイヤーID
     target-player - 対象プレイヤーID
   
   戻り値:
     準備成功フラグ\"
  ;; 効果適用の準備処理
  (setf (spade3-return-system-effect-applied-p spade3-system) nil)
  t)

;; 効果適用関数群（簡易実装）
(defun apply-hand-exchange-effect (spade3-system game-state trigger-player target-player)
  \"手札交換効果を適用\" 
  (setf (spade3-return-system-effect-applied-p spade3-system) t)
  t)

(defun apply-rank-demotion-effect (spade3-system game-state target-player)
  \"階級降格効果を適用\"
  (setf (spade3-return-system-effect-applied-p spade3-system) t)
  t)

(defun apply-card-penalty-effect (spade3-system game-state target-player)
  \"カードペナルティ効果を適用\"
  (setf (spade3-return-system-effect-applied-p spade3-system) t)
  t)

(defun apply-skip-turn-effect (spade3-system game-state target-player)
  \"ターンスキップ効果を適用\"
  (setf (spade3-return-system-effect-applied-p spade3-system) t)
  t)

;; ヘルパー関数群（簡易実装）
(defun is-last-card-play-p (spade3-system) t)
(defun target-has-joker-p (spade3-system) nil)
(defun find-richest-player (context) 1)
(defun select-random-player (context) (random 4))
(defun find-highest-rank-player (context) 0)
(defun find-most-recent-winner (context) 2)
(defun capture-player-hands (game-state) nil)
(defun get-current-player (game-state) 0)
(defun get-game-phase (game-state) :playing)

(defun record-return-history (spade3-system target)
  \"返し履歴を記録\"
  (let ((record (make-spade3-return-record 
                 :timestamp (get-universal-time)
                 :trigger-player nil  ; 実装時に設定
                 :target-player target
                 :effect-type (get-return-effect spade3-system)
                 :success-p t)))
    (push record (spade3-return-system-history spade3-system))
    t))

(defun update-return-statistics (spade3-system)
  \"返し統計を更新\"
  (let ((stats (spade3-return-system-statistics spade3-system)))
    (incf (gethash :total-returns stats 0))
    (setf (gethash :last-return-time stats) (get-universal-time))
    t))