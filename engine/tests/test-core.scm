;;; test-core.scm — カード・役判定・強さ比較・乱数

;; --- カード ----------------------------------------------------------------

(deftest "山札は52枚+ジョーカー"
  (lambda ()
    (assert-equal (length (make-deck 2)) 54 "54枚")
    (assert-equal (length (make-deck 0)) 52 "52枚")
    (assert-equal (length (dedupe (card-ids (make-deck 2)))) 54 "idが一意")))

(deftest "カードidとランク"
  (lambda ()
    (assert-equal (card-rank (id->card "S3")) 3 "S3")
    (assert-equal (card-rank (id->card "HJ")) 11 "J=11")
    (assert-equal (card-rank (id->card "DA")) 14 "A=14")
    (assert-equal (card-rank (id->card "C2")) 15 "2=15")
    (assert-equal (card-rank (id->card "JK1")) 16 "joker=16")
    (assert-equal (card-suit (id->card "D10")) 'diamond "D10")
    (assert-error (lambda () (id->card "Z9")) "不明なid")))

(deftest "手札の並び順"
  (lambda ()
    (assert-equal (card-ids (sort-cards (map id->card '("JK1" "C2" "S3" "H3" "DA"))))
                  '("S3" "H3" "DA" "C2" "JK1") "弱い順・同ランクはスート順")))

;; --- 乱数 ------------------------------------------------------------------

(deftest "シャッフルはシードで決まり、カードを失わない"
  (lambda ()
    (let ([a (car (shuffle (make-deck 2) 42))]
          [b (car (shuffle (make-deck 2) 42))]
          [c (car (shuffle (make-deck 2) 43))])
      (assert-equal (card-ids a) (card-ids b) "同じシードは同じ結果")
      (assert-false (equal? (card-ids a) (card-ids c)) "違うシードは違う結果")
      (assert-equal (card-ids (sort-cards a)) (card-ids (sort-cards (make-deck 2))) "同じカード集合"))))

;; --- 役判定 ----------------------------------------------------------------

(deftest "シングルと枚数出し"
  (lambda ()
    (assert-equal (play-type (cls1 "S5")) 'single "single")
    (assert-equal (play-type (cls1 "S5" "H5")) 'set "pair")
    (assert-equal (play-n (cls1 "S5" "H5" "D5")) 3 "3枚")
    (assert-equal (play-rank (cls1 "S5" "H5" "JK1")) 5 "ジョーカー入りペアは5")
    (assert-equal (play-rank (cls1 "JK1")) 16 "単騎ジョーカー")
    (assert-equal (play-rank (cls1 "JK1" "JK2")) 16 "ジョーカー2枚")
    (assert-equal (cls "S5" "H6") '() "違うランクは役にならない")))

(deftest "階段"
  (lambda ()
    (let ([p (cls1 "S5" "S6" "S7")])
      (assert-equal (play-type p) 'kaidan "階段")
      (assert-equal (play-rank p) 5 "最小ランク"))
    (assert-equal (cls "S5" "H6" "S7") '() "スートが違う")
    (assert-equal (cls "S5" "S6") '() "2枚は階段でない")
    (assert-equal (cls "SK" "SA" "S2") (list (play 'kaidan 3 13 '(spade spade spade) (map id->card '("SK" "SA" "S2")))) "K-A-2 はつながる")
    (assert-equal (cls "SA" "S2" "S3") '() "2-3 はつながらない")
    (assert-equal (cls "S5" "S6" "S6") '() "重複ランク")))

(deftest "ジョーカー入りの階段は複数の解釈を持つ"
  (lambda ()
    (let ([gap (cls "S5" "JK1" "S7")])
      (assert-equal (map play-rank gap) '(5) "5-JK-7 は 5-6-7 だけ"))
    (let ([ends (filter (lambda (p) (eq? (play-type p) 'kaidan)) (cls "S5" "S6" "JK1"))])
      (assert-equal (map play-rank ends) '(4 5) "4-5-6 / 5-6-7"))
    (let ([both (cls "S5" "JK1" "JK2")])
      (assert-equal (play-type (car both)) 'set "5の3枚出しとしても解釈できる")
      (assert-equal (map play-rank (cdr both)) '(3 4 5) "3-4-5 / 4-5-6 / 5-6-7"))))

;; --- 強さ比較 --------------------------------------------------------------

(deftest "強さ比較: 通常と逆転"
  (lambda ()
    (assert-true (play-beats? (cls1 "S6") (cls1 "S5") #f) "6 > 5")
    (assert-false (play-beats? (cls1 "S5") (cls1 "S6") #f) "5 < 6")
    (assert-false (play-beats? (cls1 "S5") (cls1 "H5") #f) "同ランクは出せない")
    (assert-true (play-beats? (cls1 "S5") (cls1 "S6") #t) "逆転中は 5 > 6")
    (assert-true (play-beats? (cls1 "C2") (cls1 "SA") #f) "2 > A")
    (assert-true (play-beats? (cls1 "S3") (cls1 "C2") #t) "逆転中は 3 > 2")))

(deftest "強さ比較: 枚数と型が一致しないと出せない"
  (lambda ()
    (assert-false (play-beats? (cls1 "S9" "H9") (cls1 "S5") #f) "ペアはシングルに出せない")
    (assert-false (play-beats? (cls1 "S9") (cls1 "S5" "H5") #f) "シングルはペアに出せない")
    (assert-true (play-beats? (cls1 "H6" "H7" "H8") (cls1 "S5" "S6" "S7") #f) "階段同士")
    (assert-false (play-beats? (cls1 "H6" "H7" "H8") (cls1 "S5" "S6" "S7" "S8") #f) "階段の枚数違い")))

(deftest "ジョーカーは逆転中も最強"
  (lambda ()
    (assert-true (play-beats? (cls1 "JK1") (cls1 "C2") #f) "JK > 2")
    (assert-true (play-beats? (cls1 "JK1") (cls1 "S3") #t) "逆転中も JK > 3")
    (assert-false (play-beats? (cls1 "C2") (cls1 "JK1") #f) "2 は JK に勝てない")
    (assert-false (play-beats? (cls1 "S3") (cls1 "JK1") #t) "逆転中の 3 も JK に勝てない")
    (assert-false (play-beats? (cls1 "JK2") (cls1 "JK1") #f) "JK に JK は出せない")))
