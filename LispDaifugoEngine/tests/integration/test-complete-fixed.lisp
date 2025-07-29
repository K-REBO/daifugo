;;; test-complete-fixed.lisp - 修正後の完全なゲームロジックテスト

;; すべての必要なコンポーネントを含む統合テスト
(load "../debug/final-test.lisp")

;; ゲームロジック追加実装
(in-package :daifugo-game-engine)

;;; 拡張ゲーム機能
(defun validate-card-play (cards field revolution-p)
  "カード出しの妥当性を検証"
  (cond
    ;; フィールドが空の場合は何でも出せる
    ((null field) t)
    ;; 8切りは常に出せる
    ((and (= (length cards) 1)
          (eql (daifugo-card-system:card-rank (first cards)) 8)) t)
    ;; 枚数が違う場合は出せない
    ((/= (length cards) (length field)) nil)
    ;; 革命状態の場合は強度が逆転
    (revolution-p
     (< (daifugo-card-system:card-strength (first cards))
        (daifugo-card-system:card-strength (first field))))
    ;; 通常は強度が高い必要がある
    (t
     (> (daifugo-card-system:card-strength (first cards))
        (daifugo-card-system:card-strength (first field))))))

(defun is-revolution (cards)
  "革命（4枚同じランク）かチェック"
  (and (= (length cards) 4)
       (let ((first-rank (daifugo-card-system:card-rank (first cards))))
         (every (lambda (card)
                  (eql (daifugo-card-system:card-rank card) first-rank))
                cards))))

(defun is-eight-cut (cards)
  "8切りかチェック"
  (and (= (length cards) 1)
       (eql (daifugo-card-system:card-rank (first cards)) 8)))

(defun remove-cards-from-hand (player cards)
  "プレイヤーの手札からカードを削除"
  (let ((hand (daifugo-player-system:player-hand player)))
    (dolist (card cards)
      (setf hand (remove card hand :test #'equalp :count 1)))
    (setf (daifugo-player-system:player-hand player) hand)))

;;; 拡張されたplay-card関数
(defun play-card (game-state player-id cards)
  "プレイヤーがカードを出す（拡張版）"
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  
  ;; カードの妥当性チェック
  (let* ((player (nth player-id (game-state-players game-state)))
         (field (game-state-field game-state))
         (revolution-p (game-state-revolution-p game-state)))
    
    (unless (validate-card-play cards field revolution-p)
      (error "無効なカード出し"))
    
    ;; 手札からカードを削除
    (remove-cards-from-hand player cards)
    
    ;; フィールドを更新
    (setf (game-state-field game-state) cards)
    
    ;; 革命チェック
    (when (is-revolution cards)
      (setf (game-state-revolution-p game-state)
            (not revolution-p)))
    
    ;; 8切りチェック
    (when (is-eight-cut cards)
      (setf (game-state-field game-state) nil))
    
    ;; ログ追加
    (push (format nil "プレイヤー~A が~A枚のカードを出しました" 
                  player-id (length cards))
          (game-state-logs game-state))
    t))

;; テストパッケージ
(defpackage :daifugo-complete-test-fixed
  (:use :common-lisp))

(in-package :daifugo-complete-test-fixed)

;;; 完全なテスト関数（修正版）
(defun test-single-card-play ()
  "単体カード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    ;; パッケージ独立でAカードを作成
    (let ((card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
      (daifugo-game-engine:start-game game)
      (daifugo-game-engine:play-card game 0 (list card)))))

(defun test-pair-card-play ()
  "ペア出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    ;; パッケージ独立でAカードを作成
    (let ((cards (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)
                       (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts))))
      (daifugo-game-engine:start-game game)
      (daifugo-game-engine:play-card game 0 cards))))

(defun test-card-strength-validation ()
  "カード強度の検証テスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    ;; パッケージ独立でカードを作成
    (let ((weak-card (daifugo-card-system:create-card 4 :spades))
          (strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts)))
      (daifugo-game-engine:start-game game)
      ;; 弱いカードを出す
      (daifugo-game-engine:play-card game 0 (list weak-card))
      ;; 次のプレイヤーに変更
      (setf (daifugo-game-engine:game-state-current-player game) 1)
      ;; 強いカードが出せるかテスト
      (daifugo-game-engine:play-card game 1 (list strong-card)))))

(defun test-invalid-card-play ()
  "無効なカード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    ;; パッケージ独立でカードを作成
    (let ((strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades))
          (weak-card (daifugo-card-system:create-card 4 :hearts)))
      (daifugo-game-engine:start-game game)
      ;; 強いカードを出す
      (daifugo-game-engine:play-card game 0 (list strong-card))
      ;; 次のプレイヤーに変更
      (setf (daifugo-game-engine:game-state-current-player game) 1)
      ;; 弱いカードは出せないはず
      (handler-case
          (progn
            (daifugo-game-engine:play-card game 1 (list weak-card))
            nil) ; 成功した場合は失敗
        (error () t))))) ; エラーが発生した場合は成功

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
    ;; 最初に何かカードを出す
    (daifugo-game-engine:play-card game 0 (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
    ;; 次のプレイヤーに変更
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    ;; 8を出す
    (daifugo-game-engine:play-card game 1 (list eight-card))
    ;; フィールドが空になっているかチェック
    (null (daifugo-game-engine:game-state-field game))))

(defun test-player-hand-management ()
  "プレイヤー手札管理のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (first (daifugo-game-engine:game-state-players game)))
           (initial-count (daifugo-player-system:hand-count player)))
      ;; カードを出す
      (daifugo-game-engine:play-card game 0 
                                     (list (first (daifugo-player-system:player-hand player))))
      ;; 手札が減ったかチェック
      (< (daifugo-player-system:hand-count player) initial-count))))

;;; テスト実行関数
(defun run-complete-game-logic-tests-fixed ()
  "修正後の完全なゲームロジックテストを実行"
  (format t "~%=== 修正後完全ゲームロジックテスト実行 ===~%")
  
  (let ((tests '(("単体カード出し" . test-single-card-play)
                 ("ペア出し" . test-pair-card-play)
                 ("カード強度検証" . test-card-strength-validation)
                 ("無効カード出し" . test-invalid-card-play)
                 ("革命判定" . test-revolution-detection)
                 ("8切りルール" . test-8cut-rule)
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
(run-complete-game-logic-tests-fixed)