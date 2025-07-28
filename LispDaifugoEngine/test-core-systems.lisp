;;; test-core-systems.lisp - コアシステムの統合テスト

;; 基本システムの読み込み
(load "src/core/card-system.lisp")
(load "src/core/player-system.lisp")
(load "src/utils/card-utils.lisp")

(format t "=== コアシステム統合テスト ===~%")

;; カードシステムのテスト
(format t "1. カードシステムテスト~%")
(in-package :daifugo-card-system)
(let ((card (create-card 'A :spades))
      (deck (create-deck)))
  (format t "  カード作成: ~A~%" card)
  (format t "  カード強度: ~A~%" (card-strength card))
  (format t "  デッキサイズ: ~A枚~%" (length deck)))

;; プレイヤーシステムのテスト
(format t "2. プレイヤーシステムテスト~%")
(in-package :daifugo-player-system)
(let ((player (create-player :id 1 :name "TestPlayer"))
      (players (create-players 4)))
  (format t "  プレイヤー作成: ~A~%" (player-name player))
  (format t "  プレイヤー数: ~A人~%" (length players))
  (format t "  最初のプレイヤー: ~A~%" (player-name (first players))))

;; カードユーティリティのテスト
(format t "3. カードユーティリティテスト~%")
(in-package :daifugo-card-utils)
(let ((test-cards (list (daifugo-card-system:create-card 3 :spades)
                        (daifugo-card-system:create-card 'A :hearts)
                        (daifugo-card-system:create-card 'K :clubs))))
  (format t "  テストカード数: ~A枚~%" (length test-cards))
  (let ((sorted (sort-cards test-cards)))
    (format t "  ソート後強度: ~{~A ~}~%" 
            (mapcar #'daifugo-card-system:card-strength sorted)))
  (format t "  同ランクチェック: ~A~%" (same-rank-p test-cards)))

;; プレイヤーとカードの統合テスト
(format t "4. プレイヤー-カード統合テスト~%")
(in-package :daifugo-player-system)
(let ((player (create-player :id 1 :name "TestPlayer"))
      (card (daifugo-card-system:create-card 'A :spades)))
  (add-card-to-hand player card)
  (format t "  手札追加後: ~A枚~%" (hand-count player))
  (format t "  手札内容: ~A~%" (player-hand player)))

(format t "=== コアシステム統合テスト完了 ===~%")