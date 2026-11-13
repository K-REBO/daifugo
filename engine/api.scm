;;; api.scm — ホスト（Rust: CLI / wasm）から呼ぶ関数
;;;
;;; 引数は整数・文字列・リストだけ。戻り値はすべて JSON 文字列。
;;; ゲームは *games* に id で保管し、状態の履歴を持つ（undo できる）。

;; ---------------------------------------------------------------------------
;; JSON
;; ---------------------------------------------------------------------------

(define (json-escape s)
  (let loop ([cs (string->list s)] [acc '()])
    (if (null? cs)
        (list->string (reverse acc))
        (let ([c (car cs)])
          (loop (cdr cs)
                (cond [(equal? c #\") (append (list #\" #\\) acc)]
                      [(equal? c #\\) (append (list #\\ #\\) acc)]
                      [(equal? c #\newline) (append (list #\n #\\) acc)]
                      [(< (char->integer c) 32) acc]
                      [else (cons c acc)]))))))

(define (json-key k)
  (let ([s (if (symbol? k) (symbol->string k) (to-string k))])
    (list->string (map (lambda (c) (if (equal? c #\-) #\_ c)) (string->list s)))))

(define (->json v)
  (cond
    [(eq? v #t) "true"]
    [(eq? v #f) "false"]
    [(eq? v 'null) "null"]
    [(string? v) (string-append "\"" (json-escape v) "\"")]
    [(symbol? v) (string-append "\"" (json-escape (symbol->string v)) "\"")]
    [(integer? v) (number->string v)]
    [(number? v) (number->string (exact->inexact v))]
    [(card? v) (->json (card-id v))]
    [(play? v) (->json (play->hash v))]
    [(hash? v)
     (let ([keys (sort (map json-key (hash-keys->list v)) string<?)]
           [lookup (fold (lambda (acc k) (hash-insert acc (json-key k) (hash-ref v k)))
                         (hash) (hash-keys->list v))])
       (string-append "{"
                      (string-join (map (lambda (k) (string-append "\"" k "\":" (->json (hash-ref lookup k))))
                                        keys)
                                   ",")
                      "}"))]
    [(vector? v) (->json (vector->list v))]
    [(list? v) (string-append "[" (string-join (map ->json v) ",") "]")]
    [else (->json (to-string v))]))

(define (play->hash p)
  (hash 'type (play-type p) 'n (play-n p) 'rank (play-rank p)
        'label (play-label p) 'cards (card-ids (play-cards p))))

;; ---------------------------------------------------------------------------
;; ゲームの保管
;; ---------------------------------------------------------------------------

(define *games* (hash))
(define *next-id* 1)

(define (game-record id)
  (let ([g (hash-try-get *games* id)])
    (if g g (error "unknown game id:" id))))

(define (game-state id) (hash-ref (game-record id) 'state))

(define (store-game! id rec) (set! *games* (hash-insert *games* id rec)))

(define (push-state! id st)
  (let ([rec (game-record id)])
    (store-game! id (hash-insert (hash-insert rec 'history (cons (hash-ref rec 'state) (hash-ref rec 'history)))
                                 'state st))))

;; ルール名・ルールセット名（文字列）を展開
(define (expand-rules names)
  (dedupe
   (flat-map (lambda (s)
               (let ([sym (if (symbol? s) s (string->symbol s))])
                 (cond [(hash-contains? *rule-sets* sym) (hash-ref (hash-ref *rule-sets* sym) 'rules)]
                       [(rule-known? sym) (list sym)]
                       [else (error "unknown rule or rule set:" s)])))
             names)))

;; (("key" value) ...) -> hash
(define (options-from-list lst)
  (fold (lambda (h kv) (hash-insert h (string->symbol (car kv)) (cadr kv))) (hash) lst))

(define (parse-ai s) (let ([k (string->symbol s)]) (if (memq k (cons 'human AI-KINDS)) k (error "unknown ai:" s))))

;; ---------------------------------------------------------------------------
;; 公開 API
;; ---------------------------------------------------------------------------

(define (api-rules)
  (->json
   (hash 'rules (map (lambda (name)
                       (let ([r (rule-ref name)])
                         (hash 'name name 'title (hash-ref r 'title) 'description (hash-ref r 'description)
                               'options (map (lambda (kv) (hash 'key (car kv) 'default (cdr kv)))
                                             (hash-ref r 'options)))))
                     *rule-order*)
         'rule_sets (map (lambda (name)
                           (let ([s (hash-ref *rule-sets* name)])
                             (hash 'name name 'title (hash-ref s 'title) 'rules (hash-ref s 'rules))))
                         (sort (hash-keys->list *rule-sets*)
                               (lambda (a b) (string<? (symbol->string a) (symbol->string b)))))
         'ai_kinds AI-KINDS)))

;; ais: 各席の "human" / "random" / "weak" / "strong" / "smart"
;; viewer: 表示する席（-1 なら全員の手札を見せる）
(define (api-new-game players seed rules options names ais viewer)
  (let* ([cfg (hash 'players players 'seed seed 'rules (expand-rules rules)
                    'options (options-from-list options))]
         [cfg (if (null? names) cfg (hash-insert cfg 'names names))]
         [st (new-game cfg)]
         [id *next-id*])
    (when (and (not (null? ais)) (not (= (length ais) players))) (error "ais length must equal players"))
    (set! *next-id* (+ id 1))
    (store-game! id (hash 'state st
                          'history '()
                          'ais (if (null? ais)
                                   (map (lambda (i) (if (= i viewer) 'human 'smart)) (range 0 players))
                                   (map parse-ai ais))
                          'viewer viewer))
    (api-view id)))

(define (seat-ai id i) (list-ref (hash-ref (game-record id) 'ais) i))

(define (api-view id) (->json (game-view id)))

(define (game-view id)
  (let* ([rec (game-record id)]
         [st (hash-ref rec 'state)]
         [viewer (hash-ref rec 'viewer)]
         [n (st-ref st 'n)]
         [over? (eq? (st-ref st 'phase) 'over)]
         [order (ranking st)]
         [prev (st-ref st 'prev-ranking)]
         [turn (st-ref st 'turn)]
         [human-turn? (and (not over?) (eq? (seat-ai id turn) 'human))])
    (hash
     'id id
     'round (st-ref st 'round)
     'phase (st-ref st 'phase)
     'turn turn
     'viewer viewer
     'waiting_for_human human-turn?
     'players
     (map (lambda (i)
            (hash 'index i
                  'name (player-name st i)
                  'ai (seat-ai id i)
                  'count (length (hand-of st i))
                  'hand (if (or (= viewer -1) (= viewer i) over?) (card-ids (hand-of st i)) 'null)
                  'finished (if (contains? (st-ref st 'finished) i)
                                (+ 1 (index-where (lambda (x) (= x i)) (st-ref st 'finished)))
                                'null)
                  'fallen (contains? (st-ref st 'fallen) i)
                  'passed (contains? (st-ref st 'passed) i)
                  'title (if prev (rank-title (index-where (lambda (x) (= x i)) prev) n) 'null)
                  'score (list-ref (st-ref st 'scores) i)))
          (range 0 n))
     'field (map (lambda (e) (hash 'player (car e) 'play (cdr e))) (reverse (st-ref st 'field)))
     'revolution (st-ref st 'revolution)
     'back11 (st-ref st 'back11)
     'reversed (reversed? st)
     'lock (if (st-ref st 'lock) (st-ref st 'lock) 'null)
     'rules (st-ref st 'rules)
     'exchange (if (eq? (st-ref st 'phase) 'exchange)
                   (let ([p (car (st-ref st 'exchange-queue))])
                     (hash 'giver (car p) 'receiver (cadr p) 'count (caddr p)))
                   'null)
     'legal (if (and human-turn? (eq? (st-ref st 'phase) 'play))
                (map (lambda (m) (card-ids (play-cards (move-play m)))) (play-moves (legal-moves st)))
                '())
     'can_pass (and human-turn? (eq? (st-ref st 'phase) 'play) (not (null? (st-ref st 'field))))
     'ranking (if over?
                  (map (lambda (pos) (hash 'player (list-ref order pos) 'title (rank-title pos n)))
                       (range 0 n))
                  'null)
     'can_undo (not (null? (hash-ref rec 'history)))
     'log (reverse (take-at-most (st-ref st 'log) 80)))))

(define (take-at-most lst k) (if (> (length lst) k) (take lst k) lst))

(define (act! id f)
  (push-state! id (f (game-state id)))
  (api-view id))

(define (api-play id player ids) (act! id (lambda (st) (apply-play st player ids))))
(define (api-pass id player) (act! id (lambda (st) (apply-pass st player))))
(define (api-give id player ids) (act! id (lambda (st) (apply-give st player ids))))
(define (api-next-round id) (act! id next-round))

;; 手番が CPU なら 1 手進める（人間の番なら何もしない）
(define (api-ai-step id)
  (let ([st (game-state id)])
    (if (or (eq? (st-ref st 'phase) 'over) (eq? (seat-ai id (st-ref st 'turn)) 'human))
        (api-view id)
        (act! id (lambda (st) (apply-action st (ai-action st (seat-ai id (st-ref st 'turn)))))))))

;; 人間の手番用のヒント（smart AI の判断）
(define (api-hint id)
  (let* ([st (game-state id)] [a (ai-action st 'smart)])
    (->json (hash 'action (car a) 'cards (if (null? (cdr a)) '() (cadr a))))))

;; 人間が操作した直前まで戻す
(define (api-undo id)
  (let* ([rec (game-record id)])
    (let loop ([hist (hash-ref rec 'history)])
      (cond
        [(null? hist) (api-view id)]
        [else
         (let* ([st (car hist)]
                [human? (and (not (eq? (st-ref st 'phase) 'over))
                             (eq? (seat-ai id (st-ref st 'turn)) 'human))])
           (if human?
               (begin (store-game! id (hash-insert (hash-insert rec 'state st) 'history (cdr hist)))
                      (api-view id))
               (loop (cdr hist))))]))))

(define (api-delete-game id) (set! *games* (hash-remove *games* id)) "true")

;; ---------------------------------------------------------------------------
;; シミュレーション（自動テスト・バランス確認）
;; ---------------------------------------------------------------------------

(define MAX-MOVES-PER-ROUND 2000)

;; 不変条件: 手札 + 場に出たカード = 山札
(define (cards-conserved? st total)
  (let ([in-hands (sum (map length (st-ref st 'hands)))]
        [played (sum (map (lambda (e) (length (hash-ref e 'cards)))
                          (filter (lambda (e) (eq? (hash-ref e 'type) 'play)) (st-ref st 'log))))])
    (= (+ in-hands played) total)))

(define (run-round st kinds)
  (let ([total (sum (map length (st-ref st 'hands)))])
    (let loop ([st st] [steps 0])
      (cond
        [(eq? (st-ref st 'phase) 'over) st]
        [(> steps MAX-MOVES-PER-ROUND) (error "round did not finish (possible infinite loop)")]
        [else
         (let ([nst (apply-action st (ai-action st (list-ref kinds (st-ref st 'turn))))])
           (unless (cards-conserved? nst total) (error "card conservation violated"))
           (loop nst (+ steps 1)))]))))

(define (event-counts sts)
  (fold (lambda (h e)
          (let ([t (hash-ref e 'type)])
            (if (memq t '(revolution eight back11 shibari spade3 fall))
                (hash-insert h t (+ 1 (hash-get h t 0)))
                h)))
        (hash)
        (flat-map (lambda (st) (st-ref st 'log)) sts)))

;; matches 回 x rounds ラウンド。席ごとの AI を回し、席の偏りを消すため毎試合 AI をずらす
(define (api-simulate matches rounds players seed rules ais)
  (let* ([kinds (map parse-ai ais)]
         [rules (expand-rules rules)]
         [k (length kinds)])
    (let loop ([m 0] [pos-sum (hash)] [games (hash)] [wins (hash)] [moves 0] [finals '()])
      (if (>= m matches)
          (->json
           (hash 'matches matches 'rounds rounds 'players players 'rules rules
                 'total_moves moves
                 'events (event-counts finals)
                 'ai (map (lambda (kind)
                            (let ([g (hash-get games kind 0)])
                              (hash 'kind kind
                                    'rounds g
                                    'daifugo (hash-get wins kind 0)
                                    'avg_position (if (= g 0) 'null
                                                      (exact->inexact (/ (hash-get pos-sum kind 0) g))))))
                          (dedupe kinds))))
          (let* ([seat-kinds (map (lambda (i) (list-ref kinds (modulo (+ i m) k))) (range 0 players))]
                 [st0 (new-game (hash 'players players 'seed (+ seed (* m 7777)) 'rules rules))]
                 [result
                  (let rloop ([st st0] [r 0] [acc '()])
                    (let ([done (run-round st seat-kinds)])
                      (if (>= (+ r 1) rounds)
                          (reverse (cons done acc))
                          (rloop (next-round done) (+ r 1) (cons done acc)))))]
                 [tally
                  (fold (lambda (t st)
                          (let ([order (ranking st)])
                            (fold (lambda (t2 pos)
                                    (let* ([kind (list-ref seat-kinds (list-ref order pos))]
                                           [ps (car t2)] [gs (cadr t2)] [ws (caddr t2)])
                                      (list (hash-insert ps kind (+ pos 1 (hash-get ps kind 0)))
                                            (hash-insert gs kind (+ 1 (hash-get gs kind 0)))
                                            (if (= pos 0) (hash-insert ws kind (+ 1 (hash-get ws kind 0))) ws))))
                                  t (range 0 players))))
                        (list pos-sum games wins) result)])
            (loop (+ m 1) (car tally) (cadr tally) (caddr tally)
                  (+ moves (sum (map (lambda (st) (st-ref st 'moves)) result)))
                  (append finals result)))))))
