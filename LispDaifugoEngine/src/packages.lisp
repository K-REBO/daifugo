;;; packages.lisp - LispDaifugoEngineの全パッケージ定義

(in-package :cl-user)

;;; ---------------------------------------------------------------------------
;;; コアシステム (Core Systems)
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-card-system
  (:use :common-lisp)
  (:export #:make-card #:card-rank #:card-suit #:create-deck #:card-p))

(defpackage :daifugo-player-system
  (:use :common-lisp :daifugo-card-system)
  (:export #:player #:player-name #:player-hand #:create-player))

(defpackage :daifugo-game-state
  (:use :common-lisp :daifugo-player-system)
  (:export #:game-state #:game-players #:current-player-index #:game-deck #:game-active-p))

(defpackage :daifugo-game-logic
  (:use :common-lisp :daifugo-card-system :daifugo-game-state)
  (:export #:is-valid-hand #:get-hand-type #:is-stronger-hand #:hands-compatible-p 
           #:process-card-play #:play-card))

(defpackage :daifugo-rule-engine
  (:use :common-lisp)
  (:export #:define-rule #:apply-rules #:get-rule))

(defpackage :daifugo-game-engine
  (:use :common-lisp :daifugo-game-state :daifugo-game-logic :daifugo-rule-engine)
  (:export #:create-game
           #:start-game
           #:play-turn
           #:get-game-status
           #:game-state-revolution-p
           #:game-state-players
           #:game-state-field
           #:game-state-current-player
           #:add-log))

;;; ---------------------------------------------------------------------------
;;; サブシステム (Subsystems)
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-event-system
  (:use :common-lisp)
  (:export #:subscribe-event #:publish-event))

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

;;; ---------------------------------------------------------------------------
;;; API
;;; ---------------------------------------------------------------------------

(defpackage :daifugo-javascript-api
  (:use :common-lisp :daifugo-game-engine))
