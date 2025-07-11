# Deno Lisp Interpreter

既存のLispDaifugoEngine（4000行）をブラウザ/Deno環境で動作させるJavaScript製Lispインタープリター

## 🎯 目的

- 既存のCommon Lispコードをそのまま実行
- Deno環境でのローカル実行対応
- ブラウザでの実行対応
- TDD形式での段階的実装

## 🚀 クイックスタート

### 必要環境
- Deno 2.0+ 

### インストール・実行

```bash
# プロジェクトルートで
cd deno-lisp-interpreter

# ステータス確認
deno task start

# 既存Lispファイル読み込みテスト
deno task load-lisp

# テスト実行
deno task test
```

## 📁 プロジェクト構造

```
deno-lisp-interpreter/
├── deno.json              # Deno設定
├── src/
│   ├── main.ts            # エントリーポイント
│   ├── parser/            # S式パーサー (Phase 1)
│   ├── evaluator/         # Lisp評価器 (Phase 2)
│   ├── builtin/           # 組み込み関数 (Phase 3-4)
│   └── integration/       # 既存コード統合 (Phase 5-6)
├── test/                  # テストファイル
└── README.md
```

## 🛠 実装対象

### 既存Lispファイル
- `../LispDaifugoEngine/src/core/card-system.lisp`
- `../LispDaifugoEngine/src/core/game-engine.lisp`  
- `../LispDaifugoEngine/src/rules/*.lisp`

### 必要なLisp機能
- **基本**: `defun`, `defstruct`, `defpackage`, `let`, `cond`
- **制御**: `when`, `unless`, `dolist`, `dotimes`, `lambda`
- **関数**: `mapcar`, `every`, `some`, `remove-if`
- **データ**: `make-hash-table`, `gethash`, `setf`
- **高度**: `intern`, `handler-case`

## 📋 開発進捗

実装状況は`../WORKS.md`で管理

- [ ] Phase 1: 基盤システム (3セクション)
- [ ] Phase 2: コア言語機能 (3セクション)  
- [ ] Phase 3: 制御構造 (3セクション)
- [ ] Phase 4: データ構造・関数群 (3セクション)
- [ ] Phase 5: 高度機能・エラー処理 (3セクション)
- [ ] Phase 6: 既存コード統合 (3セクション)
- [ ] Phase 7: ブラウザ対応・最適化 (2セクション)

## 🧪 テスト

```bash
# 全テスト実行
deno task test

# 特定テスト実行
deno test --allow-read test/deno-environment.test.ts
```

## 📜 ライセンス

MIT License