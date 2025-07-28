# 5. APIとユーティリティ

このセクションでは、LispDaifugoEngine を外部から利用するためのAPIと、内部で使われるユーティリティ関数について解説します。

## 5.1. JavaScript API (`daifugo-api/javascript-api`)

LispDaifugoEngine は、WebブラウザなどのJavaScript環境から簡単に利用できるよう、専用のAPIを提供しています。このAPIは、Lispの関数をJavaScriptから呼び出し可能な形式に変換するラッパーとして機能します。

### 5.1.1. APIの設計

APIは、以下の設計原則に基づいています。

- **JSONベースの通信**: JavaScriptとのデータ交換は、すべてJSON形式で行われます。これにより、言語間のデータ変換が容易になります。
- **非同期処理**: APIの呼び出しは非同期で行われ、Promiseを返します。これにより、UIの応答性を損なうことなく、Lispエンジンとの通信が可能です。
- **状態の抽象化**: クライアントは、`game-state` のようなLispの内部構造を意識する必要はありません。APIを通じて、必要な情報だけが整形されて提供されます。

### 5.1.2. 主要なAPIエンドポイント

- `(get-game-state)`: 現在のゲームの状態をJSON形式で取得します。
- `(play-card player-id cards)`: プレイヤーがカードを出すアクションを送信します。
- `(pass-turn player-id)`: プレイヤーがパスするアクションを送信します。
- `(get-valid-moves player-id)`: 現在のプレイヤーが出すことのできる有効なカードの組み合わせを取得します。

## 5.2. ユーティリティ関数

`src/utils/` ディレクトリには、エンジン全体で再利用される便利なユーティリティ関数がまとめられています。

### 5.2.1. カードユーティリティ (`card-utils`)

- `(sort-cards cards)`: カードのリストを強さの順にソートします。
- `(find-card-by-rank-and-suit hand rank suit)`: 手札から特定のカードを検索します。
- `(validate-hand hand)`: 手札がルール上有効なカードで構成されているか検証します。

### 5.2.2. プレイヤーユーティリティ (`player-utils`)

- `(get-player-by-id players id)`: プレイヤーのリストから特定のIDを持つプレイヤーを取得します。
- `(update-player-rank players)`: ゲーム終了時にプレイヤーの階級を更新します。

### 5.2.3. ゲームユーティリティ (`game-utils`)

- `(determine-winner players)`: ゲームの勝者を決定します。
- `(get-next-player-id game-state)`: 次のターンを担当するプレイヤーのIDを計算します。
