;;; src/testing/ai-players.lisp - テスト用AIプレイヤー

(defpackage :daifugo-ai-players
  (:use :common-lisp)
  (:export #:create-ai-player
           #:ai-play-turn))

(in-package :daifugo-ai-players)

(defun create-ai-player (id)
  "テスト用のシンプルなAIプレイヤーを作成します。"
  (daifugo-player-system:create-player :id id
                                       :name (format nil "AI-Player-~A" id)
                                       :type :computer))

(defun ai-play-turn (game-state player-id)
  "AIプレイヤーがターンをプレイします。
   - 非常にシンプルなロジック：出せるカードがあれば最初の手を出し、なければパスします。"
  (let* ((player (nth player-id (daifugo-game-engine:game-state-players game-state)))
         (hand (daifugo-player-system:player-hand player)))
    (if hand
        ;; 実際には、出せるカードの組み合わせを探すロジックが必要
        (let ((card-to-play (list (first hand))))
          (if (daifugo-game-logic:validate-card-play card-to-play 
                                                     (daifugo-game-engine:game-state-field game-state)
                                                     (daifugo-game-engine:game-state-revolution-p game-state))
              (daifugo-game-engine:play-card game-state player-id card-to-play)
              (daifugo-game-engine:pass-turn game-state player-id)))
        (daifugo-game-engine:pass-turn game-state player-id))))
