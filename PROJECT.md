# 大富豪判定エンジン(with Lisp)
## 1. ドメインと目的

* **対象**：大富豪ゲームにおける「出せる手」の判定を、ユーザー／開発者が自由にルール追加・変更できるDSLで定義。
* **目標**：

  * サウンドで拡張性と柔軟性：ルールは `.lisp` ファイル等で後から追加可能。
  * 明示的かつ安全な評価：Carmack流に高速性重視かつ純粋関数中心（副作用最小に）。
  * RMS流にエンジニアリング自由を維持しつつ、GPLライセンス考慮。
  * Lisp創始者McCarthy流にS式でルールを自然に定義、マクロによる抽象化を活用。

---

## 2. システム構成

```
┌──────────────────┐
│ ルール定義ファイル│───┐
│  (e.g. suit.lisp) │    │
└──────────────────┘    │
                        │load-rules→
┌──────────────────┐    │
│    ルールエンジン  │◀──┘
│ - Lispインタプリタ│
│ - `can-play?` 関数│
└──────────────────┘
        ▲
        │ Eval
        │
┌──────────────────┐
│   ゲーム状態情報  │
│ (field, play, rules-map)│
└──────────────────┘
```

### モジュール

1. **Lispインタプリタ**

   * 最小限のS式＋評価環境（McCarthy風）
   * マクロ処理対応（`defrule` マクロ）

2. **ルールローダ**

   * 指定ディレクトリから `.lisp` ルールを読み込み `defrule` で登録

3. **判定関数 `can-play?`**

   * 全ルール関数を順次 `every` で評価し、すべて `t` なら可

4. **ホストAPI**

   * `card-rank`, `card-suit`, `field-cards`, `play-cards`, `rules-flag` など

---

## 3. DSL仕様

### 3.1 `defrule` マクロ

```lisp
(defrule suit-binding
  "スート縛り：場のスートと一致しなければならない"
  (lambda (field play rules)
    (let ((suit-bind (get rules 'suit-binding))
          (fs (get field 'suit)))
      (if (and suit-bind fs)
          (every (lambda (c) (eq (card-suit c) fs))
                 (get play 'cards))
          t))))
```

* `(defrule 名前 "説明" 関数)` 形式で登録

### 3.2 `can-play?` 関数

```lisp
(defun can-play? (field play rules)
  (every (lambda (r) (funcall r field play rules))
         *registered-rules*))
```

### 3.3 ホスト提供API（例）

* `(card-suit card)` → `"♠"` `"♥"` 等
* `(card-rank card reversed?)` → ランク数値
* `(get field 'suit)` → 縛り中スート or `nil`
* `(get rules 'suit-binding)` → `t` or `nil`
* `(get play 'cards)` → 出そうとしているカードリスト

---

## 4. 高速／安全性設計（Carmack/RMS観点）

* **純粋関数**：副作用抑制。リープ前提の高速性確保([cbarrete.com][1])。
* **静的解析・型チェック**：`card` は `(suit . rank)`、`rules` は連想リストなど明確な構造。
* **メモリ耐性**：Lisp評価時のメモリ割当を最小化し、リアルタイム性を意識。

---

## 5. 追加ルールの設計思想

* RMS風に**ユーザーが自由に定義・配布可能**（GPLライクな構成）。
* McCarthy風に**S式とマクロで自然なルール拡張**。例：

```lisp
(defrule revolution
  "革命：4枚出すとランク逆転"
  ...)
```

* ルールセットを`.lisp`で構成し、共有。

---

## 6. 使用例

```lisp
;; suit.lisp
(defrule suit-binding ...)

;; revolution.lisp
(defrule revolution ...)

;; main.lisp
(load "suit.lisp")
(load "revolution.lisp")
(let* ((field ...)
       (play ...)
       (rules '((suit-binding . t) (revolution . t))))
  (if (can-play? field play rules)
      (print "OK")
      (print "NG")))
```

---

## 7. ドキュメントと仕様書構成

1. **目的・背景**（DSL 　　　拡張性＋動的読み込み）
2. **システム構成図**
3. **ホスト言語環境**
4. **DSL文法仕様**
5. **標準ルール・API仕様**
6. **`defrule`マクロ詳細**
7. **実装例：スート縛り／革命／8切り**
8. **拡張方法と共有ルール設計**
9. **パフォーマンス・安全性ガイドライン**
10. **ライセンス・配布設計**

---
