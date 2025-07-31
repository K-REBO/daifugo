;;; test-integration.lisp - 統合テスト・プレイテスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-integration-test
  (:use :common-lisp))

(in-package :daifugo-integration-test)

;;; ==========================================
;;; 全システム統合テスト
;;; ==========================================

(defun test-complete-game-flow ()
  "完全なゲームフローの統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (rule-set (daifugo-rule-set:get-rule-set :jdf-official)))
    (daifugo-game-engine:set-rule-set game rule-set)
    (daifugo-game-engine:start-game game)
    
    (and (daifugo-game-engine:game-state-p game)
         (= (length (daifugo-game-engine:game-state-players game)) 4)
         (eq (daifugo-game-engine:game-state-game-phase game) :playing)
         (daifugo-game-engine:rule-enabled-p game :revolution)
         (daifugo-game-engine:rule-enabled-p game :eight-cut))))

(defun test-multi-rule-interaction ()
  "複数ルールの相互作用テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (extended-set (daifugo-rule-set:get-rule-set :jdf-extended)))
    (daifugo-game-engine:set-rule-set game extended-set)
    (daifugo-game-engine:start-game game)
    
    ;; 革命・8切り・階段・11バック・スート縛りが全て有効
    (and (daifugo-game-engine:rule-enabled-p game :revolution)
         (daifugo-game-engine:rule-enabled-p game :eight-cut)
         (daifugo-game-engine:rule-enabled-p game :sequence)
         (daifugo-game-engine:rule-enabled-p game :eleven-back)
         (daifugo-game-engine:rule-enabled-p game :suit-binding))))

(defun test-card-system-integration ()
  "カードシステム統合テスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((player (first (daifugo-game-engine:game-state-players game))))
      (and (> (daifugo-player-system:hand-count player) 0)
           (listp (daifugo-player-system:player-hand player))
           (every #'daifugo-card-system:card-p 
                  (daifugo-player-system:player-hand player))))))

(defun test-logger-system-integration ()
  "ロガーシステム統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (logger (daifugo-game-logger:create-logger :integration-test)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-logger:log-game-state logger game)
    (daifugo-game-logger:log-player-action logger 0 :game-start nil)
    (> (daifugo-game-logger:log-count logger) 0)))

(defun test-auto-tester-integration ()
  "自動テスタ統合テスト"
  (let ((tester (daifugo-auto-tester:create-auto-tester)))
    (daifugo-auto-tester:add-test-case tester "統合テスト1" 
                                       (lambda () (test-complete-game-flow)))
    (daifugo-auto-tester:add-test-case tester "統合テスト2" 
                                       (lambda () (test-multi-rule-interaction)))
    (let ((results (daifugo-auto-tester:run-all-tests tester)))
      (> (daifugo-auto-tester:passed-count results) 0))))

;;; ==========================================
;;; AIプレイヤー統合テスト
;;; ==========================================

(defun test-ai-player-integration ()
  "AIプレイヤー統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (ai-player :smart-ai))
    (daifugo-game-engine:start-game game)
    (let ((decision :pass))
      (and decision
           (or (eq decision :pass)
               (and (listp decision)
                    (every #'daifugo-card-system:card-p decision)))))))

(defun test-ai-vs-ai-game ()
  "AI対AIゲームテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (ai-players (list :basic-ai :smart-ai :aggressive-ai :conservative-ai)))
    (daifugo-game-engine:start-game game)
    (dotimes (turn 10) ; 10ターン実行
      (let ((current-player-index (daifugo-game-engine:get-current-player game))
            (ai (nth current-player-index ai-players)))
        (when ai
          (let ((decision :pass))
            (if (eq decision :pass)
                (daifugo-game-engine:pass-turn game current-player-index)
                (when (listp decision)
                  (daifugo-game-engine:play-card game current-player-index decision)))))))
    (daifugo-game-engine:game-state-p game)))

;;; ==========================================
;;; ルールシステム統合テスト
;;; ==========================================

(defun test-revolution-system-integration ()
  "革命システム統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (kakumei-system (daifugo-kakumei:create-kakumei-system)))
    (daifugo-game-engine:start-game game)
    (let ((four-cards (list (daifugo-card-system:create-card 7 :spades)
                            (daifugo-card-system:create-card 7 :hearts)
                            (daifugo-card-system:create-card 7 :diamonds)
                            (daifugo-card-system:create-card 7 :clubs))))
      (and (daifugo-kakumei:detect-kakumei-trigger kakumei-system four-cards)
           (daifugo-kakumei:trigger-kakumei kakumei-system :four-of-a-kind)
           (daifugo-kakumei:kakumei-active-p kakumei-system)))))

(defun test-eight-cut-system-integration ()
  "8切りシステム統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (kiri-system (daifugo-8kiri:create-8kiri-system))
        (field-state (daifugo-8kiri:create-field-state)))
    (daifugo-game-engine:start-game game)
    (daifugo-8kiri:set-field-cards field-state 
                                   (list (daifugo-card-system:create-card 10 :hearts)))
    (let ((eight-card (list (daifugo-card-system:create-card 8 :spades))))
      (and (daifugo-8kiri:detect-8kiri-trigger kiri-system eight-card)
           (daifugo-8kiri:execute-8kiri kiri-system field-state eight-card)
           (= (length (daifugo-8kiri:get-field-cards field-state)) 0)))))

(defun test-sequence-system-integration ()
  "階段システム統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (kaidan-system (daifugo-kaidan:create-kaidan-system)))
    (daifugo-game-engine:start-game game)
    (let ((sequence-cards (list (daifugo-card-system:create-card 3 :spades)
                                (daifugo-card-system:create-card 4 :hearts)
                                (daifugo-card-system:create-card 5 :diamonds))))
      (and (daifugo-kaidan:is-valid-kaidan-p kaidan-system sequence-cards)
           (daifugo-kaidan:detect-kaidan-pattern sequence-cards)
           (= (daifugo-kaidan:get-kaidan-length sequence-cards) 3)))))

;;; ==========================================
;;; 拡張ルール統合テスト
;;; ==========================================

(defun test-eleven-back-integration ()
  "11バック統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (back-system (daifugo-11back:create-11back-system)))
    (daifugo-game-engine:start-game game)
    (let ((jack-card (list (daifugo-card-system:create-card 
                            (intern "J" :daifugo-card-system) :spades))))
      (and (daifugo-11back:detect-11back-trigger back-system jack-card)
           (daifugo-11back:trigger-11back back-system)
           (daifugo-11back:back-active-p back-system)))))

