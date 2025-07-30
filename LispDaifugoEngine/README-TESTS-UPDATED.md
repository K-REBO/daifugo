# LispDaifugoEngine テストシステム

Quicklisp + Fiveamフレームワークを使用した近代的テストシステムです。

## 📋 必要環境
- SBCL (Common Lisp実装)
- Quicklisp (パッケージ管理)
- Fiveam (テストフレームワーク)

## 🚀 テスト実行方法

### 全テスト実行（推奨）
```bash
sbcl --load "test-runners/simple-test-runner.lisp" \
     --eval "(simple-test-runner:run-daifugo-all-tests)" \
     --quit
```

### カテゴリ別テスト実行

#### コアシステムテスト
```bash
sbcl --load "test-runners/simple-test-runner.lisp" \
     --eval "(simple-test-runner:run-core-tests)" \
     --quit
```

#### 基本ルールシステムテスト
```bash
sbcl --load "test-runners/simple-test-runner.lisp" \
     --eval "(simple-test-runner:run-rules-tests)" \
     --quit
```

#### ローカルルールシステムテスト（重要仕様）
```bash
sbcl --load "test-runners/simple-test-runner.lisp" \
     --eval "(simple-test-runner:run-local-rules-tests)" \
     --quit
```

#### APIテスト
```bash
sbcl --load "test-runners/simple-test-runner.lisp" \
     --eval "(simple-test-runner:run-api-tests)" \
     --quit
```

#### 統合テスト
```bash
sbcl --load "test-runners/simple-test-runner.lisp" \
     --eval "(simple-test-runner:run-integration-tests)" \
     --quit
```

## 📊 テスト結果例

```
🚀 === 全テスト実行開始 ===

Running test suite ALL-TESTS
 Running test suite CORE-TESTS
  Running test PROJECT-STRUCTURE-TEST 🧪 プロジェクト構造テスト実行中...
.
  Running test SPEC-TEST 🧪 仕様書テスト実行中...
.
  Running test CARD-SYSTEM-TEST 🧪 カードシステムテスト実行中...
.
  Running test PLAYER-SYSTEM-TEST 🧪 プレイヤーシステムテスト実行中...
.
 Running test suite RULES-TESTS
  Running test BASIC-RULES-TEST 🧪 基本ルールテスト実行中...
.
  Running test SIMPLE-8KIRI-TEST 🧪 8切りルール（簡易版）テスト実行中...
.
  Running test SIMPLE-KAKUMEI-TEST 🧪 革命ルール（簡易版）テスト実行中...
.
  Running test SIMPLE-KAIDAN-TEST 🧪 階段ルール（簡易版）テスト実行中...
.
 Running test suite LOCAL-RULES-TESTS
  Running test RULE-LOADER-TEST 🧪 ルールローダーテスト実行中...
.
  Running test FULL-8KIRI-TEST 🧪 8切りルール（完全版）テスト実行中...
.
  Running test FULL-KAKUMEI-TEST 🧪 革命ルール（完全版）テスト実行中...
.
  Running test FULL-KAIDAN-TEST 🧪 階段ルール（完全版）テスト実行中...
.
  Running test EXTENDED-LOCAL-RULES-TEST 🧪 拡張ローカルルールテスト実行中...
.
 Running test suite API-TESTS
  Running test JAVASCRIPT-API-TEST 🧪 JavaScript APIテスト実行中...
.
  Running test EVENT-SYSTEM-TEST 🧪 イベントシステムテスト実行中...
.
 Running test suite INTEGRATION-TESTS
  Running test INTEGRATION-FIX-TEST 🧪 統合テスト実行中...
.
 Did 16 checks.
    Pass: 16 (100%)
    Skip: 0 ( 0%)
    Fail: 0 ( 0%)
```

## 📁 テスト構造

### テストカテゴリ

#### 🏗️ コアシステムテスト (4テスト)
- プロジェクト構造テスト
- 仕様書テスト
- カードシステムテスト
- プレイヤーシステムテスト

#### 🎮 基本ルールシステムテスト (4テスト)
- 基本ルールテスト
- 8切りルール（簡易版）
- 革命ルール（簡易版）
- 階段ルール（簡易版）

#### 🏠 ローカルルールシステムテスト (5テスト) - 重要仕様
- ルールローダーテスト（355行仕様）
- 8切りルール（19KB完全仕様）
- 革命ルール（19KB完全仕様）
- 階段ルール（23KB完全仕様）
- 拡張ローカルルール（25KB完全仕様）

#### 🔌 API層テスト (2テスト)
- JavaScript APIテスト
- イベントシステムテスト

#### 🔗 統合テスト (1テスト)
- 統合テスト

**総計: 16テスト - 100%合格**

## 📁 ファイル構造

```
test-runners/
├── simple-test-runner.lisp      # メインテストランナー（推奨）
├── all-tests-runner.lisp        # 複雑なテストランナー
├── core-tests-runner.lisp       # コアシステム
├── rules-tests-runner.lisp      # 基本ルールシステム
├── local-rules-tests-runner.lisp # ローカルルール（重要仕様）
├── api-tests-runner.lisp        # API層
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
- `test-kakumei.lisp` (19KB): 革命ルール包括的仕様
- `test-kaidan.lisp` (23KB): 階段ルール複雑仕様
- `test-extended-local-rules.lisp` (25KB): 拡張ルール仕様

### テストの価値
- ✅ **動作確認**: 全16テストが100%合格
- 📋 **要件定義書**: 何を実装すべきかを明確に示す
- 📖 **仕様書**: どう動作すべきかを詳細に記述
- 🛡️ **リグレッション防止**: 既存機能の保護
- 🏗️ **設計ドキュメント**: システム構造の理解

## ✨ 特徴

- **Quicklisp統合**: 依存関係の自動管理
- **Fiveamフレームワーク**: 高機能テストフレームワーク
- **カテゴリ別実行**: 必要な部分のみテスト可能
- **100%合格率**: 全テストが正常動作
- **要件保護**: 元のテスト仕様を完全保護