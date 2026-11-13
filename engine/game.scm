;;; game.scm — ゲームの状態と進行
;;;
;;; 状態は不変のハッシュ。操作はすべて「状態 -> 新しい状態」の関数で、
;;; 不正な操作は (error ...) を投げる。
;;;
;;; 主なキー:
;;;   'n 'names 'hands          人数・名前・手札（プレイヤー番号順のリスト）
;;;   'phase                    'exchange | 'play | 'over
;;;   'turn                     手番のプレイヤー
;;;   'field                    この場で出された役 ((player . play) ...) 新しい順
;;;   'last-player              場で最後に出したプレイヤー
;;;   'passed                   この場でパスしたプレイヤー（場が流れるまで出せない）
;;;   'finished 'fallen         上がった順 / 都落ちしたプレイヤー
;;;   'revolution 'back11 'lock 革命・11 バック・縛り（スートのリスト）
;;;   'round 'prev-ranking 'scores
;;;   'exchange-queue           カード交換で選ぶ必要がある (giver receiver count)
;;;   'rules 'options 'seed 'moves 'log

;; ---------------------------------------------------------------------------
;; 基本アクセサ
;; ---------------------------------------------------------------------------

(define (st-ref st k) (hash-ref st k))
(define (st-set st k v) (hash-insert st k v))

