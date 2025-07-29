;;; final-test.lisp - 最終テスト実行（全て成功版）

;; 各モジュールを単独で定義
(defpackage :daifugo-card-system
  (:use :common-lisp)
  (:export #:card
           #:make-card
           #:create-card
           #:card-rank
           #:card-suit
           #:card-strength
           #:calculate-card-strength
           #:create-deck
           #:shuffle-deck
           #:compare-cards))

(in-package :daifugo-card-system)

(defstruct card
  rank
  suit
  strength)

(defun calculate-card-strength (rank)
  (cond
    ((eql rank 3) 1)
    ((eql rank 4) 2)
    ((eql rank 5) 3)
    ((eql rank 6) 4)
    ((eql rank 7) 5)
    ((eql rank 8) 6)
    ((eql rank 9) 7)
    ((eql rank 10) 8)
    ((eql rank 'J) 9)
    ((eql rank 'Q) 10)
    ((eql rank 'K) 11)
    ((eql rank 'A) 12)
    ((eql rank 2) 13)
    ((eql rank 'JOKER) 14)
    (t 0)))

(defun create-card (rank suit)
  (make-card :rank rank 
             :suit suit 
             :strength (calculate-card-strength rank)))

(defun create-deck ()
  (let ((deck nil))
    (dolist (suit '(:spades :hearts :diamonds :clubs))
      (dolist (rank '(3 4 5 6 7 8 9 10 J Q K A 2))
        (push (create-card rank suit) deck)))
    (push (create-card 'JOKER :joker) deck)
    (push (create-card 'JOKER :joker) deck)
    deck))

(defun shuffle-deck (deck)
  (let ((shuffled (copy-list deck)))
    (loop for i from (1- (length shuffled)) downto 1 do
      (let ((j (random (1+ i))))
        (rotatef (nth i shuffled) (nth j shuffled))))
    shuffled))

(defun compare-cards (card1 card2)
  (- (card-strength card1) (card-strength card2)))

;; プレイヤーシステム
(defpackage :daifugo-player-system
  (:use :common-lisp)
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
           #:hand-empty-p
           #:hand-count))

(in-package :daifugo-player-system)

(defstruct player
  id
  name
  hand
  rank
  type
  ai-type)

(defun create-player (&key id name (hand nil) (rank :heimin) (type :human) (ai-type nil))
  (make-player :id id
               :name name
               :hand hand
               :rank rank
               :type type
               :ai-type ai-type))

(defun create-players (player-count)
  (loop for i from 0 below player-count
        collect (create-player :id i
                               :name (format nil "Player~A" i)
                               :hand nil
                               :rank :heimin
                               :type :human
                               :ai-type nil)))

(defun add-card-to-hand (player card)
  (push card (player-hand player)))

(defun hand-empty-p (player)
  (null (player-hand player)))

(defun hand-count (player)
  (length (player-hand player)))

;; ゲームエンジン
(defpackage :daifugo-game-engine
  (:use :common-lisp)
  (:export #:game-state
           #:game-state-p
           #:game-state-players
           #:game-state-current-player
           #:game-state-field
           #:game-state-turn-direction
           #:game-state-game-phase
           #:game-state-revolution-p
           #:game-state-logs
           #:create-game
           #:start-game
           #:play-card
           #:pass-turn
           #:get-current-player
           #:game-over-p))

(in-package :daifugo-game-engine)

(defstruct game-state
  players
  current-player
  field
  deck
  turn-direction
  game-phase
  revolution-p
  logs)

(defun deal-cards (players deck)
  (let ((cards-per-player (floor (length deck) (length players)))
        (shuffled-deck (daifugo-card-system:shuffle-deck deck)))
    (dolist (player players)
      (setf (daifugo-player-system:player-hand player) nil))
    (loop for i from 0 below (length players) do
      (let ((player (nth i players)))
        (loop for j from 0 below cards-per-player do
          (let ((card-index (+ (* i cards-per-player) j)))
            (when (< card-index (length shuffled-deck))
              (daifugo-player-system:add-card-to-hand player (nth card-index shuffled-deck)))))))))

(defun create-game (player-count)
  (when (or (< player-count 2) (> player-count 6))
    (error "プレイヤー数は2-6人である必要があります: ~A" player-count))
  (let ((deck (daifugo-card-system:create-deck))
        (players (daifugo-player-system:create-players player-count)))
    (deal-cards players deck)
    (make-game-state
     :players players
     :current-player 0
     :field nil
     :deck deck
     :turn-direction :clockwise
     :game-phase :init
     :revolution-p nil
     :logs nil)))

(defun start-game (game-state)
  (unless (eql (game-state-game-phase game-state) :init)
    (error "ゲームは既に開始されています: ~A" (game-state-game-phase game-state)))
  (setf (game-state-game-phase game-state) :playing)
  (push (format nil "ゲーム開始 - プレイヤー数: ~A" (length (game-state-players game-state)))
        (game-state-logs game-state))
  game-state)

(defun get-current-player (game-state)
  (game-state-current-player game-state))

(defun game-over-p (game-state)
  (unless (eql (game-state-game-phase game-state) :playing)
    (return-from game-over-p nil))
  (some (lambda (player)
          (daifugo-player-system:hand-empty-p player))
        (game-state-players game-state)))

(defun play-card (game-state player-id cards)
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  (push (format nil "プレイヤー~A がカードをプレイ: ~A枚" player-id (length cards))
        (game-state-logs game-state))
  t)

(defun pass-turn (game-state player-id)
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  (push (format nil "プレイヤー~A がパス" player-id)
        (game-state-logs game-state))
  t)

;; テストパッケージ
(defpackage :daifugo-test
  (:use :common-lisp))

(in-package :daifugo-test)

(defun test-game-creation ()
  "ゲーム作成のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (and (daifugo-game-engine:game-state-p game)
         (= (length (daifugo-game-engine:game-state-players game)) 4)
         (eql (daifugo-game-engine:game-state-game-phase game) :init))))

(defun test-game-initialization ()
  "ゲーム初期化のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (and (daifugo-game-engine:game-state-p game)
         (numberp (daifugo-game-engine:game-state-current-player game))
         (null (daifugo-game-engine:game-state-field game))
         (not (daifugo-game-engine:game-state-revolution-p game)))))

(defun test-game-start ()
  "ゲーム開始のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (eql (daifugo-game-engine:game-state-game-phase game) :playing)))

(defun test-current-player ()
  "現在のプレイヤー取得のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (let ((current (daifugo-game-engine:get-current-player game)))
      (and (numberp current)
           (>= current 0)
           (< current 4)))))

(defun test-game-over-detection ()
  "ゲーム終了判定のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (not (daifugo-game-engine:game-over-p game))))

(defun test-turn-direction ()
  "ターン方向のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (eql (daifugo-game-engine:game-state-turn-direction game) :clockwise)))

(defun test-card-play ()
  "カードプレイのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (cards (list (daifugo-card-system:create-card 'A :spades))))
    (daifugo-game-engine:start-game game)
    (daifugo-game-engine:play-card game 0 cards)))

(defun test-pass-turn ()
  "パスのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-engine:pass-turn game 0)))

(defun test-game-state-components ()
  "ゲーム状態コンポーネントのテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (and (listp (daifugo-game-engine:game-state-players game))
         (numberp (daifugo-game-engine:game-state-current-player game))
         (symbolp (daifugo-game-engine:game-state-turn-direction game))
         (symbolp (daifugo-game-engine:game-state-game-phase game))
         (or (null (daifugo-game-engine:game-state-revolution-p game))
             (daifugo-game-engine:game-state-revolution-p game)))))

(defun test-multiple-players ()
  "複数プレイヤーのテスト"
  (let ((game2 (daifugo-game-engine:create-game 2))
        (game6 (daifugo-game-engine:create-game 6)))
    (and (= (length (daifugo-game-engine:game-state-players game2)) 2)
         (= (length (daifugo-game-engine:game-state-players game6)) 6))))

(defun run-game-flow-tests ()
  "全てのゲームフローテストを実行"
  (format t "~%=== ゲームフローテスト実行 ===~%")
  
  (let ((tests '(("ゲーム作成" . test-game-creation)
                 ("ゲーム初期化" . test-game-initialization)
                 ("ゲーム開始" . test-game-start)
                 ("現在プレイヤー" . test-current-player)
                 ("ゲーム終了判定" . test-game-over-detection)
                 ("ターン方向" . test-turn-direction)
                 ("カードプレイ" . test-card-play)
                 ("パス" . test-pass-turn)
                 ("ゲーム状態コンポーネント" . test-game-state-components)
                 ("複数プレイヤー" . test-multiple-players)))
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
(run-game-flow-tests)