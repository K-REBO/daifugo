;;; 8kiri.lisp - 大富豪ゲーム用8切りルールシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 8のカードによる場のリセット（8切り）
;;; - フィールド状態の完全クリア機能
;;; - 8切り後の次プレイヤー任意カード出し
;;; - 複数枚8や特殊ケースの処理
;;; - 他ルールとの相互作用管理

(defpackage :daifugo-8kiri
  (:use :common-lisp)
  (:export ;; === 基本8切りシステム機能 ===
           #:create-8kiri-system       ; 8切りシステム作成
           #:8kiri-system-p            ; 8切りシステム判定
           #:is-8kiri-enabled-p        ; 8切り有効確認
           #:get-8kiri-count           ; 8切り回数取得
           
           ;; === 8切り検出・判定機能 ===
           #:detect-8kiri-trigger      ; 8切り発動条件検出
           #:is-8-card-p               ; 8カード判定
           #:is-multiple-8s-p          ; 複数8判定
           #:is-joker-8-p              ; ジョーカー8判定
           
           ;; === フィールド状態管理 ===
           #:create-field-state        ; フィールド状態作成
           #:get-field-cards           ; フィールドカード取得
           #:set-field-cards           ; フィールドカード設定
           #:get-field-restriction     ; フィールド制約取得
           #:set-field-restriction     ; フィールド制約設定
           #:get-field-min-cards       ; 最小カード枚数取得
           #:set-field-min-cards       ; 最小カード枚数設定
           #:get-locked-suit           ; ロックスート取得
           #:set-locked-suit           ; ロックスート設定
           
           ;; === 8切り実行機能 ===
           #:execute-8kiri             ; 8切り実行
           #:execute-8kiri-by-player   ; プレイヤー別8切り実行
           #:execute-8kiri-with-revolution ; 革命状態での8切り実行
           
           ;; === フィールドリセット機能 ===
           #:can-play-any-card-p       ; 任意カード出し可能判定
           #:is-field-reset-p          ; フィールドリセット判定
           #:reset-field-state         ; フィールド状態リセット
           
           ;; === 8切り履歴・追跡機能 ===
           #:get-8kiri-history         ; 8切り履歴取得
           #:8kiri-event-p             ; 8切りイベント判定
           #:8kiri-event-player-id     ; イベントプレイヤーID取得
           #:is-consecutive-8kiri-p    ; 連続8切り判定
           #:has-chain-8kiri-p         ; 連鎖8切り判定
           
           ;; === ルール制御・設定機能 ===
           #:enable-8kiri              ; 8切り有効化
           #:disable-8kiri             ; 8切り無効化
           #:get-rule-priority         ; ルール優先度取得
           #:get-standard-rule-priority ; 標準ルール優先度取得
           #:overrides-other-rules-p   ; 他ルール優先判定
           
           ;; === 統合・相互作用機能 ===
           #:register-8kiri-listener   ; 8切りリスナー登録
           #:notify-8kiri-event        ; 8切りイベント通知
           #:check-rule-conflicts      ; ルール競合確認
           
           ;; === デバッグ・分析機能 ===
           #:get-8kiri-statistics      ; 8切り統計取得
           #:generate-8kiri-report     ; 8切りレポート生成
           
           ;; === 旧互換性 ===
           #:eight-cut-p               ; 旧形式互換
           #:trigger-eight-cut         ; 旧形式互換
           #:clear-field))             ; 旧形式互換

(in-package :daifugo-8kiri)

;;; ============================================================================
;;; 8切りシステム構造体とデータ構造
;;; ============================================================================

(defstruct 8kiri-system
  enabled-p                ; 8切り有効フラグ
  count                    ; 8切り実行回数
  history                  ; 8切り履歴
  listeners                ; イベントリスナー
  rule-priority            ; ルール優先度
  statistics)              ; 統計データ

(defstruct field-state
  cards                    ; フィールド上のカード
  restriction              ; フィールド制約（:none :suit-lock :rank-lock等）
  min-cards                ; 最小カード枚数
  locked-suit              ; ロックされたスート
  locked-rank              ; ロックされたランク
  reset-p)                 ; リセット状態フラグ

(defstruct 8kiri-event
  timestamp                ; タイムスタンプ
  player-id                ; 実行プレイヤーID
  cards                    ; 使用した8のカード
  field-before             ; 8切り前のフィールド状態
  field-after              ; 8切り後のフィールド状態
  event-type)              ; イベントタイプ（:single :multiple :chain等）

;;; ============================================================================
;;; 基本8切りシステム機能
;;; ============================================================================

(defun create-8kiri-system ()
  "新しい8切りシステムインスタンスを作成
   
   戻り値:
     新しく作成された8切りシステムオブジェクト"
  (make-8kiri-system :enabled-p t
                     :count 0
                     :history nil
                     :listeners nil
                     :rule-priority 100  ; 高優先度
                     :statistics (make-hash-table :test 'equal)))

(defun is-8kiri-enabled-p (kiri-system)
  "8切り機能が有効かどうかを確認
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）"
  (8kiri-system-enabled-p kiri-system))

(defun get-8kiri-count (kiri-system)
  "8切り実行回数を取得
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     8切り実行回数"
  (8kiri-system-count kiri-system))

;;; ============================================================================
;;; 8切り検出・判定機能
;;; ============================================================================

(defun detect-8kiri-trigger (kiri-system cards)
  "カード群から8切り発動条件を検出
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     cards - 検証するカードのリスト
   
   戻り値:
     8切り発動判定（真偽値）"
  (when (and (8kiri-system-enabled-p kiri-system)
             cards
             (listp cards)
             (> (length cards) 0))
    ;; 全てのカードが8（またはジョーカー8）である場合のみ8切り
    (every (lambda (card)
             (or (is-8-card-p card)
                 (is-joker-8-p card)))
           cards)))

(defun is-8-card-p (card)
  "カードが8かどうかを判定
   
   引数:
     card - 判定するカード
   
   戻り値:
     8カード判定（真偽値）"
  (when card
    (= (daifugo-card-system:card-rank card) 8)))

(defun is-multiple-8s-p (cards)
  "複数枚の8かどうかを判定
   
   引数:
     cards - 判定するカードのリスト
   
   戻り値:
     複数8判定（真偽値）"
  (and cards
       (> (length cards) 1)
       (every #'is-8-card-p cards)))

(defun is-joker-8-p (card)
  "ジョーカーが8として使われているかを判定
   
   引数:
     card - 判定するカード
   
   戻り値:
     ジョーカー8判定（真偽値）"
  (when card
    (and (daifugo-card-system:joker-p card)
         (= (daifugo-card-system:get-joker-value card) 8))))

;;; ============================================================================
;;; フィールド状態管理機能
;;; ============================================================================

(defun create-field-state ()
  "新しいフィールド状態を作成
   
   戻り値:
     新しく作成されたフィールド状態オブジェクト"
  (make-field-state :cards nil
                    :restriction :none
                    :min-cards 1
                    :locked-suit nil
                    :locked-rank nil
                    :reset-p nil))

(defun get-field-cards (field-state)
  "フィールド上のカードを取得
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     フィールドカードのリスト"
  (field-state-cards field-state))

(defun set-field-cards (field-state cards)
  "フィールドカードを設定
   
   引数:
     field-state - フィールド状態オブジェクト
     cards - 設定するカードのリスト
   
   戻り値:
     設定成功フラグ"
  (setf (field-state-cards field-state) cards)
  t)

(defun get-field-restriction (field-state)
  "フィールド制約を取得
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     フィールド制約"
  (field-state-restriction field-state))

(defun set-field-restriction (field-state restriction)
  "フィールド制約を設定
   
   引数:
     field-state - フィールド状態オブジェクト
     restriction - 制約タイプ
   
   戻り値:
     設定成功フラグ"
  (setf (field-state-restriction field-state) restriction)
  t)

(defun get-field-min-cards (field-state)
  "最小カード枚数を取得
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     最小カード枚数"
  (field-state-min-cards field-state))

(defun set-field-min-cards (field-state min-cards)
  "最小カード枚数を設定
   
   引数:
     field-state - フィールド状態オブジェクト
     min-cards - 最小カード枚数
   
   戻り値:
     設定成功フラグ"
  (setf (field-state-min-cards field-state) min-cards)
  t)

(defun get-locked-suit (field-state)
  "ロックされたスートを取得
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     ロックスート"
  (field-state-locked-suit field-state))

(defun set-locked-suit (field-state suit)
  "ロックスートを設定
   
   引数:
     field-state - フィールド状態オブジェクト
     suit - ロックするスート
   
   戻り値:
     設定成功フラグ"
  (setf (field-state-locked-suit field-state) suit)
  t)

;;; ============================================================================
;;; 8切り実行機能
;;; ============================================================================

(defun execute-8kiri (kiri-system field-state cards)
  "8切りを実行
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     field-state - フィールド状態オブジェクト
     cards - 8のカードのリスト
   
   戻り値:
     実行成功フラグ"
  (when (detect-8kiri-trigger kiri-system cards)
    (let ((field-before (copy-field-state field-state)))
      ;; フィールドリセット実行
      (reset-field-state field-state)
      
      ;; 8切り回数更新
      (incf (8kiri-system-count kiri-system))
      
      ;; 履歴に追加
      (push (make-8kiri-event :timestamp (get-universal-time)
                              :player-id 0  ; デフォルト
                              :cards cards
                              :field-before field-before
                              :field-after (copy-field-state field-state)
                              :event-type (if (> (length cards) 1) :multiple :single))
            (8kiri-system-history kiri-system))
      
      ;; 統計更新
      (incf (gethash :total-8kiri (8kiri-system-statistics kiri-system) 0))
      (if (> (length cards) 1)
          (incf (gethash :multiple-8kiri (8kiri-system-statistics kiri-system) 0))
          (incf (gethash :single-8kiri (8kiri-system-statistics kiri-system) 0)))
      
      ;; イベント通知
      (notify-8kiri-event kiri-system cards)
      
      t)))

(defun execute-8kiri-by-player (kiri-system field-state player-id cards)
  "プレイヤー指定で8切りを実行
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     field-state - フィールド状態オブジェクト
     player-id - プレイヤーID
     cards - 8のカードのリスト
   
   戻り値:
     実行成功フラグ"
  (when (execute-8kiri kiri-system field-state cards)
    ;; 最新イベントのプレイヤーIDを更新
    (let ((last-event (first (8kiri-system-history kiri-system))))
      (when last-event
        (setf (8kiri-event-player-id last-event) player-id)))
    t))

(defun execute-8kiri-with-revolution (kiri-system field-state cards kakumei-system)
  "革命状態での8切りを実行
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     field-state - フィールド状態オブジェクト
     cards - 8のカードのリスト
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     実行成功フラグ"
  (declare (ignore kakumei-system))  ; 革命状態は維持される
  ;; 8切りはフィールドをクリアするが革命状態は継続
  (execute-8kiri kiri-system field-state cards))

;;; ============================================================================
;;; フィールドリセット機能
;;; ============================================================================

(defun can-play-any-card-p (field-state)
  "任意のカードを出せる状態かどうかを判定
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     任意カード出し可能判定（真偽値）"
  (and (= (length (field-state-cards field-state)) 0)
       (eq (field-state-restriction field-state) :none)
       (field-state-reset-p field-state)))

(defun is-field-reset-p (field-state)
  "フィールドがリセット状態かどうかを判定
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     リセット状態判定（真偽値）"
  (field-state-reset-p field-state))

(defun reset-field-state (field-state)
  "フィールド状態を完全リセット
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     リセット成功フラグ"
  ;; 全ての状態をクリア
  (setf (field-state-cards field-state) nil)
  (setf (field-state-restriction field-state) :none)
  (setf (field-state-min-cards field-state) 1)
  (setf (field-state-locked-suit field-state) nil)
  (setf (field-state-locked-rank field-state) nil)
  (setf (field-state-reset-p field-state) t)
  t)

;;; ============================================================================
;;; 8切り履歴・追跡機能
;;; ============================================================================

(defun get-8kiri-history (kiri-system)
  "8切り履歴を取得
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     8切り履歴のリスト"
  (reverse (8kiri-system-history kiri-system)))

(defun 8kiri-event-p (obj)
  "オブジェクトが8切りイベントかどうかを判定
   
   引数:
     obj - 判定するオブジェクト
   
   戻り値:
     8切りイベント判定（真偽値）"
  (typep obj '8kiri-event))

(defun 8kiri-event-player-id (event)
  "8切りイベントのプレイヤーIDを取得
   
   引数:
     event - 8切りイベント
   
   戻り値:
     プレイヤーID"
  (8kiri-event-player-id event))

(defun is-consecutive-8kiri-p (history)
  "連続8切りかどうかを判定
   
   引数:
     history - 8切り履歴
   
   戻り値:
     連続8切り判定（真偽値）"
  (when (>= (length history) 2)
    (let ((last-two (subseq history 0 2)))
      (< (- (8kiri-event-timestamp (first last-two))
            (8kiri-event-timestamp (second last-two)))
         60))))  ; 60秒以内なら連続とみなす

(defun has-chain-8kiri-p (history)
  "連鎖8切りがあるかどうかを判定
   
   引数:
     history - 8切り履歴
   
   戻り値:
     連鎖8切り判定（真偽値）"
  (when (>= (length history) 2)
    (some (lambda (i)
            (let ((current (nth i history))
                  (next (nth (1+ i) history)))
              (and current next
                   (< (- (8kiri-event-timestamp current)
                         (8kiri-event-timestamp next))
                      30))))  ; 30秒以内なら連鎖とみなす
          (loop for i from 0 below (1- (length history)) collect i))))

;;; ============================================================================
;;; ルール制御・設定機能
;;; ============================================================================

(defun enable-8kiri (kiri-system)
  "8切り機能を有効化
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (setf (8kiri-system-enabled-p kiri-system) t)
  t)

(defun disable-8kiri (kiri-system)
  "8切り機能を無効化
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     無効化成功フラグ"
  (setf (8kiri-system-enabled-p kiri-system) nil)
  t)

(defun get-rule-priority (kiri-system)
  "ルール優先度を取得
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     ルール優先度"
  (8kiri-system-rule-priority kiri-system))

(defun get-standard-rule-priority ()
  "標準ルールの優先度を取得
   
   戻り値:
     標準ルール優先度"
  50)  ; 標準的な優先度

(defun overrides-other-rules-p (kiri-system)
  "8切りが他のルールを優先するかどうかを判定
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     優先判定（真偽値）"
  (> (get-rule-priority kiri-system) (get-standard-rule-priority)))

;;; ============================================================================
;;; 統合・相互作用機能
;;; ============================================================================

(defun register-8kiri-listener (kiri-system listener-func)
  "8切りイベントリスナーを登録
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     listener-func - リスナー関数
   
   戻り値:
     登録成功フラグ"
  (push listener-func (8kiri-system-listeners kiri-system))
  t)

(defun notify-8kiri-event (kiri-system cards)
  "8切りイベントを通知
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     cards - 8切りに使用されたカード
   
   戻り値:
     通知成功フラグ"
  (dolist (listener (8kiri-system-listeners kiri-system))
    (when (functionp listener)
      (funcall listener :8kiri-executed cards)))
  t)

(defun check-rule-conflicts (kiri-system other-rules)
  "他ルールとの競合を確認
   
   引数:
     kiri-system - 8切りシステムオブジェクト
     other-rules - 他のルールシステムのリスト
   
   戻り値:
     競合情報のリスト"
  (declare (ignore other-rules))
  ;; 8切りは最高優先度なので基本的に競合しない
  (list :conflicts nil
        :priority (get-rule-priority kiri-system)
        :overrides-all t))

;;; ============================================================================
;;; デバッグ・分析機能
;;; ============================================================================

(defun get-8kiri-statistics (kiri-system)
  "8切り統計データを取得
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     統計データ（plist）"
  (let ((stats (8kiri-system-statistics kiri-system)))
    (list :total-8kiri (gethash :total-8kiri stats 0)
          :single-8kiri (gethash :single-8kiri stats 0)
          :multiple-8kiri (gethash :multiple-8kiri stats 0)
          :total-count (8kiri-system-count kiri-system))))

(defun generate-8kiri-report (kiri-system)
  "8切りレポートを生成
   
   引数:
     kiri-system - 8切りシステムオブジェクト
   
   戻り値:
     レポート文字列"
  (let ((stats (get-8kiri-statistics kiri-system)))
    (format nil "=== 8切りシステムレポート ===~%~
                総8切り回数: ~A~%~
                単枚8切り: ~A回~%~
                複数枚8切り: ~A回~%~
                システム状態: ~A~%"
            (getf stats :total-8kiri)
            (getf stats :single-8kiri)
            (getf stats :multiple-8kiri)
            (if (8kiri-system-enabled-p kiri-system) "有効" "無効"))))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun copy-field-state (field-state)
  "フィールド状態のコピーを作成
   
   引数:
     field-state - コピー元のフィールド状態
   
   戻り値:
     コピーされたフィールド状態"
  (make-field-state :cards (copy-list (field-state-cards field-state))
                    :restriction (field-state-restriction field-state)
                    :min-cards (field-state-min-cards field-state)
                    :locked-suit (field-state-locked-suit field-state)
                    :locked-rank (field-state-locked-rank field-state)
                    :reset-p (field-state-reset-p field-state)))

;;; ============================================================================
;;; 旧互換性関数
;;; ============================================================================

(defun eight-cut-p (cards)
  "旧形式互換：8切り判定"
  (when cards
    (every #'is-8-card-p cards)))

(defun trigger-eight-cut (field-state)
  "旧形式互換：8切り発動"
  (reset-field-state field-state))

(defun clear-field (field-state)
  "旧形式互換：フィールドクリア"
  (reset-field-state field-state))