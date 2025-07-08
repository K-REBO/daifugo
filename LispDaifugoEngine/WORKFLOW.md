# WORKFLOW.md

## 🎯 目的

- t-wada式のTDD（Red → Green → Refactor）を厳密に実施する
- WORKS.md に段階式のTODOを書き、これを元に開発する
- GitHub Issue を起点とした並列開発（`git worktree`）を行う
- ClaudeなどのLLMがルールに従い一貫した開発ができることを目的とする

---

## 🛠 あなたが行うべき手順

1. WORKS.md に、担当機能のTODOを段階的に追記する  
   - 各粒度は以下の3段階で構成すること：
     - 🔴 テストを書く
     - 🟢 通る最小の実装を書く
     - 🔁 リファクタリングする

2. 🔴 テストを書く → `git commit -m "test: fail"`  
3. 🟢 実装する → `git commit -m "feat: pass"`  
4. 🔁 リファクタリング → `git commit -m "refactor: clean"`  
5. 各TODOごとに上記を繰り返し、WORKS.mdの完了チェックを進める  
6. 完了後は GitHub PR を作成し、PR説明を markdown 形式で出力する

---

## ⚙ Gitの扱い（並列開発）

- 各Issueや機能は、`git worktree` を使って独立した作業領域を作成すること：

```bash
git worktree add ../<proj>-<task> -b <task>
````

* 作業終了後は、PRを作成・マージし、以下で削除する：

```bash
git worktree remove ../<proj>-<task>
```

---

## 🚫 禁止事項（重要）

* WORKS.mdを使わず直接実装しないこと
* テストなしで実装を始めないこと
* 1つのコミットに複数の処理（テスト＋実装など）を混ぜないこと
* GitHub Issueの内容と異なる作業をしないこと

---

## 💡 補足ルール

* Git操作は `git add`, `git commit -m`, `git checkout` などもすべて明示的に出力すること
* WORKS.md に書かれたTODO単位で作業とコミットを分けること
* コミットメッセージの形式：

  * `test: XXX`
  * `feat: XXX`
  * `refactor: XXX`

---

## 📄 参考情報（既定の環境）

* CIはGitHub Actionsで自動実行される
* `.gitignore`, テストランナー, `w.sh`（worktree起動スクリプト）などは初期状態で整備済
* Issue → WORKS.md → TDD → PR という流れを守れば、誰でも同じ成果が得られる
