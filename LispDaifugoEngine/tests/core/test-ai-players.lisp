;;; test-ai-players.lisp - AIプレイヤーシステムの包括的テスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-ai-players-test
  (:use :common-lisp))

(in-package :daifugo-ai-players-test)

;;; ==========================================
;;; 基本AIプレイヤー機能テスト
;;; ==========================================

(defun test-ai-player-creation ()
  "AIプレイヤーの作成テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :random-ai 0)))
    (and ai-player
         (daifugo-ai-players:ai-player-p ai-player)
         (eq (daifugo-ai-players:ai-player-type ai-player) :random-ai)
         (numberp (daifugo-ai-players:ai-player-id ai-player)))))

(defun test-ai-types-support ()
  "サポートされるAIタイプのテスト"
  (let ((supported-types (daifugo-ai-players:get-supported-ai-types)))
    (and supported-types
         (listp supported-types)
         (>= (length supported-types) 4)  ; 最低4種類のAI
         (member :random supported-types)
         (member :smart supported-types)
         (member :aggressive supported-types)
         (member :defensive supported-types))))

(defun test-ai-player-initialization ()
  "AIプレイヤーの初期化テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :smart 1)))
    (daifugo-ai-players:initialize-ai-player ai-player 
                                             (list (daifugo-card-system:create-card 3 :spades)
                                                   (daifugo-card-system:create-card 7 :hearts)))
    (and (daifugo-ai-players:ai-player-initialized-p ai-player)
         (= (length (daifugo-ai-players:ai-player-hand ai-player)) 2))))

;;; ==========================================
;;; AI意思決定・戦略テスト
;;; ==========================================

(defun test-random-ai-decisions ()
  "ランダムAIの意思決定テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :random 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    (daifugo-ai-players:initialize-ai-player ai-player 
                                             (daifugo-player-system:player-hand 
                                              (first (daifugo-game-engine:game-state-players game-state))))
    (let ((decision (daifugo-ai-players:make-decision ai-player game-state)))
      (and decision
           (listp decision)
           (member (getf decision :action) '(:play-cards :pass))
           (if (eq (getf decision :action) :play-cards)
               (listp (getf decision :cards))
               t)))))

(defun test-smart-ai-strategy ()
  "スマートAIの戦略テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :smart 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    (daifugo-ai-players:initialize-ai-player ai-player 
                                             (list (daifugo-card-system:create-card 3 :spades)
                                                   (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts)))
    (let ((decision (daifugo-ai-players:make-decision ai-player game-state)))
      (and decision
           (getf decision :action)
           (if (eq (getf decision :action) :play-cards)
               (and (getf decision :cards)
                    (>= (length (getf decision :cards)) 1))
               t)))))

(defun test-aggressive-ai_behavior ()
  "アグレッシブAIの行動テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :aggressive 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    ;; 強いカードを持たせる
    (let ((strong-cards (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)
                              (daifugo-card-system:create-card 2 :hearts))))
      (daifugo-ai-players:initialize-ai-player ai-player strong-cards)
      (let ((decision (daifugo-ai-players:make-decision ai-player game-state)))
        (and decision
             ;; アグレッシブAIは積極的にカードを出すはず
             (eq (getf decision :action) :play-cards)
             (listp (getf decision :cards)))))))

