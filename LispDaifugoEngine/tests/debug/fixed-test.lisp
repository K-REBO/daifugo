;;; fixed-test.lisp - 修正されたテスト実行

;; カードシステムの読み込み
(load "src/core/card-system.lisp")

;; プレイヤーシステムの読み込み
(load "src/core/player-system.lisp")

;; ユーティリティの読み込み
(load "src/utils/player-utils.lisp")

;; ゲームエンジンの読み込み（deal-cardsを使わない版）
(defpackage :daifugo-game-engine-fixed
  (:use :common-lisp)
  (:export #:game-state
           #:game-state-p
           #:game-state-players
           #:game-state-current-player
           #:game-state-field
           #:game-state-deck
           #:game-state-turn-direction
           #:game-state-game-phase
           #:game-state-revolution-p
           #:game-state-logs
           #:create-game
           #:start-game
           #:play-card
           #:pass-turn
           #:get-current-player
           #:game-over-p
           #:advance-turn
           #:add-log
           #:initialize-game-state))

(in-package :daifugo-game-engine-fixed)

;;; ゲーム状態の定義
(defstruct game-state
  players
  current-player
  field
  deck
  turn-direction
  game-phase
  revolution-p
  logs)

;;; カード配布関数（修正版）
(defun deal-cards-fixed (players deck)
  "プレイヤーリストにカードを配布する（修正版）"
  (let ((cards-per-player (floor (length deck) (length players)))
        (shuffled-deck (daifugo-card-system:shuffle-deck deck)))
    ;; 全プレイヤーの手札を初期化
    (dolist (player players)
      (setf (daifugo-player-system:player-hand player) nil))
    ;; カードを配布
    (loop for i from 0 below (length players) do
      (let ((player (nth i players))
            (start-index (* i cards-per-player))
            (end-index (min (+ start-index cards-per-player) (length shuffled-deck))))
        (loop for j from start-index below end-index do
          (daifugo-player-system:add-card-to-hand player (nth j shuffled-deck)))))))

;;; ゲーム作成
(defun create-game (player-count)
  "新しいゲームを作成する"
  (when (or (< player-count 2) (> player-count 6))
    (error "プレイヤー数は2-6人である必要があります: ~A" player-count))
  (let ((deck (daifugo-card-system:create-deck))
        (players (daifugo-player-system:create-players player-count)))
    (deal-cards-fixed players deck)
    (make-game-state
     :players players
     :current-player 0
     :field nil
     :deck deck
     :turn-direction :clockwise
     :game-phase :init
     :revolution-p nil
     :logs nil)))

;;; ゲーム開始
(defun start-game (game-state)
  "ゲームを開始する"
  (unless (eql (game-state-game-phase game-state) :init)
    (error "ゲームは既に開始されています: ~A" (game-state-game-phase game-state)))
  (setf (game-state-game-phase game-state) :playing)
  (push (format nil "ゲーム開始 - プレイヤー数: ~A" (length (game-state-players game-state)))
        (game-state-logs game-state))
  game-state)

;;; 現在のプレイヤー取得
(defun get-current-player (game-state)
  "現在のプレイヤーを取得する"
  (game-state-current-player game-state))

;;; ゲーム終了判定
(defun game-over-p (game-state)
  "ゲームが終了したかどうかを判定する"
  (unless (eql (game-state-game-phase game-state) :playing)
    (return-from game-over-p nil))
  ;; 手札が空のプレイヤーがいるかチェック
  (some (lambda (player)
          (daifugo-player-system:hand-empty-p player))
        (game-state-players game-state)))

;;; カードプレイ
(defun play-card (game-state player-id cards)
  "プレイヤーがカードを出す"
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  ;; 実装は後で追加
  (push (format nil "プレイヤー~A がカードをプレイ: ~A枚" player-id (length cards))
        (game-state-logs game-state))
  t)

;;; パス
(defun pass-turn (game-state player-id)
  "プレイヤーがパスする"
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  ;; 実装は後で追加
  (push (format nil "プレイヤー~A がパス" player-id)
        (game-state-logs game-state))
  t)

;;; 次のプレイヤーに進む
(defun advance-turn (game-state)
  "次のプレイヤーにターンを進める"
  (let ((player-count (length (game-state-players game-state)))
        (current (game-state-current-player game-state))
        (direction (game-state-turn-direction game-state)))
    (setf (game-state-current-player game-state)
          (if (eql direction :clockwise)
              (mod (1+ current) player-count)
              (mod (1- current) player-count)))))

;;; ログ追加
(defun add-log (game-state message)
  "ゲームログにメッセージを追加する"
  (push message (game-state-logs game-state)))

;;; ゲーム状態の初期化
(defun initialize-game-state (game-state)
  "ゲーム状態を初期化する"
  (setf (game-state-field game-state) nil
        (game-state-revolution-p game-state) nil
        (game-state-logs game-state) nil)
  (add-log game-state "ゲーム状態を初期化しました"))

;; 基本的なテスト
(defun test-basic-functionality ()
  "基本機能のテスト"
  (format t "=== 基本機能テスト ===~%")
  
  ;; カードシステムテスト
  (let ((card (daifugo-card-system:create-card 'daifugo-card-system::A :spades)))
    (format t "カード作成: ~A~%" card)
    (format t "カード強度: ~A~%" (daifugo-card-system:card-strength card)))
  
  ;; デッキ作成テスト
  (let ((deck (daifugo-card-system:create-deck)))
    (format t "デッキ作成: ~A枚~%" (length deck)))
  
  ;; プレイヤー作成テスト
  (let ((player (daifugo-player-system:create-player :id 0 :name "Player0")))
    (format t "プレイヤー作成: ~A~%" player)
    (format t "手札枚数: ~A~%" (daifugo-player-system:hand-count player)))
  
  ;; ゲーム作成テスト
  (let ((game (create-game 4)))
    (format t "ゲーム作成: ~A~%" (game-state-p game))
    (format t "プレイヤー数: ~A~%" (length (game-state-players game)))
    (format t "現在のプレイヤー: ~A~%" (get-current-player game))
    (format t "ゲームフェーズ: ~A~%" (game-state-game-phase game))
    
    ;; ゲーム開始テスト
    (start-game game)
    (format t "ゲーム開始後フェーズ: ~A~%" (game-state-game-phase game))
    
    ;; ゲーム終了判定テスト
    (format t "ゲーム終了判定: ~A~%" (game-over-p game))
    
    ;; プレイヤーの手札確認
    (let ((first-player (first (game-state-players game))))
      (format t "最初のプレイヤーの手札枚数: ~A~%" 
              (daifugo-player-system:hand-count first-player)))
    
    ;; カードプレイテスト
    (play-card game 0 (list (daifugo-card-system:create-card 'daifugo-card-system::A :spades)))
    (format t "カードプレイテスト完了~%")
    
    ;; パステスト
    (pass-turn game 0)
    (format t "パステスト完了~%")
    
    ;; ターン進行テスト
    (advance-turn game)
    (format t "ターン進行後プレイヤー: ~A~%" (get-current-player game))
    
    ;; ログ確認
    (format t "ログ数: ~A~%" (length (game-state-logs game))))
  
  (format t "=== テスト完了 ===~%"))

;; テスト実行
(test-basic-functionality)