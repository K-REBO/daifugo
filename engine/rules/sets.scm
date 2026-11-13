;;; ルールセット

(define-rule-set! 'none "ローカルルールなし" '())
(define-rule-set! 'basic "基本（革命・8切り・階段）" '(kakumei 8giri kaidan))
(define-rule-set! 'official5 "公式5ルール（旧SPEC準拠: 革命・8切り・都落ち・縛り・スペ3返し）"
  '(kakumei 8giri miyakoochi shibari spade3))
(define-rule-set! 'all "全部入り" '(kakumei 8giri kaidan shibari 11back spade3 miyakoochi))
