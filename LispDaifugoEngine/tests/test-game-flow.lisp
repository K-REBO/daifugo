;;; test-game-flow.lisp - ゲームフローのテスト

(defpackage :daifugo-game-flow-test
  (:use :common-lisp)
  (:export #:run-game-flow-tests))

(in-package :daifugo-game-flow-test)

;;; ゲームフローの機能をテストする

(defun test-game-creation ()
  "ゲーム作成のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (and (daifugo-game-engine:game-state-p game)
         (= (length (daifugo-game-engine:game-state-players game)) 4)
         (eql (daifugo-game-engine:game-state-game-phase game) :init))))

(defun test-game-initialization ()
  "ゲーム初期化のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (and (daifugo-game-engine:game-state-p game)
         (numberp (daifugo-game-engine:game-state-current-player game))
         (null (daifugo-game-engine:game-state-field game))
         (not (daifugo-game-engine:game-state-revolution-p game)))))

(defun test-game-start ()
  "ゲーム開始のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (eql (daifugo-game-engine:game-state-game-phase game) :playing)))

(defun test-current-player ()
  "現在のプレイヤー取得のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (let ((current (daifugo-game-engine:get-current-player game)))
      (and (numberp current)
           (>= current 0)
           (< current 4)))))

(defun test-game-over-detection ()
  "ゲーム終了判定のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (not (daifugo-game-engine:game-over-p game))))

(defun test-turn-direction ()
  "ターン方向のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (eql (daifugo-game-engine:game-state-turn-direction game) :clockwise)))

(defun test-card-play ()
  "カードプレイのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (cards (list (daifugo-card-system:create-card 'daifugo-card-system::A :spades))))
    (daifugo-game-engine:play-card game 0 cards)))

(defun test-pass-turn ()
  "パスのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:pass-turn game 0)))

(defun test-game-state-components ()
  "ゲーム状態コンポーネントのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (and (listp (daifugo-game-engine:game-state-players game))
         (numberp (daifugo-game-engine:game-state-current-player game))
         (symbolp (daifugo-game-engine:game-state-turn-direction game))
         (symbolp (daifugo-game-engine:game-state-game-phase game))
         (or (null (daifugo-game-engine:game-state-revolution-p game))
             (daifugo-game-engine:game-state-revolution-p game)))))

(defun test-multiple-players ()
  "複数プレイヤーのテスト"
  (let ((game2 (daifugo-game-engine:create-game 2))
        (game6 (daifugo-game-engine:create-game 6)))
    (and (= (length (daifugo-game-engine:game-state-players game2)) 2)
         (= (length (daifugo-game-engine:game-state-players game6)) 6))))

(defun run-game-flow-tests ()
  "全てのゲームフローテストを実行"
  (format t "~%=== ゲームフローテスト実行 ===~%")
  
  (let ((tests '(("ゲーム作成" . test-game-creation)
                 ("ゲーム初期化" . test-game-initialization)
                 ("ゲーム開始" . test-game-start)
                 ("現在プレイヤー" . test-current-player)
                 ("ゲーム終了判定" . test-game-over-detection)
                 ("ターン方向" . test-turn-direction)
                 ("カードプレイ" . test-card-play)
                 ("パス" . test-pass-turn)
                 ("ゲーム状態コンポーネント" . test-game-state-components)
                 ("複数プレイヤー" . test-multiple-players)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (handler-case
            (if (funcall test-func)
                (progn
                  (format t "合格~%")
                  (incf passed))
                (progn
                  (format t "失敗~%")
                  (incf failed)))
          (error (e)
            (format t "エラー: ~A~%" e)
            (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; テスト実行（失敗することが期待される）
(run-game-flow-tests)