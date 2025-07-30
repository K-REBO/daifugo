# LispDaifugoEngine テストシステム

Quicklisp + Fiveamフレームワークを使用した近代的テストシステムです。

## 📋 必要環境
- SBCL (Common Lisp実装)
- Quicklisp (パッケージ管理)
- Fiveam (テストフレームワーク)

## 🚀 テスト実行方法

### 全テスト実行
```bash
sbcl --eval "(ql:quickload :fiveam)" \
     --load "test-runners/all-tests-runner.lisp" \
     --eval "(daifugo-test-runners:daifugo-run-all-tests)" \
     --quit
```

### カテゴリ別テスト実行

#### コアシステムテスト
```bash
sbcl --eval "(ql:quickload :fiveam)" \
     --load "test-runners/all-tests-runner.lisp" \
     --eval "(daifugo-test-runners:daifugo-run-core-tests)" \
     --quit
```

#### 基本ルールシステムテスト
```bash
sbcl --eval "(ql:quickload :fiveam)" \
     --load "test-runners/all-tests-runner.lisp" \
     --eval "(daifugo-test-runners:daifugo-run-rules-tests)" \
     --quit
```

#### ローカルルールシステムテスト（重要仕様）
```bash
sbcl --eval "(ql:quickload :fiveam)" \
     --load "test-runners/all-tests-runner.lisp" \
     --eval "(daifugo-test-runners:daifugo-run-local-rules-tests)" \
     --quit
```

#### APIテスト
```bash
sbcl --eval "(ql:quickload :fiveam)" \
     --load "test-runners/all-tests-runner.lisp" \
     --eval "(daifugo-test-runners:daifugo-run-api-tests)" \
     --quit
```

#### 統合テスト
```bash
sbcl --eval "(ql:quickload :fiveam)" \
     --load "test-runners/all-tests-runner.lisp" \
     --eval "(daifugo-test-runners:daifugo-run-integration-tests)" \
     --quit
## 📁 テスト構造

### テストカテゴリ

#### 🏗️ コアシステムテスト
- プロジェクト構造、仕様書
- カードシステム、プレイヤーシステム
- ゲームロジック、ゲームフロー
- 手札検証システム

#### 🎮 基本ルールシステムテスト
- ルールセット管理
- 8切りルール（簡易版）
- 革命ルール（簡易版）
- 階段ルール（簡易版）
- 拡張ルール（簡易版）

#### 🏠 ローカルルールシステムテスト（重要仕様）
- ルールローダー（355行仕様）
- 8切りルール（19KB完全仕様）
- 革命ルール（19KB完全仕様）
- 階段ルール（23KB完全仕様）
- 拡張ローカルルール（25KB完全仕様）

#### 🔌 API層テスト
- JavaScript API
- イベントシステム

#### 🔗 統合テスト
- エンドツーエンドテスト
- パフォーマンステスト

## 📁 ファイル構造

```
test-runners/
├── all-tests-runner.lisp         # 全テスト統合実行
├── core-tests-runner.lisp        # コアシステム
├── rules-tests-runner.lisp       # 基本ルールシステム
├── local-rules-tests-runner.lisp # ローカルルール（重要仕様）
├── api-tests-runner.lisp         # API層
└── integration-tests-runner.lisp # 統合テスト

tests/
├── core/               # コアコンポーネント
├── rules/              # ルールシステム（基本＋ローカル）
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