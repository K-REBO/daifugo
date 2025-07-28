;;; game-logic.lisp - 基本ゲームロジック実装

(defpackage :daifugo-game-logic
  (:use :common-lisp)
  (:export #:validate-card-play
           #:get-card-play-error
           #:is-valid-sequence
           #:is-same-rank
           #:is-revolution
           #:is-eight-cut
           #:remove-cards-from-hand
           #:field-strength
           #:process-card-play
           #:process-pass
           #:clear-field
           ;; 手札判定関数
           #:is-valid-single-card
           #:is-valid-pair
           #:is-valid-triple
           #:is-valid-quadruple
           #:compare-single-cards
           #:compare-pairs
           #:compare-triples
           #:compare-quadruples
           #:compare-sequences
           #:get-hand-type
           #:hands-compatible-p
           #:is-valid-hand
           #:can-play-hand
           #:hand-stronger-p))

(in-package :daifugo-game-logic)

;;; ============================================================================
;;; カード検証関数群
;;; ============================================================================

(defun is-same-rank (cards)
  "全てのカードが同じランクかチェック
   引数: cards - カードのリスト
   戻り値: すべて同じランクならT、そうでなければNIL"
  (when cards
    (let ((first-rank (daifugo-card-system:card-rank (first cards))))
      (every (lambda (card)
               (eql (daifugo-card-system:card-rank card) first-rank))
             cards))))

(defun is-valid-sequence (cards)
  "階段になっているかチェック（3枚以上の連続カード）
   引数: cards - カードのリスト
   戻り値: 階段になっているならT、そうでなければNIL"
  (when (>= (length cards) 3)
    (let ((sorted-cards (sort (copy-list cards) 
                              (lambda (a b) 
                                (< (daifugo-card-system:card-strength a)
                                   (daifugo-card-system:card-strength b))))))
      (loop for i from 1 below (length sorted-cards)
            always (= (daifugo-card-system:card-strength (nth i sorted-cards))
                      (1+ (daifugo-card-system:card-strength (nth (1- i) sorted-cards))))))))

(defun is-revolution (cards)
  "革命（4枚同じランク）かチェック
   引数: cards - カードのリスト
   戻り値: 革命条件を満たすならT、そうでなければNIL"
  (and (= (length cards) 4)
       (is-same-rank cards)))

(defun is-eight-cut (cards)
  "8切りかチェック（8のカード1枚でフィールドをクリア）
   引数: cards - カードのリスト
   戻り値: 8切り条件を満たすならT、そうでなければNIL"
  (and (= (length cards) 1)
       (eql (daifugo-card-system:card-rank (first cards)) 8)))

;;; ============================================================================
;;; ユーティリティ関数群
;;; ============================================================================

(defun field-strength (field-cards)
  "フィールドのカード強度を取得
   引数: field-cards - フィールドのカードリスト
   戻り値: フィールドの代表カード強度（数値）"
  (when field-cards
    (daifugo-card-system:card-strength (first field-cards))))


(defun remove-cards-from-hand (player cards)
  "プレイヤーの手札からカードを削除
   引数: player - プレイヤーオブジェクト
         cards - 削除するカードのリスト
   戻り値: なし（副作用としてプレイヤーの手札を更新）"
  (let ((hand (daifugo-player-system:player-hand player)))
    (dolist (card cards)
      (setf hand (remove card hand :test #'equalp :count 1)))
    (setf (daifugo-player-system:player-hand player) hand)))

(defun clear-field (game-state)
  "フィールドをクリア（8切りなどで使用）
   引数: game-state - ゲーム状態オブジェクト
   戻り値: なし（副作用としてフィールドをクリア）"
  (setf (daifugo-game-state:game-state-field game-state) nil))

;;; ============================================================================
;;; カード出し妥当性チェック関数群
;;; ============================================================================

(defun get-card-play-error (cards field revolution-p)
  "カード出しのエラー理由を取得
   引数: cards - 出そうとするカードのリスト
         field - 現在のフィールドカード
         revolution-p - 革命状態フラグ
   戻り値: エラーメッセージ文字列（正常な場合はNIL）"
  (cond
    ;; フィールドが空の場合は何でも出せる
    ((null field) nil)
    ;; 8切りは常に出せる
    ((is-eight-cut cards) nil)
    ;; 枚数が違う場合は出せない
    ((/= (length cards) (length field)) 
     (format nil "カード枚数が合いません。フィールド:~A枚, 出そうとしたカード:~A枚" 
             (length field) (length cards)))
    ;; 革命状態の場合は強度が逆転
    (revolution-p
     (unless (< (daifugo-card-system:card-strength (first cards))
                (field-strength field))
       (format nil "革命状態では弱いカードを出す必要があります。フィールド強度:~A, 出したカード強度:~A" 
               (field-strength field) (daifugo-card-system:card-strength (first cards)))))
    ;; 通常は強度が高い必要がある
    (t
     (unless (> (daifugo-card-system:card-strength (first cards))
                (field-strength field))
       (format nil "より強いカードを出す必要があります。フィールド強度:~A, 出したカード強度:~A" 
               (field-strength field) (daifugo-card-system:card-strength (first cards)))))))

(defun validate-card-play (cards field revolution-p)
  "カード出しの妥当性を検証（統合版）
   引数: cards - 出そうとするカードのリスト
         field - 現在のフィールドカード
         revolution-p - 革命状態フラグ
   戻り値: 妥当ならT、そうでなければNIL"
  (can-play-hand cards field revolution-p))

;;; ============================================================================
;;; メインゲームロジック処理関数群
;;; ============================================================================

(defun process-card-play (game-state player-id cards)
  "カード出しの処理（改良版）
   引数: game-state - ゲーム状態オブジェクト
         player-id - プレイヤーID
         cards - 出すカードのリスト
   戻り値: 成功時T、失敗時エラーを投げる"
  (let* ((player (nth player-id (daifugo-game-engine:game-state-players game-state)))
         (field (daifugo-game-engine:game-state-field game-state))
         (revolution-p (daifugo-game-engine:game-state-revolution-p game-state)))
    
    ;; カードの妥当性チェック（詳細エラーメッセージ付き）
    (let ((error-msg (get-card-play-error cards field revolution-p)))
      (when error-msg
        (error "無効なカード出し: ~A" error-msg)))
    
    ;; 手札からカードを削除
    (remove-cards-from-hand player cards)
    
    ;; フィールドを更新
    (setf (daifugo-game-engine:game-state-field game-state) cards)
    
    ;; 革命チェック
    (when (is-revolution cards)
      (setf (daifugo-game-engine:game-state-revolution-p game-state)
            (not revolution-p))
      (daifugo-game-engine:add-log game-state 
                                   (format nil "プレイヤー~A が革命を起こしました！" player-id)))
    
    ;; 8切りチェック
    (when (is-eight-cut cards)
      (clear-field game-state)
      (daifugo-game-engine:add-log game-state 
                                   (format nil "プレイヤー~A が8切りでフィールドをクリアしました" player-id)))
    
    ;; ログ追加
    (daifugo-game-engine:add-log game-state 
                                 (format nil "プレイヤー~A が~A枚のカードを出しました" 
                                         player-id (length cards)))
    t))

(defun process-pass (game-state player-id)
  "パスの処理
   引数: game-state - ゲーム状態オブジェクト
         player-id - プレイヤーID
   戻り値: 常にT"
  (daifugo-game-engine:add-log game-state 
                               (format nil "プレイヤー~A がパスしました" player-id))
  t)

;;; ============================================================================
;;; 手札出し判定システム
;;; ============================================================================

;;; 単枚出し判定
(defun is-valid-single-card (cards)
  "単枚出しの妥当性をチェック
   引数: cards - カードのリスト
   戻り値: 単枚出しとして妥当ならT、そうでなければNIL"
  (= (length cards) 1))

;;; ペア出し判定
(defun is-valid-pair (cards)
  "ペア出しの妥当性をチェック
   引数: cards - カードのリスト
   戻り値: ペア出しとして妥当ならT、そうでなければNIL"
  (and (= (length cards) 2)
       (is-same-rank cards)))

;;; 3枚出し判定
(defun is-valid-triple (cards)
  "3枚出しの妥当性をチェック
   引数: cards - カードのリスト
   戻り値: 3枚出しとして妥当ならT、そうでなければNIL"
  (and (= (length cards) 3)
       (is-same-rank cards)))

;;; 4枚出し判定
(defun is-valid-quadruple (cards)
  "4枚出しの妥当性をチェック
   引数: cards - カードのリスト
   戻り値: 4枚出しとして妥当ならT、そうでなければNIL"
  (and (= (length cards) 4)
       (is-same-rank cards)))

;;; ============================================================================
;;; 手札強度比較関数群
;;; ============================================================================

;;; 単枚カード強度比較
(defun compare-single-cards (card1 card2)
  "単枚カード同士の強度比較
   引数: card1, card2 - 比較するカード
   戻り値: card1 > card2 なら正値、card1 < card2 なら負値、同じなら0"
  (- (daifugo-card-system:card-strength card1)
     (daifugo-card-system:card-strength card2)))

;;; ペア強度比較
(defun compare-pairs (pair1 pair2)
  "ペア同士の強度比較
   引数: pair1, pair2 - 比較するペアのリスト
   戻り値: pair1 > pair2 なら正値、pair1 < pair2 なら負値、同じなら0"
  (compare-single-cards (first pair1) (first pair2)))

;;; 3枚強度比較
(defun compare-triples (triple1 triple2)
  "3枚同士の強度比較
   引数: triple1, triple2 - 比較する3枚のリスト
   戻り値: triple1 > triple2 なら正値、triple1 < triple2 なら負値、同じなら0"
  (compare-single-cards (first triple1) (first triple2)))

;;; 4枚強度比較
(defun compare-quadruples (quad1 quad2)
  "4枚同士の強度比較
   引数: quad1, quad2 - 比較する4枚のリスト
   戻り値: quad1 > quad2 なら正値、quad1 < quad2 なら負値、同じなら0"
  (compare-single-cards (first quad1) (first quad2)))

;;; 階段強度比較
(defun compare-sequences (seq1 seq2)
  "階段同士の強度比較
   引数: seq1, seq2 - 比較する階段のリスト
   戻り値: seq1 > seq2 なら正値、seq1 < seq2 なら負値、同じなら0"
  (let ((sorted1 (sort (copy-list seq1) 
                       (lambda (a b) (< (daifugo-card-system:card-strength a)
                                        (daifugo-card-system:card-strength b)))))
        (sorted2 (sort (copy-list seq2) 
                       (lambda (a b) (< (daifugo-card-system:card-strength a)
                                        (daifugo-card-system:card-strength b))))))
    (compare-single-cards (first sorted1) (first sorted2))))

;;; ============================================================================
;;; 手札種類検出・適合性判定関数群
;;; ============================================================================

;;; 手札種類検出
(defun get-hand-type (cards)
  "手札の種類を検出
   引数: cards - カードのリスト
   戻り値: 手札の種類 (:single :pair :triple :quadruple :sequence :invalid)"
  (cond
    ((null cards) :invalid)
    ((is-valid-single-card cards) :single)
    ((is-valid-pair cards) :pair)
    ((is-valid-triple cards) :triple)
    ((is-valid-quadruple cards) :quadruple)
    ((is-valid-sequence cards) :sequence)
    (t :invalid)))

;;; 手札適合性判定
(defun hands-compatible-p (cards1 cards2)
  "2つの手札が適合するかチェック（同じ種類・同じ枚数）
   引数: cards1, cards2 - 比較するカードのリスト
   戻り値: 適合するならT、そうでなければNIL"
  (let ((type1 (get-hand-type cards1))
        (type2 (get-hand-type cards2)))
    (and (not (eq type1 :invalid))
         (not (eq type2 :invalid))
         (eq type1 type2))))

;;; 総合手札妥当性判定
(defun is-valid-hand (cards)
  "手札出しの総合妥当性をチェック
   引数: cards - カードのリスト
   戻り値: 妥当ならT、そうでなければNIL"
  (not (eq (get-hand-type cards) :invalid)))

;;; ============================================================================
;;; 統合カード出し判定システム
;;; ============================================================================

;;; 統合されたカード出し判定（フィールドとの適合性チェック付き）
(defun can-play-hand (cards field-cards revolution-p)
  "手札がフィールドに対して出せるかチェック
   引数: cards - 出したいカードのリスト
         field-cards - フィールドのカードリスト
         revolution-p - 革命状態フラグ
   戻り値: 出せるならT、そうでなければNIL"
  (let ((hand-type (get-hand-type cards))
        (field-type (if field-cards (get-hand-type field-cards) nil)))
    (cond
      ;; 無効な手札は出せない
      ((eq hand-type :invalid) nil)
      ;; フィールドが空の場合は任意の妥当な手札を出せる
      ((null field-cards) t)
      ;; 8切りは常に出せる
      ((is-eight-cut cards) t)
      ;; 手札の種類が適合しない場合は出せない
      ((not (hands-compatible-p cards field-cards)) nil)
      ;; 強度比較
      (t (hand-stronger-p cards field-cards revolution-p)))))

;;; 手札強度比較の統合関数
(defun hand-stronger-p (cards1 cards2 revolution-p)
  "手札1が手札2より強いかチェック
   引数: cards1, cards2 - 比較するカードのリスト
         revolution-p - 革命状態フラグ
   戻り値: cards1 > cards2 ならT、そうでなければNIL"
  (let ((type1 (get-hand-type cards1))
        (type2 (get-hand-type cards2))
        (strength-diff (case (get-hand-type cards1)
                         (:single (compare-single-cards (first cards1) (first cards2)))
                         (:pair (compare-pairs cards1 cards2))
                         (:triple (compare-triples cards1 cards2))
                         (:quadruple (compare-quadruples cards1 cards2))
                         (:sequence (compare-sequences cards1 cards2))
                         (otherwise 0))))
    (if revolution-p
        (< strength-diff 0)
        (> strength-diff 0))))