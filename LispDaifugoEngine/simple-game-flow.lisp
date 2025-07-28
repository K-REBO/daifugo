;;; simple-game-flow.lisp - 簡単なゲームフローの実装とテスト

;; 必要なシステムを読み込み
(load "src/core/card-system.lisp")
(load "src/core/player-system.lisp")
(load "src/utils/card-utils.lisp")
(load "src/core/game-state.lisp")

;;; 簡単なゲーム実行関数
(defun run-simple-game ()
  "基本的なゲームフローをテストする"
  (format t "=== 簡単なダイフゴゲームフロー ===~%")
  
  ;; 1. プレイヤー作成
  (format t "1. プレイヤー作成...~%")
  (let ((players (daifugo-player-system:create-players 4)))
    (format t "   プレイヤー数: ~A人~%" (length players))
    (dolist (player players)
      (format t "   - ~A (ID: ~A)~%" 
              (daifugo-player-system:player-name player)
              (daifugo-player-system:player-id player)))
    
    ;; 2. デッキ作成とシャッフル
    (format t "~%2. デッキ作成とシャッフル...~%")
    (let ((deck (daifugo-card-system:shuffle-deck 
                 (daifugo-card-system:create-deck))))
      (format t "   デッキサイズ: ~A枚~%" (length deck))
      
      ;; 3. カード配布
      (format t "~%3. カード配布...~%")
      (let ((hands (daifugo-card-system:deal-cards deck 4)))
        (loop for i from 0 below 4 do
          (let ((player (nth i players))
                (hand (nth i hands)))
            ;; プレイヤーに手札を設定
            (setf (daifugo-player-system:player-hand player) hand)
            (format t "   ~A: ~A枚~%" 
                    (daifugo-player-system:player-name player)
                    (length (daifugo-player-system:player-hand player)))))
        
        ;; 4. ゲーム状態作成
        (format t "~%4. ゲーム状態作成...~%")
        (let ((game-state (daifugo-game-state:make-game-state
                           :players players
                           :current-player 0
                           :field nil
                           :game-phase :playing
                           :direction :clockwise
                           :round-number 1
                           :turn-count 0)))
          (format t "   現在のプレイヤー: ~A~%" 
                  (daifugo-game-state:game-state-current-player game-state))
          (format t "   ゲームフェーズ: ~A~%" 
                  (daifugo-game-state:game-state-game-phase game-state))
          (format t "   ターン方向: ~A~%" 
                  (daifugo-game-state:game-state-direction game-state))
          
          ;; 5. 各プレイヤーの手札表示
          (format t "~%5. 各プレイヤーの手札状況...~%")
          (loop for player in players do
            (let ((hand (daifugo-player-system:player-hand player)))
              (format t "   ~A (~A枚):~%" 
                      (daifugo-player-system:player-name player)
                      (length hand))
              ;; 最初の3枚だけ表示
              (loop for i from 0 below (min 3 (length hand)) do
                (let ((card (nth i hand)))
                  (format t "     - ~A ~A (強度:~A)~%" 
                          (daifugo-card-system:card-rank card)
                          (daifugo-card-system:card-suit card)
                          (daifugo-card-system:card-strength card))))))
          
          (format t "~%=== ゲームフロー完了 ===~%")
          t)))))

;; テスト実行
(run-simple-game)