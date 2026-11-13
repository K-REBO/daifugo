;;; ai.scm — CPU プレイヤー
;;;
;;; 戦略:
;;;   'random : 合法手からランダム
;;;   'weak   : 出せる中で一番弱い役を出す（保守的）
;;;   'strong : 出せる中で一番強い役を出す（貪欲）
;;;   'smart  : 手札の組を崩さず、弱いカードから処理し、強いカードは終盤に残す
;;;
;;; 返り値は行動: (list 'play ids) | (list 'pass) | (list 'give ids)

(define AI-KINDS '(random weak strong smart))

;; 現在の向きでの強さ（大きいほど強い）
(define (rank-strength st rank)
  (cond [(= rank JOKER-RANK) 20]
        [(reversed? st) (- MAX-RANK rank)]
        [else (- rank MIN-RANK)]))

(define (play-strength st p) (rank-strength st (play-rank p)))

(define (move-play m) (cadr m))
(define (play-moves moves) (filter (lambda (m) (eq? (car m) 'play)) moves))
(define (play->action p) (list 'play (card-ids (play-cards p))))

(define (ai-rng st salt n)
  (car (rng-int (+ (st-ref st 'seed) (* 7919 (st-ref st 'moves)) (* 104729 salt)) n)))

(define (ai-random st moves)
  (let ([m (list-ref moves (ai-rng st (st-ref st 'turn) (length moves)))])
    (if (eq? (car m) 'pass) (list 'pass) (play->action (move-play m)))))

(define (ai-by-strength st moves pick)
  (let ([plays (map move-play (play-moves moves))])
    (if (null? plays)
        (list 'pass)
        (play->action (pick (lambda (p) (+ (* 10 (play-strength st p)) (- 10 (play-n p)))) plays)))))

;; --- smart ---------------------------------------------------------------

(define (card-strength st c) (rank-strength st (card-rank c)))

;; この役を出すと手札の同ランクの組をいくつ崩すか
(define (breaks-groups st hand p)
  (let ([used-ranks (dedupe (map card-rank (remove-if joker? (play-cards p))))])
    (count-if (lambda (r)
                (let ([total (count-if (lambda (c) (= (card-rank c) r)) hand)]
                      [used (count-if (lambda (c) (= (card-rank c) r)) (play-cards p))])
                  (and (eq? (play-type p) 'single) (> total used))))
              used-ranks)))

(define (smart-cost st hand p lead?)
  (let* ([cards (play-cards p)]
         [n (play-n p)]
         [avg (/ (sum (map (lambda (c) (card-strength st c)) cards)) n)]
         [jokers (count-if joker? cards)]
         [big-hand? (> (length hand) 5)]
         [joker-penalty (if (and big-hand? (> jokers 0) (not (all-joker-play? p))) 12 0)]
         [break-penalty (* 2 (breaks-groups st hand p))])
    (+ avg joker-penalty break-penalty
       (if lead? (* -3 (- n 1)) 0))))

(define (ai-smart st moves)
  (let* ([player (st-ref st 'turn)]
         [hand (hand-of st player)]
         [plays (map move-play (play-moves moves))]
         [lead? (null? (st-ref st 'field))]
         [finisher (find-first (lambda (p) (= (play-n p) (length hand))) plays)])
    (cond
      [(null? plays) (list 'pass)]
      [finisher (play->action finisher)]
      [else (play->action (min-by (lambda (p) (smart-cost st hand p lead?)) plays))])))

;; --- 交換で渡すカード: 弱い順（ジョーカーと 2 は渡さない） ----------------

(define (ai-give st)
  (let* ([player (st-ref st 'turn)]
         [k (caddr (car (st-ref st 'exchange-queue)))]
         [hand (sort (hand-of st player)
                     (lambda (a b) (< (rank-strength st (card-rank a)) (rank-strength st (card-rank b)))))])
    (list 'give (card-ids (take hand k)))))

(define (ai-action st kind)
  (case (st-ref st 'phase)
    [(exchange) (ai-give st)]
    [(play)
     (let ([moves (legal-moves st)])
       (case kind
         [(random) (ai-random st moves)]
         [(weak) (ai-by-strength st moves min-by)]
         [(strong) (ai-by-strength st moves max-by)]
         [else (ai-smart st moves)]))]
    [else (error "game is over")]))

(define (apply-action st action)
  (case (car action)
    [(play) (apply-play st (st-ref st 'turn) (cadr action))]
    [(pass) (apply-pass st (st-ref st 'turn))]
    [(give) (apply-give st (st-ref st 'turn) (cadr action))]
    [else (error "unknown action:" action)]))
