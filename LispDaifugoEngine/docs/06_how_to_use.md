# 6. 開発者向けガイド

このセクションでは、LispDaifugoEngine を使って開発を始めるための手順を解説します。

## 6.1. セットアップ

### 6.1.1. 必要なソフトウェア

- **Common Lisp 環境**: SBCL (Steel Bank Common Lisp) を推奨します。
- **Quicklisp**: Common Lisp のライブラリマネージャです。

### 6.1.2. インストール手順

1. **リポジトリのクローン**:
   ```bash
   git clone https://github.com/your-username/LispDaifugoEngine.git
   cd LispDaifugoEngine
   ```

2. **依存ライブラリのインストール**:
   Quicklisp を使って、必要なライブラリをインストールします。
   ```lisp
   (ql:quickload :LispDaifugoEngine)
   ```

## 6.2. 基本的な使い方

以下は、LispDaifugoEngine を使って簡単なゲームを動かす例です。

```lisp
;; 必要なパッケージをロード
(load "load-all.lisp")

;; 4人プレイのゲームを作成
(defvar *game* (daifugo-game-engine:create-game 4))

;; ゲームを開始
(daifugo-game-engine:start-game *game*)

;; 現在のプレイヤーを取得
(let ((current-player-id (daifugo-game-engine:get-current-player *game*)))
  (format t "現在のプレイヤーは ~A です。~%" current-player-id)

  ;; 現在のプレイヤーの手札を取得
  (let* ((player (nth current-player-id (daifugo-game-engine:game-state-players *game*)))
         (hand (daifugo-player-system:player-hand player)))
    (format t "手札: ~A~%" hand)

    ;; 例として、手札から最初のカードを出す
    (when hand
      (let ((card-to-play (list (first hand))))
        (format t "~A を出します。~%" card-to-play)
        (daifugo-game-engine:play-card *game* current-player-id card-to-play)))))

;; ゲームが終了するまでループ (実際のゲームループはより複雑になります)
(loop until (daifugo-game-engine:game-over-p *game*)
      do (progn
           ;; ここにゲームの進行ロジックを記述
           (format t "ゲーム進行中...~%")
           ;; (daifugo-game-engine:advance-turn *game*)
           (sleep 1)
           ;; このループはデモ用のため、手動で終了してください
           (return)
           ))

(format t "ゲーム終了！~%")
```

## 6.3. 新しいルールの追加

新しいルールを追加するには、以下の手順に従います。

1. **ルールファイルの作成**: `src/rules/` ディレクトリに、新しいルールを定義するLispファイルを作成します（例：`my-new-rule.lisp`）。

2. **ルールの定義**: ファイル内で、`daifugo-rule-engine:make-rule` を使ってルールを定義します。
   ```lisp
   (in-package :daifugo-rule-engine)

   (defvar *my-new-rule*
     (make-rule :name :my-new-rule
                :trigger (lambda (game-state context)
                           ;; ルールが発動する条件をここに記述
                           t)
                :effect (lambda (game-state context)
                          ;; ルールの効果をここに記述
                          (format t "新しいルールが適用されました！~%"))
                :description "これは新しいルールのサンプルです。"
                :priority 50))
   ```

3. **ルールの登録**: 作成したルールをルールエンジンに登録します。
   ```lisp
   (daifugo-rule-engine:register-rule *my-new-rule*)
   ```

   または、`rules/combined/custom-set.lisp` のようなルールセットファイルにルールを追加して、まとめてロードすることもできます。

## 6.4. テストの実行

`tests/` ディレクトリに、各モジュールのテストが用意されています。

`run-card-test.lisp` などのテスト実行用ファイルを使って、テストを実行できます。

```bash
# SBCLでテストを実行する例
sbcl --load run-card-test.lisp --eval "(uiop:quit)"
```
