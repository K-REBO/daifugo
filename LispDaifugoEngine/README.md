# LispDaifugoEngine

Common Lisp で実装された大富豪ゲームエンジン

## テスト実行

### Deno タスクランナーを使用（推奨）

```bash
# 全テスト実行
deno task test

# 個別テスト実行  
deno task test:core    # LispDaifugoEngine テスト
```

## テスト結果（現在）

- ✅ **プロジェクト構造テスト**: 17/17合格 (100%)
- ✅ **カードシステムテスト**: 8/8合格 (100%)  
- ✅ **プレイヤーシステムテスト**: 8/8合格 (100%)
- ✅ **統合テスト**: 完全動作確認済み

**全体テスト結果**: 4/4合格 (100%) 🎉

## CLI ゲームプレイ

```bash
# CLI ゲーム起動
deno task cli
```
