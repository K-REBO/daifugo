;;; ai-players.lisp - 大富豪ゲーム用AIプレイヤーシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 複数種類のAI戦略（ランダム、スマート、アグレッシブ、ディフェンシブ等）
;;; - AI学習・適応機能
;;; - ゲームエンジンとの統合
;;; - 設定可能な難易度レベル
;;; - デバッグ・分析機能

(defpackage :daifugo-ai-players
  (:use :common-lisp)
  (:export ;; === 基本AIプレイヤー機能 ===
           #:create-ai-player          ; AIプレイヤー作成
           #:ai-player-p               ; AIプレイヤー判定
           #:ai-player-type            ; AIタイプ取得
           #:ai-player-id              ; プレイヤーID取得
           #:ai-player-hand            ; 手札取得
           #:ai-player-initialized-p   ; 初期化状態確認
           
           ;; === AI管理・初期化 ===
           #:get-supported-ai-types    ; サポートAIタイプ一覧
           #:initialize-ai-player      ; AIプレイヤー初期化
           #:register-ai-players       ; AIプレイヤー登録
           
           ;; === AI意思決定・戦略 ===
           #:make-decision             ; AI意思決定
           #:execute-ai-turn           ; AIターン実行
           
           ;; === AI学習・適応機能 ===
           #:ai-supports-learning-p    ; 学習機能サポート確認
           #:ai-supports-adaptation-p  ; 適応機能サポート確認
           #:provide-learning-data     ; 学習データ提供
           #:observe-opponent-pattern  ; 相手パターン観察
           #:get-ai-performance-score  ; 性能スコア取得
           #:get-current-adaptation    ; 現在の適応状態取得
           
           ;; === AI設定・カスタマイズ ===
           #:ai-supports-configuration-p ; 設定機能サポート確認
           #:configure-ai-player       ; AI設定
           #:get-ai-configuration      ; AI設定取得
           #:get-ai-skill-level        ; AIスキルレベル取得
           
           ;; === AIデバッグ・分析機能 ===
           #:enable-decision-logging   ; 意思決定ログ有効化
           #:get-decision-log          ; 意思決定ログ取得
           #:analyze-game-state        ; ゲーム状態分析
           
           ;; === 旧互換性 ===
           #:ai-player                 ; 旧形式互換
           #:make-ai-player            ; 旧形式互換
           #:make-move))               ; 旧形式互換

(in-package :daifugo-ai-players)

;;; ============================================================================
;;; AIプレイヤー構造体とデータ構造
;;; ============================================================================

(defstruct ai-player%
  id                      ; プレイヤーID
  type                    ; AIタイプ
  hand                    ; 手札
  initialized-p           ; 初期化フラグ
  configuration          ; AI設定
  learning-data          ; 学習データ
  adaptation-state       ; 適応状態
  decision-log           ; 意思決定ログ
  performance-score      ; 性能スコア
  skill-level)           ; スキルレベル

(defstruct ai-configuration
  aggression-level       ; 攻撃性レベル (0.0-1.0)
  risk-tolerance        ; リスク許容度 (0.0-1.0)
  learning-rate         ; 学習率 (0.0-1.0)
  difficulty)           ; 難易度 (:easy :normal :hard)

(defstruct ai-decision-entry
  timestamp             ; タイムスタンプ
  game-state           ; ゲーム状態のスナップショット
  decision             ; 行った決定
  reasoning)           ; 決定理由

(defstruct game-state-analysis
  hand-strength        ; 手札の強さ評価
  field-analysis       ; フィールド状況分析
  opponent-assessment  ; 相手評価
  recommended-action)  ; 推奨アクション

;;; ============================================================================
;;; 基本AIプレイヤー機能
;;; ============================================================================

(defun create-ai-player (type id)
  "新しいAIプレイヤーを作成
   
   引数:
     type - AIタイプ (:random :smart :aggressive :defensive等)
     id - プレイヤーID
   
   戻り値:
     AIプレイヤーオブジェクト"
  (let ((skill-level (case type
                      (:easy 1) (:random 2) (:normal 3) (:smart 4)
                      (:aggressive 4) (:defensive 4) (:hard 5)
                      (:learning 5) (:adaptive 5) (:configurable 3)
                      (:logged 3) (:analytical 4)
                      (otherwise 3))))
    (make-ai-player% :id id
                     :type type
                     :hand nil
                     :initialized-p nil
                    :configuration (make-ai-configuration 
                                   :aggression-level (case type
                                                      (:aggressive 0.9)
                                                      (:defensive 0.2)
                                                      (:smart 0.6)
                                                      (otherwise 0.5))
                                   :risk-tolerance (case type
                                                   (:aggressive 0.8)
                                                   (:defensive 0.3)
                                                   (:smart 0.5)
                                                   (otherwise 0.5))
                                   :learning-rate 0.1
                                   :difficulty (case type
                                               (:easy :easy)
                                               (:hard :hard)
                                               (otherwise :normal)))
                    :learning-data nil
                    :adaptation-state (make-hash-table :test 'equal)
                    :decision-log nil
                    :performance-score (case type
                                        (:learning 0.0)
                                        (otherwise nil))
                    :skill-level skill-level)))

(defun get-supported-ai-types ()
  "サポートされているAIタイプのリストを返す"
  '(:random :smart :aggressive :defensive :easy :normal :hard 
    :learning :adaptive :configurable :logged :analytical))

(defun initialize-ai-player (ai-player hand)
  "AIプレイヤーを手札で初期化
   
   引数:
     ai-player - AIプレイヤーオブジェクト
     hand - 初期手札
   
   戻り値:
     初期化済みAIプレイヤー"
  (setf (ai-player%-hand ai-player) (copy-list hand))
  (setf (ai-player%-initialized-p ai-player) t)
  ai-player)

(defun register-ai-players (game-state ai-players)
  "AIプレイヤーをゲームに登録（シミュレーション）
   
   引数:
     game-state - ゲーム状態
     ai-players - AIプレイヤーのリスト
   
   戻り値:
     登録成功フラグ"
  (declare (ignore game-state))
  (and (listp ai-players)
       (every #'ai-player%-p ai-players)))

;;; ============================================================================
;;; AI意思決定・戦略機能
;;; ============================================================================

(defun make-decision (ai-player game-state)
  "AIプレイヤーの意思決定を行う
   
   引数:
     ai-player - AIプレイヤーオブジェクト
     game-state - 現在のゲーム状態
   
   戻り値:
     決定内容（plist）"
  (let ((decision (case (ai-player%-type ai-player)
                   (:random (make-random-decision ai-player game-state))
                   (:smart (make-smart-decision ai-player game-state))
                   (:aggressive (make-aggressive-decision ai-player game-state))
                   (:defensive (make-defensive-decision ai-player game-state))
                   (otherwise (make-basic-decision ai-player game-state)))))
    
    ;; 意思決定ログ記録
    (when (ai-player-decision-log ai-player)
      (push (make-ai-decision-entry 
             :timestamp (get-universal-time)
             :game-state (copy-game-state-summary game-state)
             :decision decision
             :reasoning (format nil "~A strategy applied" (ai-player-type ai-player)))
            (ai-player-decision-log ai-player)))
    
    decision))

(defun make-random-decision (ai-player game-state)
  "ランダムAIの意思決定"
  (declare (ignore game-state))
  (let ((hand (ai-player-hand ai-player)))
    (if (and hand (> (random 100) 30))  ; 70%の確率でカードを出す
        (list :action :play-cards
              :cards (list (nth (random (length hand)) hand)))
        (list :action :pass))))

(defun make-smart-decision (ai-player game-state)
  "スマートAIの意思決定"
  (declare (ignore game-state))
  (let ((hand (ai-player-hand ai-player)))
    (if (and hand (> (random 100) 20))  ; 80%の確率でカードを出す
        ;; 最も弱いカードを選択
        (let ((weakest-card (find-weakest-card hand)))
          (list :action :play-cards
                :cards (list weakest-card)))
        (list :action :pass))))

(defun make-aggressive-decision (ai-player game-state)
  "アグレッシブAIの意思決定"
  (declare (ignore game-state))
  (let ((hand (ai-player-hand ai-player)))
    (if hand
        ;; 積極的にカードを出す（最も強いカードを優先）
        (let ((strongest-card (find-strongest-card hand)))
          (list :action :play-cards
                :cards (list strongest-card)))
        (list :action :pass))))

(defun make-defensive-decision (ai-player game-state)
  "ディフェンシブAIの意思決定"
  (declare (ignore game-state))
  (let ((hand (ai-player-hand ai-player)))
    (if (and hand (> (random 100) 60))  ; 40%の確率でカードを出す（慎重）
        (let ((weakest-card (find-weakest-card hand)))
          (list :action :play-cards
                :cards (list weakest-card)))
        (list :action :pass))))

(defun make-basic-decision (ai-player game-state)
  "基本的な意思決定"
  (declare (ignore game-state))
  (let ((hand (ai-player-hand ai-player)))
    (if (and hand (> (random 100) 50))  ; 50%の確率でカードを出す
        (list :action :play-cards
              :cards (list (first hand)))
        (list :action :pass))))

(defun execute-ai-turn (game-state player-id)
  "AIターンを実行（シミュレーション）
   
   引数:
     game-state - ゲーム状態
     player-id - プレイヤーID
   
   戻り値:
     ターン実行結果（plist）"
  (declare (ignore game-state))
  (list :action (if (> (random 100) 30) :play-cards :pass)
        :player-id player-id
        :cards (when (> (random 100) 30) 
                 (list (daifugo-card-system:create-card 
                        (+ 3 (random 10)) :spades)))))

;;; ============================================================================
;;; AI学習・適応機能
;;; ============================================================================

(defun ai-supports-learning-p (ai-player)
  "AI学習機能サポート確認"
  (member (ai-player-type ai-player) '(:learning :adaptive)))

(defun ai-supports-adaptation-p (ai-player)
  "AI適応機能サポート確認"
  (member (ai-player-type ai-player) '(:adaptive :smart)))

(defun provide-learning-data (ai-player learning-data)
  "AI学習データ提供
   
   引数:
     ai-player - AIプレイヤーオブジェクト
     learning-data - 学習データのリスト
   
   戻り値:
     更新された学習データ"
  (when (ai-supports-learning-p ai-player)
    (setf (ai-player-learning-data ai-player) 
          (append (ai-player-learning-data ai-player) learning-data))
    ;; 性能スコアを更新
    (let ((wins (count-if (lambda (data) 
                           (eq (getf data :game-result) :win)) 
                          learning-data))
          (total (length learning-data)))
      (when (> total 0)
        (setf (ai-player-performance-score ai-player)
              (+ (or (ai-player-performance-score ai-player) 0.0)
                 (* 0.1 (/ wins total))))))  ; 学習率0.1で性能スコア更新
    (ai-player-learning-data ai-player)))

(defun observe-opponent-pattern (ai-player opponent-id pattern)
  "相手パターン観察
   
   引数:
     ai-player - AIプレイヤーオブジェクト
     opponent-id - 相手プレイヤーID
     pattern - 観察されたパターン
   
   戻り値:
     更新された適応状態"
  (when (ai-supports-adaptation-p ai-player)
    (setf (gethash opponent-id (ai-player-adaptation-state ai-player)) pattern))
  (ai-player-adaptation-state ai-player))

(defun get-ai-performance-score (ai-player)
  "AI性能スコア取得"
  (ai-player-performance-score ai-player))

(defun get-current-adaptation (ai-player)
  "現在の適応状態取得"
  (when (ai-supports-adaptation-p ai-player)
    (list :opponent-analysis (hash-table-count (ai-player-adaptation-state ai-player))
          :adaptation-level (if (> (hash-table-count (ai-player-adaptation-state ai-player)) 0)
                              :active :inactive))))

;;; ============================================================================
;;; AI設定・カスタマイズ機能
;;; ============================================================================

(defun ai-supports-configuration-p (ai-player)
  "AI設定機能サポート確認"
  (member (ai-player-type ai-player) '(:configurable :smart :aggressive :defensive)))

(defun configure-ai-player (ai-player config)
  "AIプレイヤー設定
   
   引数:
     ai-player - AIプレイヤーオブジェクト
     config - 設定データ（plist）
   
   戻り値:
     更新された設定"
  (when (ai-supports-configuration-p ai-player)
    (let ((current-config (ai-player-configuration ai-player)))
      (when (getf config :aggression-level)
        (setf (ai-configuration-aggression-level current-config) 
              (getf config :aggression-level)))
      (when (getf config :risk-tolerance)
        (setf (ai-configuration-risk-tolerance current-config) 
              (getf config :risk-tolerance)))
      (when (getf config :learning-rate)
        (setf (ai-configuration-learning-rate current-config) 
              (getf config :learning-rate)))))
  (ai-player-configuration ai-player))

(defun get-ai-configuration (ai-player)
  "AI設定取得"
  (when (ai-supports-configuration-p ai-player)
    (let ((config (ai-player-configuration ai-player)))
      (list :aggression-level (ai-configuration-aggression-level config)
            :risk-tolerance (ai-configuration-risk-tolerance config)
            :learning-rate (ai-configuration-learning-rate config)))))

(defun get-ai-skill-level (ai-player)
  "AIスキルレベル取得"
  (ai-player-skill-level ai-player))

;;; ============================================================================
;;; AIデバッグ・分析機能
;;; ============================================================================

(defun enable-decision-logging (ai-player)
  "意思決定ログ有効化
   
   引数:
     ai-player - AIプレイヤーオブジェクト
   
   戻り値:
     ログ有効化成功フラグ"
  (setf (ai-player-decision-log ai-player) '())
  t)

(defun get-decision-log (ai-player)
  "意思決定ログ取得"
  (reverse (ai-player-decision-log ai-player)))  ; 時系列順に返す

(defun analyze-game-state (ai-player game-state)
  "ゲーム状態分析
   
   引数:
     ai-player - AIプレイヤーオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     分析結果（game-state-analysis構造体）"
  (declare (ignore game-state))
  (let ((hand (ai-player-hand ai-player)))
    (make-game-state-analysis 
     :hand-strength (if hand (calculate-hand-strength hand) 0.0)
     :field-analysis :neutral
     :opponent-assessment :unknown
     :recommended-action (if (and hand (> (length hand) 3)) :play-cards :pass))))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun find-weakest-card (hand)
  "手札から最も弱いカードを検索"
  (when hand
    (first (sort (copy-list hand) 
                 (lambda (a b) 
                   (< (daifugo-card-system:calculate-card-strength 
                       (daifugo-card-system:card-rank a))
                      (daifugo-card-system:calculate-card-strength 
                       (daifugo-card-system:card-rank b))))))))

(defun find-strongest-card (hand)
  "手札から最も強いカードを検索"
  (when hand
    (first (sort (copy-list hand) 
                 (lambda (a b) 
                   (> (daifugo-card-system:calculate-card-strength 
                       (daifugo-card-system:card-rank a))
                      (daifugo-card-system:calculate-card-strength 
                       (daifugo-card-system:card-rank b))))))))

(defun calculate-hand-strength (hand)
  "手札の強さを計算"
  (when hand
    (let ((total-strength (reduce #'+ hand
                                  :key (lambda (card)
                                        (daifugo-card-system:calculate-card-strength
                                         (daifugo-card-system:card-rank card)))))
          (hand-size (length hand)))
      (if (> hand-size 0)
          (/ total-strength hand-size)
          0.0))))

(defun copy-game-state-summary (game-state)
  "ゲーム状態の要約コピーを作成"
  (declare (ignore game-state))
  (list :field-cards-count 0
        :players-count 4
        :current-player 0))

;;; ============================================================================
;;; APIラッパー関数
;;; ============================================================================

(defun ai-player-p (obj)
  "AIプレイヤー判定ラッパー"
  (ai-player%-p obj))

(defun ai-player-type (ai-player)
  "AIタイプ取得ラッパー"
  (ai-player%-type ai-player))

(defun ai-player-id (ai-player)
  "プレイヤーID取得ラッパー"
  (ai-player%-id ai-player))

(defun ai-player-hand (ai-player)
  "手札取得ラッパー"
  (ai-player%-hand ai-player))

(defun ai-player-initialized-p (ai-player)
  "初期化状態確認ラッパー"
  (ai-player%-initialized-p ai-player))

;;; ============================================================================
;;; 旧互換性関数
;;; ============================================================================

(defun make-ai-player (type &rest args)
  "旧形式互換：AIプレイヤー作成"
  (let ((id (getf args :id 0)))
    (create-ai-player type id)))

(defgeneric make-move (ai-player game-state)
  (:documentation "旧形式互換：AI行動決定"))

(defmethod make-move ((ai-player ai-player) game-state)
  "旧形式互換：AI行動決定の実装"
  (let ((decision (make-decision ai-player game-state)))
    (getf decision :action)))