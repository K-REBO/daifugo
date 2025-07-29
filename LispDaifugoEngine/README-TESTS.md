# LispDaifugoEngine テストシステム

復元された元のテスト要件定義を使用したテストシステムです。

## 🚀 テスト実行方法

### 全テスト実行
```bash
sbcl --load test-runners/all-tests.lisp --quit
```

### カテゴリ別テスト実行

#### コアシステムテスト
```bash
sbcl --load test-runners/core-tests.lisp --quit
```
- プロジェクト構造、仕様書
- カードシステム、プレイヤーシステム
- ゲームロジック、ゲームフロー
- 手札検証システム
- ゲームロガー、AIプレイヤー

#### ルールシステムテスト
```bash
sbcl --load test-runners/rules-tests.lisp --quit
```
- ルールローダー、ルールセット
- 8切りルール（19KB）
- 革命ルール（19KB）
- 階段ルール（23KB）
- 拡張ローカルルール（25KB）

#### API層テスト
```bash
sbcl --load test-runners/api-tests.lisp --quit
```
- JavaScript API
- イベントシステム

#### 統合テスト
```bash
sbcl --load test-runners/integration-tests.lisp --quit
```
- 基本統合テスト
- 完全統合テスト
- 大規模テスト
- パフォーマンステスト

## 📁 テスト構造

```
test-runners/
├── all-tests.lisp       # 全テスト実行
├── core-tests.lisp      # コアシステム
├── rules-tests.lisp     # ルールシステム
├── api-tests.lisp       # API層
└── integration-tests.lisp # 統合テスト

tests/
├── core/               # コアコンポーネント
├── rules/              # ルールシステム
├── api/                # API層
├── events/             # イベントシステム
├── integration/        # 統合テスト
├── performance/        # パフォーマンス
└── debug/              # デバッグ用
```

## 🎯 復元されたテスト

### 重要なテストファイル（要件定義として）
- `test-rule-loader.lisp` (355行): 動的ルール読み込み22機能
- `test-8kiri.lisp` (19KB): 8切りルール詳細仕様
- `test-kakumei.lisp` (19KB): 革命ルール包括的要件
- `test-kaidan.lisp` (23KB): 階段ルール複雑仕様
- `test-extended-local-rules.lisp` (25KB): 拡張ルール仕様

### テストの価値
- **要件定義書**: 何を実装すべきかを明確に示す
- **仕様書**: どう動作すべきかを詳細に記述
- **リグレッション防止**: 既存機能の保護
- **設計ドキュメント**: システム構造の理解

## 🛠️ 次のステップ

1. **技術的修正**: パッケージ依存関係の修正のみ実施
2. **要件保護**: テストロジック・内容は一切変更しない
3. **段階的修正**: 一つずつ慎重に修正してコミット