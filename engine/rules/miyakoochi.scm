;;; 都落ち: 2 ゲーム目以降、前回の大富豪より先に誰かが 1 位で上がると、
;;; 大富豪はその時点で大貧民になって抜ける。

(define-rule! 'miyakoochi "都落ち"
  "2ゲーム目以降、大富豪が1位で上がれなかったら、その時点で大貧民になる。"
  (hash 'on-player-out
        (lambda (st player)
          (let ([prev (st-ref st 'prev-ranking)])
            (if (and prev
                     (= (length (st-ref st 'finished)) 1)
                     (not (= player (car prev)))
                     (active? st (car prev))
                     (>= (st-ref st 'n) 3))
                (player-fall st (car prev)
                             (string-append "都落ち！ " (player-name st (car prev)) " は大貧民に"))
                st)))))
