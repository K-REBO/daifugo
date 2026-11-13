;;; test-ai.scm — AI・API・大量シミュレーション

(deftest "どの AI も合法手を返し、ゲームが終わる"
  (lambda ()
    (for-each
     (lambda (kind)
       (let* ([st (new-game (hash 'players 4 'seed 5 'rules (expand-rules '("all"))))]
              [done (run-round st (list kind kind kind kind))])
         (assert-equal (st-ref done 'phase) 'over (symbol->string kind))))
     AI-KINDS)))

(deftest "smart は上がれるなら上がる"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S5" "H5") (ids "S3" "S4")))])
      (assert-equal (sort-ids (ai-action st 'smart)) (list 'play '("H5" "S5")) "ペアで上がる"))))

(deftest "smart は親のとき組を崩さず弱い方から出す"
  (lambda ()
    (let* ([st (fixture '() (list (ids "S4" "H4" "S6" "SK" "HK" "C2" "D9" "DJ") (ids "S3")))]
           [a (ai-action st 'smart)])
      (assert-equal (sort-ids a) (list 'play '("H4" "S4")) "4のペア"))))

(deftest "交換で渡すのは弱いカード"
  (lambda ()
    (let* ([st (new-game (hash 'players 4 'seed 9))]
           [st (next-round (st-set (st-set st 'phase 'over) 'finished '(0 1 2 3)))]
           [a (ai-action st 'smart)]
           [hand (hand-of st 0)])
      (assert-equal (car a) 'give "give")
      (assert-equal (map (lambda (id) (card-rank (id->card id))) (cadr a))
                    (map card-rank (take hand 2)) "最弱の2枚"))))

(deftest "シミュレーション: 不変条件を保って最後まで進む"
  (lambda ()
    (let ([r (api-simulate 6 3 4 123 '("all") '("random" "weak" "strong" "smart"))])
      (assert-true (string? r) "JSON"))
    (let ([r (api-simulate 3 2 2 7 '("basic") '("random" "smart"))])
      (assert-true (string? r) "2人"))
    (let ([r (api-simulate 3 2 7 8 '("official5" "kaidan" "11back") '("smart" "random"))])
      (assert-true (string? r) "7人"))))

(deftest "smart は random より強い"
  (lambda ()
    ;; 2 人対戦を 40 試合。smart の平均順位が random より良いこと
    (let* ([games 40]
           [wins (fold (lambda (w m)
                         (let* ([st (new-game (hash 'players 2 'seed (+ 1000 m) 'rules '(kakumei 8giri)))]
                                [kinds (if (even? m) '(smart random) '(random smart))]
                                [done (run-round st kinds)]
                                [winner (car (ranking done))])
                           (if (eq? (list-ref kinds winner) 'smart) (+ w 1) w)))
                       0 (range 0 games))])
      (assert-true (> wins (* games 0.6)) (string-append "smart wins " (number->string wins) "/40")))))

(deftest "API: 新規ゲームから CPU を進めて人間の番になる"
  (lambda ()
    (let* ([_ (api-new-game 4 42 '("basic") '() '() '("human" "smart" "smart" "smart") 0)]
           [id (- *next-id* 1)])
      (let loop ([k 0])
        (let ([st (game-state id)])
          (when (and (< k 50) (not (= (st-ref st 'turn) 0)))
            (api-ai-step id)
            (loop (+ k 1)))))
      (let ([st (game-state id)])
        (assert-equal (st-ref st 'turn) 0 "人間の番")
        (let* ([moves (play-moves (legal-moves st))]
               [ids (card-ids (play-cards (move-play (car moves))))])
          (api-play id 0 ids)
          (assert-false (has-card? (hand-of (game-state id) 0) (id->card (car ids))) "出したカードが消える")
          (api-undo id)
          (assert-true (has-card? (hand-of (game-state id) 0) (id->card (car ids))) "undoで戻る"))))))

(deftest "JSON 出力"
  (lambda ()
    (assert-equal (->json (hash 'a 1 'b-c "x\"y")) "{\"a\":1,\"b_c\":\"x\\\"y\"}" "オブジェクト")
    (assert-equal (->json (list #t #f 'null 'sym)) "[true,false,null,\"sym\"]" "配列")
    (assert-equal (->json '()) "[]" "空配列")))