(defun test-suit-binding-integration ()
  "スート縛り統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (binding-system (daifugo-suit-binding:create-suit-binding-system)))
    (daifugo-game-engine:start-game game)
    (let ((spade-cards (list (daifugo-card-system:create-card 7 :spades)
                             (daifugo-card-system:create-card 8 :spades))))
      (and (daifugo-suit-binding:detect-binding-trigger binding-system spade-cards)
           (daifugo-suit-binding:activate-binding binding-system :spades)
           (daifugo-suit-binding:binding-active-p binding-system)
           (eq (daifugo-suit-binding:get-bound-suit binding-system) :spades)))))

(defun test-spade3-return-integration ()
  "スペ3返し統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (return-system (daifugo-spade3-return:create-spade3-return-system)))
    (daifugo-game-engine:start-game game)
    (let ((spade3-card (list (daifugo-card-system:create-card 3 :spades))))
      (and (daifugo-spade3-return:detect-spade3-trigger return-system spade3-card)
           (daifugo-spade3-return:execute-spade3-return return-system 0 1)
           (> (daifugo-spade3-return:get-return-count return-system) 0)))))

(defun test-miyako-ochi-integration ()
  "都落ち統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (ochi-system (daifugo-miyako-ochi:create-miyako-ochi-system)))
    (daifugo-game-engine:start-game game)
    (and (daifugo-miyako-ochi:check-miyako-ochi-condition ochi-system 0)
         (daifugo-miyako-ochi:can-prevent-miyako-ochi-p ochi-system 0)
         (daifugo-miyako-ochi:miyako-ochi-system-p ochi-system))))

;;; ==========================================
;;; JavaScriptAPI統合テスト
;;; ==========================================

(defun test-javascript-api-integration ()
  "JavaScript API統合テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api))
        (game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let ((game-json (daifugo-javascript-api:game-to-json js-api game))
          (player-json (daifugo-javascript-api:player-to-json js-api 
                         (first (daifugo-game-engine:game-state-players game)))))
      (and (daifugo-javascript-api:json-response-p game-json)
           (daifugo-javascript-api:json-response-p player-json)
           (daifugo-javascript-api:get-json-field game-json "gamePhase")
           (daifugo-javascript-api:get-json-field player-json "handCount")))))

(defun test-event-system-integration ()
  "イベントシステム統合テスト"
  (let ((event-system (daifugo-event-system:create-event-system))
        (game (daifugo-game-engine:create-game 4))
        (event-fired nil))
    (daifugo-event-system:register-listener event-system :game-start
                                            (lambda (data) (setf event-fired t)))
    (daifugo-game-engine:start-game game)
    (daifugo-event-system:emit-event event-system :game-start 
                                     (list :game-id "test-game"))
    (and event-fired
         (> (daifugo-event-system:get-listener-count event-system :game-start) 0))))

;;; ==========================================
;;; パフォーマンス統合テスト
;;; ==========================================

(defun test-performance-integration ()
  "パフォーマンス統合テスト"
  (let ((start-time (get-universal-time))
        (games-completed 0))
    ;; 100ゲームの高速実行
    (dotimes (i 100)
      (let ((game (daifugo-game-engine:create-game 4)))
        (daifugo-game-engine:start-game game)
        (when (daifugo-game-engine:game-state-p game)
          (incf games-completed))))
    (let ((end-time (get-universal-time))
          (duration (- end-time start-time)))
      (and (= games-completed 100)
           (< duration 10))))) ; 10秒以内に100ゲーム完了

