# 大富豪ゲームエンジン

Common Lispで実装された大富豪カードゲームエンジンです。

## 特徴

- **Pure Lisp実装**: JavaScriptに依存しない純粋なCommon Lisp実装
- **動的ルール読み込み**: ローカルルールを動的に読み込み・適用可能
- **強力なテスト基盤**: 自動テスタ、ロガー、AIプレイヤーを内蔵
- **JavaScript UI**: UI表示のみJavaScriptで実装

## クイックスタート

### 1. エンジン読み込み

```lisp
(load "load-all.lisp")
```

### 2. ゲーム作成

```lisp
(defvar *game* (daifugo-game-engine:create-game 4))
```

### 3. ローカルルール読み込み

```lisp
;; 革命ルール
(daifugo-rule-loader:load-local-rule "rules/kakumei.lisp")

;; 日本大富豪連盟公式ルール
(daifugo-rule-loader:load-rule-set "rules/combined/japan-official.lisp")
```

### 4. テスト実行

```lisp
;; プロジェクト構成テスト
(load "test-project-structure.lisp")

;; 大量自動テスト
(daifugo-auto-tester:run-bulk-test :games 1000 :players 4)
```

## ディレクトリ構成

```
LispDaifugoEngine/
├── src/
│   ├── core/           # コアシステム
│   ├── rules/          # ルールシステム
│   ├── testing/        # テスト・デバッグ
│   ├── api/            # JavaScript API
│   └── utils/          # ユーティリティ
├── rules/              # ローカルルール
│   ├── kakumei.lisp    # 革命
│   ├── 8kiri.lisp      # 8切り
│   ├── kaidan.lisp     # 階段出し
│   └── combined/       # ルールセット
├── logs/               # ログ出力
├── tests/              # テストファイル
├── SPEC.md             # 仕様書
├── WORKS.md            # 作業計画
└── load-all.lisp       # 全モジュール読み込み
```

## 主要機能

### ローカルルール

- **革命** (kakumei.lisp): 4枚出しで強弱逆転
- **8切り** (8kiri.lisp): 8で場が流れる
- **階段出し** (kaidan.lisp): 連続数字の同時出し
- **11バック** (11back.lisp): Jでターン逆転
- **スート縛り** (sute-shibari.lisp): 同じスートのみ
- **スペ3返し** (spe3gaeshi.lisp): ジョーカーを無効化
- **都落ち** (miyakoochi.lisp): 大富豪が降格

### テスト・デバッグ

- **ゲームロガー**: 全イベントの詳細記録
- **自動テスタ**: 大量テスト実行
- **AIプレイヤー**: 5種類の戦略パターン

### JavaScript API

UI表示用のシンプルなAPI:

```javascript
const gameUI = new DaifugoUI();
gameUI.displayGame(gameState);
gameUI.updatePlayerHand(playerId, cards);
```

## 開発

### テスト実行

```bash
# プロジェクト構成テスト
sbcl --load test-project-structure.lisp --quit

# 仕様書テスト
sbcl --load test-spec.lisp --quit
```

### 新しいローカルルール作成

1. `rules/` ディレクトリに `.lisp` ファイル作成
2. `defrule` マクロでルール定義
3. `daifugo-rule-loader:load-local-rule` で読み込み

### コミット

TDD形式でコミット:

```bash
git commit -m "test: 新機能のテスト作成"
git commit -m "feat: 新機能の実装"
git commit -m "refactor: コードの最適化"
```

## ライセンス

MIT License