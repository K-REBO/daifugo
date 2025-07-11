# WORKS.md - Deno JavaScript Lispインタープリター開発

## 🎯 目的
既存LispDaifugoEngine（4000行）をDeno/ブラウザで動作させるJavaScript製Lispインタープリター開発

## Phase 1: 基盤システム

### 1. プロジェクト構成・Deno環境
- [ ] 🔴 Deno環境のテスト
- [ ] 🟢 プロジェクト構成とDeno設定
- [ ] 🔁 環境設定のリファクタリング

### 2. S式パーサー
- [ ] 🔴 S式パーサーのテスト
- [ ] 🟢 基本S式解析（リスト、シンボル、数値、文字列）
- [ ] 🔁 パーサーのリファクタリング

### 3. 基本評価器
- [ ] 🔴 基本評価器のテスト
- [ ] 🟢 シンボル解決・関数適用・環境管理
- [ ] 🔁 評価器のリファクタリング

## Phase 2: コア言語機能

### 4. 関数定義システム (defun)
- [ ] 🔴 defunのテスト
- [ ] 🟢 関数定義・呼び出し・クロージャ
- [ ] 🔁 関数システムのリファクタリング

### 5. 構造体システム (defstruct)
- [ ] 🔴 defstructのテスト
- [ ] 🟢 構造体定義・コンストラクタ・アクセサー
- [ ] 🔁 構造体システムのリファクタリング

### 6. 変数束縛 (let)
- [ ] 🔴 letのテスト
- [ ] 🟢 局所変数束縛・スコープ管理
- [ ] 🔁 変数束縛のリファクタリング

## Phase 3: 制御構造

### 7. 条件分岐 (cond, when, unless)
- [ ] 🔴 条件分岐のテスト
- [ ] 🟢 cond, when, unless実装
- [ ] 🔁 条件分岐のリファクタリング

### 8. 反復構造 (dolist, dotimes)
- [ ] 🔴 反復構造のテスト
- [ ] 🟢 dolist, dotimes実装
- [ ] 🔁 反復構造のリファクタリング

### 9. 無名関数 (lambda)
- [ ] 🔴 lambdaのテスト
- [ ] 🟢 無名関数・クロージャ
- [ ] 🔁 lambdaのリファクタリング

## Phase 4: データ構造・関数群

### 10. リスト操作関数
- [ ] 🔴 リスト関数のテスト
- [ ] 🟢 mapcar, every, some, remove-if実装
- [ ] 🔁 リスト関数のリファクタリング

### 11. ハッシュテーブル
- [ ] 🔴 ハッシュテーブルのテスト
- [ ] 🟢 make-hash-table, gethash, setf実装
- [ ] 🔁 ハッシュテーブルのリファクタリング

### 12. パッケージシステム
- [ ] 🔴 パッケージのテスト
- [ ] 🟢 defpackage, in-package, export実装
- [ ] 🔁 パッケージシステムのリファクタリング

## Phase 5: 高度機能・エラー処理

### 13. エラーハンドリング
- [ ] 🔴 エラーハンドリングのテスト
- [ ] 🟢 handler-case, error実装
- [ ] 🔁 エラーハンドリングのリファクタリング

### 14. 高度機能 (intern)
- [ ] 🔴 internのテスト
- [ ] 🟢 シンボル生成・文字列変換
- [ ] 🔁 高度機能のリファクタリング

### 15. ファイル読み込み
- [ ] 🔴 ファイル読み込みのテスト
- [ ] 🟢 Deno.readTextFile + load関数
- [ ] 🔁 ファイル読み込みのリファクタリング

## Phase 6: 既存コード統合

### 16. カードシステム統合
- [ ] 🔴 カードシステム統合のテスト
- [ ] 🟢 src/core/card-system.lisp実行
- [ ] 🔁 カードシステム統合のリファクタリング

### 17. ルールシステム統合
- [ ] 🔴 ルールシステム統合のテスト
- [ ] 🟢 src/rules/rule-set.lisp実行
- [ ] 🔁 ルールシステム統合のリファクタリング

### 18. 完全システム統合
- [ ] 🔴 完全システム統合のテスト
- [ ] 🟢 LispDaifugoEngine全体実行
- [ ] 🔁 完全システム統合のリファクタリング

## Phase 7: ブラウザ対応・最適化

### 19. ブラウザ対応
- [ ] 🔴 ブラウザ対応のテスト
- [ ] 🟢 ブラウザ互換コード・UI統合
- [ ] 🔁 ブラウザ対応のリファクタリング

### 20. パフォーマンス最適化
- [ ] 🔴 パフォーマンステストの作成
- [ ] 🟢 実行速度・メモリ最適化
- [ ] 🔁 最適化のリファクタリング

---

## 現在の進行状況

**進捗率: 0% 開始**（20セクション中0セクション完了）

### 実装対象の既存Lispコード
- **src/core/card-system.lisp** - カードシステム
- **src/core/game-engine.lisp** - ゲームエンジン
- **src/rules/rule-set.lisp** - ルールセット
- **src/rules/kakumei.lisp** - 革命ルール
- **src/rules/8kiri.lisp** - 8切りルール
- **src/rules/kaidan.lisp** - 階段ルール
- **総行数**: 約1,600行（コア実装）

### 必要なLisp機能（分析済み）
- **基本**: defun, defstruct, defpackage, let, cond, when, unless
- **反復**: dolist, dotimes, lambda
- **関数**: mapcar, every, some, remove-if
- **データ**: make-hash-table, gethash, setf
- **高度**: intern（2箇所のみ）, handler-case

### 技術スタック
- **Runtime**: Deno (TypeScript/JavaScript)
- **ローカル**: deno run --allow-read
- **ブラウザ**: ES modules対応
- **テスト**: Deno標準テストランナー

---

## 次のステップ
1. Deno環境設定とプロジェクト構成（Phase 1, Section 1）
2. TDD形式での段階的実装
3. 既存Lispファイルとの継続的統合テスト