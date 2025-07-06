;; Name: 無効なルール
;; Description: 構文エラーがあるルール
;; Category: test

(define-rule invalid-syntax
  (when (missing-parenthesis cards
    (clear-field)))