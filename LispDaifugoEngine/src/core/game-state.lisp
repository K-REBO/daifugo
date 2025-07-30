;;; game-state.lisp - ゲーム状態管理

(in-package :daifugo-game-state)

;;; ============================================================================
;;; ゲーム状態構造体とデータ構造
;;; ============================================================================

(defstruct game-state
  "ゲーム全体の状態を管理する構造体"
  players           ; プレイヤーリスト
  current-player    ; 現在のプレイヤーID
  field            ; 場に出ているカード
  game-phase       ; ゲームフェーズ (:init :playing :finished)
  direction        ; 回転方向 (:clockwise :counterclockwise)
  rules            ; 適用ルール
  logs             ; ゲームログ
  round-number     ; ラウンド番号
  turn-count       ; ターン数
  revolution-p     ; 革命状態フラグ
  turn-direction   ; ターン方向（別名）
  game-over-p)     ; ゲーム終了フラグ

;;; ============================================================================
;;; ゲーム状態作成・初期化機能
;;; ============================================================================

(defun create-initial-game-state (players)
  "初期ゲーム状態を作成
   
   引数:
     players - プレイヤーリスト
   
   戻り値:
     初期化されたゲーム状態"
  (make-game-state :players players
                   :current-player 0
                   :field nil
                   :game-phase :init
                   :direction :clockwise
                   :rules nil
                   :logs nil
                   :round-number 1
                   :turn-count 0
                   :revolution-p nil
                   :turn-direction :clockwise
                   :game-over-p nil))

(defun update-game-state (game-state &key players current-player field 
                                         game-phase direction rules logs
                                         round-number turn-count revolution-p
                                         turn-direction game-over-p)
  "ゲーム状態を更新
   
   引数:
     game-state - 更新するゲーム状態
     その他 - 更新する項目（キーワード引数）
   
   戻り値:
     更新成功フラグ"
  (when players (setf (game-state-players game-state) players))
  (when current-player (setf (game-state-current-player game-state) current-player))
  (when field (setf (game-state-field game-state) field))
  (when game-phase (setf (game-state-game-phase game-state) game-phase))
  (when direction (setf (game-state-direction game-state) direction))
  (when rules (setf (game-state-rules game-state) rules))
  (when logs (setf (game-state-logs game-state) logs))
  (when round-number (setf (game-state-round-number game-state) round-number))
  (when turn-count (setf (game-state-turn-count game-state) turn-count))
  (when revolution-p (setf (game-state-revolution-p game-state) revolution-p))
  (when turn-direction (setf (game-state-turn-direction game-state) turn-direction))
  (when game-over-p (setf (game-state-game-over-p game-state) game-over-p))
  t)

;;; ============================================================================
;;; プレイヤー・ターン管理機能
;;; ============================================================================

(defun get-current-player (game-state)
  "現在のプレイヤーIDを取得
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     現在のプレイヤーID"
  (game-state-current-player game-state))

(defun advance-turn (game-state)
  "ターンを進める
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     進行成功フラグ"
  (let ((current (game-state-current-player game-state))
        (player-count (length (game-state-players game-state))))
    ;; 次のプレイヤーを計算
    (let ((next-player (if (eq (game-state-direction game-state) :clockwise)
                          (mod (1+ current) player-count)
                          (mod (1- current) player-count))))
      (setf (game-state-current-player game-state) next-player))
    ;; ターン数を増加
    (incf (game-state-turn-count game-state))
    t))

;;; ============================================================================
;;; ゲーム状態判定機能
;;; ============================================================================

(defun is-game-over-p (game-state)
  "ゲームが終了しているかを判定
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     終了判定（真偽値）"
  (or (game-state-game-over-p game-state)
      (eq (game-state-game-phase game-state) :finished)
      ;; 手札が空のプレイヤーがいるかチェック
      (some (lambda (player)
              (zerop (length (daifugo-player-system:player-hand player))))
            (game-state-players game-state))))

(defun set-game-phase (game-state phase)
  "ゲームフェーズを設定
   
   引数:
     game-state - ゲーム状態
     phase - 新しいフェーズ
   
   戻り値:
     設定成功フラグ"
  (setf (game-state-game-phase game-state) phase)
  t)

;;; ============================================================================
;;; ログ・履歴管理機能
;;; ============================================================================

(defun add-game-log (game-state log-entry)
  "ゲームログを追加
   
   引数:
     game-state - ゲーム状態
     log-entry - ログエントリ
   
   戻り値:
     追加成功フラグ"
  (push log-entry (game-state-logs game-state))
  t)

;;; ============================================================================
;;; 革命・特殊状態管理
;;; ============================================================================

(defun toggle-revolution (game-state)
  "革命状態を切り替え
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     切り替え後の革命状態"
  (setf (game-state-revolution-p game-state) 
        (not (game-state-revolution-p game-state)))
  (game-state-revolution-p game-state))

(defun set-turn-direction (game-state direction)
  "ターン方向を設定
   
   引数:
     game-state - ゲーム状態
     direction - 方向（:clockwise :counterclockwise）
   
   戻り値:
     設定成功フラグ"
  (setf (game-state-direction game-state) direction)
  (setf (game-state-turn-direction game-state) direction)
  t)

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun get-player-count (game-state)
  "プレイヤー数を取得
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     プレイヤー数"
  (length (game-state-players game-state)))

(defun get-remaining-cards (game-state)
  "各プレイヤーの残りカード数を取得
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     残りカード数のリスト"
  (mapcar (lambda (player)
            (length (daifugo-player-system:player-hand player)))
          (game-state-players game-state)))

(defun clear-field (game-state)
  "フィールドをクリア
   
   引数:
     game-state - ゲーム状態
   
   戻り値:
     クリア成功フラグ"
  (setf (game-state-field game-state) nil)
  t)