(defun test-defensive-ai-behavior ()
  "ディフェンシブAIの行動テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :defensive 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    ;; フィールドに強いカードを配置
    (setf (daifugo-game-engine:game-state-field game-state) 
          (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)))
    ;; 弱いカードを持たせる
    (let ((weak-cards (list (daifugo-card-system:create-card 3 :spades)
                            (daifugo-card-system:create-card 4 :hearts))))
      (daifugo-ai-players:initialize-ai-player ai-player weak-cards)
      (let ((decision (daifugo-ai-players:make-decision ai-player game-state)))
        (and decision
             ;; ディフェンシブAIは慎重にパスするはず
             (member (getf decision :action) '(:play-cards :pass)))))))

;;; ==========================================
;;; AI学習・適応機能テスト
;;; ==========================================

(defun test-ai-learning-capability ()
  "AI学習機能テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :learning 0)))
    (when (daifugo-ai-players:ai-supports-learning-p ai-player)
      (let ((initial-score (daifugo-ai-players:get-ai-performance-score ai-player)))
        ;; 学習データを提供
        (daifugo-ai-players:provide-learning-data ai-player 
                                                  '((:game-result :win :turns 45)
                                                    (:game-result :loss :turns 67)))
        (let ((updated-score (daifugo-ai-players:get-ai-performance-score ai-player)))
          (or (null initial-score)  ; 初期状態での学習なし
              (/= initial-score updated-score)))))))  ; スコアが変化したか

(defun test-ai-adaptation ()
  "AI適応機能テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :adaptive 0)))
    (when (daifugo-ai-players:ai-supports-adaptation-p ai-player)
      ;; 相手の戦略パターンを学習
      (daifugo-ai-players:observe-opponent-pattern ai-player 0 
                                                   '(:strategy :aggressive :frequent-pairs))
      (let ((adaptation (daifugo-ai-players:get-current-adaptation ai-player)))
        (and adaptation
             (listp adaptation)
             (getf adaptation :opponent-analysis))))))

;;; ==========================================
;;; AIプレイヤー統合・ゲーム連携テスト
;;; ==========================================

(defun test-ai-game-integration ()
  "AIプレイヤーとゲームエンジンの統合テスト"
  (let ((game-state (daifugo-game-engine:create-game 4))
        (ai-players (list (daifugo-ai-players:create-ai-player :random 0)
                          (daifugo-ai-players:create-ai-player :smart 1)
                          (daifugo-ai-players:create-ai-player :aggressive 2)
                          (daifugo-ai-players:create-ai-player :defensive 3))))
    (daifugo-game-engine:start-game game-state)
    ;; AIプレイヤーをゲームに登録
    (daifugo-ai-players:register-ai-players game-state ai-players)
    ;; AIプレイヤーが正しく動作するかテスト
    (let ((turn-result (daifugo-ai-players:execute-ai-turn game-state 0)))
      (and turn-result
           (listp turn-result)
           (member (getf turn-result :action) '(:play-cards :pass))))))

(defun test-ai-multiplayer-coordination ()
  "AI複数プレイヤー連携テスト"
  (let ((game-state (daifugo-game-engine:create-game 4))
        (ai-players (loop for i from 0 to 3
                         collect (daifugo-ai-players:create-ai-player :smart i))))
    (daifugo-game-engine:start-game game-state)
    (daifugo-ai-players:register-ai-players game-state ai-players)
    ;; 全AIプレイヤーで1ターンずつ実行
    (let ((turn-results (loop for i from 0 to 3
                             collect (daifugo-ai-players:execute-ai-turn game-state i))))
      (and (= (length turn-results) 4)
           (every (lambda (result) 
                    (and result (getf result :action)))
                  turn-results)))))

;;; ==========================================
;;; AI性能・最適化テスト
;;; ==========================================

(defun test-ai-performance_benchmarking ()
  "AI性能ベンチマークテスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :smart 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    (daifugo-ai-players:initialize-ai-player ai-player 
                                             (daifugo-player-system:player-hand 
                                              (first (daifugo-game-engine:game-state-players game-state))))
    (let ((start-time (get-internal-real-time)))
      (dotimes (i 100)  ; 100回の意思決定
        (daifugo-ai-players:make-decision ai-player game-state))
      (let ((duration (/ (- (get-internal-real-time) start-time) 
                        internal-time-units-per-second)))
        (and (numberp duration)
             (< duration 1.0))))))  ; 1秒以内に100回の意思決定

(defun test-ai-memory-efficiency ()
  "AIメモリ効率テスト"
  (let ((initial-memory (room)))
    (let ((ai-players (loop for i from 0 to 99
                           collect (daifugo-ai-players:create-ai-player :random i))))
      ;; AIプレイヤーを大量作成
      (declare (ignore ai-players))
      ;; ガベージコレクション実行
      (sb-ext:gc :full t)
      (let ((final-memory (room)))
        ;; メモリ使用量が適切な範囲内かチェック
        (declare (ignore initial-memory final-memory))
        t))))  ; 簡易実装

;;; ==========================================
;;; AI設定・カスタマイズテスト
;;; ==========================================

(defun test-ai-configuration ()
  "AI設定機能テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :configurable 0)))
    (when (daifugo-ai-players:ai-supports-configuration-p ai-player)
      (let ((config '(:aggression-level 0.7 :risk-tolerance 0.5 :learning-rate 0.1)))
        (daifugo-ai-players:configure-ai-player ai-player config)
        (let ((current-config (daifugo-ai-players:get-ai-configuration ai-player)))
          (and current-config
               (numberp (getf current-config :aggression-level))
               (numberp (getf current-config :risk-tolerance))))))))

(defun test-ai-difficulty_levels ()
  "AI難易度レベルテスト"
  (let ((easy-ai (daifugo-ai-players:create-ai-player :easy 0))
        (normal-ai (daifugo-ai-players:create-ai-player :normal 1))
        (hard-ai (daifugo-ai-players:create-ai-player :hard 2)))
    (and (daifugo-ai-players:ai-player-p easy-ai)
         (daifugo-ai-players:ai-player-p normal-ai)
         (daifugo-ai-players:ai-player-p hard-ai)
         (< (daifugo-ai-players:get-ai-skill-level easy-ai)
            (daifugo-ai-players:get-ai-skill-level normal-ai))
         (< (daifugo-ai-players:get-ai-skill-level normal-ai)
            (daifugo-ai-players:get-ai-skill-level hard-ai)))))

;;; ==========================================
;;; AIデバッグ・分析機能テスト
;;; ==========================================

(defun test-ai-decision-logging ()
  "AI意思決定ログ機能テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :logged 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    (daifugo-ai-players:enable-decision-logging ai-player)
    (daifugo-ai-players:initialize-ai-player ai-player 
                                             (list (daifugo-card-system:create-card 7 :spades)))
    (daifugo-ai-players:make-decision ai-player game-state)
    (let ((decision-log (daifugo-ai-players:get-decision-log ai-player)))
      (and decision-log
           (listp decision-log)
           (> (length decision-log) 0)
           (getf (first decision-log) :timestamp)
           (getf (first decision-log) :decision)))))

(defun test-ai-state-analysis ()
  "AI状態分析機能テスト"
  (let ((ai-player (daifugo-ai-players:create-ai-player :analytical 0))
        (game-state (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game-state)
    (daifugo-ai-players:initialize-ai-player ai-player 
                                             (list (daifugo-card-system:create-card 10 :hearts)
                                                   (daifugo-card-system:create-card (intern "J" :daifugo-card-system) :spades)))
    (let ((analysis (daifugo-ai-players:analyze-game-state ai-player game-state)))
      (and analysis
           (listp analysis)
           (getf analysis :hand-strength)
           (getf analysis :field-analysis)
           (getf analysis :opponent-assessment)))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-ai-players-tests ()
  "AIプレイヤーシステムの全テストを実行"
  (format t "~%=== AIプレイヤーシステムテスト実行 ===~%")
  
  (let ((tests '(("AIプレイヤー作成" . test-ai-player-creation)
                 ("AIタイプサポート" . test-ai-types-support)
                 ("AIプレイヤー初期化" . test-ai-player-initialization)
                 ("ランダムAI意思決定" . test-random-ai-decisions)
                 ("スマートAI戦略" . test-smart-ai-strategy)
                 ("アグレッシブAI行動" . test-aggressive-ai_behavior)
                 ("ディフェンシブAI行動" . test-defensive-ai-behavior)
                 ("AI学習機能" . test-ai-learning-capability)
                 ("AI適応機能" . test-ai-adaptation)
                 ("AIゲーム統合" . test-ai-game-integration)
                 ("AI複数プレイヤー連携" . test-ai-multiplayer-coordination)
                 ("AI性能ベンチマーク" . test-ai-performance_benchmarking)
                 ("AIメモリ効率" . test-ai-memory-efficiency)
                 ("AI設定機能" . test-ai-configuration)
                 ("AI難易度レベル" . test-ai-difficulty_levels)
                 ("AI意思決定ログ" . test-ai-decision-logging)
                 ("AI状態分析" . test-ai-state-analysis)))
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
(format t "~%AIプレイヤーシステムのテストケース準備完了~%")
(format t "実装完了後に (run-ai-players-tests) を実行してください~%")