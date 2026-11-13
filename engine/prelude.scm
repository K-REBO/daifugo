;;; prelude.scm — Steel に無い小さな汎用関数と、決定論的な乱数
;;;
;;; エンジンの他のファイルはすべてこのファイルの後に読み込まれる。

;; ---------------------------------------------------------------------------
;; リスト操作
;; ---------------------------------------------------------------------------

(define (fold f acc lst)
  (if (null? lst) acc (fold f (f acc (car lst)) (cdr lst))))

(define (any? pred lst)
  (cond [(null? lst) #f]
        [(pred (car lst)) #t]
        [else (any? pred (cdr lst))]))

(define (all? pred lst)
  (cond [(null? lst) #t]
        [(pred (car lst)) (all? pred (cdr lst))]
        [else #f]))

(define (count-if pred lst)
  (fold (lambda (n x) (if (pred x) (+ n 1) n)) 0 lst))

(define (find-first pred lst)
  (cond [(null? lst) #f]
        [(pred (car lst)) (car lst)]
        [else (find-first pred (cdr lst))]))

(define (index-where pred lst)
  (let loop ([l lst] [i 0])
    (cond [(null? l) #f]
          [(pred (car l)) i]
          [else (loop (cdr l) (+ i 1))])))

(define (flat-map f lst)
  (fold (lambda (acc x) (append acc (f x))) '() lst))

;; i 番目を v に置き換えた新しいリスト
(define (list-replace lst i v)
  (let loop ([l lst] [k 0])
    (cond [(null? l) '()]
          [(= k i) (cons v (cdr l))]
          [else (cons (car l) (loop (cdr l) (+ k 1)))])))

;; pred を満たす要素を除いたリスト
(define (remove-if pred lst)
  (filter (lambda (x) (not (pred x))) lst))

;; x を（equal? で）含むか
(define (contains? lst x)
  (if (member x lst) #t #f))

;; 重複を除く（最初の出現順を保つ）
(define (dedupe lst)
  (reverse
   (fold (lambda (acc x) (if (contains? acc x) acc (cons x acc))) '() lst)))

;; lst から k 個を選ぶ組み合わせ（元の順序を保つ）
(define (combinations lst k)
  (cond [(= k 0) (list '())]
        [(null? lst) '()]
        [else
         (append (map (lambda (rest) (cons (car lst) rest))
                      (combinations (cdr lst) (- k 1)))
                 (combinations (cdr lst) k))]))

(define (sum lst) (fold + 0 lst))

(define (min-by key lst)
  (fold (lambda (best x) (if (or (not best) (< (key x) (key best))) x best)) #f lst))

(define (max-by key lst)
  (fold (lambda (best x) (if (or (not best) (> (key x) (key best))) x best)) #f lst))

;; a の各要素が b に（多重度込みで）含まれるか
(define (multiset-subset? a b)
  (cond [(null? a) #t]
        [(member (car a) b) (multiset-subset? (cdr a) (remove-one (car a) b))]
        [else #f]))

(define (remove-one x lst)
  (cond [(null? lst) '()]
        [(equal? x (car lst)) (cdr lst)]
        [else (cons (car lst) (remove-one x (cdr lst)))]))

(define (xor a b) (if a (not b) (if b #t #f)))

(define (hash-get h k default)
  (let ([v (hash-try-get h k)])
    (if (or v (hash-contains? h k)) v default)))

;; ---------------------------------------------------------------------------
;; 決定論的な乱数（31bit LCG）
;;   同じシードなら Web でもネイティブでも同じゲームが再現できる。
;; ---------------------------------------------------------------------------

(define RNG-MOD 2147483648)

(define (rng-step s)
  (modulo (+ (* (modulo s RNG-MOD) 1103515245) 12345) RNG-MOD))

;; 0 <= r < n の整数と次の状態を返す: (cons r next-seed)
(define (rng-int seed n)
  (let ([s (rng-step seed)])
    (cons (modulo (quotient s 65536) n) s)))

;; Fisher–Yates。 (cons shuffled-list next-seed) を返す
(define (shuffle lst seed)
  ;; list->vector は不変ベクタを返すので make-vector で可変ベクタを作る
  (let ([v (make-vector (length lst) 0)])
    (let fill ([l lst] [i 0])
      (unless (null? l)
        (vector-set! v i (car l))
        (fill (cdr l) (+ i 1))))
    (let loop ([i (- (vector-length v) 1)] [s seed])
      (if (<= i 0)
          (cons (vector->list v) s)
          (let* ([r (rng-int s (+ i 1))]
                 [j (car r)]
                 [tmp (vector-ref v i)])
            (vector-set! v i (vector-ref v j))
            (vector-set! v j tmp)
            (loop (- i 1) (cdr r)))))))