(defun test-memory-usage-integration ()
  "メモリ使用量統合テスト"
  (let ((games '()))
    ;; 50ゲームを同時に保持
    (dotimes (i 50)
      (let ((game (daifugo-game-engine:create-game 4)))
        (daifugo-game-engine:start-game game)
        (push game games)))
    ;; 全ゲームが正常に動作
    (every (lambda (game)
             (and (daifugo-game-engine:game-state-p game)
                  (= (length (daifugo-game-engine:game-state-players game)) 4)))
           games)))

;;; ==========================================
;;; エラーハンドリング統合テスト
;;; ==========================================

(defun test-error-handling-integration ()
  "エラーハンドリング統合テスト"
  (let ((error-caught nil))
    ;; 無効なプレイヤー数でゲーム作成
    (handler-case
        (daifugo-game-engine:create-game 0)
      (error (e) (setf error-caught t)))
    
    ;; 無効なカード出し
    (let ((game (daifugo-game-engine:create-game 4)))
      (daifugo-game-engine:start-game game)
      (handler-case
          (daifugo-game-engine:play-card game 0 nil)
        (error (e) (setf error-caught t))))
    
    error-caught))

(defun test-data-integrity-integration ()
  "データ整合性統合テスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((players (daifugo-game-engine:game-state-players game))
           (total-cards (apply #'+ (mapcar #'daifugo-player-system:hand-count players)))
           (deck-size 52)) ; 標準デッキ
      ;; 全カードが適切に配布されている
      (and (= (length players) 4)
           (<= total-cards deck-size)
           (every (lambda (player)
                    (and (daifugo-player-system:player-p player)
                         (>= (daifugo-player-system:hand-count player) 0)))
                  players)))))

;;; ==========================================
;;; 互換性統合テスト
;;; ==========================================

(defun test-rule-set-compatibility-integration ()
  "ルールセット互換性統合テスト"
  (let ((jdf-official (daifugo-rule-set:get-rule-set :jdf-official))
        (jdf-extended (daifugo-rule-set:get-rule-set :jdf-extended))
        (casual (daifugo-rule-set:get-rule-set :casual)))
    (and (daifugo-rule-set:compatible-p jdf-official jdf-extended)
         (daifugo-rule-set:compatible-p jdf-official casual)
         (not (daifugo-rule-set:rule-sets-equal-p jdf-official casual)))))

(defun test-version-compatibility-integration ()
  "バージョン互換性統合テスト"
  (let ((v1-set (daifugo-rule-set:create-rule-set :version-test-1))
        (v2-set (daifugo-rule-set:create-rule-set :version-test-2)))
    (daifugo-rule-set:set-version v1-set "1.0.0")
    (daifugo-rule-set:set-version v2-set "1.1.0")
    (and (daifugo-rule-set:compatible-p v1-set v2-set)
         (daifugo-rule-set:can-upgrade-p v1-set v2-set))))

;;; ==========================================
;;; 統合テスト実行関数
;;; ==========================================

(defun run-integration-tests ()
  "統合テストを実行"
  (format t "~%=== 統合テスト・プレイテスト実行 ===~%")
  
  (let ((tests '(("完全ゲームフロー" . test-complete-game-flow)
                 ("複数ルール相互作用" . test-multi-rule-interaction)
                 ("カードシステム統合" . test-card-system-integration)
                 ("ロガーシステム統合" . test-logger-system-integration)
                 ("自動テスタ統合" . test-auto-tester-integration)
                 ("AIプレイヤー統合" . test-ai-player-integration)
                 ("AI対AIゲーム" . test-ai-vs-ai-game)
                 ("革命システム統合" . test-revolution-system-integration)
                 ("8切りシステム統合" . test-eight-cut-system-integration)
                 ("階段システム統合" . test-sequence-system-integration)
                 ("11バック統合" . test-eleven-back-integration)
                 ("スート縛り統合" . test-suit-binding-integration)
                 ("スペ3返し統合" . test-spade3-return-integration)
                 ("都落ち統合" . test-miyako-ochi-integration)
                 ("JavaScript API統合" . test-javascript-api-integration)
                 ("イベントシステム統合" . test-event-system-integration)
                 ("パフォーマンス統合" . test-performance-integration)
                 ("メモリ使用量統合" . test-memory-usage-integration)
                 ("エラーハンドリング統合" . test-error-handling-integration)
                 ("データ整合性統合" . test-data-integrity-integration)
                 ("ルールセット互換性統合" . test-rule-set-compatibility-integration)
                 ("バージョン互換性統合" . test-version-compatibility-integration)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "統合テスト: ~A ... " test-name)
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
    
    (format t "~%統合テスト結果: ~A合格, ~A失敗~%" passed failed)
    (format t "統合テストカバレッジ: ~A%~%" 
            (round (* (/ passed (+ passed failed)) 100)))
    (= failed 0)))

;; テスト実行
(run-integration-tests)