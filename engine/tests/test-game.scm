;;; test-game.scm — ゲームの進行

(deftest "配札: 全カードを均等に配る"
  (lambda ()
    (let ([st (new-game (hash 'players 4 'seed 7))])
      (assert-equal (map length (st-ref st 'hands)) '(14 14 13 13) "54枚を4人に")
      (assert-equal (length (dedupe (flat-map card-ids (st-ref st 'hands)))) 54 "重複なし")
      (assert-true (has-card? (hand-of st (st-ref st 'turn)) (id->card "D3")) "♦3を持つ人から"))
    (let ([st (new-game (hash 'players 5 'seed 7 'options (hash 'jokers 0)))])
      (assert-equal (sum (map length (st-ref st 'hands))) 52 "ジョーカーなし"))
    (assert-error (lambda () (new-game (hash 'players 1))) "1人は不可")
    (assert-error (lambda () (new-game (hash 'players 9))) "9人は不可")
    (assert-error (lambda () (new-game (hash 'players 4 'rules '(nope)))) "不明なルール")))

(deftest "出す・手番が回る"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S3" "S9") (ids "S4" "S8") (ids "S5" "S7")))]
           [st (play-ids st 0 "S3")])
      (assert-equal (hand-of st 0) (list (id->card "S9")) "手札から消える")
      (assert-equal (st-ref st 'turn) 1 "次の人へ")
      (assert-equal (field-top-ids st) '("S3") "場に出る")
      (assert-error (lambda () (play-ids st 2 "S5")) "手番でない人は出せない")
      (assert-error (lambda () (play-ids st 1 "S9")) "持っていないカード")
      (assert-error (lambda () (play-ids st 1 "S4" "S8")) "役にならない組")
      (let ([st (play-ids st 1 "S4")])
        (assert-error (lambda () (play-ids st 2 "S5" "S5")) "同じカードを2回")
        (assert-equal (st-ref st 'turn) 2 "3人目へ")))))

(deftest "弱いカードは出せない"
  (lambda ()
    (let ([st (play-ids (fixture '() (list (ids "S9" "S3") (ids "S4" "SK"))) 0 "S9")])
      (assert-error (lambda () (play-ids st 1 "S4")) "4 は 9 に出せない")
      (assert-equal (field-top-ids (play-ids st 1 "SK")) '("SK") "K は出せる"))))

(deftest "親はパスできない"
  (lambda ()
    (assert-error (lambda () (pass (fixture '() (list (ids "S3") (ids "S4"))) 0)) "親のパス")))

(deftest "全員パスで場が流れ、最後に出した人が親"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S3" "S9") (ids "S4" "S8") (ids "S5" "S7")))]
           [st (play-ids st 0 "S9")]
           [st (pass st 1)]
           [st (pass st 2)])
      (assert-equal (st-ref st 'field) '() "場が流れる")
      (assert-equal (st-ref st 'turn) 0 "最後に出した人が親")
      (assert-equal (st-ref st 'passed) '() "パス記録がリセット"))))

(deftest "パスした人はその場では出せない"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S3" "S9") (ids "S4" "SK") (ids "S5" "S7" "SQ")))]
           [st (play-ids st 0 "S3")]
           [st (pass st 1)]
           [st (play-ids st 2 "S5")])
      (assert-equal (st-ref st 'turn) 0 "パスした1を飛ばして0へ")
      (let* ([st (pass st 0)])
        (assert-equal (st-ref st 'field) '() "残りが全員パス済みなので流れる")
        (assert-equal (st-ref st 'turn) 2 "2が親")))))

(deftest "上がりと順位"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S9") (ids "S4" "S8") (ids "S5" "S7")))]
           [st (play-ids st 0 "S9")])
      (assert-equal (st-ref st 'finished) '(0) "0が1位")
      (assert-equal (st-ref st 'turn) 1 "次の人へ")
      (let* ([st (pass st 1)]
             [st (pass st 2)])
        ;; 0 は上がったので、場が流れたら次の人（1）が親
        (assert-equal (st-ref st 'turn) 1 "上がった人の次が親")
        (let* ([st (play-ids st 1 "S8")]
               [st (pass st 2)]
               [st (play-ids st 1 "S4")])
          (assert-equal (st-ref st 'phase) 'over "2人上がると終了")
          (assert-equal (ranking st) '(0 1 2) "順位")
          (assert-equal (st-ref st 'scores) '(2 1 0) "得点"))))))

(deftest "最後の1枚で上がった直後、全員パス済みなら次の人が親"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S3" "SK") (ids "S4" "S5") (ids "S6" "S7")))]
           [st (play-ids st 0 "S3")]
           [st (pass st 1)]
           [st (pass st 2)]          ; 流れて 0 が親
           [st (play-ids st 0 "SK")]) ; 0 上がり
      (assert-equal (st-ref st 'finished) '(0) "0上がり")
      (assert-equal (top-play st) (cls1 "SK") "場には K が残る")
      (assert-equal (st-ref st 'turn) 1 "次は1"))))

(deftest "階級名"
  (lambda ()
    (assert-equal (map (lambda (p) (rank-title-id p 4)) (range 0 4)) '(daifugo fugo hinmin daihinmin) "4人")
    (assert-equal (map (lambda (p) (rank-title-id p 5)) (range 0 5)) '(daifugo fugo heimin hinmin daihinmin) "5人")
    (assert-equal (map (lambda (p) (rank-title-id p 3)) (range 0 3)) '(daifugo heimin daihinmin) "3人")
    (assert-equal (map (lambda (p) (rank-title-id p 2)) (range 0 2)) '(daifugo daihinmin) "2人")))

(deftest "2ゲーム目: カード交換"
  (lambda ()
    (let* ([st (new-game (hash 'players 4 'seed 3))]
           [st (st-set (st-set st 'phase 'over) 'finished '(2 0 3 1))]
           [before (st-ref st 'hands)]
           [st2 (next-round st)])
      (assert-equal (st-ref st2 'round) 2 "2ゲーム目")
      (assert-equal (st-ref st2 'prev-ranking) '(2 0 3 1) "前回順位")
      (assert-equal (st-ref st2 'phase) 'exchange "交換フェーズ")
      (assert-equal (st-ref st2 'turn) 2 "大富豪が選ぶ")
      ;; 大貧民(1)は最強の2枚を渡し済み、大富豪(2)は16枚
      (assert-equal (length (hand-of st2 2)) (+ 2 (length (hand-of (start-round (st-set (st-set st 'round 2) 'prev-ranking #f)) 2))) "大富豪 +2")
      (assert-error (lambda () (apply-give st2 2 (list (card-id (car (hand-of st2 2)))))) "2枚必要")
      (let* ([give (card-ids (take (hand-of st2 2) 2))]
             [st3 (apply-give st2 2 give)])
        (assert-equal (st-ref st3 'turn) 0 "次は富豪")
        (let* ([st4 (apply-give st3 0 (card-ids (take (hand-of st3 0) 1)))])
          (assert-equal (st-ref st4 'phase) 'play "交換完了で開始")
          (assert-equal (st-ref st4 'turn) 1 "大貧民から")
          (assert-equal (sum (map length (st-ref st4 'hands))) 54 "カードは保存される"))))))

(deftest "大貧民は最強カードを献上する"
  (lambda ()
    (let* ([st (new-game (hash 'players 4 'seed 11))]
           [st (st-set (st-set st 'phase 'over) 'finished '(0 1 2 3))]
           [st2 (next-round st)]
           [d (start-round (st-set (st-set (st-set st 'round 2) 'prev-ranking #f) 'log '()))]
           [top2 (strongest-cards (hand-of d 3) 2)])
      (assert-true (all? (lambda (c) (has-card? (hand-of st2 0) c)) top2) "大富豪が受け取る")
      (assert-false (any? (lambda (c) (has-card? (hand-of st2 3) c)) top2) "大貧民から消える"))))

(deftest "合法手の列挙"
  (lambda ()
    (let* ([st (fixture '(kaidan) (list (ids "S5" "S6" "S7" "H5" "JK1") (ids "S3")))]
           [moves (legal-moves st)])
      (assert-false (any? (lambda (m) (eq? (car m) 'pass)) moves) "親はパスなし")
      (assert-true (any? (lambda (m) (and (eq? (car m) 'play) (eq? (play-type (cadr m)) 'kaidan) (= (play-n (cadr m)) 4))) moves) "4枚階段 5-6-7-JK")
      (assert-true (any? (lambda (m) (and (eq? (car m) 'play) (eq? (play-type (cadr m)) 'set) (= (play-n (cadr m)) 3))) moves) "5の3枚（JK込み）")
      (let ([st (play-ids st 0 "S5")])
        (let ([moves (legal-moves st)])
          (assert-equal (car (car moves)) 'pass "パスがある")
          (assert-equal (length moves) 1 "3では返せない"))))))
