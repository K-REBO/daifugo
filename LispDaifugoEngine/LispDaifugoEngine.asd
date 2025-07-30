;;; LispDaifugoEngine.asd - ASDF System Definition

(asdf:defsystem #:LispDaifugoEngine
  :description "A Daifugo game engine written in Common Lisp."
  :author "Your Name <you@example.com>"
  :license "Specify license here"
  :version "0.0.1"
  :serial t
  :depends-on ()
  :components ((:file "src/packages")
               (:file "src/core/card-system")
               (:file "src/core/player-system")
               (:file "src/core/game-state")
               (:file "src/core/game-logic")
               (:file "src/core/rule-engine")
               (:file "src/core/game-engine")
               (:file "src/events/event-system")
               (:file "src/testing/game-logger")
               (:file "src/utils/card-utils")
               (:file "src/utils/player-utils")
               (:file "src/utils/game-utils")
               (:file "src/rules/basic-rules")
               (:file "src/api/javascript-api"))

  :in-order-to ((asdf:test-op (asdf:test-op #:LispDaifugoEngine/test))))

(asdf:defsystem #:LispDaifugoEngine/test
  :description "Test suite for LispDaifugoEngine."
  :author "Your Name <you@example.com>"
  :license "Specify license here"
  :version "0.0.1"
  :serial t
  :depends-on (#:LispDaifugoEngine #:fiveam)
  :components ((:file "test-runners/all-tests-runner")
               (:file "test-runners/core-tests-runner")
               (:file "test-runners/rules-tests-runner")
               (:file "test-runners/local-rules-tests-runner")
               (:file "test-runners/api-tests-runner")
               (:file "test-runners/integration-tests-runner"))
  :perform (asdf:test-op (op c) (uiop:symbol-call :daifugo-test-runners '#:run-all-tests)))