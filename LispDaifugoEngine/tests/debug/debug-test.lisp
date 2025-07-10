;;; debug-test.lisp - デバッグ用テスト

(load "../debug/final-test.lisp")

;; デバッグ用のカード強度検証テスト
(defpackage :debug-test
  (:use :common-lisp))

(in-package :debug-test)

(defun debug-card-strength-validation ()
  "カード強度の検証テストをデバッグ"
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
    
    ;; フィールドの強度を確認
    (let ((field (daifugo-game-engine:game-state-field game)))
      (format t "フィールドカード強度: ~A~%" 
              (daifugo-card-system:card-strength (first field))))
    
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

(defun debug-invalid-card-play ()
  "無効なカード出しのテストをデバッグ"
  (let ((game (daifugo-game-engine:create-game 4))
        (strong-card (daifugo-card-system:create-card 'A :spades))
        (weak-card (daifugo-card-system:create-card 4 :hearts)))
    
    (format t "強いカード: ~A 強度: ~A~%" strong-card (daifugo-card-system:card-strength strong-card))
    (format t "弱いカード: ~A 強度: ~A~%" weak-card (daifugo-card-system:card-strength weak-card))
    
    (daifugo-game-engine:start-game game)
    (format t "ゲーム開始~%")
    
    ;; 強いカードを出す
    (format t "強いカードを出します...~%")
    (daifugo-game-engine:play-card game 0 (list strong-card))
    (format t "強いカードを出しました。フィールド: ~A~%" 
            (daifugo-game-engine:game-state-field game))
    
    ;; 次のプレイヤーに変更
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    (format t "プレイヤー変更: ~A~%" (daifugo-game-engine:game-state-current-player game))
    
    ;; フィールドの強度を確認
    (let ((field (daifugo-game-engine:game-state-field game)))
      (format t "フィールドカード強度: ~A~%" 
              (daifugo-card-system:card-strength (first field))))
    
    ;; 弱いカードは出せないはず
    (format t "弱いカードを出します（エラーが出るはず）...~%")
    (handler-case
        (progn
          (daifugo-game-engine:play-card game 1 (list weak-card))
          (format t "弱いカードを出しました。失敗（エラーが出るべき）!~%")
          nil) ; 成功した場合は失敗
      (error (e)
        (format t "エラー: ~A （これは正しい）~%" e)
        t)))) ; エラーが発生した場合は成功

(format t "=== デバッグテスト実行 ===~%")
(format t "カード強度検証テスト:~%")
(debug-card-strength-validation)
(format t "~%無効カード出しテスト:~%")
(debug-invalid-card-play)