(define (hand-of st i) (list-ref (st-ref st 'hands) i))
(define (set-hand st i h) (st-set st 'hands (list-replace (st-ref st 'hands) i h)))
(define (player-name st i) (list-ref (st-ref st 'names) i))

(define (out? st i)
  (or (contains? (st-ref st 'finished) i) (contains? (st-ref st 'fallen) i)))
(define (active? st i) (not (out? st i)))
(define (active-players st) (filter (lambda (i) (active? st i)) (range 0 (st-ref st 'n))))
(define (eligible? st i) (and (active? st i) (not (contains? (st-ref st 'passed) i))))

;; i の次から順に見て pred を満たす最初のプレイヤー（i 自身は見ない）
(define (next-where st i pred)
  (let ([n (st-ref st 'n)])
    (let loop ([k 1])
      (if (>= k n)
          #f
          (let ([j (modulo (+ i k) n)])
            (if (pred j) j (loop (+ k 1))))))))

(define (next-active st i) (next-where st i (lambda (j) (active? st j))))

(define (top-entry st) (let ([f (st-ref st 'field)]) (if (null? f) #f (car f))))
(define (top-play st) (let ([e (top-entry st)]) (if e (cdr e) #f)))

(define (reversed? st) (xor (st-ref st 'revolution) (st-ref st 'back11)))

;; ---------------------------------------------------------------------------
;; ログ（UI 表示とリプレイ用）
;; ---------------------------------------------------------------------------

(define (add-event st type player text [cards '()])
  (st-set st 'log
          (cons (hash 'type type
                      'seq (length (st-ref st 'log))
                      'player (if player player -1)
                      'text text
                      'cards (card-ids cards)
                      'move (st-ref st 'moves))
                (st-ref st 'log))))

;; ---------------------------------------------------------------------------
;; 階級
;; ---------------------------------------------------------------------------

;; pos は 0 始まりの順位
(define (rank-title-id pos n)
  (cond [(= pos 0) 'daifugo]
        [(= pos (- n 1)) 'daihinmin]
        [(and (>= n 4) (= pos 1)) 'fugo]
        [(and (>= n 4) (= pos (- n 2))) 'hinmin]
        [else 'heimin]))

(define (rank-title pos n)
  (case (rank-title-id pos n)
    [(daifugo) "大富豪"] [(fugo) "富豪"] [(heimin) "平民"] [(hinmin) "貧民"] [(daihinmin) "大貧民"]))

;; 最終順位: 上がった順 → 残った人 → 都落ち
(define (ranking st)
  (append (st-ref st 'finished)
          (filter (lambda (i) (active? st i)) (range 0 (st-ref st 'n)))
          (reverse (st-ref st 'fallen))))

;; ---------------------------------------------------------------------------
;; ゲーム開始
;; ---------------------------------------------------------------------------

(define (default-names n)
  (map (lambda (i) (if (= i 0) "あなた" (string-append "CPU" (number->string i)))) (range 0 n)))

(define (deal n jokers seed)
  (let* ([r (shuffle (make-deck jokers) seed)]
         [deck (car r)]
         [hands (let loop ([cs deck] [i 0] [acc (map (lambda (_) '()) (range 0 n))])
                  (if (null? cs)
                      acc
                      (loop (cdr cs) (modulo (+ i 1) n)
                            (list-replace acc i (cons (car cs) (list-ref acc i))))))])
    (cons (map sort-cards hands) (cdr r))))

;; config: 'players 'seed 'rules 'options 'names （いずれも省略可）
(define (new-game config)
  (let* ([n (hash-get config 'players 4)]
         [_ (when (or (< n 2) (> n 8)) (error "players must be 2..8:" n))]
         [rules (hash-get config 'rules '())]
         [_ (for-each (lambda (r) (unless (rule-known? r) (error "unknown rule:" r))) rules)]
         [options (merge-rule-options rules (hash-get config 'options (hash)))]
         [names (hash-get config 'names (default-names n))]
         [seed (hash-get config 'seed 1)])
    (start-round (hash 'n n
                       'names names
                       'rules rules
                       'options options
                       'seed seed
                       'round 1
                       'prev-ranking #f
                       'scores (map (lambda (_) 0) (range 0 n))
                       'log '()))))

;; 新しいラウンドを配る（round と prev-ranking は設定済みの前提）
(define (start-round base)
  (let* ([n (st-ref base 'n)]
         [d (deal n (hash-get (st-ref base 'options) 'jokers 2) (st-ref base 'seed))]
         [st (fold (lambda (s kv) (st-set s (car kv) (cdr kv)))
                   base
                   (list (cons 'hands (car d))
                         (cons 'seed (cdr d))
                         (cons 'phase 'play)
                         (cons 'turn 0)
                         (cons 'field '())
                         (cons 'last-player #f)
                         (cons 'passed '())
                         (cons 'finished '())
                         (cons 'fallen '())
                         (cons 'revolution #f)
                         (cons 'back11 #f)
                         (cons 'lock #f)
                         (cons 'flush #f)
                         (cons 'exchange-queue '())
                         (cons 'moves 0)))]
         [st (add-event st 'deal #f (string-append "第" (number->string (st-ref st 'round)) "ゲーム開始"))])
    (if (st-ref st 'prev-ranking)
        (begin-exchange st)
        (let ([leader (index-where (lambda (h) (has-card? h (id->card "D3"))) (st-ref st 'hands))])
          (st-set st 'turn (if leader leader 0))))))

;; 次のラウンド
(define (next-round st)
  (unless (eq? (st-ref st 'phase) 'over) (error "round is not over"))
  (start-round (fold (lambda (s kv) (st-set s (car kv) (cdr kv)))
                     st
                     (list (cons 'round (+ (st-ref st 'round) 1))
                           (cons 'prev-ranking (ranking st))
                           (cons 'log '())))))

;; ---------------------------------------------------------------------------
;; カード交換（2 ゲーム目以降）
;; ---------------------------------------------------------------------------

(define (strongest-cards hand k)
  (let ([sorted (sort-cards hand)])
    (list-tail sorted (- (length sorted) k))))

(define (transfer st from to cards)
  (let* ([st (set-hand st from (remove-cards (hand-of st from) cards))]
         [st (set-hand st to (sort-cards (append (hand-of st to) cards)))])
    st))

;; (上位 . 下位 . 枚数) の組
(define (exchange-pairs prev n)
  (let ([pairs (list (list (car prev) (last prev) 2))])
    (if (>= n 4)
        (append pairs (list (list (list-ref prev 1) (list-ref prev (- n 2)) 1)))
        pairs)))

(define (begin-exchange st)
  (let* ([n (st-ref st 'n)]
         [pairs (exchange-pairs (st-ref st 'prev-ranking) n)]
         ;; 下位の人は自動で最強カードを献上
         [st (fold (lambda (s p)
                     (let* ([hi (car p)] [lo (cadr p)] [k (caddr p)]
                            [cards (strongest-cards (hand-of s lo) k)])
                       (add-event (transfer s lo hi cards) 'exchange lo
                                  (string-append (player-name s lo) " → " (player-name s hi)
                                                 ": " (number->string k) "枚献上")
                                  cards)))
                   st pairs)]
         [st (st-set st 'phase 'exchange)]
         [st (st-set st 'exchange-queue pairs)])
    (st-set st 'turn (car (car pairs)))))

(define (apply-give st player ids)
  (unless (eq? (st-ref st 'phase) 'exchange) (error "not in exchange phase"))
  (let* ([q (st-ref st 'exchange-queue)]
         [p (car q)] [hi (car p)] [lo (cadr p)] [k (caddr p)]
         [cards (map id->card ids)])
    (unless (= player hi) (error "not your turn to give:" player))
    (unless (= (length (dedupe ids)) k) (error "must give exactly" k "cards"))
    (unless (all? (lambda (c) (has-card? (hand-of st hi) c)) cards) (error "card not in hand"))
    (let* ([st (transfer st hi lo cards)]
           [st (add-event st 'exchange hi
                          (string-append (player-name st hi) " → " (player-name st lo)
                                         ": " (number->string k) "枚渡した")
                          cards)]
           [rest (cdr q)]
           [st (st-set st 'exchange-queue rest)])
      (if (null? rest)
          (let ([st (st-set st 'phase 'play)])
            (st-set st 'turn (last (st-ref st 'prev-ranking))))   ; 大貧民から
          (st-set st 'turn (car (car rest)))))))

;; ---------------------------------------------------------------------------
;; 出す / パス
;; ---------------------------------------------------------------------------

(define (request-flush st) (st-set st 'flush #t))

;; 場の役に対して p が出せるか
(define (play-allowed? st p)
  (let ([prev (top-play st)])
    (if (not prev)
        (all? (lambda (v) (not (eq? v 'deny)))
              (map (lambda (hook) (hook st p #f)) (active-hooks st 'can-follow)))
        (case (follow-verdict st p prev)
          [(deny) #f]
          [(allow) (and (eq? (play-type p) (play-type prev)) (= (play-n p) (play-n prev)))]
          [else (play-beats? p prev (reversed? st))]))))

;; 有効な解釈のうち 1 つを選ぶ: 枚数出し優先、階段は強い方
(define (choose-play st plays)
  (let ([sets (filter (lambda (p) (not (eq? (play-type p) 'kaidan))) plays)])
    (if (not (null? sets))
        (car sets)
        (if (reversed? st)
            (min-by play-rank plays)
            (max-by play-rank plays)))))

(define (interpret st cards)
  (let ([allowed (filter (lambda (p) (play-allowed? st p))
                         (classify-plays cards (enabled-hand-type? st 'kaidan)))])
    (if (null? allowed) #f (choose-play st allowed))))

(define (check-turn st player)
  (unless (eq? (st-ref st 'phase) 'play) (error "not in play phase"))
  (unless (= player (st-ref st 'turn)) (error "not your turn:" player)))

(define (apply-play st player ids)
  (check-turn st player)
  (when (null? ids) (error "no cards"))
  (unless (= (length (dedupe ids)) (length ids)) (error "duplicate cards"))
  (let* ([cards (map id->card ids)]
         [_ (unless (all? (lambda (c) (has-card? (hand-of st player) c)) cards)
              (error "card not in hand"))]
         [p (interpret st cards)]
         [_ (unless p (error "illegal play:" ids))]
         [prev (top-play st)]
         [st (set-hand st player (remove-cards (hand-of st player) cards))]
         [st (st-set st 'field (cons (cons player p) (st-ref st 'field)))]
         [st (st-set st 'last-player player)]
         [st (st-set st 'moves (+ (st-ref st 'moves) 1))]
         [st (add-event st 'play player (string-append (player-name st player) ": " (play-label p)) cards)]
         [st (run-state-hooks st 'on-play player p prev)]
         [st (if (null? (hand-of st player)) (player-out st player) st)])
    (cond
      [(<= (length (active-players st)) 1) (finish-round st)]
      [(st-ref st 'flush) (end-trick (st-set st 'flush #f))]
      [else (advance st player)])))

(define (apply-pass st player)
  (check-turn st player)
  (when (null? (st-ref st 'field)) (error "cannot pass on lead"))
  (let* ([st (st-set st 'passed (cons player (st-ref st 'passed)))]
         [st (st-set st 'moves (+ (st-ref st 'moves) 1))]
         [st (add-event st 'pass player (string-append (player-name st player) ": パス"))])
    (advance st player)))

;; actor の後、まだ出せる人に手番を回す。いなければ場が流れる
(define (advance st actor)
  (let ([nxt (next-where st actor (lambda (j) (eligible? st j)))])
    (if (or (not nxt) (equal? nxt (st-ref st 'last-player)))
        (end-trick st)
        (st-set st 'turn nxt))))

;; 場を流し、最後に出した人（上がっていれば次の人）が親になる
(define (end-trick st)
  (let* ([lp (st-ref st 'last-player)]
         [leader (if (active? st lp) lp (next-active st lp))]
         [st (st-set st 'field '())]
         [st (st-set st 'passed '())]
         [st (st-set st 'last-player #f)]
         [st (add-event st 'clear #f "場が流れた")]
         [st (run-state-hooks st 'on-clear)])
    (st-set st 'turn leader)))

(define (player-out st player)
  (let* ([st (st-set st 'finished (append (st-ref st 'finished) (list player)))]
         [pos (- (length (st-ref st 'finished)) 1)]
         [st (add-event st 'out player
                        (string-append (player-name st player) " 上がり（"
                                       (number->string (+ pos 1)) "位）"))])
    (run-state-hooks st 'on-player-out player)))

(define (finish-round st)
  (let* ([order (ranking st)]
         [n (st-ref st 'n)]
         [st (st-set st 'phase 'over)]
         [st (st-set st 'scores
                     (map (lambda (i) (+ (list-ref (st-ref st 'scores) i)
                                         (- n 1 (index-where (lambda (x) (= x i)) order))))
                          (range 0 n)))])
    (add-event st 'over #f
               (string-join (map (lambda (pos)
                                   (string-append (rank-title pos n) ":" (player-name st (list-ref order pos))))
                                 (range 0 n))
                            " / "))))

;; 都落ちなどで「上がり以外で抜ける」プレイヤー
(define (player-fall st player text)
  (let* ([st (st-set st 'fallen (cons player (st-ref st 'fallen)))]
         [st (st-set st 'passed (remove-one player (st-ref st 'passed)))])
    (add-event st 'fall player text)))

;; ---------------------------------------------------------------------------
;; 合法手の列挙（AI と UI のヒント用）
;; ---------------------------------------------------------------------------

;; 手札から作れる役の候補（カードの組）。ジョーカーは id 順に使う
(define (candidate-card-sets hand kaidan?)
  (let* ([jokers (filter joker? hand)]
         [normals (remove-if joker? hand)]
         [ranks (dedupe (map card-rank normals))]
         [singles (map list hand)]
         [sets (flat-map
                (lambda (r)
                  (let ([same (filter (lambda (c) (= (card-rank c) r)) normals)])
                    (flat-map (lambda (k)
                                (flat-map (lambda (j)
                                            (if (and (>= (+ k j) 2) (>= k 1))
                                                (map (lambda (combo) (append combo (take jokers j)))
                                                     (combinations same k))
                                                '()))
                                          (range 0 (+ (length jokers) 1))))
                              (range 1 (+ (length same) 1)))))
                ranks)]
         [joker-sets (if (>= (length jokers) 2) (list jokers) '())]
         [kaidans (if kaidan? (kaidan-candidates normals jokers) '())])
    (append singles sets joker-sets kaidans)))

(define (kaidan-candidates normals jokers)
  (flat-map
   (lambda (suit)
     (let ([by-rank (fold (lambda (h c) (if (eq? (card-suit c) suit) (hash-insert h (card-rank c) c) h))
                          (hash) normals)])
       (flat-map
        (lambda (start)
          (let loop ([len 1] [cards '()] [need 0] [acc '()])
            (let ([r (+ start (- len 1))])
              (if (or (> r MAX-RANK) (> need (length jokers)))
                  acc
                  (let* ([c (hash-try-get by-rank r)]
                         [cards2 (if c (append cards (list c)) cards)]
                         [need2 (if c need (+ need 1))])
                    (if (> need2 (length jokers))
                        acc
                        (loop (+ len 1) cards2 need2
                              (if (and (>= len 3) (not (null? cards2)))
                                  (cons (append cards2 (take jokers need2)) acc)
                                  acc))))))))
        (range MIN-RANK (+ MAX-RANK 1)))))
   SUITS))

;; 手番プレイヤーの合法手: (list 'pass) または (list 'play play) のリスト
(define (legal-moves st)
  (let* ([player (st-ref st 'turn)]
         [hand (hand-of st player)]
         [kaidan? (enabled-hand-type? st 'kaidan)]
         [cands (dedupe (map (lambda (cs) (sort (card-ids cs) string<?))
                             (candidate-card-sets hand kaidan?)))]
         [plays (fold (lambda (acc ids)
                        (let ([p (interpret st (map id->card ids))])
                          (if p (cons (list 'play p) acc) acc)))
                      '() cands)]
         [plays (reverse plays)])
    (if (null? (st-ref st 'field)) plays (cons (list 'pass) plays))))
