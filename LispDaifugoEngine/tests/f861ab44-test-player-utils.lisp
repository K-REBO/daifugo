;;; test-player-utils.lisp - プレイヤーユーティリティのテスト

(defpackage :daifugo-player-utils-test
  (:use :common-lisp)
  (:export #:run-player-utils-tests))

(in-package :daifugo-player-utils-test)

;;; プレイヤーユーティリティの機能をテストする

(defun test-rank-to-string ()
  "階級文字列変換のテスト"
  (and (string= (daifugo-player-utils:rank-to-string :daifugo) "大富豪")
       (string= (daifugo-player-utils:rank-to-string :heimin) "平民")
       (string= (daifugo-player-utils:rank-to-string :daihinmin) "大貧民")))

(defun test-string-to-rank ()
  "文字列階級変換のテスト"
  (and (eql (daifugo-player-utils:string-to-rank "大富豪") :daifugo)
       (eql (daifugo-player-utils:string-to-rank "平民") :heimin)
       (eql (daifugo-player-utils:string-to-rank "大貧民") :daihinmin)))

(defun test-rank-order ()
  "階級順序のテスト"
  (and (< (daifugo-player-utils:rank-order :daihinmin) 
          (daifugo-player-utils:rank-order :daifugo))
       (< (daifugo-player-utils:rank-order :heimin) 
          (daifugo-player-utils:rank-order :fugo))))

(defun test-higher-rank-p ()
  "階級比較のテスト"
  (and (daifugo-player-utils:higher-rank-p :daifugo :heimin)
       (daifugo-player-utils:higher-rank-p :fugo :daihinmin)
       (not (daifugo-player-utils:higher-rank-p :heimin :daifugo))))

(defun test-next-previous-rank ()
  "次/前階級のテスト"
  (and (eql (daifugo-player-utils:get-next-rank :heimin) :fugo)
       (eql (daifugo-player-utils:get-previous-rank :fugo) :heimin)
       (null (daifugo-player-utils:get-next-rank :daifugo))
       (null (daifugo-player-utils:get-previous-rank :daihinmin))))

(defun test-player-multiple-cards ()
  "複数カード操作のテスト"
  (let ((player (daifugo-player-system:create-player :id 0 :name "Test Player"))
        (cards (list (daifugo-card-system:create-card 'daifugo-card-system::A :spades)
                     (daifugo-card-system:create-card 'daifugo-card-system::K :hearts)
                     (daifugo-card-system:create-card 3 :diamonds))))
    (and (= (daifugo-player-system:hand-count player) 0)
         (progn
           (daifugo-player-system:add-cards-to-hand player cards)
           (= (daifugo-player-system:hand-count player) 3))
         (progn
           (daifugo-player-system:remove-cards-from-hand player (list (first cards)))
           (= (daifugo-player-system:hand-count player) 2)))))

(defun test-player-to-string ()
  "プレイヤー文字列変換のテスト"
  (let ((player (daifugo-player-system:create-player :id 0 :name "Test Player")))
    (stringp (daifugo-player-system:player-to-string player))))

(defun run-player-utils-tests ()
  "全てのプレイヤーユーティリティテストを実行"
  (format t "~%=== プレイヤーユーティリティテスト実行 ===~%")
  
  (let ((tests '(("階級文字列変換" . test-rank-to-string)
                 ("文字列階級変換" . test-string-to-rank)
                 ("階級順序" . test-rank-order)
                 ("階級比較" . test-higher-rank-p)
                 ("次/前階級" . test-next-previous-rank)
                 ("複数カード操作" . test-player-multiple-cards)
                 ("文字列変換" . test-player-to-string)))
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
(run-player-utils-tests)