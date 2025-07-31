;;; 11back.lisp - 11バック（イレブンバック）ルール実装
;;; 
;;; 11バックルール：
;;; - ジャック（11）を出すとカードの強度が逆転する
;;; - 奇数回発動で強度逆転、偶数回発動で強度正常に戻る
;;; - 単体ジャック、ペア、3枚、4枚すべてで発動可能
;;; - ゲーム全体に影響する永続効果

(defpackage :daifugo-11back
  (:use :common-lisp)
  (:export ;; === 基本システム機能 ===
           #:create-11back-system       ; 11バックシステム作成
           #:11back-system-p            ; 11バックシステム判定
           #:is-11back-enabled-p        ; 11バック有効状態確認
           #:get-11back-settings        ; 11バック設定取得
           
           ;; === 11バック検出・発動 ===
           #:detect-11back-trigger      ; 11バックトリガー検出
           #:is-valid-11back-play-p     ; 有効な11バックプレイ判定
           #:get-11back-type            ; 11バックタイプ取得
           #:trigger-11back             ; 11バック発動
           #:is-11back-active-p         ; 11バック有効状態確認
           
           ;; === カード強度比較 ===
           #:compare-card-strength      ; カード強度比較（11バック考慮）
           #:get-card-strength-order    ; カード強度順序取得
           #:is-strength-reversed-p     ; 強度逆転状態確認
           #:apply-strength-reversal    ; 強度逆転適用
           
           ;; === ゲーム統合 ===
           #:integrate-with-game        ; ゲーム統合
           #:is-integrated-with-game-p  ; ゲーム統合確認
           #:can-trigger-in-game-p      ; ゲーム内発動可能確認
           #:get-game-integration-status ; ゲーム統合状態取得
           
           ;; === 履歴・統計 ===
           #:enable-history-tracking    ; 履歴追跡有効化
           #:get-11back-history         ; 11バック履歴取得
           #:get-trigger-count-by-type  ; タイプ別発動回数取得
           #:get-total-trigger-count    ; 総発動回数取得))

(in-package :daifugo-11back)

;;; ============================================================================
;;; 11バックシステム構造体
;;; ============================================================================

(defstruct 11back-system
  enabled-p                   ; システム有効フラグ
  trigger-count              ; 11バック発動回数
  active-p                   ; 現在の11バック有効状態
  last-trigger-type          ; 最後の発動タイプ
  settings                   ; システム設定
  history-enabled-p          ; 履歴記録有効フラグ
  trigger-history           ; 発動履歴
  integration-status        ; ゲーム統合状態
  statistics)               ; 統計データ

(defstruct 11back-trigger-record
  timestamp                  ; 発動時刻
  trigger-type              ; 発動タイプ
  player-id                 ; 発動プレイヤー
  cards                     ; 使用カード
  game-state)               ; ゲーム状態

;;; ============================================================================
;;; 基本システム機能
;;; ============================================================================

(defun create-11back-system ()
  "新しい11バックシステムインスタンスを作成
   
   戻り値:
     新しく作成された11バックシステムオブジェクト"
  (make-11back-system :enabled-p t
                      :trigger-count 0
                      :active-p nil
                      :last-trigger-type nil
                      :settings (make-hash-table :test 'equal)
                      :history-enabled-p nil
                      :trigger-history nil
                      :integration-status (make-hash-table :test 'equal)
                      :statistics (make-hash-table :test 'equal)))

(defun is-11back-enabled-p (back11-system)
  "11バックシステムが有効かどうかを確認
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）"
  (11back-system-enabled-p back11-system))

(defun get-11back-settings (back11-system)
  "11バックシステム設定を取得
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     設定ハッシュテーブル"
  (11back-system-settings back11-system))

;;; ============================================================================
;;; 11バック検出・発動機能
;;; ============================================================================

(defun detect-11back-trigger (back11-system cards)
  "11バックトリガーを検出
   
   引数:
     back11-system - 11バックシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     11バック検出結果（真偽値）"
  (when (and (is-11back-enabled-p back11-system)
             cards
             (listp cards))
    (every (lambda (card)
             (and (daifugo-card-system:card-p card)
                  (= (daifugo-card-system:get-card-rank card) 11)))
           cards)))

(defun is-valid-11back-play-p (back11-system cards)
  "有効な11バックプレイかどうかを判定
   
   引数:
     back11-system - 11バックシステムオブジェクト
     cards - カードリスト
   
   戻り値:
     有効性判定（真偽値）"
  (when (detect-11back-trigger back11-system cards)
    (let ((card-count (length cards)))
      (and (>= card-count 1)
           (<= card-count 4)
           ;; 同じランクのカード群であることを確認
           (every (lambda (card)
                    (= (daifugo-card-system:get-card-rank card) 11))
                  cards)
           ;; ペア以上の場合、適切な組み合わせかチェック
           (if (> card-count 1)
               (is-valid-jack-combination cards)
               t)))))

(defun get-11back-type (cards)
  "11バックタイプを取得
   
   引数:
     cards - カードリスト
   
   戻り値:
     11バックタイプ（:jack-single, :jack-pair, :jack-triple, :jack-quad）"
  (when (and cards (listp cards))
    (case (length cards)
      (1 :jack-single)
      (2 :jack-pair)
      (3 :jack-triple)
      (4 :jack-quad)
      (otherwise nil))))

(defun trigger-11back (back11-system trigger-type)
  "11バックを発動
   
   引数:
     back11-system - 11バックシステムオブジェクト
     trigger-type - 発動タイプ
   
   戻り値:
     発動成功フラグ"
  (when (and (is-11back-enabled-p back11-system) trigger-type)
    ;; 発動回数増加
    (incf (11back-system-trigger-count back11-system))
    ;; 有効状態切り替え（奇数回で有効、偶数回で無効）
    (setf (11back-system-active-p back11-system)
          (oddp (11back-system-trigger-count back11-system)))
    ;; 最後の発動タイプ記録
    (setf (11back-system-last-trigger-type back11-system) trigger-type)
    ;; 履歴記録
    (when (11back-system-history-enabled-p back11-system)
      (record-trigger-history back11-system trigger-type))
    ;; 統計更新
    (update-trigger-statistics back11-system trigger-type)
    t))

(defun is-11back-active-p (back11-system)
  "11バックが現在有効かどうかを確認
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）"
  (11back-system-active-p back11-system))

(defun back-active-p (back11-system)
  "11バックが現在有効かどうかを確認（エイリアス）"
  (is-11back-active-p back11-system))

;;; ============================================================================
;;; カード強度比較機能
;;; ============================================================================

(defun compare-card-strength (back11-system card1 card2)
  "カード強度を比較（11バック考慮）
   
   引数:
     back11-system - 11バックシステムオブジェクト
     card1 - 比較カード1
     card2 - 比較カード2
   
   戻り値:
     比較結果（:stronger, :weaker, :equal）"
  (let ((rank1 (daifugo-card-system:get-card-rank card1))
        (rank2 (daifugo-card-system:get-card-rank card2)))
    (let ((base-comparison (compare-base-strength rank1 rank2)))
      (if (is-11back-active-p back11-system)
          ;; 11バック有効時は強度逆転
          (reverse-strength-comparison base-comparison)
          ;; 通常時
          base-comparison))))

(defun get-card-strength-order (back11-system)
  "カード強度順序を取得
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     強度順序リスト"
  (let ((normal-order '(3 4 5 6 7 8 9 10 11 12 13 1 2)))
    (if (is-11back-active-p back11-system)
        ;; 11バック有効時は逆順
        (reverse normal-order)
        ;; 通常時
        normal-order)))

(defun is-strength-reversed-p (back11-system)
  "強度が逆転しているかどうかを確認
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     逆転状態（真偽値）"
  (is-11back-active-p back11-system))

(defun apply-strength-reversal (back11-system card-list)
  "強度逆転を適用してカードリストをソート
   
   引数:
     back11-system - 11バックシステムオブジェクト
     card-list - カードリスト
   
   戻り値:
     ソートされたカードリスト"
  (let ((strength-order (get-card-strength-order back11-system)))
    (sort (copy-list card-list)
          (lambda (card1 card2)
            (let ((rank1 (daifugo-card-system:get-card-rank card1))
                  (rank2 (daifugo-card-system:get-card-rank card2)))
              (< (position rank1 strength-order)
                 (position rank2 strength-order)))))))

;;; ============================================================================
;;; ゲーム統合機能
;;; ============================================================================

(defun integrate-with-game (back11-system game-state)
  "ゲーム状態と統合
   
   引数:
     back11-system - 11バックシステムオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     統合成功フラグ"
  (when (and back11-system game-state)
    ;; 統合状態設定
    (setf (gethash :integrated-p (11back-system-integration-status back11-system)) t)
    (setf (gethash :game-state (11back-system-integration-status back11-system)) game-state)
    (setf (gethash :integration-time (11back-system-integration-status back11-system)) 
          (get-universal-time))
    ;; ゲーム状態にも11バック情報を設定
    (when (daifugo-game-engine:game-state-p game-state)
      (setf (gethash :11back-system (daifugo-game-engine:get-game-extensions game-state))
            back11-system))
    t))

(defun is-integrated-with-game-p (back11-system game-state)
  "ゲーム状態と統合されているかを確認
   
   引数:
     back11-system - 11バックシステムオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     統合確認（真偽値）"
  (and (gethash :integrated-p (11back-system-integration-status back11-system))
       (eq (gethash :game-state (11back-system-integration-status back11-system))
           game-state)))

(defun can-trigger-in-game-p (back11-system game-state)
  "ゲーム内で11バックを発動可能かを確認
   
   引数:
     back11-system - 11バックシステムオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     発動可能性（真偽値）"
  (and (is-11back-enabled-p back11-system)
       (is-integrated-with-game-p back11-system game-state)
       (daifugo-game-engine:is-game-active-p game-state)))

(defun get-game-integration-status (back11-system)
  "ゲーム統合状態を取得
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     統合状態情報"
  (11back-system-integration-status back11-system))

;;; ============================================================================
;;; 履歴・統計機能
;;; ============================================================================

(defun enable-history-tracking (back11-system)
  "履歴追跡を有効化
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (setf (11back-system-history-enabled-p back11-system) t)
  (unless (11back-system-trigger-history back11-system)
    (setf (11back-system-trigger-history back11-system) nil))
  t)

(defun get-11back-history (back11-system)
  "11バック履歴を取得
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     履歴リスト"
  (11back-system-trigger-history back11-system))

(defun get-trigger-count-by-type (history trigger-type)
  "タイプ別発動回数を取得
   
   引数:
     history - 履歴リスト
     trigger-type - 発動タイプ
   
   戻り値:
     発動回数"
  (count-if (lambda (record)
              (eq (11back-trigger-record-trigger-type record) trigger-type))
            history))

(defun get-total-trigger-count (back11-system)
  "総発動回数を取得
   
   引数:
     back11-system - 11バックシステムオブジェクト
   
   戻り値:
     総発動回数"
  (11back-system-trigger-count back11-system))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun is-valid-jack-combination (cards)
  "有効なジャック組み合わせかどうかを判定
   
   引数:
     cards - カードリスト
   
   戻り値:
     有効性判定（真偽値）"
  (let ((card-count (length cards)))
    (and (> card-count 1)
         (<= card-count 4)
         ;; 全てジャック（11）であることを確認
         (every (lambda (card)
                  (= (daifugo-card-system:get-card-rank card) 11))
                cards)
         ;; スート重複なし（ペア以上の場合）
         (= (length (remove-duplicates 
                     (mapcar #'daifugo-card-system:get-card-suit cards)))
            card-count))))

(defun compare-base-strength (rank1 rank2)
  "基本的なカード強度比較
   
   引数:
     rank1 - ランク1
     rank2 - ランク2
   
   戻り値:
     比較結果（:stronger, :weaker, :equal）"
  (let ((order '(3 4 5 6 7 8 9 10 11 12 13 1 2)))
    (let ((pos1 (position rank1 order))
          (pos2 (position rank2 order)))
      (cond ((> pos1 pos2) :stronger)
            ((< pos1 pos2) :weaker)
            (t :equal)))))

(defun reverse-strength-comparison (comparison)
  "強度比較結果を逆転
   
   引数:
     comparison - 比較結果
   
   戻り値:
     逆転した比較結果"
  (case comparison
    (:stronger :weaker)
    (:weaker :stronger)
    (:equal :equal)
    (otherwise :equal)))

(defun record-trigger-history (back11-system trigger-type)
  "発動履歴を記録
   
   引数:
     back11-system - 11バックシステムオブジェクト
     trigger-type - 発動タイプ
   
   戻り値:
     記録成功フラグ"
  (when (11back-system-history-enabled-p back11-system)
    (let ((record (make-11back-trigger-record 
                   :timestamp (get-universal-time)
                   :trigger-type trigger-type
                   :player-id nil  ; 実装時に設定
                   :cards nil      ; 実装時に設定
                   :game-state nil))) ; 実装時に設定
      (push record (11back-system-trigger-history back11-system))
      t)))

(defun update-trigger-statistics (back11-system trigger-type)
  "発動統計を更新
   
   引数:
     back11-system - 11バックシステムオブジェクト
     trigger-type - 発動タイプ
   
   戻り値:
     更新成功フラグ"
  (let ((stats (11back-system-statistics back11-system)))
    ;; タイプ別カウント更新
    (incf (gethash trigger-type stats 0))
    ;; 総発動回数更新
    (incf (gethash :total-triggers stats 0))
    ;; 最終発動時刻更新
    (setf (gethash :last-trigger-time stats) (get-universal-time))
    t))