# WORKFLOW

## 🎯 全体目標
- t-wada推奨のTDD（Red → Green → Refactor）を中心とした開発
- git + GitHub Issue を使ったバグ・機能管理
- Anthropic推奨の`git worktree`による並列開発 :contentReference[oaicite:1]{index=1}

---

## 🛠 開発ステップ

### 1. リポジトリ初期化
- README.md に従い、`git init` → ベースブランチ作成 → 必要なファイル配置
- `git worktree add ../<proj>-main -b main`
- 環境構築：依存インストール、TDD用テストランナー（例：Jest, pytest, JUnit）導入

### 2. WORKS.md 作成
- フィーチャー単位で段階化されたTODOを記述
- 各TODOには：
  - 🔴 テストを書く
  - 🟢 通る最低限の実装を書く
  - 🔁 リファクタリングを行いコミット
- これを繰り返し、前提知識不要で完了できる粒度に

### 3. TDD開発サイクル
1. テストを書く（失敗することを確認）
2. 実装してテストを成功させる
3. リファクタリング後にコミット
4. コミットは「テスト成功時」に、なるべく小さな粒度で（≥1コミット/赤–緑–※） :contentReference[oaicite:2]{index=2}
5. GitHub Pull Request（PR）を作成し、CIを通す

### 4. 並列開発（feature/fix毎に worktree）
- 新機能・バグ毎に `git worktree add ../<proj>-<task> -b <task>` を実行 :contentReference[oaicite:3]{index=3}
- 各作業領域で独立して Claude Code や手動開発
- 完了後はPRマージ & `git worktree remove ../...`

### 5. GitHub Issue & プロセス連携
- Issue 発行 → ユーザーとコメントで仕様確認やレビュー → ブランチで対応
- PR完了でIssueクローズ。TODO未消化の場合はWORKS.md更新

---

## 📄 各セクション解説

- **段階式TODO**は初心者にも進めやすい粒度を担保\
- **並列作業**はClaude Codeとの親和性が高く、文脈切り替えロスを削減 :contentReference[oaicite:4]{index=4}
- **CI連携**で品質担保：テスト・リンティングを自動化

---

## ✅ 定義済ツール群
- テストランナー（例：Jest、pytest）
- CI テンプレート（例：GitHub Actions YAML）
- `.gitignore`、基本依存関係
- worktree起動スクリプト（例：`w.sh`）

---

## 🏁 ゴール：誰でも同じ手順でプロジェクトを完成できる状態

WORKS.md に沿って進めれば、TDD → CI → PR → Release までが自然に流れるよう設計。

