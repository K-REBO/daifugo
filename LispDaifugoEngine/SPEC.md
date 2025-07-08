# 大富豪ゲームエンジン仕様書

## 1. 概要

Common Lispで実装された大富豪カードゲームのエンジンです。
動的なローカルルール読み込み機能と強力なテスト・デバッグ基盤を持つ拡張性の高いゲームエンジンです。

## 2. 基本仕様

### 2.1 技術仕様
- **言語**: Common Lisp
- **エンジン**: Common Lisp単体で動作（JavaScript非依存）
- **UI**: JavaScript インターフェース（UIのみ）
- **拡張性**: 動的ローカルルール読み込み
- **テスト**: 強力なロガーと自動テスタ搭載

### 2.2 対応人数
- 基本：2-8人
- 推奨：4-6人

## 3. 基本ルール

### 3.1 カード仕様
- **デッキ**: 52枚 + ジョーカー2枚
- **カード強度**: 3(弱) → 4 → 5 → 6 → 7 → 8 → 9 → 10 → J → Q → K → A → 2(強) → ジョーカー(最強)

### 3.2 階級システム
- **大富豪** (1位)
- **富豪** (2位)  
- **平民** (3位以下、最下位-1まで)
- **貧民** (最下位-1)
- **大貧民** (最下位)

### 3.3 カード交換
2ゲーム目以降：
- 大貧民 → 大富豪: 最強カード2枚
- 貧民 → 富豪: 最強カード1枚
- 大富豪 → 大貧民: 任意カード2枚
- 富豪 → 貧民: 任意カード1枚

### 3.4 手札の出し方
- **単枚出し**: 1枚のカード
- **ペア**: 同じ数字2枚
- **3枚出し**: 同じ数字3枚
- **4枚出し**: 同じ数字4枚（革命発生）
- **階段出し**: 同じマークで連続した数字3枚以上（ローカルルール）

### 3.5 ゲームフロー
1. カード配布（均等分配）
2. カード交換（2ゲーム目以降）
3. 大貧民から開始
4. 順番にカードを出す
5. パスまたは場流れまで継続
6. 手札なしで上がり
7. 階級決定

## 4. 動的ローカルルール システム

### 4.1 ローカルルール ファイル構成
```
rules/
├── kakumei.lisp      # 革命ルール
├── 8kiri.lisp        # 8切りルール
├── 11back.lisp       # 11バック（逆回転）
├── kaidan.lisp       # 階段出し
├── sute-shibari.lisp # スート縛り
├── spe3gaeshi.lisp   # スペ3返し
├── miyakoochi.lisp   # 都落ち
└── combined/         # 複合ルールセット
    ├── japan-official.lisp  # 日本大富豪連盟公式5ルール
    └── custom-set.lisp      # カスタムルールセット
```

### 4.2 ローカルルール 仕様

#### 4.2.1 革命（kakumei.lisp）
- **発動条件**: 同じ数字4枚同時出し
- **効果**: ジョーカー以外の強弱逆転
- **階段革命**: 4枚以上の階段で革命（オプション）

#### 4.2.2 8切り（8kiri.lisp）
- **発動条件**: 8を含むカード出し
- **効果**: 場が流れ、次プレイヤーが任意カード出し可能
- **制限**: 階段内の8は無効

#### 4.2.3 11バック（11back.lisp）
- **発動条件**: 11（J）を含むカード出し
- **効果**: ゲーム進行が逆時計回りに変更

#### 4.2.4 階段出し（kaidan.lisp）
- **条件**: 同じマーク、連続数字、3枚以上
- **制限**: 2-3間は非連続
- **比較方式**: 重複OK/NG設定可能

#### 4.2.5 スート縛り（sute-shibari.lisp）
- **発動条件**: 同じマークカード出し
- **効果**: 以降同じマークのみ出し可能

#### 4.2.6 スペ3返し（spe3gaeshi.lisp）
- **発動条件**: ジョーカー出しに対し
- **効果**: スペードの3でジョーカーを無効化

#### 4.2.7 都落ち（miyakoochi.lisp）
- **発動条件**: 大富豪が1位以外で終了
- **効果**: 大富豪が強制的に大貧民に降格

## 5. テスト・デバッグ基盤

### 5.1 強力なゲームロガー
- **イベントログ**: 全ゲームイベントの詳細記録
- **状態スナップショット**: 各ターン毎の完全状態保存
- **ルール適用ログ**: ローカルルール発動の詳細記録
- **統計情報**: プレイヤー別・ルール別統計
- **リプレイ機能**: ログからのゲーム再現

### 5.2 自動テスタシステム
- **擬似プレイヤー**: 多様な戦略を持つAIプレイヤー
- **大量テスト**: 数千〜数万回のゲーム自動実行
- **回帰テスト**: 新機能追加時の既存機能チェック
- **境界値テスト**: 極端な状況での動作検証
- **パフォーマンステスト**: 大規模ゲームでの性能測定

### 5.3 AIプレイヤー種別
- **ランダムプレイヤー**: 完全ランダム行動
- **グリーディプレイヤー**: 常に最強カードを出す
- **コンサーバティブプレイヤー**: 保守的な戦略
- **アグレッシブプレイヤー**: 攻撃的な戦略
- **アダプティブプレイヤー**: 状況適応型戦略

## 6. システム アーキテクチャ

### 6.1 コア モジュール構成
```
src/
├── core/
│   ├── game-engine.lisp     # メインゲームエンジン
│   ├── card-system.lisp     # カード管理
│   ├── player-system.lisp   # プレイヤー管理
│   └── rule-engine.lisp     # ルール処理エンジン
├── rules/
│   ├── basic-rules.lisp     # 基本ルール
│   └── rule-loader.lisp     # 動的ルール読み込み
├── testing/
│   ├── game-logger.lisp     # ゲームロガー
│   ├── auto-tester.lisp     # 自動テスタ
│   └── ai-players.lisp      # AIプレイヤー
├── api/
│   └── javascript-api.lisp  # JavaScript インターフェース
└── utils/
    ├── card-utils.lisp      # カード操作ユーティリティ
    └── game-utils.lisp      # ゲーム操作ユーティリティ
```

