;;; hands.scm — 出したカードの役判定と強さ比較
;;;
;;; 役 (play):
;;;   type  : 'single | 'set（同ランク複数枚） | 'kaidan（同スート連番 3 枚以上）
;;;   n     : 枚数
;;;   rank  : single/set はそのランク（ジョーカーのみなら 16）、kaidan は最小ランク
;;;   suits : ジョーカー以外のスート（ソート済み）。縛り判定に使う
;;;   cards : 実際のカード
;;;
;;; ジョーカーはワイルドカード。1 組のカードが複数の役に解釈できる場合
;;; （例: 5♠ JK JK は 5 の 3 枚出し / 3-4-5, 4-5-6, 5-6-7 の階段）は
;;; classify-plays がすべての解釈を返す。

(struct play (type n rank suits cards) #:transparent)

(define (sorted-suits cards)
  (sort (map card-suit (remove-if joker? cards))
        (lambda (a b) (< (suit-order a) (suit-order b)))))

(define (joker-single? p)
  (and (eq? (play-type p) 'single) (= (play-rank p) JOKER-RANK)))

;; ジョーカーだけの組（単騎ジョーカー、ジョーカー 2 枚）は革命・11 バックでも最強
(define (all-joker-play? p) (= (play-rank p) JOKER-RANK))

(define (classify-set cards)
  (let* ([normals (remove-if joker? cards)]
         [n (length cards)])
    (cond
      [(null? normals) (list (play (if (= n 1) 'single 'set) n JOKER-RANK '() cards))]
      [(all? (lambda (c) (= (card-rank c) (card-rank (car normals)))) normals)
       (list (play (if (= n 1) 'single 'set) n (card-rank (car normals)) (sorted-suits cards) cards))]
      [else '()])))

(define (classify-kaidan cards)
  (let* ([normals (remove-if joker? cards)]
         [n (length cards)]
         [jokers (- n (length normals))])
    (if (or (< n 3) (null? normals)
            (not (all? (lambda (c) (eq? (card-suit c) (card-suit (car normals)))) normals)))
        '()
        (let* ([ranks (sort (map card-rank normals) <)]
               [lo (car ranks)]
               [hi (last ranks)]
               [distinct? (= (length (dedupe ranks)) (length ranks))]
               [gaps (- (+ (- hi lo) 1) (length ranks))])
          (if (or (not distinct?) (> gaps jokers) (> (+ (- hi lo) 1) n))
              '()
              ;; 開始位置 s: s <= lo, s+n-1 >= hi, 3 <= s, s+n-1 <= 15
              (let ([s-min (max MIN-RANK (- (+ hi 1) n))]
                    [s-max (min lo (- MAX-RANK (- n 1)))])
                (map (lambda (s) (play 'kaidan n s (sorted-suits cards) cards))
                     (range s-min (+ s-max 1)))))))))

;; cards の全解釈。kaidan? が偽なら階段は考えない
(define (classify-plays cards kaidan?)
  (if (null? cards)
      '()
      (append (classify-set cards)
              (if kaidan? (classify-kaidan cards) '()))))

;; new が prev に勝つか（ルールによる特例は rules.scm 側で扱う）
;;   reversed? : 革命と 11 バックの排他的論理和
(define (play-beats? new prev reversed?)
  (and (eq? (play-type new) (play-type prev))
       (= (play-n new) (play-n prev))
       (cond
         [(all-joker-play? prev) #f]
         [(all-joker-play? new) #t]
         [reversed? (< (play-rank new) (play-rank prev))]
         [else (> (play-rank new) (play-rank prev))])))

;; 表示用: "5♠ 6♠ JK(7)" のような説明
(define (play-label p)
  (string-append
   (case (play-type p) [(single) "シングル"] [(set) (string-append (number->string (play-n p)) "枚出し")]
     [(kaidan) "階段"] [else "?"])
   " "
   (rank-label (play-rank p))
   (if (eq? (play-type p) 'kaidan)
       (string-append "-" (rank-label (+ (play-rank p) (- (play-n p) 1))))
       "")))
