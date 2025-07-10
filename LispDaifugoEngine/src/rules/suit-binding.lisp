;;; suit-binding.lisp - スート縛り（マーク縛り）ルール実装
;;; 
;;; スート縛りルール：
;;; - 同一スートのカードを複数枚出すとそのスートで縛られる
;;; - 縛り中は指定されたスートのカードしか出せない
;;; - 流れるか特定条件で縛りが解除される
;;; - 連鎖反応で縛りが強化される場合もある

(defpackage :daifugo-suit-binding
  (:use :common-lisp)
  (:export ;; === 基本システム機能 ===
           #:create-suit-binding-system    ; スート縛りシステム作成
           #:suit-binding-system-p         ; スート縛りシステム判定
           #:is-suit-binding-enabled-p     ; スート縛り有効状態確認
           #:get-binding-settings          ; 縛り設定取得
           
           ;; === スート縛り検出・発動 ===
           #:detect-suit-binding           ; スート縛り検出
           #:is-valid-binding-play-p       ; 有効な縛りプレイ判定
           #:get-binding-suit              ; 縛りスート取得
           #:activate-suit-binding         ; スート縛り発動
           #:is-suit-binding-active-p      ; スート縛り有効状態確認
           
           ;; === 縛り強制・制御 ===
           #:get-active-binding-suit       ; 有効縛りスート取得
           #:is-valid-play-under-binding   ; 縛り下での有効プレイ判定
           #:release-suit-binding          ; スート縛り解除
           #:check-binding-release-conditions ; 縛り解除条件確認
           
           ;; === 連鎖反応・拡張機能 ===
           #:enable-chain-reaction         ; 連鎖反応有効化
           #:is-chain-reaction-active-p    ; 連鎖反応有効状態確認
           #:process-binding-play          ; 縛りプレイ処理
           #:get-chain-count               ; 連鎖回数取得
           
           ;; === 履歴・統計 ===
           #:get-binding-history           ; 縛り履歴取得
           #:get-binding-statistics        ; 縛り統計取得))

(in-package :daifugo-suit-binding)

;;; ============================================================================
;;; スート縛りシステム構造体
;;; ============================================================================

(defstruct suit-binding-system
  enabled-p                   ; システム有効フラグ
  active-binding-p           ; 現在縛り有効フラグ
  active-suit                ; 現在の縛りスート
  binding-strength           ; 縛りの強度
  chain-reaction-enabled-p   ; 連鎖反応有効フラグ
  chain-count                ; 連鎖回数
  settings                   ; システム設定
  history                    ; 縛り履歴
  statistics)                ; 統計データ

(defstruct suit-binding-record
  timestamp                  ; 発生時刻
  binding-suit              ; 縛りスート
  trigger-cards             ; 発動カード
  player-id                 ; 発動プレイヤー
  release-reason)           ; 解除理由

;;; ============================================================================
;;; 基本システム機能
;;; ============================================================================

(defun create-suit-binding-system ()
  \"新しいスート縛りシステムインスタンスを作成
   
   戻り値:
     新しく作成されたスート縛りシステムオブジェクト\"
  (make-suit-binding-system :enabled-p t
                            :active-binding-p nil
                            :active-suit nil
                            :binding-strength 1
                            :chain-reaction-enabled-p nil
                            :chain-count 0
                            :settings (make-hash-table :test 'equal)
                            :history nil
                            :statistics (make-hash-table :test 'equal)))

(defun is-suit-binding-enabled-p (suit-binding-system)
  \"スート縛りシステムが有効かどうかを確認
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）\"
  (suit-binding-system-enabled-p suit-binding-system))

(defun get-binding-settings (suit-binding-system)
  \"スート縛りシステム設定を取得
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     設定ハッシュテーブル\"
  (suit-binding-system-settings suit-binding-system))

;;; ============================================================================
;;; スート縛り検出・発動機能
;;; ============================================================================

(defun detect-suit-binding (suit-binding-system cards)
  \"スート縛りを検出
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     縛り検出結果（真偽値）\"
  (when (and (is-suit-binding-enabled-p suit-binding-system)
             cards
             (listp cards)
             (> (length cards) 1))
    ;; 全て同一スートかチェック
    (let ((first-suit (daifugo-card-system:get-card-suit (first cards))))
      (every (lambda (card)
               (eq (daifugo-card-system:get-card-suit card) first-suit))
             cards))))

(defun is-valid-binding-play-p (suit-binding-system cards)
  \"有効な縛りプレイかどうかを判定
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     有効性判定（真偽値）\"
  (when (detect-suit-binding suit-binding-system cards)
    (let ((card-count (length cards)))
      (and (>= card-count 2)
           (<= card-count 4)
           ;; 同じスートのカード群であることを確認
           (let ((suits (mapcar #'daifugo-card-system:get-card-suit cards)))
             (= (length (remove-duplicates suits)) 1))
           ;; 有効なカード組み合わせかチェック
           (is-valid-suit-combination cards)))))

(defun get-binding-suit (cards)
  \"縛りスートを取得
   
   引数:
     cards - カードリスト
   
   戻り値:
     縛りスート\"
  (when (and cards (listp cards) (> (length cards) 1))
    (let ((first-suit (daifugo-card-system:get-card-suit (first cards))))
      (when (every (lambda (card)
                     (eq (daifugo-card-system:get-card-suit card) first-suit))
                   cards)
        first-suit))))

(defun activate-suit-binding (suit-binding-system binding-suit)
  \"スート縛りを発動
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     binding-suit - 縛りスート
   
   戻り値:
     発動成功フラグ\"
  (when (and (is-suit-binding-enabled-p suit-binding-system) binding-suit)
    ;; 縛り状態設定
    (setf (suit-binding-system-active-binding-p suit-binding-system) t)
    (setf (suit-binding-system-active-suit suit-binding-system) binding-suit)
    ;; 連鎖反応処理
    (when (suit-binding-system-chain-reaction-enabled-p suit-binding-system)
      (incf (suit-binding-system-chain-count suit-binding-system)))
    ;; 履歴記録
    (record-binding-history suit-binding-system binding-suit)
    ;; 統計更新
    (update-binding-statistics suit-binding-system binding-suit)
    t))

(defun is-suit-binding-active-p (suit-binding-system)
  \"スート縛りが現在有効かどうかを確認
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）\"
  (suit-binding-system-active-binding-p suit-binding-system))

;;; ============================================================================
;;; 縛り強制・制御機能
;;; ============================================================================

(defun get-active-binding-suit (suit-binding-system)
  \"有効な縛りスートを取得
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     縛りスート（nil if 縛りなし）\"
  (when (is-suit-binding-active-p suit-binding-system)
    (suit-binding-system-active-suit suit-binding-system)))

(defun is-valid-play-under-binding (suit-binding-system cards)
  \"縛り下での有効プレイかどうかを判定
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     有効性判定（真偽値）\"
  (if (is-suit-binding-active-p suit-binding-system)
      ;; 縛り有効時：指定スートのみ有効
      (let ((required-suit (get-active-binding-suit suit-binding-system)))
        (every (lambda (card)
                 (eq (daifugo-card-system:get-card-suit card) required-suit))
               cards))
      ;; 縛りなし時：全スート有効
      t))

(defun release-suit-binding (suit-binding-system release-reason)
  \"スート縛りを解除
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     release-reason - 解除理由
   
   戻り値:
     解除成功フラグ\"
  (when (is-suit-binding-active-p suit-binding-system)
    ;; 解除理由を履歴に記録
    (when (suit-binding-system-history suit-binding-system)
      (setf (suit-binding-record-release-reason 
             (first (suit-binding-system-history suit-binding-system)))
            release-reason))
    ;; 縛り状態解除
    (setf (suit-binding-system-active-binding-p suit-binding-system) nil)
    (setf (suit-binding-system-active-suit suit-binding-system) nil)
    ;; 連鎖回数リセット
    (setf (suit-binding-system-chain-count suit-binding-system) 0)
    ;; 統計更新
    (update-release-statistics suit-binding-system release-reason)
    t))

(defun check-binding-release-conditions (suit-binding-system game-context)
  \"縛り解除条件を確認
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     game-context - ゲームコンテキスト
   
   戻り値:
     解除条件判定（真偽値）と解除理由\"
  (when (is-suit-binding-active-p suit-binding-system)
    ;; 標準的な解除条件をチェック
    (cond
      ;; 場が流れた
      ((and game-context (getf game-context :field-cleared))
       (values t :field-cleared))
      ;; ターン終了
      ((and game-context (getf game-context :turn-ended))
       (values t :turn-end))
      ;; 特殊カード（ジョーカー等）
      ((and game-context (getf game-context :special-card-played))
       (values t :special-card))
      ;; 革命発動
      ((and game-context (getf game-context :revolution-triggered))
       (values t :revolution))
      ;; デフォルト：解除なし
      (t (values nil nil)))))

;;; ============================================================================
;;; 連鎖反応・拡張機能
;;; ============================================================================

(defun enable-chain-reaction (suit-binding-system)
  \"連鎖反応を有効化
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (suit-binding-system-chain-reaction-enabled-p suit-binding-system) t)
  t)

(defun is-chain-reaction-active-p (suit-binding-system)
  \"連鎖反応が有効かどうかを確認
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）\"
  (and (suit-binding-system-chain-reaction-enabled-p suit-binding-system)
       (> (suit-binding-system-chain-count suit-binding-system) 1)))

(defun process-binding-play (suit-binding-system cards)
  \"縛りプレイを処理
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     処理成功フラグ\"
  (when (and (is-suit-binding-enabled-p suit-binding-system) cards)
    ;; 新規縛り検出
    (when (detect-suit-binding suit-binding-system cards)
      (let ((binding-suit (get-binding-suit cards)))
        (cond
          ;; 既存縛りと同じスート：連鎖強化
          ((and (is-suit-binding-active-p suit-binding-system)
                (eq binding-suit (get-active-binding-suit suit-binding-system)))
           (when (suit-binding-system-chain-reaction-enabled-p suit-binding-system)
             (incf (suit-binding-system-chain-count suit-binding-system))
             (incf (suit-binding-system-binding-strength suit-binding-system)))
           t)
          ;; 新規縛り発動
          ((not (is-suit-binding-active-p suit-binding-system))
           (activate-suit-binding suit-binding-system binding-suit))
          ;; 異なるスートでの縛り：既存を上書き
          (t
           (release-suit-binding suit-binding-system :overridden)
           (activate-suit-binding suit-binding-system binding-suit)))))
    ;; 縛り下でのプレイ検証
    (when (is-suit-binding-active-p suit-binding-system)
      (is-valid-play-under-binding suit-binding-system cards))))

(defun get-chain-count (suit-binding-system)
  \"連鎖回数を取得
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     連鎖回数\"
  (suit-binding-system-chain-count suit-binding-system))

;;; ============================================================================
;;; 履歴・統計機能
;;; ============================================================================

(defun get-binding-history (suit-binding-system)
  \"縛り履歴を取得
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     履歴リスト\"
  (suit-binding-system-history suit-binding-system))

(defun get-binding-statistics (suit-binding-system)
  \"縛り統計を取得
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
   
   戻り値:
     統計データ\"
  (suit-binding-system-statistics suit-binding-system))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun is-valid-suit-combination (cards)
  \"有効なスート組み合わせかどうかを判定
   
   引数:
     cards - カードリスト
   
   戻り値:
     有効性判定（真偽値）\"
  (let ((card-count (length cards)))
    (and (>= card-count 2)
         (<= card-count 4)
         ;; 同一スート確認
         (let ((suits (mapcar #'daifugo-card-system:get-card-suit cards)))
           (= (length (remove-duplicates suits)) 1))
         ;; 同一ランク確認（ペア・3枚・4枚の場合）
         (let ((ranks (mapcar #'daifugo-card-system:get-card-rank cards)))
           (= (length (remove-duplicates ranks)) 1)))))

(defun record-binding-history (suit-binding-system binding-suit)
  \"縛り履歴を記録
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     binding-suit - 縛りスート
   
   戻り値:
     記録成功フラグ\"
  (let ((record (make-suit-binding-record 
                 :timestamp (get-universal-time)
                 :binding-suit binding-suit
                 :trigger-cards nil  ; 実装時に設定
                 :player-id nil      ; 実装時に設定
                 :release-reason nil)))
    (push record (suit-binding-system-history suit-binding-system))
    t))

(defun update-binding-statistics (suit-binding-system binding-suit)
  \"縛り統計を更新
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     binding-suit - 縛りスート
   
   戻り値:
     更新成功フラグ\"
  (let ((stats (suit-binding-system-statistics suit-binding-system)))
    ;; スート別縛り回数更新
    (incf (gethash binding-suit stats 0))
    ;; 総縛り回数更新
    (incf (gethash :total-bindings stats 0))
    ;; 最終縛り時刻更新
    (setf (gethash :last-binding-time stats) (get-universal-time))
    t))

(defun update-release-statistics (suit-binding-system release-reason)
  \"解除統計を更新
   
   引数:
     suit-binding-system - スート縛りシステムオブジェクト
     release-reason - 解除理由
   
   戻り値:
     更新成功フラグ\"
  (let ((stats (suit-binding-system-statistics suit-binding-system)))
    ;; 解除理由別カウント更新
    (incf (gethash release-reason stats 0))
    ;; 総解除回数更新
    (incf (gethash :total-releases stats 0))
    t))