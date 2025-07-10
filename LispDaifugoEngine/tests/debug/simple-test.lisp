;;; simple-test.lisp - シンプルなテスト実行

;; 各モジュールを順番に読み込み
(load "src/core/card-system.lisp")
(load "src/core/player-system.lisp")
(load "src/utils/player-utils.lisp")
(load "src/core/game-engine.lisp")

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
  (let ((game (daifugo-game-engine:create-game 4)))
    (format t "ゲーム作成: ~A~%" (daifugo-game-engine:game-state-p game))
    (format t "プレイヤー数: ~A~%" (length (daifugo-game-engine:game-state-players game)))
    (format t "現在のプレイヤー: ~A~%" (daifugo-game-engine:get-current-player game))
    (format t "ゲームフェーズ: ~A~%" (daifugo-game-engine:game-state-game-phase game))
    
    ;; ゲーム開始テスト
    (daifugo-game-engine:start-game game)
    (format t "ゲーム開始後フェーズ: ~A~%" (daifugo-game-engine:game-state-game-phase game))
    
    ;; ゲーム終了判定テスト
    (format t "ゲーム終了判定: ~A~%" (daifugo-game-engine:game-over-p game))
    
    ;; プレイヤーの手札確認
    (let ((first-player (first (daifugo-game-engine:game-state-players game))))
      (format t "最初のプレイヤーの手札枚数: ~A~%" 
              (daifugo-player-system:hand-count first-player))))
  
  (format t "=== テスト完了 ===~%"))

;; テスト実行
(test-basic-functionality)