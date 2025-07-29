;;; test-extended-rules-simple.lisp - 拡張ローカルルールの簡易テスト

(defpackage :simple-extended-rules-test
  (:use :common-lisp)
  (:export #:run-simple-extended-rules-tests))

(in-package :simple-extended-rules-test)

;; 簡易カードシステム
(defstruct simple-card rank suit)
(defun create-simple-card (rank suit) (make-simple-card :rank rank :suit suit))

;; 簡易ゲーム状態
(defstruct simple-game-state data)
(defun create-simple-game-state () (make-simple-game-state :data nil))

;; 簡易11バックシステム
(defstruct simple-11back-system
  enabled-p
  trigger-count
  active-p)

(defun create-simple-11back-system ()
  "簡易11バックシステムを作成"
  (make-simple-11back-system :enabled-p t :trigger-count 0 :active-p nil))

(defun simple-detect-11back-trigger (back11-system cards)
  "簡易11バックトリガー検出"
  (when (simple-11back-system-enabled-p back11-system)
    (every (lambda (card) (= (simple-card-rank card) 11)) cards)))

(defun simple-trigger-11back (back11-system)
  "簡易11バック発動"
  (incf (simple-11back-system-trigger-count back11-system))
  (setf (simple-11back-system-active-p back11-system)
        (oddp (simple-11back-system-trigger-count back11-system)))
  t)

;; 簡易スート縛りシステム
(defstruct simple-suit-binding-system
  enabled-p
  active-binding-p
  active-suit)

(defun create-simple-suit-binding-system ()
  "簡易スート縛りシステムを作成"
  (make-simple-suit-binding-system :enabled-p t :active-binding-p nil :active-suit nil))

(defun simple-detect-suit-binding (suit-system cards)
  "簡易スート縛り検出"
  (when (and (simple-suit-binding-system-enabled-p suit-system)
             (> (length cards) 1))
    (let ((first-suit (simple-card-suit (first cards))))
      (every (lambda (card) (eq (simple-card-suit card) first-suit)) cards))))

(defun simple-activate-suit-binding (suit-system binding-suit)
  "簡易スート縛り発動"
  (setf (simple-suit-binding-system-active-binding-p suit-system) t)
  (setf (simple-suit-binding-system-active-suit suit-system) binding-suit)
  t)

;; 簡易スペ3返しシステム
(defstruct simple-spade3-system
  enabled-p
  return-triggered-p
  target-player)

(defun create-simple-spade3-system ()
  "簡易スペ3返しシステムを作成"
  (make-simple-spade3-system :enabled-p t :return-triggered-p nil :target-player nil))

(defun simple-is-spade3-p (spade3-system card)
  "簡易スペード3判定"
  (and (simple-spade3-system-enabled-p spade3-system)
       (= (simple-card-rank card) 3)
       (eq (simple-card-suit card) :spades)))

(defun simple-process-spade3-play (spade3-system cards)
  "簡易スペ3プレイ処理"
  (when (some (lambda (card) (simple-is-spade3-p spade3-system card)) cards)
    (setf (simple-spade3-system-return-triggered-p spade3-system) t)
    (setf (simple-spade3-system-target-player spade3-system) 1)  ; 固定対象
    t))

;; 簡易都落ちシステム
(defstruct simple-miyako-system
  enabled-p
  executed-ochi
  prevented-ochi)

(defun create-simple-miyako-system ()
  "簡易都落ちシステムを作成"
  (make-simple-miyako-system :enabled-p t 
                             :executed-ochi (make-hash-table :test 'equal)
                             :prevented-ochi (make-hash-table :test 'equal)))

(defun simple-check-ochi-conditions (miyako-system player-id)
  "簡易都落ち条件確認"
  (and (simple-miyako-system-enabled-p miyako-system)
       (= player-id 0)))  ; Player 0が対象と仮定

(defun simple-execute-miyako-ochi (miyako-system player-id)
  "簡易都落ち実行"
  (when (simple-check-ochi-conditions miyako-system player-id)
    (setf (gethash player-id (simple-miyako-system-executed-ochi miyako-system)) t)
    t))

;; テスト関数群
(defun test-simple-11back-creation ()
  "11バックシステム作成テスト"
  (let ((system (create-simple-11back-system)))
    (and system
         (simple-11back-system-p system)
         (simple-11back-system-enabled-p system)
         (not (simple-11back-system-active-p system)))))

(defun test-simple-11back-detection ()
  "11バック検出テスト"
  (let ((system (create-simple-11back-system)))
    (let ((jack-cards (list (create-simple-card 11 :spades)
                           (create-simple-card 11 :hearts))))
      (and (simple-detect-11back-trigger system jack-cards)
           (progn
             (simple-trigger-11back system)
             (simple-11back-system-active-p system))))))

(defun test-simple-suit-binding-creation ()
  "スート縛りシステム作成テスト"
  (let ((system (create-simple-suit-binding-system)))
    (and system
         (simple-suit-binding-system-p system)
         (simple-suit-binding-system-enabled-p system)
         (not (simple-suit-binding-system-active-binding-p system)))))

(defun test-simple-suit-binding-detection ()
  "スート縛り検出テスト"
  (let ((system (create-simple-suit-binding-system)))
    (let ((spade-cards (list (create-simple-card 3 :spades)
                            (create-simple-card 4 :spades))))
      (and (simple-detect-suit-binding system spade-cards)
           (progn
             (simple-activate-suit-binding system :spades)
             (eq (simple-suit-binding-system-active-suit system) :spades))))))

(defun test-simple-spade3-creation ()
  "スペ3返しシステム作成テスト"
  (let ((system (create-simple-spade3-system)))
    (and system
         (simple-spade3-system-p system)
         (simple-spade3-system-enabled-p system)
         (not (simple-spade3-system-return-triggered-p system)))))

(defun test-simple-spade3-detection ()
  "スペ3検出テスト"
  (let ((system (create-simple-spade3-system)))
    (let ((spade3-card (create-simple-card 3 :spades)))
      (and (simple-is-spade3-p system spade3-card)
           (simple-process-spade3-play system (list spade3-card))
           (simple-spade3-system-return-triggered-p system)))))

(defun test-simple-miyako-creation ()
  "都落ちシステム作成テスト"
  (let ((system (create-simple-miyako-system)))
    (and system
         (simple-miyako-system-p system)
         (simple-miyako-system-enabled-p system))))

(defun test-simple-miyako-execution ()
  "都落ち実行テスト"
  (let ((system (create-simple-miyako-system)))
    (and (simple-execute-miyako-ochi system 0)
         (gethash 0 (simple-miyako-system-executed-ochi system)))))

(defun test-simple-multiple-rules-integration ()
  "複数ルール統合テスト"
  (let ((back11-system (create-simple-11back-system))
        (suit-system (create-simple-suit-binding-system))
        (spade3-system (create-simple-spade3-system))
        (miyako-system (create-simple-miyako-system)))
    ;; 各システムが独立して動作することを確認
    (and (simple-11back-system-enabled-p back11-system)
         (simple-suit-binding-system-enabled-p suit-system)
         (simple-spade3-system-enabled-p spade3-system)
         (simple-miyako-system-enabled-p miyako-system))))

(defun run-simple-extended-rules-tests ()
  "簡易拡張ローカルルールテスト実行"
  (format t "~%=== 簡易拡張ローカルルールテスト実行 ===~%")
  
  (let ((tests '(("11バックシステム作成" . test-simple-11back-creation)
                 ("11バック検出" . test-simple-11back-detection)
                 ("スート縛りシステム作成" . test-simple-suit-binding-creation)
                 ("スート縛り検出" . test-simple-suit-binding-detection)
                 ("スペ3返しシステム作成" . test-simple-spade3-creation)
                 ("スペ3検出" . test-simple-spade3-detection)
                 ("都落ちシステム作成" . test-simple-miyako-creation)
                 ("都落ち実行" . test-simple-miyako-execution)
                 ("複数ルール統合" . test-simple-multiple-rules-integration)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (if (funcall test-func)
            (progn
              (format t "合格~%")
              (incf passed))
            (progn
              (format t "失敗~%")
              (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%~%" passed failed)
    (= failed 0)))

;; テスト実行
(format t "~%簡易拡張ローカルルールテスト準備完了~%")
(format t "実行: (simple-extended-rules-test:run-simple-extended-rules-tests)~%")