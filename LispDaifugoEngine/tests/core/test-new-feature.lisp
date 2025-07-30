;;; test-new-feature.lisp - 実際のカードシステム・プレイヤーシステムテスト

(defpackage :daifugo-new-feature-test
  (:use :common-lisp)
  (:export #:run-new-feature-tests))

(in-package :daifugo-new-feature-test)

(defun run-new-feature-tests ()
  "カードシステムとプレイヤーシステムの実際のテスト実行"
  (format t "=== カード・プレイヤーシステム統合テスト実行 ===~%")
  (let ((passed 0) (total 5))
    
    ;; テスト1: カード作成と強度確認
    (format t "テスト: カード作成・強度 ... ")
    (let ((card (daifugo-card-system:create-card 'A :spades)))
      (if (and (daifugo-card-system:card-p card)
               (= (daifugo-card-system:card-strength card) 12))
          (progn (format t "合格~%") (incf passed))
          (format t "失敗~%")))
    
    ;; テスト2: プレイヤー作成確認
    (format t "テスト: プレイヤー作成 ... ")
    (let ((player (daifugo-player-system:create-player :id 1 :name "テスト")))
      (if (and (daifugo-player-system:player-p player)
               (= (daifugo-player-system:hand-count player) 0))
          (progn (format t "合格~%") (incf passed))
          (format t "失敗~%")))
    
    ;; テスト3: 手札操作確認
    (format t "テスト: 手札操作 ... ")
    (let ((player (daifugo-player-system:create-player :id 2 :name "手札テスト"))
          (card (daifugo-card-system:create-card 'K :hearts)))
      (daifugo-player-system:add-cards-to-hand player (list card))
      (if (= (daifugo-player-system:hand-count player) 1)
          (progn (format t "合格~%") (incf passed))
          (format t "失敗~%")))
    
    ;; テスト4: カード比較機能
    (format t "テスト: カード比較 ... ")
    (let ((card1 (daifugo-card-system:create-card 3 :spades))
          (card2 (daifugo-card-system:create-card 'A :hearts)))
      (if (< (daifugo-card-system:compare-cards card1 card2) 0)
          (progn (format t "合格~%") (incf passed))
          (format t "失敗~%")))
    
    ;; テスト5: ランクシステム
    (format t "テスト: ランクシステム ... ")
    (let ((player (daifugo-player-system:create-player :id 3 :name "ランクテスト" :rank :daifugo)))
      (if (eq (daifugo-player-system:player-rank player) :daifugo)
          (progn (format t "合格~%") (incf passed))
          (format t "失敗~%")))
    
    (format t "結果: ~A合格, ~A失敗~%" passed (- total passed))
    (= passed total)))

;; テスト関数の呼び出し（自動実行のため）
(format t "実際の機能テストファイルが読み込まれました~%")