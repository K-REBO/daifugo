;;; kakumei.lisp - 大富豪ゲーム用革命ルールシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 革命の発動条件検出（4枚同じ数字・同じスート4枚・階段4枚等）
;;; - 革命状態の管理（発動・解除・状態確認）
;;; - カード強度の動的逆転処理
;;; - 革命パターンの分類・検証
;;; - ゲームエンジンとの統合機能

;;; Package definition moved to packages.lisp to avoid conflicts
#|
(defpackage :daifugo-kakumei
  (:use :common-lisp)
  (:export ;; === 基本革命システム機能 ===
           #:create-kakumei-system     ; 革命システム作成
           #:kakumei-system-p          ; 革命システム判定
           #:is-kakumei-active-p       ; 革命状態確認
           #:get-kakumei-count         ; 革命回数取得
           
           ;; === 革命検出・判定機能 ===
           #:detect-kakumei-trigger    ; 革命発動条件検出
           #:get-kakumei-type          ; 革命タイプ取得
           #:validate-kakumei-cards    ; 革命カード検証
           
           ;; === 革命状態制御機能 ===
           #:trigger-kakumei           ; 革命発動
           #:resolve-kakumei           ; 革命解除
           #:get-kakumei-state         ; 革命状態取得
           #:reset-kakumei-system      ; 革命システムリセット
           
           ;; === カード強度・比較機能 ===
           #:calculate-card-strength   ; カード強度計算
           #:compare-cards             ; カード比較
           #:can-play-over             ; カード出し可能判定
           #:get-stronger-cards        ; 上位カード取得
           
           ;; === 革命パターン・分析機能 ===
           #:analyze-hand-kakumei      ; 手札革命分析
           #:get-possible-kakumei      ; 可能革命取得
           #:calculate-kakumei-probability ; 革命確率計算
           
           ;; === 統合・イベント機能 ===
           #:register-kakumei-listener ; 革命リスナー登録
           #:notify-kakumei-event      ; 革命イベント通知
           #:get-kakumei-history       ; 革命履歴取得
           
           ;; === 設定・カスタマイズ ===
           #:configure-kakumei-rules   ; 革命ルール設定
           #:enable-kakumei-type       ; 革命タイプ有効化
           #:disable-kakumei-type      ; 革命タイプ無効化
           
           ;; === デバッグ・分析機能 ===
           #:get-kakumei-statistics    ; 革命統計取得
           #:generate-kakumei-report   ; 革命レポート生成
           
           ;; === 旧互換性 ===
           #:revolution-active-p       ; 旧形式互換
           #:trigger-revolution        ; 旧形式互換
           #:check-revolution))        ; 旧形式互換
|#

(in-package :daifugo-kakumei)

;;; ============================================================================
;;; 革命システム構造体とデータ構造
;;; ============================================================================

(defstruct kakumei-system
  active-p                ; 革命状態フラグ
  count                   ; 革命回数
  last-type              ; 最後の革命タイプ
  history                ; 革命履歴
  enabled-types          ; 有効な革命タイプ
  listeners              ; イベントリスナー
  configuration          ; 革命設定
  statistics)            ; 統計データ

(defstruct kakumei-event
  timestamp              ; タイムスタンプ
  type                   ; 革命タイプ
  player-id              ; プレイヤーID
  cards                  ; 使用カード
  state-before           ; 革命前状態
  state-after)           ; 革命後状態

(defstruct kakumei-configuration
  four-of-kind-enabled   ; 4枚同数字革命有効
  same-suit-enabled      ; 同スート4枚革命有効
  sequence-enabled       ; 階段4枚革命有効
  joker-allowed          ; ジョーカー使用許可
  min-card-count         ; 最小カード枚数
  auto-resolve)          ; 自動解除フラグ

;;; ============================================================================
;;; 基本革命システム機能
;;; ============================================================================

(defun create-kakumei-system ()
  "新しい革命システムインスタンスを作成
   
   戻り値:
     新しく作成された革命システムオブジェクト"
  (make-kakumei-system :active-p nil
                       :count 0
                       :last-type nil
                       :history nil
                       :enabled-types '(:four-of-a-kind :same-suit :sequence)
                       :listeners nil
                       :configuration (make-kakumei-configuration
                                      :four-of-kind-enabled t
                                      :same-suit-enabled t
                                      :sequence-enabled t
                                      :joker-allowed t
                                      :min-card-count 4
                                      :auto-resolve nil)
                       :statistics (make-hash-table :test 'equal)))

(defun is-kakumei-active-p (kakumei-system)
  "革命状態が有効かどうかを確認
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     革命状態（真偽値）"
  (kakumei-system-active-p kakumei-system))

(defun kakumei-active-p (kakumei-system)
  "革命状態が有効かどうかを確認（エイリアス）"
  (is-kakumei-active-p kakumei-system))

(defun get-kakumei-count (kakumei-system)
  "革命回数を取得
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     革命回数"
  (kakumei-system-count kakumei-system))

;;; ============================================================================
;;; 革命検出・判定機能
;;; ============================================================================

(defun detect-kakumei-trigger (kakumei-system cards)
  "カード群から革命発動条件を検出
   
   引数:
     kakumei-system - 革命システムオブジェクト
     cards - 検証するカードのリスト
   
   戻り値:
     革命発動判定（真偽値）"
  (when (and cards
             (listp cards)
             (>= (length cards) 
                 (kakumei-configuration-min-card-count 
                  (kakumei-system-configuration kakumei-system))))
    (let ((kakumei-type (get-kakumei-type cards)))
      (and kakumei-type
           (member kakumei-type (kakumei-system-enabled-types kakumei-system))))))

(defun get-kakumei-type (cards)
  "カード群の革命タイプを判定
   
   引数:
     cards - 判定するカードのリスト
   
   戻り値:
     革命タイプ（キーワード）"
  (when (and cards (= (length cards) 4))
    (cond
      ;; 4枚同じ数字
      ((all-same-rank-p cards)
       (if (has-joker-p cards)
           :four-of-a-kind-with-joker
           :four-of-a-kind))
      
      ;; 同じスート4枚
      ((all-same-suit-p cards)
       :same-suit)
      
      ;; 階段（連続する4枚）
      ((is-sequence-p cards)
       :sequence)
      
      ;; 革命なし
      (t nil))))

(defun validate-kakumei-cards (kakumei-system cards)
  "革命カードの有効性を検証
   
   引数:
     kakumei-system - 革命システムオブジェクト
     cards - 検証するカードのリスト
   
   戻り値:
     検証結果（plist）"
  (let ((kakumei-type (get-kakumei-type cards)))
    (list :valid (and kakumei-type
                     (member kakumei-type (kakumei-system-enabled-types kakumei-system)))
          :type kakumei-type
          :card-count (length cards)
          :reason (if kakumei-type
                     "有効な革命パターン"
                     "革命パターンなし"))))

;;; ============================================================================
;;; 革命状態制御機能
;;; ============================================================================

(defun trigger-kakumei (kakumei-system kakumei-type)
  "革命を発動
   
   引数:
     kakumei-system - 革命システムオブジェクト
     kakumei-type - 革命タイプ
   
   戻り値:
     発動成功フラグ"
  (when kakumei-type
    (let ((state-before (copy-kakumei-state kakumei-system)))
      ;; 革命回数を増加
      (incf (kakumei-system-count kakumei-system))
      
      ;; 革命状態をトグル（奇数回で有効、偶数回で無効）
      (setf (kakumei-system-active-p kakumei-system)
            (oddp (kakumei-system-count kakumei-system)))
      
      ;; 最後の革命タイプを記録
      (setf (kakumei-system-last-type kakumei-system) kakumei-type)
      
      ;; 履歴に追加
      (push (make-kakumei-event :timestamp (get-universal-time)
                                :type kakumei-type
                                :player-id 0  ; 簡易実装
                                :cards nil
                                :state-before state-before
                                :state-after (copy-kakumei-state kakumei-system))
            (kakumei-system-history kakumei-system))
      
      ;; 統計更新
      (incf (gethash kakumei-type (kakumei-system-statistics kakumei-system) 0))
      
      ;; イベント通知
      (notify-kakumei-event kakumei-system kakumei-type)
      
      t)))

(defun resolve-kakumei (kakumei-system)
  "革命を解除
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     解除成功フラグ"
  (when (kakumei-system-active-p kakumei-system)
    (setf (kakumei-system-active-p kakumei-system) nil)
    t))

(defun get-kakumei-state (kakumei-system)
  "革命状態の詳細情報を取得
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     状態情報（plist）"
  (list :active (kakumei-system-active-p kakumei-system)
        :count (kakumei-system-count kakumei-system)
        :last-type (kakumei-system-last-type kakumei-system)
        :history-count (length (kakumei-system-history kakumei-system))))

(defun reset-kakumei-system (kakumei-system)
  "革命システムを初期状態にリセット
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     リセット成功フラグ"
  (setf (kakumei-system-active-p kakumei-system) nil)
  (setf (kakumei-system-count kakumei-system) 0)
  (setf (kakumei-system-last-type kakumei-system) nil)
  (setf (kakumei-system-history kakumei-system) nil)
  (clrhash (kakumei-system-statistics kakumei-system))
  t)

;;; ============================================================================
;;; カード強度・比較機能
;;; ============================================================================

(defun calculate-card-strength (kakumei-system card)
  "革命状態を考慮したカード強度を計算
   
   引数:
     kakumei-system - 革命システムオブジェクト
     card - カードオブジェクト
   
   戻り値:
     カード強度（数値）"
  (let ((base-strength (daifugo-card-system:calculate-card-strength 
                        (daifugo-card-system:card-rank card))))
    (if (kakumei-system-active-p kakumei-system)
        ;; 革命時：強度を逆転（15から引く）
        (- 15 base-strength)
        ;; 通常時：そのまま
        base-strength)))

(defun compare-cards (kakumei-system card1 card2 mode)
  "革命状態を考慮したカード比較
   
   引数:
     kakumei-system - 革命システムオブジェクト
     card1 - 比較カード1
     card2 - 比較カード2
     mode - 比較モード（:normal :kakumei）
   
   戻り値:
     card1 > card2 の判定結果（真偽値）"
  (let ((strength1 (if (eq mode :kakumei)
                      (calculate-card-strength kakumei-system card1)
                      (daifugo-card-system:calculate-card-strength 
                       (daifugo-card-system:card-rank card1))))
        (strength2 (if (eq mode :kakumei)
                      (calculate-card-strength kakumei-system card2)
                      (daifugo-card-system:calculate-card-strength 
                       (daifugo-card-system:card-rank card2)))))
    (> strength1 strength2)))

(defun can-play-over (kakumei-system player-card field-card)
  "フィールドのカードに対してプレイヤーカードが出せるかを判定
   
   引数:
     kakumei-system - 革命システムオブジェクト
     player-card - プレイヤーのカード
     field-card - フィールドのカード
   
   戻り値:
     プレイ可能判定（真偽値）"
  (> (calculate-card-strength kakumei-system player-card)
     (calculate-card-strength kakumei-system field-card)))

(defun get-stronger-cards (kakumei-system hand field-card)
  "手札から指定カードより強いカードを取得
   
   引数:
     kakumei-system - 革命システムオブジェクト
     hand - 手札
     field-card - 比較対象カード
   
   戻り値:
     より強いカードのリスト"
  (remove-if-not (lambda (card)
                   (can-play-over kakumei-system card field-card))
                 hand))

;;; ============================================================================
;;; 革命パターン・分析機能
;;; ============================================================================

(defun analyze-hand-kakumei (kakumei-system hand)
  "手札の革命可能性を分析
   
   引数:
     kakumei-system - 革命システムオブジェクト
     hand - 手札
   
   戻り値:
     分析結果（plist）"
  (let ((possible-kakumei (get-possible-kakumei kakumei-system hand)))
    (list :has-kakumei (> (length possible-kakumei) 0)
          :kakumei-count (length possible-kakumei)
          :kakumei-types possible-kakumei
          :probability (calculate-kakumei-probability kakumei-system hand))))

(defun get-possible-kakumei (kakumei-system hand)
  "手札から可能な革命パターンを取得
   
   引数:
     kakumei-system - 革命システムオブジェクト
     hand - 手札
   
   戻り値:
     可能な革命パターンのリスト"
  (let ((possible-patterns nil))
    ;; 4枚同数字チェック
    (when (and (member :four-of-a-kind (kakumei-system-enabled-types kakumei-system))
               (has-four-of-kind-p hand))
      (push :four-of-a-kind possible-patterns))
    
    ;; 同スート4枚チェック
    (when (and (member :same-suit (kakumei-system-enabled-types kakumei-system))
               (has-same-suit-four-p hand))
      (push :same-suit possible-patterns))
    
    ;; 階段4枚チェック
    (when (and (member :sequence (kakumei-system-enabled-types kakumei-system))
               (has-sequence-four-p hand))
      (push :sequence possible-patterns))
    
    possible-patterns))

(defun calculate-kakumei-probability (kakumei-system hand)
  "手札の革命確率を計算
   
   引数:
     kakumei-system - 革命システムオブジェクト
     hand - 手札
   
   戻り値:
     革命確率（0.0-1.0）"
  (declare (ignore kakumei-system))
  (let ((hand-size (length hand)))
    (cond
      ((< hand-size 4) 0.0)
      ((has-four-of-kind-p hand) 1.0)
      ((has-same-suit-four-p hand) 1.0)
      ((has-sequence-four-p hand) 1.0)
      ((>= hand-size 8) 0.3)
      ((>= hand-size 6) 0.2)
      (t 0.1))))

;;; ============================================================================
;;; 統合・イベント機能
;;; ============================================================================

(defun register-kakumei-listener (kakumei-system listener-func)
  "革命イベントリスナーを登録
   
   引数:
     kakumei-system - 革命システムオブジェクト
     listener-func - リスナー関数
   
   戻り値:
     登録成功フラグ"
  (push listener-func (kakumei-system-listeners kakumei-system))
  t)

(defun notify-kakumei-event (kakumei-system kakumei-type)
  "革命イベントを通知
   
   引数:
     kakumei-system - 革命システムオブジェクト
     kakumei-type - 革命タイプ
   
   戻り値:
     通知成功フラグ"
  (dolist (listener (kakumei-system-listeners kakumei-system))
    (when (functionp listener)
      (funcall listener kakumei-type (kakumei-system-active-p kakumei-system))))
  t)

(defun get-kakumei-history (kakumei-system)
  "革命履歴を取得
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     革命履歴のリスト"
  (reverse (kakumei-system-history kakumei-system)))

;;; ============================================================================
;;; 設定・カスタマイズ機能
;;; ============================================================================

(defun configure-kakumei-rules (kakumei-system config)
  "革命ルールを設定
   
   引数:
     kakumei-system - 革命システムオブジェクト
     config - 設定データ（plist）
   
   戻り値:
     設定成功フラグ"
  (let ((current-config (kakumei-system-configuration kakumei-system)))
    (when (getf config :four-of-kind-enabled)
      (setf (kakumei-configuration-four-of-kind-enabled current-config)
            (getf config :four-of-kind-enabled)))
    (when (getf config :same-suit-enabled)
      (setf (kakumei-configuration-same-suit-enabled current-config)
            (getf config :same-suit-enabled)))
    (when (getf config :sequence-enabled)
      (setf (kakumei-configuration-sequence-enabled current-config)
            (getf config :sequence-enabled)))
    (when (getf config :joker-allowed)
      (setf (kakumei-configuration-joker-allowed current-config)
            (getf config :joker-allowed))))
  t)

(defun enable-kakumei-type (kakumei-system kakumei-type)
  "指定革命タイプを有効化
   
   引数:
     kakumei-system - 革命システムオブジェクト
     kakumei-type - 革命タイプ
   
   戻り値:
     有効化成功フラグ"
  (pushnew kakumei-type (kakumei-system-enabled-types kakumei-system))
  t)

(defun disable-kakumei-type (kakumei-system kakumei-type)
  "指定革命タイプを無効化
   
   引数:
     kakumei-system - 革命システムオブジェクト
     kakumei-type - 革命タイプ
   
   戻り値:
     無効化成功フラグ"
  (setf (kakumei-system-enabled-types kakumei-system)
        (remove kakumei-type (kakumei-system-enabled-types kakumei-system)))
  t)

;;; ============================================================================
;;; デバッグ・分析機能
;;; ============================================================================

(defun get-kakumei-statistics (kakumei-system)
  "革命統計データを取得
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     統計データ（plist）"
  (let ((stats (kakumei-system-statistics kakumei-system)))
    (list :total-kakumei (kakumei-system-count kakumei-system)
          :four-of-kind-count (gethash :four-of-a-kind stats 0)
          :same-suit-count (gethash :same-suit stats 0)
          :sequence-count (gethash :sequence stats 0)
          :current-active (kakumei-system-active-p kakumei-system))))

(defun generate-kakumei-report (kakumei-system)
  "革命レポートを生成
   
   引数:
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     レポート文字列"
  (let ((stats (get-kakumei-statistics kakumei-system)))
    (format nil "=== 革命システムレポート ===~%~
                総革命回数: ~A~%~
                4枚同数字: ~A回~%~
                同スート4枚: ~A回~%~
                階段4枚: ~A回~%~
                現在状態: ~A~%"
            (getf stats :total-kakumei)
            (getf stats :four-of-kind-count)
            (getf stats :same-suit-count)
            (getf stats :sequence-count)
            (if (getf stats :current-active) "革命中" "通常"))))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun all-same-rank-p (cards)
  "全カードが同じランクかどうかを判定"
  (when cards
    (let ((first-rank (daifugo-card-system:card-rank (first cards))))
      (every (lambda (card)
               (= (daifugo-card-system:card-rank card) first-rank))
             cards))))

(defun all-same-suit-p (cards)
  "全カードが同じスートかどうかを判定"
  (when cards
    (let ((first-suit (daifugo-card-system:card-suit (first cards))))
      (every (lambda (card)
               (eq (daifugo-card-system:card-suit card) first-suit))
             cards))))

(defun is-sequence-p (cards)
  "カードが連続しているかどうかを判定"
  (when (= (length cards) 4)
    (let ((ranks (sort (mapcar #'daifugo-card-system:card-rank cards) #'<)))
      (and (= (- (fourth ranks) (first ranks)) 3)
           (= (- (second ranks) (first ranks)) 1)
           (= (- (third ranks) (second ranks)) 1)))))

(defun has-joker-p (cards)
  "ジョーカーが含まれているかどうかを判定"
  (some #'daifugo-card-system:joker-p cards))

(defun has-four-of-kind-p (hand)
  "手札に4枚同数字があるかどうかを判定"
  (let ((rank-counts (make-hash-table)))
    (dolist (card hand)
      (incf (gethash (daifugo-card-system:card-rank card) rank-counts 0)))
    (some (lambda (count) (>= count 4)) (hash-table-values rank-counts))))

(defun has-same-suit-four-p (hand)
  "手札に同スート4枚があるかどうかを判定"
  (let ((suit-counts (make-hash-table)))
    (dolist (card hand)
      (incf (gethash (daifugo-card-system:card-suit card) suit-counts 0)))
    (some (lambda (count) (>= count 4)) (hash-table-values suit-counts))))

(defun has-sequence-four-p (hand)
  "手札に階段4枚があるかどうかを判定"
  (when (>= (length hand) 4)
    (let ((ranks (sort (remove-duplicates 
                        (mapcar #'daifugo-card-system:card-rank hand)) #'<)))
      (some (lambda (start-idx)
              (and (< (+ start-idx 3) (length ranks))
                   (= (- (nth (+ start-idx 3) ranks) (nth start-idx ranks)) 3)))
            (loop for i from 0 below (- (length ranks) 3) collect i)))))

(defun copy-kakumei-state (kakumei-system)
  "革命システム状態のコピーを作成"
  (list :active (kakumei-system-active-p kakumei-system)
        :count (kakumei-system-count kakumei-system)
        :last-type (kakumei-system-last-type kakumei-system)))

(defun hash-table-values (hash-table)
  "ハッシュテーブルの全値をリストで取得"
  (let ((values nil))
    (maphash (lambda (key value)
               (declare (ignore key))
               (push value values))
             hash-table)
    values))

;;; ============================================================================
;;; 旧互換性関数
;;; ============================================================================

(defun revolution-active-p (kakumei-system)
  "旧形式互換：革命状態確認"
  (is-kakumei-active-p kakumei-system))

(defun trigger-revolution (kakumei-system)
  "旧形式互換：革命発動"
  (trigger-kakumei kakumei-system :four-of-a-kind))

(defun check-revolution (cards)
  "旧形式互換：革命チェック"
  (get-kakumei-type cards))