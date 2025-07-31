

(in-package :daifugo-game-engine)

;; ゲーム状態構造体はdaifugo-game-stateパッケージで定義されています

;;; カード配布
(defun deal-cards (players deck)
  "プレイヤーリストにカードを配布する"
  (let ((cards-per-player (floor (length deck) (length players)))
        (shuffled-deck (daifugo-card-system:shuffle-deck deck)))
    ;; 全プレイヤーの手札を初期化
    (dolist (player players)
      (setf (daifugo-player-system:player-hand player) nil))
    ;; カードを配布
    (loop for i from 0 below (length players) do
      (let ((player (nth i players)))
        (loop for j from 0 below cards-per-player do
          (let ((card-index (+ (* i cards-per-player) j)))
            (when (< card-index (length shuffled-deck))
              (daifugo-player-system:add-card-to-hand player (nth card-index shuffled-deck)))))))))

;;; ゲーム作成
(defun create-game (player-count)
  "新しいゲームを作成する"
  (when (or (< player-count 2) (> player-count 6))
    (error "プレイヤー数は2-6人である必要があります: ~A" player-count))
  (let ((deck (daifugo-card-system:create-deck))
        (players (daifugo-player-system:create-players player-count)))
    (deal-cards players deck)
    (daifugo-game-state:create-initial-game-state players)))

;;; ゲーム開始
(defun start-game (game-state)
  "ゲームを開始する"
  (unless (eql (daifugo-game-state:game-state-game-phase game-state) :init)
    (error "ゲームは既に開始されています: ~A" (daifugo-game-state:game-state-game-phase game-state)))
  (daifugo-game-state:set-game-phase game-state :playing)
  (daifugo-game-state:add-game-log game-state 
    (format nil "ゲーム開始 - プレイヤー数: ~A" 
            (length (daifugo-game-state:game-state-players game-state))))
  game-state)

;;; カードプレイ
(defun play-card (game-state player-id cards)
  "プレイヤーがカードを出す"
  (unless (eql (daifugo-game-state:game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (daifugo-game-state:game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  
  ;; ゲームロジックを使用してカード出しを処理
  (daifugo-game-logic:process-card-play game-state player-id cards)
  t)

;;; パス
(defun pass-turn (game-state player-id)
  "プレイヤーがパスする"
  (unless (eql (daifugo-game-state:game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (daifugo-game-state:game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  
  ;; ゲームロジックを使用してパスを処理
  (daifugo-game-logic:process-pass game-state player-id)
  t)

;;; 現在のプレイヤー取得
(defun get-current-player (game-state)
  "現在のプレイヤーを取得する"
  (daifugo-game-state:get-current-player game-state))

;;; ゲーム終了判定
(defun game-over-p (game-state)
  "ゲーム終了判定"
  (daifugo-game-state:is-game-over-p game-state))


;;; ログ追加
(defun add-log (game-state message)
  "ゲームログにメッセージを追加する"
  (daifugo-game-state:add-game-log game-state message))

;;; ゲーム状態の初期化
(defun initialize-game-state (game-state)
  "ゲーム状態を初期化する"
  (daifugo-game-state:update-game-state game-state 
                                       :field nil
                                       :revolution-p nil
                                       :logs nil)
  (add-log game-state "ゲーム状態を初期化しました"))

;;; ルールセット管理
(defun set-rule-set (game-state rule-set)
  "ゲーム状態にルールセットを設定"
  (daifugo-game-state:update-game-state game-state :rules rule-set)
  rule-set)

(defun get-rule-set (game-state)
  "ゲーム状態からルールセットを取得"
  (daifugo-game-state:game-state-rules game-state))

;;; エイリアス関数（テスト互換性のため）
(defun create-game-state (players)
  "ゲーム状態を作成（create-initial-game-stateのエイリアス）"
  (daifugo-game-state:create-initial-game-state players))

;;; 動的ルール管理システム（Lispの真髄）
(defvar *dynamic-rules* (make-hash-table :test #'eq)
  "動的に読み込まれたルールの管理ハッシュテーブル")

(defvar *rule-systems* (make-hash-table :test #'eq)
  "登録されたルールシステムの管理ハッシュテーブル")

(defun rule-enabled-p (rule-name &optional game-state)
  "指定されたルールが有効かどうかを動的に判定"
  (declare (ignore game-state))
  (gethash rule-name *dynamic-rules*))

(defun enable-rule (rule-name)
  "ルールを動的に有効化（Lispファイル読み込み対応）"
  (setf (gethash rule-name *dynamic-rules*) t)
  (format t "Rule ~A enabled dynamically~%" rule-name))

(defun disable-rule (rule-name)
  "ルールを動的に無効化"
  (setf (gethash rule-name *dynamic-rules*) nil)
  (format t "Rule ~A disabled~%" rule-name))

(defun register-rule-system (rule-name rule-system)
  "ルールシステムを登録（テスト用）"
  (setf (gethash rule-name *rule-systems*) rule-system)
  (format t "Rule system ~A registered~%" rule-name)
  rule-system)

(defun get-rule-system (rule-name)
  "登録されたルールシステムを取得"
  (gethash rule-name *rule-systems*))

(defun is-rule-registered-p (rule-name)
  "ルールがシステムに登録されているかを確認"
  (not (null (gethash rule-name *rule-systems*))))

(defun get-game-extensions (game-state)
  "ゲーム状態の拡張機能を取得"
  (declare (ignore game-state))
  (make-hash-table :test #'eq))

(defun process-turn (game-state player-id action)
  "ターンを処理"
  (declare (ignore game-state player-id action))
  t)

(defun is-game-active-p (game-state)
  "ゲームがアクティブかどうかを判定"
  (and game-state
       (daifugo-game-state:game-state-p game-state)
       (eq (daifugo-game-state:game-state-game-phase game-state) :playing)))

(defun load-user-rule-script (file-path)
  "ユーザー作成のルールスクリプトを動的にロード（Lispの真髄）"
  (handler-case
      (progn
        (load file-path)
        (format t "Successfully loaded user rule script: ~A~%" file-path)
        t)
    (error (e)
      (format t "Failed to load rule script ~A: ~A~%" file-path e)
      nil)))

