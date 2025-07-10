;;; test-fix.lisp - 修正後のテスト

(load "src/core/card-system.lisp")
(load "src/core/player-system.lisp")
(load "src/utils/player-utils.lisp")
(load "src/core/game-logic.lisp")
(load "src/core/game-engine.lisp")

(defpackage :test-fix
  (:use :common-lisp))

(in-package :test-fix)

(defun test-card-creation ()
  "修正後のカード作成テスト"
  (format t "=== 修正後のカード作成テスト ===~%")
  
  ;; 異なる方法でAカードを作成
  (format t "方法1: 'A~%")
  (let ((card1 (daifugo-card-system:create-card 'A :hearts)))
    (format t "カード1: ~A~%" card1)
    (format t "ランク: ~A~%" (daifugo-card-system:card-rank card1))
    (format t "強度: ~A~%" (daifugo-card-system:card-strength card1)))
  
  (format t "~%方法2: 数字カード 4~%")
  (let ((card2 (daifugo-card-system:create-card 4 :spades)))
    (format t "カード2: ~A~%" card2)
    (format t "ランク: ~A~%" (daifugo-card-system:card-rank card2))
    (format t "強度: ~A~%" (daifugo-card-system:card-strength card2)))
  
  (format t "~%カード強度の比較:~%")
  (let ((card-a (daifugo-card-system:create-card 'A :hearts))
        (card-4 (daifugo-card-system:create-card 4 :spades)))
    (format t "Aカード強度: ~A~%" (daifugo-card-system:card-strength card-a))
    (format t "4カード強度: ~A~%" (daifugo-card-system:card-strength card-4))
    (format t "A > 4: ~A~%" (> (daifugo-card-system:card-strength card-a) 
                                (daifugo-card-system:card-strength card-4)))))

(defun test-game-logic ()
  "修正後のゲームロジックテスト"
  (format t "~%=== 修正後のゲームロジックテスト ===~%")
  
  (let ((game (daifugo-game-engine:create-game 4))
        (weak-card (daifugo-card-system:create-card 4 :spades))
        (strong-card (daifugo-card-system:create-card 'A :hearts)))
    
    (format t "弱いカード: ~A 強度: ~A~%" weak-card (daifugo-card-system:card-strength weak-card))
    (format t "強いカード: ~A 強度: ~A~%" strong-card (daifugo-card-system:card-strength strong-card))
    
    (daifugo-game-engine:start-game game)
    (format t "ゲーム開始~%")
    
    ;; 弱いカードを出す
    (format t "弱いカードを出します...~%")
    (daifugo-game-engine:play-card game 0 (list weak-card))
    (format t "弱いカードを出しました。フィールド: ~A~%" 
            (daifugo-game-engine:game-state-field game))
    
    ;; 次のプレイヤーに変更
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    (format t "プレイヤー変更: ~A~%" (daifugo-game-engine:game-state-current-player game))
    
    ;; 強いカードが出せるかテスト
    (format t "強いカードを出します...~%")
    (handler-case
        (progn
          (daifugo-game-engine:play-card game 1 (list strong-card))
          (format t "強いカードを出しました。成功!~%")
          t)
      (error (e)
        (format t "エラー: ~A~%" e)
        nil))))

(test-card-creation)
(test-game-logic)