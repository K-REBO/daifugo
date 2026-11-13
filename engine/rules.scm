;;; rules.scm — ローカルルールの登録と呼び出し
;;;
;;; ルールは engine/rules/*.scm で define-rule! を呼んで自分を登録する。
;;; ゲーム開始時に有効にするルール名のリストを渡し、ゲームはその順でフックを呼ぶ。
;;; 実行時に新しいルールファイルを読み込めば、そのまま使える（動的ルール）。
;;;
;;; フック（すべて省略可）:
;;;   'enables       : 有効にする役の種類のリスト。例: '(kaidan)
;;;   'can-follow    : (st new prev) -> 'allow | 'deny | #f
;;;                    'deny が 1 つでもあれば出せない。'allow があれば強さに関係なく出せる。
;;;   'on-play       : (st player new prev) -> st     prev は場にあった役（親なら #f）
;;;                    場を流すときは (request-flush st) を返す
;;;   'on-clear      : (st) -> st                     場が流れたとき
;;;   'on-player-out : (st player) -> st              誰かが上がったとき
;;;
;;; 登録: (define-rule! 'name "表示名" "説明" (hash 'on-play ...) '((option-key . default) ...))

(define *rules* (hash))
(define *rule-order* '())   ; 登録順（一覧表示用）
(define *rule-sets* (hash))

(define (define-rule! name title description hooks [options '()])
  (unless (contains? *rule-order* name)
    (set! *rule-order* (append *rule-order* (list name))))
  (set! *rules*
        (hash-insert *rules* name
                     (hash 'name name
                           'title title
                           'description description
                           'hooks hooks
                           'options options)))
  name)

(define (define-rule-set! name title rules [options '()])
  (set! *rule-sets* (hash-insert *rule-sets* name
                                 (hash 'name name 'title title 'rules rules 'options options)))
  name)

(define (rule-known? name) (hash-contains? *rules* name))

(define (rule-ref name)
  (let ([r (hash-try-get *rules* name)])
    (if r r (error "unknown rule:" name))))

(define (rule-hook name key)
  (let ([hooks (hash-ref (rule-ref name) 'hooks)])
    (hash-try-get hooks key)))

;; 有効なルールのうち key フックを持つものを順に返す
(define (active-hooks st key)
  (fold (lambda (acc name)
          (let ([h (rule-hook name key)])
            (if h (append acc (list h)) acc)))
        '()
        (hash-ref st 'rules)))

(define (rule-on? st name) (contains? (hash-ref st 'rules) name))

(define (enabled-hand-type? st type)
  (any? (lambda (name)
          (let ([e (rule-hook name 'enables)])
            (and e (contains? e type))))
        (hash-ref st 'rules)))

;; ルールの既定オプションをまとめる（ユーザー指定が優先）
(define (merge-rule-options rules user-options)
  (fold (lambda (opts name)
          (fold (lambda (o kv) (if (hash-contains? o (car kv)) o (hash-insert o (car kv) (cdr kv))))
                opts
                (hash-ref (rule-ref name) 'options)))
        user-options
        rules))

(define (opt st key default)
  (hash-get (hash-ref st 'options) key default))

;; フックを順に適用する
(define (run-state-hooks st key . args)
  (fold (lambda (s hook) (apply hook (cons s args))) st (active-hooks st key)))

(define (follow-verdict st new prev)
  (let ([vs (map (lambda (hook) (hook st new prev)) (active-hooks st 'can-follow))])
    (cond [(contains? vs 'deny) 'deny]
          [(contains? vs 'allow) 'allow]
          [else #f])))
