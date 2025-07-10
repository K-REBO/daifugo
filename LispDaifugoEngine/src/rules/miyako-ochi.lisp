;;; miyako-ochi.lisp - 都落ち（みやこおち）ルール実装
;;; 
;;; 都落ちルール：
;;; - 大富豪が最下位になると大貧民に転落
;;; - 特定条件下では防止される場合がある
;;; - 補償システムで公平性を保つ場合もある
;;; - ゲームバランスに大きく影響する特殊ルール

(defpackage :daifugo-miyako-ochi
  (:use :common-lisp)
  (:export ;; === 基本システム機能 ===
           #:create-miyako-ochi-system     ; 都落ちシステム作成
           #:miyako-ochi-system-p          ; 都落ちシステム判定
           #:is-miyako-ochi-enabled-p      ; 都落ち有効状態確認
           #:get-ochi-settings             ; 都落ち設定取得
           
           ;; === 都落ち発動条件・実行 ===
           #:check-ochi-conditions         ; 都落ち条件確認
           #:is-eligible-for-ochi-p        ; 都落ち対象判定
           #:get-ochi-trigger-type         ; 都落ち発動タイプ取得
           #:execute-miyako-ochi           ; 都落ち実行
           #:is-ochi-executed-p            ; 都落ち実行確認
           
           ;; === プレイヤー階級管理 ===
           #:set-player-rank               ; プレイヤー階級設定
           #:get-player-rank               ; プレイヤー階級取得
           #:update-player-ranks           ; プレイヤー階級更新
           #:get-rank-hierarchy            ; 階級階層取得
           
           ;; === 都落ち防止機能 ===
           #:set-prevention-rule           ; 防止ルール設定
           #:attempt-miyako-ochi           ; 都落ち実行試行
           #:is-ochi-prevented-p           ; 都落ち防止確認
           #:get-prevention-reason         ; 防止理由取得
           #:give-joker-to-player          ; プレイヤーにジョーカー付与
           
           ;; === 補償システム ===
           #:enable-compensation           ; 補償有効化
           #:set-compensation-type         ; 補償タイプ設定
           #:apply-compensation            ; 補償適用
           #:is-compensation-applied-p     ; 補償適用確認
           #:get-compensation-details      ; 補償詳細取得
           #:is-compensation-fair-p        ; 補償公平性確認
           
           ;; === 統計・分析 ===
           #:enable-statistics             ; 統計有効化
           #:simulate-ochi-scenario        ; 都落ちシナリオシミュレーション
           #:get-ochi-statistics           ; 都落ち統計取得
           #:get-total-ochi-count          ; 総都落ち回数取得
           #:get-ochi-frequency            ; 都落ち頻度取得
           #:get-prevention-rate           ; 防止率取得))

(in-package :daifugo-miyako-ochi)

;;; ============================================================================
;;; 都落ちシステム構造体
;;; ============================================================================

(defstruct miyako-ochi-system
  enabled-p                  ; システム有効フラグ
  prevention-rules          ; 防止ルール設定
  compensation-enabled-p    ; 補償有効フラグ
  compensation-type         ; 補償タイプ
  statistics-enabled-p      ; 統計有効フラグ
  executed-ochi            ; 実行された都落ち記録
  prevented-ochi           ; 防止された都落ち記録
  settings                 ; システム設定
  statistics               ; 統計データ
  history)                 ; 都落ち履歴

(defstruct miyako-ochi-record
  timestamp                ; 発生時刻
  target-player           ; 対象プレイヤー
  trigger-type            ; 発動タイプ
  prevented-p             ; 防止フラグ
  prevention-reason       ; 防止理由
  compensation-applied-p  ; 補償適用フラグ
  final-rank)             ; 最終階級

;;; ============================================================================
;;; 基本システム機能
;;; ============================================================================

(defun create-miyako-ochi-system ()
  \"新しい都落ちシステムインスタンスを作成
   
   戻り値:
     新しく作成された都落ちシステムオブジェクト\"
  (make-miyako-ochi-system :enabled-p t
                           :prevention-rules (make-hash-table :test 'equal)
                           :compensation-enabled-p nil
                           :compensation-type :card-exchange
                           :statistics-enabled-p nil
                           :executed-ochi (make-hash-table :test 'equal)
                           :prevented-ochi (make-hash-table :test 'equal)
                           :settings (make-hash-table :test 'equal)
                           :statistics (make-hash-table :test 'equal)
                           :history nil))

(defun is-miyako-ochi-enabled-p (miyako-system)
  \"都落ちシステムが有効かどうかを確認
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     有効状態（真偽値）\"
  (miyako-ochi-system-enabled-p miyako-system))

(defun get-ochi-settings (miyako-system)
  \"都落ちシステム設定を取得
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     設定ハッシュテーブル\"
  (miyako-ochi-system-settings miyako-system))

;;; ============================================================================
;;; 都落ち発動条件・実行機能
;;; ============================================================================

(defun check-ochi-conditions (miyako-system game-state player-id)
  \"都落ち条件を確認
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     条件満足（真偽値）\"
  (when (and (is-miyako-ochi-enabled-p miyako-system)
             game-state
             (numberp player-id))
    (let ((current-rank (get-player-rank game-state player-id))
          (game-result (get-game-result game-state player-id)))
      ;; 大富豪が最下位になった場合
      (and (eq current-rank :daifugo)
           (eq game-result :last-place)))))

(defun is-eligible-for-ochi-p (miyako-system player-id)
  \"プレイヤーが都落ち対象かどうかを判定
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     対象判定（真偽値）\"
  (and (is-miyako-ochi-enabled-p miyako-system)
       (numberp player-id)
       (>= player-id 0)
       (<= player-id 3)))  ; 4人プレイ想定

(defun get-ochi-trigger-type (miyako-system)
  \"都落ち発動タイプを取得
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     発動タイプ\"
  :last-place-finish)  ; 基本的な発動タイプ

(defun execute-miyako-ochi (miyako-system game-state player-id)
  \"都落ちを実行
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     実行成功フラグ\"
  (when (and (check-ochi-conditions miyako-system game-state player-id)
             (not (is-ochi-prevented miyako-system game-state player-id)))
    ;; 階級変更：大富豪 → 大貧民
    (set-player-rank game-state player-id :daihinmin)
    ;; 実行記録
    (setf (gethash player-id (miyako-ochi-system-executed-ochi miyako-system)) t)
    ;; 履歴記録
    (record-ochi-history miyako-system player-id :executed)
    ;; 統計更新
    (update-ochi-statistics miyako-system player-id :executed)
    t))

(defun is-ochi-executed-p (miyako-system player-id)
  \"都落ちが実行されたかを確認
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     実行確認（真偽値）\"
  (gethash player-id (miyako-ochi-system-executed-ochi miyako-system) nil))

;;; ============================================================================
;;; プレイヤー階級管理機能
;;; ============================================================================

(defun set-player-rank (game-state player-id rank)
  \"プレイヤー階級を設定
   
   引数:
     game-state - ゲーム状態
     player-id - プレイヤーID
     rank - 階級
   
   戻り値:
     設定成功フラグ\"
  (when (and game-state (numberp player-id) rank)
    ;; ゲーム状態に階級情報を設定
    (let ((player-ranks (or (getf (get-game-data game-state) :player-ranks)
                           (make-hash-table :test 'equal))))
      (setf (gethash player-id player-ranks) rank)
      (setf (getf (get-game-data game-state) :player-ranks) player-ranks)
      t)))

(defun get-player-rank (game-state player-id)
  \"プレイヤー階級を取得
   
   引数:
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     プレイヤー階級\"
  (when (and game-state (numberp player-id))
    (let ((player-ranks (getf (get-game-data game-state) :player-ranks)))
      (when player-ranks
        (gethash player-id player-ranks :heimin)))))  ; デフォルト：平民

(defun update-player-ranks (game-state rank-results)
  \"プレイヤー階級を一括更新
   
   引数:
     game-state - ゲーム状態
     rank-results - 階級結果リスト
   
   戻り値:
     更新成功フラグ\"
  (when (and game-state rank-results)
    (dolist (result rank-results)
      (let ((player-id (getf result :player-id))
            (rank (getf result :rank)))
        (set-player-rank game-state player-id rank)))
    t))

(defun get-rank-hierarchy (miyako-system)
  \"階級階層を取得
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     階級階層リスト\"
  '(:daifugo :fugo :heimin :hinmin :daihinmin))

;;; ============================================================================
;;; 都落ち防止機能
;;; ============================================================================

(defun set-prevention-rule (miyako-system rule-key value)
  \"防止ルールを設定
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     rule-key - ルールキー
     value - ルール値
   
   戻り値:
     設定成功フラグ\"
  (setf (gethash rule-key (miyako-ochi-system-prevention-rules miyako-system)) value)
  t)

(defun attempt-miyako-ochi (miyako-system game-state player-id)
  \"都落ち実行を試行
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     試行結果（実行 or 防止）\"
  (if (is-ochi-prevented miyako-system game-state player-id)
      ;; 防止された場合
      (progn
        (setf (gethash player-id (miyako-ochi-system-prevented-ochi miyako-system)) t)
        (record-ochi-history miyako-system player-id :prevented)
        nil)
      ;; 実行される場合
      (execute-miyako-ochi miyako-system game-state player-id)))

(defun is-ochi-prevented-p (miyako-system player-id)
  \"都落ちが防止されたかを確認
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     防止確認（真偽値）\"
  (gethash player-id (miyako-ochi-system-prevented-ochi miyako-system) nil))

(defun get-prevention-reason (miyako-system player-id)
  \"防止理由を取得
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     防止理由\"
  (when (is-ochi-prevented-p miyako-system player-id)
    ;; 履歴から防止理由を取得
    (let ((history (miyako-ochi-system-history miyako-system)))
      (dolist (record history)
        (when (and (= (miyako-ochi-record-target-player record) player-id)
                   (miyako-ochi-record-prevented-p record))
          (return (miyako-ochi-record-prevention-reason record)))))))

(defun give-joker-to-player (game-state player-id)
  \"プレイヤーにジョーカーを付与
   
   引数:
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     付与成功フラグ\"
  (when (and game-state (numberp player-id))
    ;; プレイヤーの手札にジョーカーを追加
    (let ((player-hands (or (getf (get-game-data game-state) :player-hands)
                           (make-hash-table :test 'equal))))
      (let ((current-hand (gethash player-id player-hands)))
        (push (create-joker-card) current-hand)
        (setf (gethash player-id player-hands) current-hand)
        (setf (getf (get-game-data game-state) :player-hands) player-hands)
        t))))

;;; ============================================================================
;;; 補償システム機能
;;; ============================================================================

(defun enable-compensation (miyako-system)
  \"補償システムを有効化
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (miyako-ochi-system-compensation-enabled-p miyako-system) t)
  t)

(defun set-compensation-type (miyako-system compensation-type)
  \"補償タイプを設定
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     compensation-type - 補償タイプ
   
   戻り値:
     設定成功フラグ\"
  (setf (miyako-ochi-system-compensation-type miyako-system) compensation-type)
  t)

(defun apply-compensation (miyako-system game-state player-id)
  \"補償を適用
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     適用成功フラグ\"
  (when (and (miyako-ochi-system-compensation-enabled-p miyako-system)
             (is-ochi-executed-p miyako-system player-id))
    (let ((compensation-type (miyako-ochi-system-compensation-type miyako-system)))
      (case compensation-type
        (:card-exchange (apply-card-exchange-compensation game-state player-id))
        (:extra-turn (apply-extra-turn-compensation game-state player-id))
        (:rank-protection (apply-rank-protection-compensation game-state player-id))
        (otherwise nil)))))

(defun is-compensation-applied-p (miyako-system player-id)
  \"補償が適用されたかを確認
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     適用確認（真偽値）\"
  (let ((history (miyako-ochi-system-history miyako-system)))
    (some (lambda (record)
            (and (= (miyako-ochi-record-target-player record) player-id)
                 (miyako-ochi-record-compensation-applied-p record)))
          history)))

(defun get-compensation-details (miyako-system player-id)
  \"補償詳細を取得
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     補償詳細\"
  (when (is-compensation-applied-p miyako-system player-id)
    (list :type (miyako-ochi-system-compensation-type miyako-system)
          :applied-time (get-universal-time)
          :player-id player-id)))

(defun is-compensation-fair-p (miyako-system player-id)
  \"補償が公平かどうかを確認
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     player-id - プレイヤーID
   
   戻り値:
     公平性判定（真偽値）\"
  ;; 簡易実装：補償が適用されていれば公平とみなす
  (is-compensation-applied-p miyako-system player-id))

;;; ============================================================================
;;; 統計・分析機能
;;; ============================================================================

(defun enable-statistics (miyako-system)
  \"統計記録を有効化
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     有効化成功フラグ\"
  (setf (miyako-ochi-system-statistics-enabled-p miyako-system) t)
  t)

(defun simulate-ochi-scenario (miyako-system game-state scenario-id)
  \"都落ちシナリオをシミュレーション
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     game-state - ゲーム状態
     scenario-id - シナリオID
   
   戻り値:
     シミュレーション成功フラグ\"
  (when (miyako-ochi-system-statistics-enabled-p miyako-system)
    ;; 仮想的な都落ちシナリオを実行
    (let ((target-player (mod scenario-id 4)))
      (set-player-rank game-state target-player :daifugo)
      (attempt-miyako-ochi miyako-system game-state target-player)
      t)))

(defun get-ochi-statistics (miyako-system)
  \"都落ち統計を取得
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
   
   戻り値:
     統計データ\"
  (miyako-ochi-system-statistics miyako-system))

(defun get-total-ochi-count (stats)
  \"総都落ち回数を取得
   
   引数:
     stats - 統計データ
   
   戻り値:
     総都落ち回数\"
  (gethash :total-ochi stats 0))

(defun get-ochi-frequency (stats)
  \"都落ち頻度を取得
   
   引数:
     stats - 統計データ
   
   戻り値:
     都落ち頻度\"
  (let ((total (gethash :total-games stats 1))
        (ochi-count (get-total-ochi-count stats)))
    (/ ochi-count total)))

(defun get-prevention-rate (stats)
  \"防止率を取得
   
   引数:
     stats - 統計データ
   
   戻り値:
     防止率\"
  (let ((total-attempts (gethash :total-attempts stats 1))
        (prevented (gethash :total-prevented stats 0)))
    (/ prevented total-attempts)))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun is-ochi-prevented (miyako-system game-state player-id)
  \"都落ちが防止されるかを判定
   
   引数:
     miyako-system - 都落ちシステムオブジェクト
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     防止判定（真偽値）と防止理由\"
  (let ((prevention-rules (miyako-ochi-system-prevention-rules miyako-system)))
    (cond
      ;; ジョーカー保護
      ((and (gethash :joker-protection prevention-rules)
            (player-has-joker-p game-state player-id))
       (values t :joker-protection))
      ;; 革命免疫
      ((and (gethash :revolution-immunity prevention-rules)
            (is-revolution-active-p game-state))
       (values t :revolution-immunity))
      ;; 連続防止（前回も防止された場合）
      ((and (gethash :consecutive-prevention prevention-rules)
            (was-previously-prevented-p miyako-system player-id))
       (values t :consecutive-prevention))
      ;; 防止なし
      (t (values nil nil)))))

;; ヘルパー関数群（簡易実装）
(defun get-game-data (game-state)
  \"ゲーム状態からデータを取得\"
  (or (getf game-state :data) 
      (setf (getf game-state :data) nil)))

(defun get-game-result (game-state player-id)
  \"ゲーム結果を取得\"
  :last-place)  ; 簡易実装

(defun player-has-joker-p (game-state player-id)
  \"プレイヤーがジョーカーを持っているか\"
  (let ((player-hands (getf (get-game-data game-state) :player-hands)))
    (when player-hands
      (let ((hand (gethash player-id player-hands)))
        (some #'is-joker-card-p hand)))))

(defun is-revolution-active-p (game-state)
  \"革命が発動中か\"
  (getf (get-game-data game-state) :revolution-active))

(defun was-previously-prevented-p (miyako-system player-id)
  \"前回防止されたか\"
  (gethash player-id (miyako-ochi-system-prevented-ochi miyako-system)))

(defun create-joker-card ()
  \"ジョーカーカードを作成\"
  (list :rank :joker :suit :any))

(defun is-joker-card-p (card)
  \"ジョーカーカードか判定\"
  (and (listp card) (eq (getf card :rank) :joker)))

;; 補償適用関数群（簡易実装）
(defun apply-card-exchange-compensation (game-state player-id) t)
(defun apply-extra-turn-compensation (game-state player-id) t)
(defun apply-rank-protection-compensation (game-state player-id) t)

(defun record-ochi-history (miyako-system player-id result-type)
  \"都落ち履歴を記録\"
  (let ((record (make-miyako-ochi-record 
                 :timestamp (get-universal-time)
                 :target-player player-id
                 :trigger-type (get-ochi-trigger-type miyako-system)
                 :prevented-p (eq result-type :prevented)
                 :prevention-reason (when (eq result-type :prevented) :joker-protection)
                 :compensation-applied-p nil
                 :final-rank (if (eq result-type :executed) :daihinmin :daifugo))))
    (push record (miyako-ochi-system-history miyako-system))
    t))

(defun update-ochi-statistics (miyako-system player-id result-type)
  \"都落ち統計を更新\"
  (when (miyako-ochi-system-statistics-enabled-p miyako-system)
    (let ((stats (miyako-ochi-system-statistics miyako-system)))
      (case result-type
        (:executed 
         (incf (gethash :total-ochi stats 0))
         (incf (gethash :total-attempts stats 0)))
        (:prevented
         (incf (gethash :total-prevented stats 0))
         (incf (gethash :total-attempts stats 0))))
      (incf (gethash :total-games stats 0))
      t)))