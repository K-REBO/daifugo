;;; framework.scm — 最小限のテストフレームワーク
;;;
;;; (deftest "名前" (lambda () ... (assert-equal actual expected "説明") ...))
;;; ホストから (test-run) を呼ぶと JSON で結果を返す。

(define *tests* '())

(define (deftest name thunk)
  (set! *tests* (append *tests* (list (cons name thunk)))))

(define (fail! msg . irritants)
  (error (string-append msg " :: " (string-join (map to-string irritants) " | "))))

(define (assert-equal actual expected msg)
  (unless (equal? actual expected)
    (fail! (string-append "assert-equal: " msg) (list 'actual actual) (list 'expected expected))))

(define (assert-true v msg) (unless v (fail! (string-append "assert-true: " msg))))
(define (assert-false v msg) (when v (fail! (string-append "assert-false: " msg) v)))

;; thunk を実行し、(cons 'ok 値) か (cons 'err メッセージ) を返す
;; 注意: Steel 0.8.3 では call/cc を入れ子にすると継続が正しく戻らないので使わない。
;;       with-handler はハンドラの戻り値をそのまま式の値にする。
(define (try-run thunk)
  (with-handler (lambda (e) (cons 'err (if (error-object? e) (error-object-message e) (to-string e))))
                (cons 'ok (thunk))))

(define (assert-error thunk msg)
  (when (eq? (car (try-run thunk)) 'ok)
    (fail! (string-append "assert-error: エラーにならなかった: " msg))))

(define (test-run)
  (let* ([results (map (lambda (t) (cons (car t) (try-run (cdr t)))) *tests*)]
         [failures (filter (lambda (r) (eq? (cadr r) 'err)) results)])
    (->json (hash 'total (length results)
                  'passed (- (length results) (length failures))
                  'failed (length failures)
                  'failures (map (lambda (r) (hash 'name (car r) 'message (cddr r))) failures)))))

;; ---------------------------------------------------------------------------
;; フィクスチャ: 手札を指定してゲーム状態を作る
;; ---------------------------------------------------------------------------

;; hands: 各プレイヤーの手札 id リスト。turn は 0
(define (fixture rules hands [options (hash)])
  (let* ([st (new-game (hash 'players (length hands) 'rules rules 'options options 'seed 1))]
         [st (st-set st 'hands (map (lambda (ids) (sort-cards (map id->card ids))) hands))]
         [st (st-set st 'turn 0)])
    st))

(define (ids . xs) xs)

(define (play-ids st player . xs) (apply-play st player xs))
(define (pass st player) (apply-pass st player))

(define (cls . xs) (classify-plays (map id->card xs) #t))
(define (cls1 . xs) (car (classify-plays (map id->card xs) #t)))

(define (field-top-ids st) (card-ids (play-cards (top-play st))))

;; 行動のカード id をソートして比較しやすくする
(define (sort-ids action)
  (if (null? (cdr action)) action (list (car action) (sort (cadr action) string<?))))
