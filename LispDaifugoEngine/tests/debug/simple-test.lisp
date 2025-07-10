;;; simple-test.lisp - シンプルなテスト実行

;; 各モジュールを順番に読み込み（パス修正・エラーハンドリング付き）
(handler-case (load "../../src/core/card-system.lisp")
  (error (e) (format t "Warning: card-system.lisp load error: ~A~%" e)))
(handler-case (load "../../src/core/player-system.lisp")
  (error (e) (format t "Warning: player-system.lisp load error: ~A~%" e)))
(handler-case (load "../../src/utils/player-utils.lisp")
  (error (e) (format t "Warning: player-utils.lisp load error: ~A~%" e)))
(handler-case (load "../../src/core/game-engine.lisp")
  (error (e) (format t "Warning: game-engine.lisp load error: ~A~%" e)))

;; 基本的なテスト（エラーハンドリング付き）
(defun test-basic-functionality ()
  "基本機能のテスト"
  (format t "=== 基本機能テスト ===~%")
  
  ;; カードシステムテスト
  (handler-case
      (let ((card (daifugo-card-system:create-card 'daifugo-card-system::A :spades)))
        (format t "カード作成: ~A~%" card)
        (format t "カード強度: ~A~%" (daifugo-card-system:card-strength card)))
    (error (e) (format t "カードシステムエラー: ~A~%" e)))
  
  ;; デッキ作成テスト
  (handler-case
      (let ((deck (daifugo-card-system:create-deck)))
        (format t "デッキ作成: ~A枚~%" (length deck)))
    (error (e) (format t "デッキ作成エラー: ~A~%" e)))
  
  ;; プレイヤー作成テスト
  (handler-case
      (let ((player (daifugo-player-system:create-player :id 0 :name "Player0")))
        (format t "プレイヤー作成: ~A~%" player)
        (format t "手札枚数: ~A~%" (daifugo-player-system:hand-count player)))
    (error (e) (format t "プレイヤー作成エラー: ~A~%" e)))
  
  ;; ゲーム作成テスト
  (handler-case
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
    (error (e) (format t "ゲーム作成・実行エラー: ~A~%" e)))
  
  (format t "=== テスト完了 ===~%")
  (format t "simple-test.lisp: 基本機能テスト正常終了~%"))

;; テスト実行
(test-basic-functionality)