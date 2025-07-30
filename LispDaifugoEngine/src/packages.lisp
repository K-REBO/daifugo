;;; packages.lisp - LispDaifugoEngineの全パッケージ定義

(in-package :cl-user)

;;; ---------------------------------------------------------------------------
;;; コアシステム (Core Systems)
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-card-system
  (:use :common-lisp)
  (:export #:card
           #:make-card
           #:create-card
           #:card-rank
           #:card-suit
           #:card-strength
           #:card-p
           #:calculate-card-strength
           #:*card-strength-map*
           #:create-deck
           #:shuffle-deck
           #:deal-cards
           #:compare-cards
           #:valid-rank-p
           #:valid-suit-p))

(defpackage :daifugo-player-system
  (:use :common-lisp :daifugo-card-system)
  (:export #:player
           #:make-player
           #:create-player
           #:player-p
           #:player-id
           #:player-name
           #:player-hand
           #:player-rank
           #:player-type
           #:player-ai-type
           #:create-players
           #:add-card-to-hand
           #:add-cards-to-hand
           #:remove-card-from-hand
           #:remove-cards-from-hand
           #:hand-empty-p
           #:hand-count
           #:get-player-by-id
           #:player-to-string))

(defpackage :daifugo-game-state
  (:use :common-lisp)
  (:export #:game-state
           #:make-game-state
           #:game-state-p
           #:game-state-players
           #:game-state-current-player
           #:game-state-field
           #:game-state-game-phase
           #:game-state-direction
           #:game-state-rules
           #:game-state-logs
           #:game-state-round-number
           #:game-state-turn-count
           #:game-state-revolution-p
           #:game-state-turn-direction
           #:create-initial-game-state
           #:update-game-state
           #:get-current-player
           #:advance-turn
           #:is-game-over-p
           #:set-game-phase
           #:add-game-log))

(defpackage :daifugo-game-logic
  (:use :common-lisp :daifugo-card-system :daifugo-game-state)
  (:export #:is-valid-hand #:get-hand-type #:is-stronger-hand #:hands-compatible-p 
           #:process-card-play #:play-card #:process-pass #:can-play-cards-p
           #:player-has-cards-p #:remove-cards-from-player #:set-field-cards
           #:advance-turn))

(defpackage :daifugo-rule-engine
  (:use :common-lisp)
  (:export #:rule
           #:make-rule
           #:rule-name
           #:rule-trigger
           #:rule-effect
           #:rule-description
           #:register-rule
           #:unregister-rule
           #:get-active-rules
           #:apply-rules
           #:validate-play
           #:get-rule
           #:define-rule))

(defpackage :daifugo-game-engine
  (:use :common-lisp :daifugo-game-state :daifugo-game-logic :daifugo-rule-engine)
  (:export #:create-game
           #:start-game
           #:play-card
           #:pass-turn
           #:get-current-player
           #:game-over-p
           #:get-game-status
           #:game-state-p
           #:game-state-revolution-p
           #:game-state-players
           #:game-state-field
           #:game-state-current-player
           #:game-state-game-phase
           #:game-state-turn-direction
           #:add-log))

;;; ---------------------------------------------------------------------------
;;; サブシステム (Subsystems)
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-auto-tester
  (:use :common-lisp)
  (:export ;; === 基本自動テスタ機能 ===
           #:create-auto-tester
           #:auto-tester-p
           #:tester-name
           
           ;; === ゲーム実行・シミュレーション ===
           #:run-single-game
           #:run-bulk-tests
           #:run-ai-game
           #:run-configured-test
           #:run-parallel-tests
           
           ;; === AI プレイヤー機能 ===
           #:compare-ai-types
           #:set-ai-configuration
           
           ;; === 統計・分析機能 ===
           #:get-test-statistics
           #:get-turn-distribution
           #:analyze-winner-patterns
           
           ;; === パフォーマンス・負荷テスト ===
           #:run-performance-benchmark
           #:run-stress-test
           
           ;; === 回帰・ルール検証 ===
           #:validate-game-rules
           #:establish-baseline
           #:detect-regressions
           
           ;; === レポート・出力機能 ===
           #:generate-test-report
           #:export-results-csv
           
           ;; === 設定・カスタマイズ ===
           #:set-test-configuration
           #:set-test-seed
           #:set-test-timeout))

(defpackage :daifugo-event-system
  (:use :common-lisp)
  (:export #:create-event-system
           #:event-system-p
           #:is-event-system-active-p
           #:get-event-system-version
           #:register-event-listener
           #:unregister-event-listener
           #:is-listener-registered-p
           #:get-listener-count
           #:register-filtered-listener
           #:register-prioritized-listener
           #:register-async-listener
           #:register-batch-listener
           #:emit-event
           #:emit-external-event
           #:emit-to-channel
           #:broadcast-event
           #:stop-event-propagation
           #:generate-listener-id
           #:execute-listeners
           #:get-listeners-for-event
           #:subscribe-to-broadcasts
           #:unsubscribe-from-broadcasts
           #:enable-event-history
           #:disable-event-history
           #:get-event-history
           #:find-events-by-type
           #:find-events-by-player
           #:filter-events-by-player
           #:get-recent-events
           #:replay-events
           #:enable-async-processing
           #:disable-async-processing
           #:wait-for-async-completion
           #:pause-event-processing
           #:resume-event-processing
           #:get-event-queue-size
           #:flush-batch-events
           #:create-event-channel
           #:subscribe-to-channel
           #:unsubscribe-from-channel
           #:subscribe-to-broadcast
           #:setup-external-integration
           #:enable-event-statistics
           #:get-event-statistics
           #:get-event-count
           #:get-total-events
           #:enable-performance-monitoring
           #:get-performance-metrics
           #:get-average-processing-time
           #:get-total-processed-events
           #:analyze-event-patterns
           #:get-player-activity-level
           #:get-game-duration-estimate
           #:get-event-frequency
           #:set-error-handler
           #:get-system-health
           #:is-system-healthy-p
           #:get-memory-usage))

(defpackage :daifugo-game-logger
  (:use :common-lisp :daifugo-event-system)
  (:export #:log-event #:get-game-log))

(defpackage :daifugo-utils
  (:use :common-lisp)
  (:export #:card-utils #:game-utils #:player-utils))

(defpackage :daifugo-player-utils  
  (:use :common-lisp :daifugo-player-system)
  (:export #:find-player-by-id #:get-player-rank #:update-player-hand))

(defpackage :daifugo-card-utils
  (:use :common-lisp)
  (:export #:card-strength-utils #:compare-card-strength #:sort-hand))

(defpackage :daifugo-game-utils
  (:use :common-lisp :daifugo-game-state)
  (:export #:get-current-player #:advance-turn #:check-game-end))

;;; ---------------------------------------------------------------------------
;;; ルール (Rules)
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-basic-rules
  (:use :common-lisp :daifugo-rule-engine))

(defpackage :daifugo-8kiri
  (:use :common-lisp :daifugo-rule-engine))

(defpackage :daifugo-kakumei
  (:use :common-lisp :daifugo-rule-engine))

(defpackage :daifugo-rules
  (:use :common-lisp :daifugo-rule-engine))

(defpackage :daifugo-11back
  (:use :common-lisp :daifugo-rule-engine))

(defpackage :daifugo-ai-players
  (:use :common-lisp :daifugo-player-system))

;;; ---------------------------------------------------------------------------
;;; API
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-javascript-api
  (:use :common-lisp :daifugo-game-engine))
