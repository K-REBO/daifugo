;;; test-rules.scm — ローカルルール

;; --- 革命 ------------------------------------------------------------------

(deftest "革命: 4枚出しで逆転し、もう一度で戻る"
  (lambda ()
    (let* ([st (fixture '(kakumei) (list (ids "S5" "H5" "D5" "C5" "S3") (ids "S4" "H4" "D4" "JK1" "S9")))]
           [st (play-ids st 0 "S5" "H5" "D5" "C5")])
      (assert-true (st-ref st 'revolution) "革命中")
      (assert-true (reversed? st) "強さ逆転")
      (let* ([st (play-ids st 1 "S4" "H4" "D4" "JK1")])
        (assert-false (st-ref st 'revolution) "革命返し")))))

(deftest "革命: ルールが無効なら起きない"
  (lambda ()
    (let ([st (play-ids (fixture '() (list (ids "S5" "H5" "D5" "C5" "S3") (ids "S4"))) 0 "S5" "H5" "D5" "C5")])
      (assert-false (st-ref st 'revolution) "革命なし"))))

(deftest "革命中は弱いカードが強い"
  (lambda ()
    (let* ([st (st-set (fixture '(kakumei) (list (ids "S9" "S3") (ids "S4" "SK"))) 'revolution #t)]
           [st (play-ids st 0 "S9")])
      (assert-error (lambda () (play-ids st 1 "SK")) "K は 9 に出せない")
      (assert-equal (field-top-ids (play-ids st 1 "S4")) '("S4") "4 は出せる"))))

(deftest "階段革命はオプション"
  (lambda ()
    (let* ([hands (list (ids "S5" "S6" "S7" "S8" "H3") (ids "H4"))]
           [off (play-ids (fixture '(kakumei kaidan) hands) 0 "S5" "S6" "S7" "S8")]
           [on (play-ids (fixture '(kakumei kaidan) hands (hash 'kaidan-revolution #t)) 0 "S5" "S6" "S7" "S8")])
      (assert-false (st-ref off 'revolution) "既定では起きない")
      (assert-true (st-ref on 'revolution) "オプションで起きる"))))

;; --- 8切り -----------------------------------------------------------------

(deftest "8切り: 場が流れて同じ人が親"
  (lambda ()
    (let* ([st (fixture '(8giri) (list (ids "S8" "S3") (ids "SK" "S4")))]
           [st (play-ids st 0 "S8")])
      (assert-equal (st-ref st 'field) '() "流れる")
      (assert-equal (st-ref st 'turn) 0 "もう一度親"))))

(deftest "8切り: 8で上がったら次の人が親"
  (lambda ()
    (let* ([st (fixture '(8giri) (list (ids "S8") (ids "SK" "S4") (ids "S5" "S6")))]
           [st (play-ids st 0 "S8")])
      (assert-equal (st-ref st 'field) '() "流れる")
      (assert-equal (st-ref st 'turn) 1 "次の人"))))

(deftest "8切り: 階段の中の8は既定で無効"
  (lambda ()
    (let* ([hands (list (ids "S7" "S8" "S9" "S3") (ids "H4"))]
           [st (play-ids (fixture '(8giri kaidan) hands) 0 "S7" "S8" "S9")]
           [st2 (play-ids (fixture '(8giri kaidan) hands (hash 'kaidan-8giri #t)) 0 "S7" "S8" "S9")])
      (assert-false (null? (st-ref st 'field)) "流れない")
      (assert-equal (st-ref st2 'field) '() "オプションで流れる"))))

;; --- 11バック --------------------------------------------------------------

(deftest "11バック: 場が流れるまで逆転"
  (lambda ()
    (let* ([st (fixture '(11back) (list (ids "SJ" "S3" "S2") (ids "S4" "SK") (ids "S5" "S6")))]
           [st (play-ids st 0 "SJ")])
      (assert-true (st-ref st 'back11) "11バック中")
      (assert-error (lambda () (play-ids st 1 "SK")) "K は J に出せない")
      (let* ([st (play-ids st 1 "S4")]
             [st (pass st 2)]
             [st (pass st 0)])
        (assert-equal (st-ref st 'field) '() "流れた")
        (assert-false (st-ref st 'back11) "流れたら解除")))))

(deftest "11バックと革命は打ち消し合う"
  (lambda ()
    (let* ([st (st-set (fixture '(11back kakumei) (list (ids "SJ" "S3") (ids "SK" "S4"))) 'revolution #t)]
           [st (play-ids st 0 "SJ")])
      (assert-false (reversed? st) "革命中の11バックは通常の強さ")
      (assert-equal (field-top-ids (play-ids st 1 "SK")) '("SK") "K を出せる"))))

;; --- 階段 ------------------------------------------------------------------

(deftest "階段: ルールが無いと出せない"
  (lambda ()
    (assert-error (lambda () (play-ids (fixture '() (list (ids "S5" "S6" "S7") (ids "S3"))) 0 "S5" "S6" "S7"))
                  "階段なし")
    (assert-equal (play-type (top-play (play-ids (fixture '(kaidan) (list (ids "S5" "S6" "S7" "S3") (ids "S4"))) 0 "S5" "S6" "S7")))
                  'kaidan "階段あり")))

(deftest "階段に階段で返す"
  (lambda ()
    (let* ([st (fixture '(kaidan) (list (ids "S5" "S6" "S7" "S3") (ids "H6" "H7" "H8" "D4" "D5" "D6" "C3")))]
           [st (play-ids st 0 "S5" "S6" "S7")])
      (assert-error (lambda () (play-ids st 1 "D4" "D5" "D6")) "弱い階段")
      (assert-equal (field-top-ids (play-ids st 1 "H6" "H7" "H8")) '("H6" "H7" "H8") "強い階段"))))

(deftest "ジョーカー入り階段は勝てる解釈が選ばれる"
  (lambda ()
    (let* ([st (fixture '(kaidan) (list (ids "S5" "S6" "S7" "S3") (ids "H6" "H7" "JK1" "C3")))]
           [st (play-ids st 0 "S5" "S6" "S7")]
           [st (play-ids st 1 "H6" "H7" "JK1")])
      (assert-equal (play-rank (top-play st)) 6 "6-7-JK(8) として出る"))))

;; --- 縛り ------------------------------------------------------------------

(deftest "縛り: 同じマークが続くとそのマークしか出せない"
  (lambda ()
    (let* ([st (fixture '(shibari) (list (ids "S5" "SQ" "H3") (ids "S9" "HK" "SK") (ids "HA" "SA")))]
           [st (play-ids st 0 "S5")]
           [st (play-ids st 1 "S9")])
      (assert-equal (st-ref st 'lock) '(spade) "スペード縛り")
      (assert-error (lambda () (play-ids st 2 "HA")) "ハートは出せない")
      (let* ([st (play-ids st 2 "SA")])
        (assert-equal (field-top-ids st) '("SA") "スペードは出せる")))))

(deftest "縛り: 違うマークなら縛られない・流れたら解除"
  (lambda ()
    (let* ([st (fixture '(shibari) (list (ids "S5" "SQ" "H3") (ids "H9" "HK" "SK") (ids "DA" "SA")))]
           [st (play-ids st 0 "S5")]
           [st (play-ids st 1 "H9")])
      (assert-false (st-ref st 'lock) "縛りなし"))
    (let* ([st (fixture '(shibari) (list (ids "S5" "SQ" "H3") (ids "S9" "HK" "SK") (ids "DA" "SA")))]
           [st (play-ids st 0 "S5")]
           [st (play-ids st 1 "S9")]
           [st (pass st 2)]
           [st (pass st 0)])
      (assert-false (st-ref st 'lock) "流れたら解除"))))

(deftest "縛り: ペアはマークの組で判定、ジョーカーは何にでもなる"
  (lambda ()
    (let* ([st (fixture '(shibari) (list (ids "S5" "H5" "S3") (ids "S9" "H9" "D4") (ids "SQ" "JK1" "DQ" "HQ")))]
           [st (play-ids st 0 "S5" "H5")]
           [st (play-ids st 1 "S9" "H9")])
      (assert-equal (st-ref st 'lock) '(spade heart) "スペード・ハート縛り")
      (assert-error (lambda () (play-ids st 2 "DQ" "HQ")) "ダイヤ入りは出せない")
      (assert-equal (field-top-ids (play-ids st 2 "SQ" "JK1")) '("SQ" "JK1") "JK はハート扱い"))))

;; --- スペ3返し -------------------------------------------------------------

(deftest "スペ3返し: 単騎ジョーカーに♠3を出せて場が流れる"
  (lambda ()
    (let* ([st (fixture '(spade3) (list (ids "JK1" "S4") (ids "S3" "H5") (ids "C2" "D9")))]
           [st (play-ids st 0 "JK1")])
      (assert-error (lambda () (play-ids st 1 "H5")) "5 は出せない")
      (let ([st (play-ids st 1 "S3")])
        (assert-equal (st-ref st 'field) '() "流れる")
        (assert-equal (st-ref st 'turn) 1 "♠3を出した人が親")))))

(deftest "スペ3返し: ルールが無ければ出せない、ジョーカー以外には効かない"
  (lambda ()
    (let ([st (play-ids (fixture '() (list (ids "JK1" "S4") (ids "S3" "H5"))) 0 "JK1")])
      (assert-error (lambda () (play-ids st 1 "S3")) "ルールなし"))
    (let ([st (play-ids (fixture '(spade3) (list (ids "C2" "S4") (ids "S3" "H5"))) 0 "C2")])
      (assert-error (lambda () (play-ids st 1 "S3")) "2 には出せない"))))

;; --- 都落ち ----------------------------------------------------------------

(deftest "都落ち: 大富豪以外が1位なら大富豪は大貧民"
  (lambda ()
    (let* ([st (fixture '(miyakoochi) (list (ids "S9") (ids "S4" "SK") (ids "S5" "S6") (ids "S7" "S8")))]
           [st (st-set st 'prev-ranking '(1 0 2 3))]
           [st (play-ids st 0 "S9")])
      (assert-equal (st-ref st 'finished) '(0) "0が1位")
      (assert-equal (st-ref st 'fallen) '(1) "前回大富豪の1が都落ち")
      (assert-false (active? st 1) "1は抜ける")
      (assert-equal (st-ref st 'turn) 2 "1を飛ばして2へ")
      (let* ([st (pass st 2)] [st (pass st 3)]  ; 流れて 2 が親
             [st (play-ids st 2 "S5")] [st (pass st 3)] [st (play-ids st 2 "S6")])
        (assert-equal (st-ref st 'phase) 'over "終了")
        (assert-equal (ranking st) '(0 2 3 1) "都落ちは最下位")))))

(deftest "都落ち: 大富豪が1位なら何も起きない"
  (lambda ()
    (let* ([st (fixture '(miyakoochi) (list (ids "S9") (ids "S4" "SK") (ids "S5" "S6")))]
           [st (st-set st 'prev-ranking '(0 1 2))]
           [st (play-ids st 0 "S9")])
      (assert-equal (st-ref st 'fallen) '() "都落ちなし"))))

;; --- ルール登録 ------------------------------------------------------------

(deftest "ルールセットの展開"
  (lambda ()
    (assert-equal (expand-rules '("official5")) '(kakumei 8giri miyakoochi shibari spade3) "公式5")
    (assert-equal (expand-rules '("basic" "kakumei" "11back")) '(kakumei 8giri kaidan 11back) "重複除去")
    (assert-error (lambda () (expand-rules '("nope"))) "不明")))

(deftest "実行時に新しいルールを定義して使える"
  (lambda ()
    ;; 「9 を出すと場が流れる」ルールをその場で定義する
    (define-rule! 'test-9giri "9切り" "テスト用"
      (hash 'on-play (lambda (st player p prev)
                       (if (and (memq (play-type p) '(single set)) (= (play-rank p) 9)) (request-flush st) st))))
    (let ([st (play-ids (fixture '(test-9giri) (list (ids "S9" "S3") (ids "SK"))) 0 "S9")])
      (assert-equal (st-ref st 'field) '() "9で流れる")
      (assert-equal (st-ref st 'turn) 0 "同じ人が親"))))