### 6.2 動的ルール読み込み機能

#### 6.2.1 ルール読み込み API
```lisp
(load-local-rule "rules/kakumei.lisp")
(load-rule-set "rules/combined/japan-official.lisp")
(unload-rule "kakumei")
(list-active-rules)
```

#### 6.2.2 ルール定義形式
```lisp
(defrule kakumei
  :trigger (lambda (cards) (and (= (length cards) 4) (same-rank-p cards)))
  :effect (lambda (game-state) (toggle-revolution game-state))
  :description "同じ数字4枚で革命発生")
```

### 6.3 ロガーシステム

#### 6.3.1 ログ記録API
```lisp
(log-event :card-played :player player-id :cards cards)
(log-state-snapshot game-state)
(log-rule-trigger :rule-name 'kakumei :effect "革命発生")
(export-game-log "game-20240708-001.log")
```

#### 6.3.2 ログ分析API
```lisp
(analyze-game-statistics log-file)
(find-rule-usage-patterns log-file)
(detect-game-anomalies log-file)
(generate-replay-from-log log-file)
```

### 6.4 自動テスタシステム

#### 6.4.1 テスト実行API
```lisp
(run-bulk-test :games 10000 :players 4 :rules '(kakumei 8kiri))
(run-regression-test test-suite)
(run-performance-test :duration 3600)
(validate-rule-interactions '(kakumei kaidan))
```

#### 6.4.2 テスト結果分析
```lisp
(analyze-test-results test-results)
(detect-balance-issues test-results)
(generate-test-report test-results)
```

## 7. JavaScript UI インターフェース

### 7.1 ゲーム制御 API（UIのみ）
```javascript
// ゲーム表示制御
const gameUI = new DaifugoUI();
gameUI.displayGame(gameState);
gameUI.updatePlayerHand(playerId, cards);
gameUI.showGameLog(logData);

// ユーザー入力処理
gameUI.onCardSelection((cards) => {
  // Lispエンジンに送信
  lispEngine.playCard(currentPlayer, cards);
});

// ゲーム状態表示
gameUI.displayCurrentPlayer(playerId);
gameUI.displayGameResult(results);
```

### 7.2 イベント システム
```javascript
gameUI.on('gameStateChanged', (gameState) => {});
gameUI.on('playerAction', (action) => {});
gameUI.on('ruleTriggered', (ruleName, effect) => {});
```

## 8. 拡張性

### 8.1 新規ローカルルール追加
1. `rules/` ディレクトリに `.lisp` ファイル作成
2. `defrule` マクロでルール定義
3. 動的読み込みでゲームに適用

### 8.2 カスタムルールセット作成
```lisp
(defrule-set my-custom-rules
  :rules (kakumei 8kiri kaidan)
  :configuration ((kaidan :overlap-mode :allowed)
                  (kakumei :stair-revolution t)))
```

### 8.3 新規AIプレイヤー追加
```lisp
(defclass strategic-ai-player (ai-player)
  ((strategy :initarg :strategy :accessor strategy)))

(defmethod make-move ((player strategic-ai-player) game-state)
  (apply-strategy (strategy player) game-state))
```

## 9. テスト仕様

### 9.1 単体テスト
- 各ルールの動作検証
- カード操作の正確性
- プレイヤー管理機能

### 9.2 統合テスト
- ゲームフロー全体
- ローカルルール組み合わせ
- JavaScript UI連携

### 9.3 自動プレイテスト
- 10,000回以上の自動ゲーム実行
- 各ルール組み合わせでの動作検証
- 統計的バランス分析

### 9.4 性能テスト
- 大量カード処理
- 複数ルール同時適用
- 長時間ゲーム実行

## 10. 実装フェーズ

### Phase 1: 仕様書作成とプロジェクト構成
- [ ] 仕様書作成
- [ ] プロジェクト構成整備

### Phase 2: コアエンジン実装
- [ ] カードシステム実装
- [ ] プレイヤー管理システム
- [ ] 基本ゲームロジック
- [ ] 手札出し判定システム

### Phase 3: テスト・デバッグ基盤
- [ ] ゲームロガーシステム
- [ ] 自動テスタシステム
- [ ] AIプレイヤー実装

### Phase 4: 動的ルールシステム
- [ ] ルール読み込み機能
- [ ] 基本ローカルルール実装
- [ ] 階段出しルール

### Phase 5: JavaScript UIインターフェース
- [ ] JavaScript API
- [ ] イベントシステム

### Phase 6: 拡張ローカルルール
- [ ] 残りローカルルール実装
- [ ] ルールセット機能

### Phase 7: 包括的テスト・デバッグ
- [ ] 統合テスト・プレイテスト
- [ ] 大規模自動テスト
- [ ] 性能最適化

## 11. 技術的制約

### 11.1 Common Lisp実装
- SBCL推奨
- ポータブルコード
- 外部ライブラリ最小限

### 11.2 JavaScript UI
- JSONでのデータ交換
- 非同期処理対応
- 表示・入力処理のみ

### 11.3 メモリ管理
- ガベージコレクション考慮
- 大規模ゲーム対応
- リソース効率化

### 11.4 ログ・テスト
- 大量ログデータ処理
- 高速テスト実行
- 統計分析処理

---

**Version**: 1.0  
**Date**: 2024-07-08  
**Author**: Daifugo Engine Development Team