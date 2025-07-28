;;; run-card-test.lisp - カードシステムテスト実行

;; card-systemを読み込み
(load "src/core/card-system.lisp")

;; テストファイルを読み込み
(load "tests/test-card-system.lisp")

;; テスト実行
(daifugo-card-system-test:run-card-system-tests)