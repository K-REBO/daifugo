;;; test-complete.lisp - 完全なゲームロジックテスト

;; すべての必要なコンポーネントを含む統合テスト
(load "../debug/final-test.lisp")

;; ゲームロジック追加実装
(in-package :daifugo-game-engine)

;;; 拡張ゲーム機能
(defun validate-card-play (cards field revolution-p)
  "カード出しの妥当性を検証"
  (cond
    ;; フィールドが空の場合は何でも出せる
    ((null field) t)
    ;; 8切りは常に出せる
    ((and (= (length cards) 1)
          (eql (daifugo-card-system:card-rank (first cards)) 8)) t)
    ;; 枚数が違う場合は出せない
    ((/= (length cards) (length field)) nil)
    ;; 革命状態の場合は強度が逆転
    (revolution-p
     (< (daifugo-card-system:card-strength (first cards))
        (daifugo-card-system:card-strength (first field))))
    ;; 通常は強度が高い必要がある
    (t
     (> (daifugo-card-system:card-strength (first cards))
        (daifugo-card-system:card-strength (first field))))))

(defun is-revolution (cards)
  "革命（4枚同じランク）かチェック"
  (and (= (length cards) 4)
       (let ((first-rank (daifugo-card-system:card-rank (first cards))))
         (every (lambda (card)
                  (eql (daifugo-card-system:card-rank card) first-rank))
                cards))))

(defun is-eight-cut (cards)
  "8切りかチェック"
  (and (= (length cards) 1)
       (eql (daifugo-card-system:card-rank (first cards)) 8)))

(defun remove-cards-from-hand (player cards)
  "プレイヤーの手札からカードを削除"
  (let ((hand (daifugo-player-system:player-hand player)))
    (dolist (card cards)
      (setf hand (remove card hand :test #'equalp :count 1)))
    (setf (daifugo-player-system:player-hand player) hand)))

;;; 拡張されたplay-card関数
(defun play-card (game-state player-id cards)
  "プレイヤーがカードを出す（拡張版）"
  (unless (eql (game-state-game-phase game-state) :playing)
    (error "ゲームが開始されていません"))
  (unless (= player-id (game-state-current-player game-state))
    (error "現在のプレイヤーではありません: ~A" player-id))
  
  ;; カードの妥当性チェック
  (let* ((player (nth player-id (game-state-players game-state)))
         (field (game-state-field game-state))
         (revolution-p (game-state-revolution-p game-state)))
    
    (unless (validate-card-play cards field revolution-p)
      (error "無効なカード出し"))
    
    ;; 手札からカードを削除
    (remove-cards-from-hand player cards)
    
    ;; フィールドを更新
    (setf (game-state-field game-state) cards)
    
    ;; 革命チェック
    (when (is-revolution cards)
      (setf (game-state-revolution-p game-state)
            (not revolution-p)))
    
    ;; 8切りチェック
    (when (is-eight-cut cards)
      (setf (game-state-field game-state) nil))
    
    ;; ログ追加
    (push (format nil "プレイヤー~A が~A枚のカードを出しました" 
                  player-id (length cards))
          (game-state-logs game-state))
    t))

;; テストパッケージ
(defpackage :daifugo-complete-test
  (:use :common-lisp))

(in-package :daifugo-complete-test)

;;; 完全なテスト関数
(defun test-single-card-play ()
  "単体カード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
    (daifugo-game-engine:start-game game)
    (daifugo-game-engine:play-card game 0 (list card))))

(defun test-pair-card-play ()
  "ペア出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (cards (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)
                     (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts))))
    (daifugo-game-engine:start-game game)
    (daifugo-game-engine:play-card game 0 cards)))

(defun test-card-strength-validation ()
  "カード強度の検証テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (weak-card (daifugo-card-system:create-card 4 :spades))
        (strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts)))
    (daifugo-game-engine:start-game game)
    ;; 弱いカードを出す
    (daifugo-game-engine:play-card game 0 (list weak-card))
    ;; 次のプレイヤーに変更
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    ;; 強いカードが出せるかテスト
    (daifugo-game-engine:play-card game 1 (list strong-card))))

