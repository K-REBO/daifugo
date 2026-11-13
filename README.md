# 大富豪（Steel エンジン）

大富豪のゲームエンジンを [Steel](https://github.com/mattwparas/steel)（Rust 製の Scheme）で書き、
同じエンジンを **Web 版（Steel on WebAssembly）** と **スタンドアロン版（ネイティブ CLI）** の両方で動かす。

```
engine/            ゲームロジック（すべて Steel / Scheme）
  prelude.scm        汎用関数・決定論的な乱数
  cards.scm          カード
  hands.scm          役判定（シングル / 枚数出し / 階段、ジョーカー）と強さ比較
  rules.scm          ローカルルールの登録とフック呼び出し
  game.scm           ゲーム進行（配札・交換・出す・パス・場流れ・上がり・順位）
  ai.scm             CPU（random / weak / strong / smart）
  api.scm            ホスト向け API（JSON を返す）・シミュレーション
  rules/*.scm        ローカルルール 7 種とルールセット
  tests/*.scm        テスト（cargo test から実行）
crates/
  daifugo-host/      Steel を組み込んでエンジンを読み込む薄い層（engine/*.scm をバイナリに埋め込む）
  daifugo-cli/       スタンドアロン版 `daifugo`
  daifugo-wasm/      wasm-bindgen で JS に公開
web/               ブラウザ UI（素の HTML/CSS/JS、エンジンは Web Worker で動く）
```

旧 Common Lisp 実装（`LispDaifugoEngine/`）は Steel 版に置き換えて削除した。必要なら git の履歴（`8c83191` 以前）から取り出せる。

## 使い方

```sh
nix develop            # Rust(+wasm32) / steel / wasm-bindgen / wasm-opt / miniserve / just

just test              # テスト（Scheme のテストも含む）
just play              # 端末で遊ぶ
just play --players 5 --rules official5,kaidan --ai weak
just sim --matches 200 --rounds 3          # AI 同士の大量対戦（不変条件チェック付き）
just web && just serve                     # Web 版 → http://localhost:8080

nix run . -- play      # インストールせずにスタンドアロン版を起動
```

`daifugo play` の操作: 番号かカード id（`1 2` / `S3 H3`）で出す、`p` パス、`h` ヒント、`u` 戻す、`q` 終了。

## ルール

基本: 52 枚 + ジョーカー 2 枚、2〜8 人。3 が最弱で 2 が最強、ジョーカーはさらに強いワイルドカード。
1 ゲーム目は ♦3 を持つ人から始め、2 ゲーム目以降は大貧民から始める。2 ゲーム目以降はカード交換をする
（大貧民→大富豪 2 枚、貧民→富豪 1 枚は自動で最強カード。大富豪・富豪は好きなカードを返す）。
パスした人は、その場が流れるまで出せない。

| 名前 | ルール | オプション |
|---|---|---|
| `kakumei` | 革命: 4 枚以上で強さが逆転 | `kaidan-revolution`（階段でも革命） |
| `8giri` | 8切り: 8 で場が流れ、出した人から再開 | `kaidan-8giri`（階段の 8 でも） |
| `11back` | 11バック: J で場が流れるまで逆転 | |
| `kaidan` | 階段: 同スート連番 3 枚以上（2→3 はつながらない） | |
| `shibari` | 縛り: 同じマークが続くとそのマークしか出せない | |
| `spade3` | スペ3返し: 単騎ジョーカーに ♠3、場が流れる | |
| `miyakoochi` | 都落ち: 大富豪が 1 位でないと大貧民に | |

ルールセット: `none` / `basic`（革命・8切り・階段） / `official5`（旧 SPEC の 5 ルール） / `all`。

## ルールを追加する

ルールはフックの組。新しい `.scm` を書いて読み込むだけで使える（再ビルド不要）。

```scheme
(define-rule! '9giri "9切り" "9を出すと場が流れる。"
  (hash 'on-play
        (lambda (st player p prev)
          (if (and (memq (play-type p) '(single set)) (= (play-rank p) 9))
              (request-flush (add-event st 'eight player "9切り！"))
              st))))
```

- CLI: `daifugo play --load my-rule.scm --rules all,9giri`
- Web: 設定画面の「詳細設定 → 自作ルール」に貼る

フック: `enables`（役の種類を有効化）, `can-follow`（`'allow` / `'deny` で出せるかを上書き）,
`on-play`, `on-clear`, `on-player-out`。詳しくは `engine/rules.scm` と `engine/rules/*.scm`。

## 設計メモ

- 状態は不変のハッシュで、操作は「状態 → 新しい状態」。不正な操作は `error` を投げる。undo は履歴を戻すだけ。
- 乱数はシード付きの LCG。同じシードなら Web とネイティブで同じゲームになる（確認済み）。
- Rust ↔ Steel の境界は「引数は整数・文字列・リスト、戻り値は JSON 文字列」に限定し、Steel の内部型に依存しない。
- Steel 0.8.3 の注意点: `list->vector` は不変ベクタを返す。`call/cc` を入れ子にすると継続が正しく戻らない
  （例外処理は `with-handler` だけで書く）。
