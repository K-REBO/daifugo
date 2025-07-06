;; Name: テスト用カスタムルール
;; Description: 7を出すとフィールドがクリアされる
;; Category: custom

(define-rule seven-clear
  (when (any-card-rank cards "7")
    (clear-field)
    (log-message "7でフィールドクリア！")))