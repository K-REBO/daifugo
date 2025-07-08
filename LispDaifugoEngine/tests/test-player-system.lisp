;;; test-player-system.lisp - プレイヤー管理システムのテスト

(defpackage :daifugo-player-system-test
  (:use :common-lisp)
  (:export #:run-player-system-tests))

(in-package :daifugo-player-system-test)

;;; プレイヤー管理システムの機能をテストする

(defun test-player-creation ()
  "プレイヤー作成のテスト"
  (let ((players (daifugo-player-system:create-players 4)))
    (and (= (length players) 4)
         (every (lambda (player)
                  (and (daifugo-player-system:player-p player)
                       (numberp (daifugo-player-system:player-id player))
                       (stringp (daifugo-player-system:player-name player))))
                players))))

(defun test-player-hand-management ()
  "プレイヤー手札管理のテスト"
  (let ((player (daifugo-player-system:create-player :id 0 :name "Test Player"))
        (card (daifugo-card-system:create-card 'daifugo-card-system::A :spades)))
    (and (daifugo-player-system:hand-empty-p player)
         (progn
           (daifugo-player-system:add-card-to-hand player card)
           (not (daifugo-player-system:hand-empty-p player)))
         (= (length (daifugo-player-system:player-hand player)) 1)
         (progn
           (daifugo-player-system:remove-card-from-hand player card)
           (daifugo-player-system:hand-empty-p player)))))

(defun test-player-rank-system ()
  "プレイヤー階級システムのテスト"
  (let ((player (daifugo-player-system:create-player :id 0 :name "Test Player")))
    (and (eql (daifugo-player-system:player-rank player) :heimin)
         (progn
           (setf (daifugo-player-system:player-rank player) :daifugo)
           (eql (daifugo-player-system:player-rank player) :daifugo)))))

(defun test-player-type-system ()
  "プレイヤータイプシステムのテスト"
  (let ((human-player (daifugo-player-system:create-player :id 0 :name "Human" :type :human))
        (ai-player (daifugo-player-system:create-player :id 1 :name "AI" :type :ai :ai-type :random)))
    (and (eql (daifugo-player-system:player-type human-player) :human)
         (eql (daifugo-player-system:player-type ai-player) :ai)
         (eql (daifugo-player-system:player-ai-type ai-player) :random)
         (null (daifugo-player-system:player-ai-type human-player)))))

(defun test-get-player-by-id ()
  "プレイヤーID検索のテスト"
  (let ((players (daifugo-player-system:create-players 4)))
    (and (daifugo-player-system:player-p (daifugo-player-system:get-player-by-id players 0))
         (daifugo-player-system:player-p (daifugo-player-system:get-player-by-id players 3))
         (null (daifugo-player-system:get-player-by-id players 99)))))

(defun test-multiple-cards-management ()
  "複数カード管理のテスト"
  (let ((player (daifugo-player-system:create-player :id 0 :name "Test Player"))
        (cards (list (daifugo-card-system:create-card 'daifugo-card-system::A :spades)
                     (daifugo-card-system:create-card 'daifugo-card-system::K :hearts)
                     (daifugo-card-system:create-card 3 :diamonds))))
    (and (daifugo-player-system:hand-empty-p player)
         (progn
           (dolist (card cards)
             (daifugo-player-system:add-card-to-hand player card))
           (= (length (daifugo-player-system:player-hand player)) 3))
         (progn
           (daifugo-player-system:remove-card-from-hand player (first cards))
           (= (length (daifugo-player-system:player-hand player)) 2)))))

(defun test-player-id-uniqueness ()
  "プレイヤーID一意性のテスト"
  (let ((players (daifugo-player-system:create-players 6)))
    (= (length (remove-duplicates (mapcar #'daifugo-player-system:player-id players))) 6)))

(defun test-player-name-generation ()
  "プレイヤー名生成のテスト"
  (let ((players (daifugo-player-system:create-players 4)))
    (every (lambda (player)
             (and (stringp (daifugo-player-system:player-name player))
                  (> (length (daifugo-player-system:player-name player)) 0)))
           players)))

(defun run-player-system-tests ()
  "全てのプレイヤーシステムテストを実行"
  (format t "~%=== プレイヤーシステムテスト実行 ===~%")
  
  (let ((tests '(("プレイヤー作成" . test-player-creation)
                 ("手札管理" . test-player-hand-management)
                 ("階級システム" . test-player-rank-system)
                 ("タイプシステム" . test-player-type-system)
                 ("ID検索" . test-get-player-by-id)
                 ("複数カード管理" . test-multiple-cards-management)
                 ("ID一意性" . test-player-id-uniqueness)
                 ("名前生成" . test-player-name-generation)))
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
(run-player-system-tests)