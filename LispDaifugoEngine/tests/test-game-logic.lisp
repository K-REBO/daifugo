;;; test-game-logic.lisp - 基本ゲームロジックのテスト

;; テスト用の基本機能をロード
(load "../debug/final-test.lisp")

(defpackage :daifugo-game-logic-test
  (:use :common-lisp))

(in-package :daifugo-game-logic-test)

;;; カード出しの基本ルールテスト
(defun test-single-card-play ()
  "単体カード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (card (daifugo-card-system:create-card 'A :spades)))
    (daifugo-game-engine:start-game game)
    ;; 単体カードを出せるかテスト
    (daifugo-game-engine:play-card game 0 (list card))))

(defun test-pair-card-play ()
  "ペア出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (cards (list (daifugo-card-system:create-card 'A :spades)
                     (daifugo-card-system:create-card 'A :hearts))))
    (daifugo-game-engine:start-game game)
    ;; ペアカードを出せるかテスト
    (daifugo-game-engine:play-card game 0 cards)))

(defun test-sequence-card-play ()
  "階段出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (cards (list (daifugo-card-system:create-card 3 :spades)
                     (daifugo-card-system:create-card 4 :hearts)
                     (daifugo-card-system:create-card 5 :diamonds))))
    (daifugo-game-engine:start-game game)
    ;; 階段カードを出せるかテスト
    (daifugo-game-engine:play-card game 0 cards)))

(defun test-card-strength-validation ()
  "カード強度の検証テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (weak-card (daifugo-card-system:create-card 3 :spades))
        (strong-card (daifugo-card-system:create-card 'A :hearts)))
    (daifugo-game-engine:start-game game)
    ;; 弱いカードの後に強いカードが出せるかテスト
    (and (daifugo-game-engine:play-card game 0 (list weak-card))
         (daifugo-game-engine:play-card game 1 (list strong-card)))))

(defun test-invalid-card-play ()
  "無効なカード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (strong-card (daifugo-card-system:create-card 'A :spades))
        (weak-card (daifugo-card-system:create-card 3 :hearts)))
    (daifugo-game-engine:start-game game)
    ;; 強いカードの後に弱いカードは出せないはず
    (daifugo-game-engine:play-card game 0 (list strong-card))
    ;; これは失敗するはず（テストでは成功と見なす）
    (handler-case
        (progn
          ;; ターン進行は今は手動でプレイヤーIDを変更
          (setf (daifugo-game-engine:game-state-current-player game) 1)
          (daifugo-game-engine:play-card game 1 (list weak-card))
          nil) ; 成功した場合は失敗
      (error () t)))) ; エラーが発生した場合は成功

(defun test-turn-progression ()
  "ターン進行のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((initial-player (daifugo-game-engine:get-current-player game)))
      ;; 手動でターンを進める
      (setf (daifugo-game-engine:game-state-current-player game) 
            (mod (1+ initial-player) 4))
      (let ((next-player (daifugo-game-engine:get-current-player game)))
        ;; プレイヤーが変わったかテスト
        (not (= initial-player next-player))))))

(defun test-revolution-detection ()
  "革命判定のテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (revolution-cards (list (daifugo-card-system:create-card 3 :spades)
                               (daifugo-card-system:create-card 3 :hearts)
                               (daifugo-card-system:create-card 3 :diamonds)
                               (daifugo-card-system:create-card 3 :clubs))))
    (daifugo-game-engine:start-game game)
    ;; 4枚同じランクで革命が起こるかテスト
    (daifugo-game-engine:play-card game 0 revolution-cards)
    ;; 革命状態がセットされているかチェック
    (daifugo-game-engine:game-state-revolution-p game)))

(defun test-8cut-rule ()
  "8切りルールのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (eight-card (daifugo-card-system:create-card 8 :spades)))
    (daifugo-game-engine:start-game game)
    ;; 8を出すとフィールドがクリアされるかテスト
    (daifugo-game-engine:play-card game 0 (list eight-card))
    ;; フィールドが空になっているかチェック
    (null (daifugo-game-engine:game-state-field game))))

(defun test-pass-all-around ()
  "全プレイヤーパスのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    ;; 最初のプレイヤーがカードを出す
    (daifugo-game-engine:play-card game 0 (list (daifugo-card-system:create-card 'A :spades)))
    ;; 他の全プレイヤーがパス
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    (daifugo-game-engine:pass-turn game 1)
    (setf (daifugo-game-engine:game-state-current-player game) 2)
    (daifugo-game-engine:pass-turn game 2)
    (setf (daifugo-game-engine:game-state-current-player game) 3)
    (daifugo-game-engine:pass-turn game 3)
    ;; フィールドがクリアされて最初のプレイヤーのターンに戻るかテスト
    (and (null (daifugo-game-engine:game-state-field game))
         (= (daifugo-game-engine:get-current-player game) 0))))

(defun test-player-hand-management ()
  "プレイヤー手札管理のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (first (daifugo-game-engine:game-state-players game)))
           (initial-count (daifugo-player-system:hand-count player))
           (card-to-play (first (daifugo-player-system:player-hand player))))
      ;; カードを出したら手札が減るかテスト
      (daifugo-game-engine:play-card game 0 (list card-to-play))
      (< (daifugo-player-system:hand-count player) initial-count))))

;;; テスト実行関数
(defun run-game-logic-tests ()
  "全ての基本ゲームロジックテストを実行"
  (format t "~%=== 基本ゲームロジックテスト実行 ===~%")
  
  (let ((tests '(("単体カード出し" . test-single-card-play)
                 ("ペア出し" . test-pair-card-play)
                 ("階段出し" . test-sequence-card-play)
                 ("カード強度検証" . test-card-strength-validation)
                 ("無効カード出し" . test-invalid-card-play)
                 ("ターン進行" . test-turn-progression)
                 ("革命判定" . test-revolution-detection)
                 ("8切りルール" . test-8cut-rule)
                 ("全員パス" . test-pass-all-around)
                 ("手札管理" . test-player-hand-management)))
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

;; テスト実行
(run-game-logic-tests)