(defun test-invalid-card-play ()
  "無効なカード出しのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades))
        (weak-card (daifugo-card-system:create-card 4 :hearts)))
    (daifugo-game-engine:start-game game)
    ;; 強いカードを出す
    (daifugo-game-engine:play-card game 0 (list strong-card))
    ;; 次のプレイヤーに変更
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    ;; 弱いカードは出せないはず
    (handler-case
        (progn
          (daifugo-game-engine:play-card game 1 (list weak-card))
          nil) ; 成功した場合は失敗
      (error () t)))) ; エラーが発生した場合は成功

(defun test-revolution-detection ()
  "革命判定のテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (revolution-cards (list (daifugo-card-system:create-card 3 :spades)
                               (daifugo-card-system:create-card 3 :hearts)
                               (daifugo-card-system:create-card 3 :diamonds)
                               (daifugo-card-system:create-card 3 :clubs))))
    (daifugo-game-engine:start-game game)
    ;; 4枚同じランクで革命が起こるかテスト
    (daifugo-game-engine:play-card game 0 revolution-cards)
    ;; 革命状態がセットされているかチェック
    (daifugo-game-engine:game-state-revolution-p game)))

(defun test-8cut-rule ()
  "8切りルールのテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (eight-card (daifugo-card-system:create-card 8 :spades)))
    (daifugo-game-engine:start-game game)
    ;; 最初に何かカードを出す
    (daifugo-game-engine:play-card game 0 (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
    ;; 次のプレイヤーに変更
    (setf (daifugo-game-engine:game-state-current-player game) 1)
    ;; 8を出す
    (daifugo-game-engine:play-card game 1 (list eight-card))
    ;; フィールドが空になっているかチェック
    (null (daifugo-game-engine:game-state-field game))))

(defun test-player-hand-management ()
  "プレイヤー手札管理のテスト"
  (let ((game (daifugo-game-engine:create-game 4)))
    (daifugo-game-engine:start-game game)
    (let* ((player (first (daifugo-game-engine:game-state-players game)))
           (initial-count (daifugo-player-system:hand-count player)))
      ;; カードを出す
      (daifugo-game-engine:play-card game 0 
                                     (list (first (daifugo-player-system:player-hand player))))
      ;; 手札が減ったかチェック
      (< (daifugo-player-system:hand-count player) initial-count))))

;;; テスト実行関数
(defun run-complete-game-logic-tests ()
  "完全なゲームロジックテストを実行"
  (format t "~%=== 完全ゲームロジックテスト実行 ===~%")
  
  (let ((tests '(("単体カード出し" . test-single-card-play)
                 ("ペア出し" . test-pair-card-play)
                 ("カード強度検証" . test-card-strength-validation)
                 ("無効カード出し" . test-invalid-card-play)
                 ("革命判定" . test-revolution-detection)
                 ("8切りルール" . test-8cut-rule)
                 ("手札管理" . test-player-hand-management)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (handler-case
            (if (funcall test-func)
                (progn
                  (format t "合格~%")
                  (incf passed))
                (progn
                  (format t "失敗~%")
                  (incf failed)))
          (error (e)
            (format t "エラー: ~A~%" e)
            (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; テスト実行
(run-complete-game-logic-tests)

;;; 手札出し判定システムの実装（テスト用）
(in-package :daifugo-game-engine)

;;; 手札出し判定関数群
(defun is-valid-single-card (cards)
  "単枚出しの妥当性をチェック"
  (= (length cards) 1))

(defun is-valid-pair (cards)
  "ペア出しの妥当性をチェック"
  (and (= (length cards) 2)
       (let ((rank1 (daifugo-card-system:card-rank (first cards)))
             (rank2 (daifugo-card-system:card-rank (second cards))))
         (eql rank1 rank2))))

(defun is-valid-triple (cards)
  "3枚出しの妥当性をチェック"
  (and (= (length cards) 3)
       (let ((rank1 (daifugo-card-system:card-rank (first cards)))
             (rank2 (daifugo-card-system:card-rank (second cards)))
             (rank3 (daifugo-card-system:card-rank (third cards))))
         (and (eql rank1 rank2) (eql rank2 rank3)))))

(defun is-valid-quadruple (cards)
  "4枚出しの妥当性をチェック"
  (and (= (length cards) 4)
       (let ((rank1 (daifugo-card-system:card-rank (first cards))))
         (every (lambda (card) (eql (daifugo-card-system:card-rank card) rank1)) cards))))

(defun is-valid-sequence (cards)
  "階段出しの妥当性をチェック"
  (when (>= (length cards) 3)
    (let ((sorted-cards (sort (copy-list cards) 
                              (lambda (a b) 
                                (< (daifugo-card-system:card-strength a)
                                   (daifugo-card-system:card-strength b))))))
      (loop for i from 1 below (length sorted-cards)
            always (= (daifugo-card-system:card-strength (nth i sorted-cards))
                      (1+ (daifugo-card-system:card-strength (nth (1- i) sorted-cards))))))))

(defun get-hand-type (cards)
  "手札の種類を検出"
  (cond
    ((null cards) :invalid)
    ((is-valid-single-card cards) :single)
    ((is-valid-pair cards) :pair)
    ((is-valid-triple cards) :triple)
    ((is-valid-quadruple cards) :quadruple)
    ((is-valid-sequence cards) :sequence)
    (t :invalid)))

(defun hands-compatible-p (cards1 cards2)
  "2つの手札が適合するかチェック"
  (let ((type1 (get-hand-type cards1))
        (type2 (get-hand-type cards2)))
    (and (not (eq type1 :invalid))
         (not (eq type2 :invalid))
         (eq type1 type2))))

(defun compare-single-cards (card1 card2)
  "単枚カード同士の強度比較"
  (- (daifugo-card-system:card-strength card1)
     (daifugo-card-system:card-strength card2)))

(defun can-play-hand (cards field-cards revolution-p)
  "手札がフィールドに対して出せるかチェック"
  (let ((hand-type (get-hand-type cards))
        (field-type (if field-cards (get-hand-type field-cards) nil)))
    (cond
      ;; 無効な手札は出せない
      ((eq hand-type :invalid) nil)
      ;; フィールドが空の場合は任意の妥当な手札を出せる
      ((null field-cards) t)
      ;; 8切りは常に出せる
      ((and (= (length cards) 1)
            (eql (daifugo-card-system:card-rank (first cards)) 8)) t)
      ;; 手札の種類が適合しない場合は出せない
      ((not (hands-compatible-p cards field-cards)) nil)
      ;; 強度比較
      (t (let ((strength-diff (case (get-hand-type cards)
                               (:single (compare-single-cards (first cards) (first field-cards)))
                               (:pair (compare-single-cards (first cards) (first field-cards)))
                               (:triple (compare-single-cards (first cards) (first field-cards)))
                               (:quadruple (compare-single-cards (first cards) (first field-cards)))
                               (:sequence (compare-single-cards (first cards) (first field-cards)))
                               (otherwise 0))))
           (if revolution-p
               (< strength-diff 0)
               (> strength-diff 0)))))))

;;; 手札出し判定テスト

(defun test-hand-validation ()
  "手札出し判定システムのテスト"
  (format t "~%=== 手札出し判定システムテスト実行 ===~%")
  
  ;; テストデータ作成
  (let ((single-card (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :spades)))
        (pair-cards (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)
                          (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :hearts)))
        (triple-cards (list (daifugo-card-system:create-card 7 :spades)
                            (daifugo-card-system:create-card 7 :hearts)
                            (daifugo-card-system:create-card 7 :diamonds)))
        (quad-cards (list (daifugo-card-system:create-card 9 :spades)
                          (daifugo-card-system:create-card 9 :hearts)
                          (daifugo-card-system:create-card 9 :diamonds)
                          (daifugo-card-system:create-card 9 :clubs)))
        (sequence-cards (list (daifugo-card-system:create-card 4 :spades)
                              (daifugo-card-system:create-card 5 :hearts)
                              (daifugo-card-system:create-card 6 :diamonds)))
        (invalid-cards (list (daifugo-card-system:create-card 4 :spades)
                             (daifugo-card-system:create-card 6 :hearts))))
    
    (let ((passed 0) (failed 0))
      
      ;; 単枚出し判定テスト
      (format t "テスト: 単枚出し判定 ... ")
      (if (and (is-valid-single-card single-card)
               (not (is-valid-single-card pair-cards)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed)))
      
      ;; ペア出し判定テスト
      (format t "テスト: ペア出し判定 ... ")
      (if (and (is-valid-pair pair-cards)
               (not (is-valid-pair single-card))
               (not (is-valid-pair invalid-cards)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed)))
      
      ;; 3枚出し判定テスト
      (format t "テスト: 3枚出し判定 ... ")
      (if (and (is-valid-triple triple-cards)
               (not (is-valid-triple pair-cards)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed)))
      
      ;; 4枚出し判定テスト
      (format t "テスト: 4枚出し判定 ... ")
      (if (and (is-valid-quadruple quad-cards)
               (not (is-valid-quadruple triple-cards)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed)))
      
      ;; 階段出し判定テスト
      (format t "テスト: 階段出し判定 ... ")
      (if (and (is-valid-sequence sequence-cards)
               (not (is-valid-sequence invalid-cards)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed)))
      
      ;; 手札種類検出テスト
      (format t "テスト: 手札種類検出 ... ")
      (if (and (eq (get-hand-type single-card) :single)
               (eq (get-hand-type pair-cards) :pair)
               (eq (get-hand-type triple-cards) :triple)
               (eq (get-hand-type quad-cards) :quadruple)
               (eq (get-hand-type sequence-cards) :sequence)
               (eq (get-hand-type invalid-cards) :invalid))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed)))
      
      ;; 手札適合性テスト
      (format t "テスト: 手札適合性 ... ")
      (let ((single-a (list (daifugo-card-system:create-card 5 :spades)))
            (single-b (list (daifugo-card-system:create-card 8 :hearts)))
            (pair-a (list (daifugo-card-system:create-card 10 :spades)
                          (daifugo-card-system:create-card 10 :hearts)))
            (pair-b (list (daifugo-card-system:create-card (intern "J" :daifugo-card-system) :spades)
                          (daifugo-card-system:create-card (intern "J" :daifugo-card-system) :hearts))))
        (if (and (hands-compatible-p single-a single-b)
                 (hands-compatible-p pair-a pair-b)
                 (not (hands-compatible-p single-a pair-a)))
            (progn (format t "合格~%") (incf passed))
            (progn (format t "失敗~%") (incf failed))))
      
      ;; 強度比較テスト
      (format t "テスト: 強度比較 ... ")
      (let ((weak-card (daifugo-card-system:create-card 3 :spades))
            (strong-card (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts)))
        (if (and (> (compare-single-cards strong-card weak-card) 0)
                 (< (compare-single-cards weak-card strong-card) 0))
            (progn (format t "合格~%") (incf passed))
            (progn (format t "失敗~%") (incf failed))))
      
      (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
      (= failed 0))))

;; 手札出し判定テスト実行
(test-hand-validation)

;;; 統合システムテスト
(defun test-integrated-hand-system ()
  "統合手札判定システムのテスト"
  (format t "~%=== 統合手札判定システムテスト実行 ===~%")
  
  (let ((passed 0) (failed 0))
    
    ;; 統合判定テスト1: 空フィールドに対する出し
    (format t "テスト: 空フィールドに対する出し ... ")
    (let ((cards (list (daifugo-card-system:create-card 7 :spades))))
      (if (can-play-hand cards nil nil)
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    ;; 統合判定テスト2: 適合する手札同士の強度比較
    (format t "テスト: 適合する手札同士の強度比較 ... ")
    (let ((weak-pair (list (daifugo-card-system:create-card 4 :spades)
                           (daifugo-card-system:create-card 4 :hearts)))
          (strong-pair (list (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :spades)
                             (daifugo-card-system:create-card (intern "K" :daifugo-card-system) :hearts))))
      (if (and (can-play-hand strong-pair weak-pair nil)
               (not (can-play-hand weak-pair strong-pair nil)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    ;; 統合判定テスト3: 革命状態での強度逆転
    (format t "テスト: 革命状態での強度逆転 ... ")
    (let ((weak-card (list (daifugo-card-system:create-card 3 :spades)))
          (strong-card (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts))))
      (if (and (can-play-hand weak-card strong-card t)
               (not (can-play-hand strong-card weak-card t)))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    ;; 統合判定テスト4: 8切りの特殊ルール
    (format t "テスト: 8切りの特殊ルール ... ")
    (let ((eight-card (list (daifugo-card-system:create-card 8 :spades)))
          (field-card (list (daifugo-card-system:create-card (intern "A" :daifugo-card-system) :hearts))))
      (if (can-play-hand eight-card field-card nil)
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    ;; 統合判定テスト5: 非適合手札の拒否
    (format t "テスト: 非適合手札の拒否 ... ")
    (let ((single-card (list (daifugo-card-system:create-card 7 :spades)))
          (pair-card (list (daifugo-card-system:create-card 8 :spades)
                           (daifugo-card-system:create-card 8 :hearts))))
      (if (not (can-play-hand single-card pair-card nil))
          (progn (format t "合格~%") (incf passed))
          (progn (format t "失敗~%") (incf failed))))
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; 統合システムテスト実行
(test-integrated-hand-system)

;;; ============================================================================
;;; ゲームロガーシステムテスト統合
;;; ============================================================================

(defpackage :daifugo-logger-test-integrated
  (:use :common-lisp))

(in-package :daifugo-logger-test-integrated)

;;; 基本ロガー機能テスト
(defun test-logger-creation ()
  "ロガーの作成テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (and logger
         (daifugo-game-logger:logger-p logger)
         (eq (daifugo-game-logger:logger-name logger) :test-game))))

(defun test-basic-logging ()
  "基本ログ記録テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:log-info logger "テストメッセージ")
    (daifugo-game-logger:log-warn logger "警告メッセージ")
    (daifugo-game-logger:log-error logger "エラーメッセージ")
    (= (daifugo-game-logger:log-count logger) 3)))

(defun test-log-levels ()
  "ログレベル機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :test-game)))
    (daifugo-game-logger:set-log-level logger :warn)
    (daifugo-game-logger:log-debug logger "デバッグメッセージ")
    (daifugo-game-logger:log-info logger "情報メッセージ")
    (daifugo-game-logger:log-warn logger "警告メッセージ")
    (daifugo-game-logger:log-error logger "エラーメッセージ")
    ;; DEBUG, INFOは無視される、WARN, ERRORのみ記録
    (= (daifugo-game-logger:log-count logger) 2)))

(defun test-log-filtering ()
  "ログフィルタリングテスト"
  (let ((logger (daifugo-game-logger:create-logger :filtering-test)))
    (daifugo-game-logger:log-info logger "情報1")
    (daifugo-game-logger:log-warn logger "警告1")
    (daifugo-game-logger:log-error logger "エラー1")
    (daifugo-game-logger:log-info logger "情報2")
    (let ((warn-logs (daifugo-game-logger:filter-logs logger :level :warn))
          (error-logs (daifugo-game-logger:filter-logs logger :level :error)))
      (and (= (length warn-logs) 1)
           (= (length error-logs) 1)))))

(defun test-log-statistics ()
  "ログ統計機能テスト"
  (let ((logger (daifugo-game-logger:create-logger :stats-test)))
    (daifugo-game-logger:log-info logger "情報1")
    (daifugo-game-logger:log-info logger "情報2")
    (daifugo-game-logger:log-warn logger "警告1")
    (daifugo-game-logger:log-error logger "エラー1")
    (let ((stats (daifugo-game-logger:get-log-statistics logger)))
      (and (= (daifugo-game-logger:stat-total stats) 4)
           (= (daifugo-game-logger:stat-info-count stats) 2)
           (= (daifugo-game-logger:stat-warn-count stats) 1)
           (= (daifugo-game-logger:stat-error-count stats) 1)))))

(defun test-performance-metrics ()
  "パフォーマンス計測テスト"
  (let ((logger (daifugo-game-logger:create-logger :performance-test)))
    (daifugo-game-logger:start-timer logger :game-duration)
    (sleep 0.01)
    (daifugo-game-logger:stop-timer logger :game-duration)
    (let ((metrics (daifugo-game-logger:get-performance-metrics logger)))
      (daifugo-game-logger:metric-exists-p metrics :game-duration))))

;;; ゲームロガーテスト実行関数
(defun run-game-logger-tests ()
  "ゲームロガーシステムのテストを実行"
  (format t "~%=== ゲームロガーシステムテスト実行 ===~%")
  
  (let ((tests '(("ロガー作成" . test-logger-creation)
                 ("基本ログ記録" . test-basic-logging)
                 ("ログレベル" . test-log-levels)
                 ("ログフィルタリング" . test-log-filtering)
                 ("ログ統計" . test-log-statistics)
                 ("パフォーマンス計測" . test-performance-metrics)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (handler-case
            (if (funcall test-func)
                (progn
                  (format t "合格~%")
                  (incf passed))
                (progn
                  (format t "失敗~%")
                  (incf failed)))
          (error (e)
            (format t "エラー: ~A~%" e)
            (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; テスト実行
(run-game-logger-tests)