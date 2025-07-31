;;; kaidan.lisp - 大富豪ゲーム用階段出しルールシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 連続数字（階段）の検出・検証
;;; - 階段の強度比較（最低位・最高位ベース）
;;; - 階段長さの制限・設定管理
;;; - 特殊階段（ジョーカー含む、エース処理等）
;;; - 他ルールとの相互作用管理

;;; Package definition moved to packages.lisp to avoid conflicts
#|
(defpackage :daifugo-kaidan
  (:use :common-lisp)
  (:export ;; === 基本階段システム機能 ===
           #:create-kaidan-system      ; 階段システム作成
           #:kaidan-system-p           ; 階段システム判定
           #:is-kaidan-enabled-p       ; 階段有効確認
           #:get-min-kaidan-length     ; 最小階段長さ取得
           
           ;; === 階段検出・検証機能 ===
           #:is-valid-kaidan-p         ; 有効階段判定
           #:detect-kaidan-pattern     ; 階段パターン検出
           #:get-kaidan-length         ; 階段長さ取得
           #:get-kaidan-min-rank       ; 階段最小ランク取得
           #:get-kaidan-max-rank       ; 階段最大ランク取得
           
           ;; === 階段強度・比較機能 ===
           #:compare-kaidan            ; 階段比較
           #:can-compare-kaidan-p      ; 階段比較可能判定
           #:compare-kaidan-with-revolution ; 革命時階段比較
           #:calculate-kaidan-strength ; 階段強度計算
           
           ;; === 特殊階段処理機能 ===
           #:contains-joker-p          ; ジョーカー含有判定
           #:count-jokers              ; ジョーカー数計算
           #:is-suit-mixed-p           ; スート混合判定
           #:is-same-suit-kaidan-p     ; 同スート階段判定
           #:has-conflict-with-8kiri-p ; 8切り競合判定
           
           ;; === 階段設定・カスタマイズ ===
           #:set-min-kaidan-length     ; 最小階段長さ設定
           #:enable-kaidan             ; 階段有効化
           #:disable-kaidan            ; 階段無効化
           #:set-ace-mode              ; エース処理モード設定
           #:allows-ace-low-p          ; エース低位許可判定
           #:set-strength-mode         ; 強度計算モード設定
           #:get-strength-mode         ; 強度計算モード取得
           #:uses-max-rank-strength-p  ; 最高位強度使用判定
           
           ;; === フィールド状態管理 ===
           #:create-field-state        ; フィールド状態作成
           #:place-kaidan-on-field     ; フィールドに階段配置
           #:field-has-kaidan-p        ; フィールド階段有無判定
           #:get-field-kaidan-length   ; フィールド階段長さ取得
           #:can-play-kaidan-over      ; 階段上出し可能判定
           #:play-kaidan-over          ; 階段上出し実行
           
           ;; === ルール統合・優先度 ===
           #:get-rule-priority         ; ルール優先度取得
           #:register-kaidan-listener  ; 階段リスナー登録
           #:notify-kaidan-event       ; 階段イベント通知
           
           ;; === デバッグ・分析機能 ===
           #:get-kaidan-statistics     ; 階段統計取得
           #:generate-kaidan-report    ; 階段レポート生成
           #:analyze-kaidan-hand       ; 手札階段分析
           
           ;; === 旧互換性 ===
           #:sequence-p                ; 旧形式互換
           #:valid-sequence-p          ; 旧形式互換
           #:compare-sequences))       ; 旧形式互換
|#

(in-package :daifugo-kaidan)

;;; ============================================================================
;;; 階段システム構造体とデータ構造
;;; ============================================================================

(defstruct kaidan-system
  enabled-p                ; 階段機能有効フラグ
  min-length              ; 最小階段長さ
  ace-mode                ; エース処理モード（:high-only :allow-low :both）
  strength-mode           ; 強度計算モード（:min-rank :max-rank :average）
  same-suit-bonus         ; 同スート階段ボーナス
  rule-priority           ; ルール優先度
  listeners               ; イベントリスナー
  statistics)             ; 統計データ

(defstruct kaidan-field-state
  cards                   ; フィールド上のカード
  kaidan-length           ; 現在の階段長さ
  min-rank                ; 階段の最小ランク
  max-rank                ; 階段の最大ランク
  has-kaidan-p)           ; 階段配置フラグ

(defstruct kaidan-event
  timestamp               ; タイムスタンプ
  player-id               ; プレイヤーID
  cards                   ; 階段カード
  length                  ; 階段長さ
  min-rank                ; 最小ランク
  max-rank                ; 最大ランク
  strength)               ; 階段強度

;;; ============================================================================
;;; 基本階段システム機能
;;; ============================================================================

(defun create-kaidan-system ()
  "新しい階段システムインスタンスを作成
   
   戻り値:
     新しく作成された階段システムオブジェクト"
  (make-kaidan-system :enabled-p t
                      :min-length 3
                      :ace-mode :high-only
                      :strength-mode :min-rank
                      :same-suit-bonus 0.5
                      :rule-priority 70
                      :listeners nil
                      :statistics (make-hash-table :test 'equal)))

(defun is-kaidan-enabled-p (kaidan-system)
  "階段機能が有効かどうかを確認
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     有効状態（真偽値）"
  (kaidan-system-enabled-p kaidan-system))

(defun get-min-kaidan-length (kaidan-system)
  "最小階段長さを取得
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     最小階段長さ"
  (kaidan-system-min-length kaidan-system))

;;; ============================================================================
;;; 階段検出・検証機能
;;; ============================================================================

(defun is-valid-kaidan-p (kaidan-system cards)
  "カード群が有効な階段かどうかを判定
   
   引数:
     kaidan-system - 階段システムオブジェクト
     cards - 判定するカードのリスト
   
   戻り値:
     有効階段判定（真偽値）"
  (when (and (kaidan-system-enabled-p kaidan-system)
             cards
             (listp cards)
             (>= (length cards) (kaidan-system-min-length kaidan-system)))
    (let ((sorted-ranks (get-sorted-ranks cards kaidan-system)))
      (and sorted-ranks
           (is-consecutive-sequence-p sorted-ranks)))))

(defun detect-kaidan-pattern (cards)
  "階段パターンを検出
   
   引数:
     cards - 検出するカードのリスト
   
   戻り値:
     パターン検出結果（真偽値）"
  (when (and cards (>= (length cards) 3))
    (let ((ranks (mapcar (lambda (card)
                          (if (daifugo-card-system:joker-p card)
                              (daifugo-card-system:get-joker-value card)
                              (daifugo-card-system:card-rank card)))
                        cards)))
      (let ((sorted-ranks (sort (copy-list ranks) #'<)))
        (is-consecutive-sequence-p sorted-ranks)))))

(defun get-kaidan-length (cards)
  "階段の長さを取得
   
   引数:
     cards - 階段カードのリスト
   
   戻り値:
     階段長さ"
  (length cards))

(defun get-kaidan-min-rank (cards)
  "階段の最小ランクを取得
   
   引数:
     cards - 階段カードのリスト
   
   戻り値:
     最小ランク"
  (when cards
    (let ((ranks (get-card-ranks cards)))
      (when ranks
        (apply #'min ranks)))))

(defun get-kaidan-max-rank (cards)
  "階段の最大ランクを取得
   
   引数:
     cards - 階段カードのリスト
   
   戻り値:
     最大ランク"
  (when cards
    (let ((ranks (get-card-ranks cards)))
      (when ranks
        (apply #'max ranks)))))

;;; ============================================================================
;;; 階段強度・比較機能
;;; ============================================================================

(defun compare-kaidan (kaidan-system kaidan1 kaidan2)
  "２つの階段を比較
   
   引数:
     kaidan-system - 階段システムオブジェクト
     kaidan1 - 比較する階段1
     kaidan2 - 比較する階段2
   
   戻り値:
     kaidan1 > kaidan2 の判定結果（真偽値）"
  (when (can-compare-kaidan-p kaidan-system kaidan1 kaidan2)
    (let ((strength1 (calculate-kaidan-strength kaidan-system kaidan1))
          (strength2 (calculate-kaidan-strength kaidan-system kaidan2)))
      (> strength1 strength2))))

(defun can-compare-kaidan-p (kaidan-system kaidan1 kaidan2)
  "２つの階段が比較可能かどうかを判定
   
   引数:
     kaidan-system - 階段システムオブジェクト
     kaidan1 - 階段1
     kaidan2 - 階段2
   
   戻り値:
     比較可能判定（真偽値）"
  (and (is-valid-kaidan-p kaidan-system kaidan1)
       (is-valid-kaidan-p kaidan-system kaidan2)
       (= (length kaidan1) (length kaidan2))))

(defun compare-kaidan-with-revolution (kaidan-system kaidan1 kaidan2 kakumei-system)
  "革命時の階段比較
   
   引数:
     kaidan-system - 階段システムオブジェクト
     kaidan1 - 階段1
     kaidan2 - 階段2
     kakumei-system - 革命システムオブジェクト
   
   戻り値:
     革命時比較結果（真偽値）"
  (if (daifugo-kakumei:is-kakumei-active-p kakumei-system)
      ;; 革命時は弱い階段が強い
      (not (compare-kaidan kaidan-system kaidan1 kaidan2))
      ;; 通常時
      (compare-kaidan kaidan-system kaidan1 kaidan2)))

(defun calculate-kaidan-strength (kaidan-system cards)
  "階段の強度を計算
   
   引数:
     kaidan-system - 階段システムオブジェクト
     cards - 階段カード
   
   戻り値:
     階段強度（数値）"
  (when (is-valid-kaidan-p kaidan-system cards)
    (let ((base-strength (case (kaidan-system-strength-mode kaidan-system)
                          (:min-rank (get-kaidan-min-rank cards))
                          (:max-rank (get-kaidan-max-rank cards))
                          (:average (/ (+ (get-kaidan-min-rank cards)
                                         (get-kaidan-max-rank cards)) 2))
                          (otherwise (get-kaidan-min-rank cards))))
          (length-bonus (* (length cards) 0.1))
          (suit-bonus (if (is-same-suit-kaidan-p cards)
                         (kaidan-system-same-suit-bonus kaidan-system)
                         0.0)))
      (+ base-strength length-bonus suit-bonus))))

;;; ============================================================================
;;; 特殊階段処理機能
;;; ============================================================================

(defun contains-joker-p (cards)
  "階段にジョーカーが含まれているかを判定
   
   引数:
     cards - 階段カード
   
   戻り値:
     ジョーカー含有判定（真偽値）"
  (some #'daifugo-card-system:joker-p cards))

(defun count-jokers (cards)
  "階段内のジョーカー数を計算
   
   引数:
     cards - 階段カード
   
   戻り値:
     ジョーカー数"
  (count-if #'daifugo-card-system:joker-p cards))

(defun is-suit-mixed-p (cards)
  "階段がスート混合かどうかを判定
   
   引数:
     cards - 階段カード
   
   戻り値:
     スート混合判定（真偽値）"
  (when cards
    (let ((suits (remove-duplicates 
                  (mapcar (lambda (card)
                           (unless (daifugo-card-system:joker-p card)
                             (daifugo-card-system:card-suit card)))
                          cards)
                  :test 'eq)))
      (> (length (remove nil suits)) 1))))

(defun is-same-suit-kaidan-p (cards)
  "階段が同スートかどうかを判定
   
   引数:
     cards - 階段カード
   
   戻り値:
     同スート判定（真偽値）"
  (not (is-suit-mixed-p cards)))

(defun has-conflict-with-8kiri-p (cards)
  "階段が8切りと競合するかを判定
   
   引数:
     cards - 階段カード
   
   戻り値:
     8切り競合判定（真偽値）"
  (some (lambda (card)
          (and (not (daifugo-card-system:joker-p card))
               (= (daifugo-card-system:card-rank card) 8)))
        cards))

;;; ============================================================================
;;; 階段設定・カスタマイズ機能
;;; ============================================================================

(defun set-min-kaidan-length (kaidan-system length)
  "最小階段長さを設定
   
   引数:
     kaidan-system - 階段システムオブジェクト
     length - 最小長さ
   
   戻り値:
     設定成功フラグ"
  (when (and (integerp length) (>= length 3))
    (setf (kaidan-system-min-length kaidan-system) length)
    t))

(defun enable-kaidan (kaidan-system)
  "階段機能を有効化
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (setf (kaidan-system-enabled-p kaidan-system) t)
  t)

(defun disable-kaidan (kaidan-system)
  "階段機能を無効化
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     無効化成功フラグ"
  (setf (kaidan-system-enabled-p kaidan-system) nil)
  t)

(defun set-ace-mode (kaidan-system mode)
  "エース処理モードを設定
   
   引数:
     kaidan-system - 階段システムオブジェクト
     mode - エースモード（:high-only :allow-low :both）
   
   戻り値:
     設定成功フラグ"
  (when (member mode '(:high-only :allow-low :both))
    (setf (kaidan-system-ace-mode kaidan-system) mode)
    t))

(defun allows-ace-low-p (kaidan-system)
  "エースの低位使用が許可されているかを判定
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     エース低位許可判定（真偽値）"
  (member (kaidan-system-ace-mode kaidan-system) '(:allow-low :both)))

(defun set-strength-mode (kaidan-system mode)
  "強度計算モードを設定
   
   引数:
     kaidan-system - 階段システムオブジェクト
     mode - 強度モード（:min-rank :max-rank :average）
   
   戻り値:
     設定成功フラグ"
  (when (member mode '(:min-rank :max-rank :average))
    (setf (kaidan-system-strength-mode kaidan-system) mode)
    t))

(defun get-strength-mode (kaidan-system)
  "強度計算モードを取得
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     強度計算モード"
  (kaidan-system-strength-mode kaidan-system))

(defun uses-max-rank-strength-p (kaidan-system)
  "最高位ベースの強度計算を使用するかを判定
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     最高位強度使用判定（真偽値）"
  (eq (kaidan-system-strength-mode kaidan-system) :max-rank))

;;; ============================================================================
;;; フィールド状態管理機能
;;; ============================================================================

(defun create-field-state ()
  "新しいフィールド状態を作成
   
   戻り値:
     新しく作成されたフィールド状態オブジェクト"
  (make-kaidan-field-state :cards nil
                           :kaidan-length 0
                           :min-rank nil
                           :max-rank nil
                           :has-kaidan-p nil))

(defun place-kaidan-on-field (field-state cards)
  "フィールドに階段を配置
   
   引数:
     field-state - フィールド状態オブジェクト
     cards - 配置する階段カード
   
   戻り値:
     配置成功フラグ"
  (when cards
    (setf (kaidan-field-state-cards field-state) cards)
    (setf (kaidan-field-state-kaidan-length field-state) (length cards))
    (setf (kaidan-field-state-min-rank field-state) (get-kaidan-min-rank cards))
    (setf (kaidan-field-state-max-rank field-state) (get-kaidan-max-rank cards))
    (setf (kaidan-field-state-has-kaidan-p field-state) t)
    t))

(defun field-has-kaidan-p (field-state)
  "フィールドに階段があるかを判定
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     階段有無判定（真偽値）"
  (kaidan-field-state-has-kaidan-p field-state))

(defun get-field-kaidan-length (field-state)
  "フィールドの階段長さを取得
   
   引数:
     field-state - フィールド状態オブジェクト
   
   戻り値:
     階段長さ"
  (kaidan-field-state-kaidan-length field-state))

(defun can-play-kaidan-over (kaidan-system cards field-state)
  "フィールドの階段に対して上出し可能かを判定
   
   引数:
     kaidan-system - 階段システムオブジェクト
     cards - プレイヤーの階段カード
     field-state - フィールド状態
   
   戻り値:
     上出し可能判定（真偽値）"
  (when (and (field-has-kaidan-p field-state)
             (is-valid-kaidan-p kaidan-system cards))
    (let ((field-cards (kaidan-field-state-cards field-state)))
      (and (can-compare-kaidan-p kaidan-system cards field-cards)
           (compare-kaidan kaidan-system cards field-cards)))))

(defun play-kaidan-over (kaidan-system cards field-state)
  "階段の上出しを実行
   
   引数:
     kaidan-system - 階段システムオブジェクト
     cards - プレイヤーの階段カード
     field-state - フィールド状態
   
   戻り値:
     上出し実行成功フラグ"
  (when (can-play-kaidan-over kaidan-system cards field-state)
    (place-kaidan-on-field field-state cards)
    ;; 統計更新
    (incf (gethash :kaidan-plays (kaidan-system-statistics kaidan-system) 0))
    ;; イベント通知
    (notify-kaidan-event kaidan-system cards)
    t))

;;; ============================================================================
;;; ルール統合・優先度機能
;;; ============================================================================

(defun get-rule-priority (kaidan-system)
  "ルール優先度を取得
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     ルール優先度"
  (kaidan-system-rule-priority kaidan-system))

(defun register-kaidan-listener (kaidan-system listener-func)
  "階段イベントリスナーを登録
   
   引数:
     kaidan-system - 階段システムオブジェクト
     listener-func - リスナー関数
   
   戻り値:
     登録成功フラグ"
  (push listener-func (kaidan-system-listeners kaidan-system))
  t)

(defun notify-kaidan-event (kaidan-system cards)
  "階段イベントを通知
   
   引数:
     kaidan-system - 階段システムオブジェクト
     cards - 階段カード
   
   戻り値:
     通知成功フラグ"
  (dolist (listener (kaidan-system-listeners kaidan-system))
    (when (functionp listener)
      (funcall listener :kaidan-played cards)))
  t)

;;; ============================================================================
;;; デバッグ・分析機能
;;; ============================================================================

(defun get-kaidan-statistics (kaidan-system)
  "階段統計データを取得
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     統計データ（plist）"
  (let ((stats (kaidan-system-statistics kaidan-system)))
    (list :total-kaidan-plays (gethash :kaidan-plays stats 0)
          :same-suit-bonus (kaidan-system-same-suit-bonus kaidan-system)
          :min-length (kaidan-system-min-length kaidan-system)
          :ace-mode (kaidan-system-ace-mode kaidan-system)
          :strength-mode (kaidan-system-strength-mode kaidan-system))))

(defun generate-kaidan-report (kaidan-system)
  "階段レポートを生成
   
   引数:
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     レポート文字列"
  (let ((stats (get-kaidan-statistics kaidan-system)))
    (format nil "=== 階段出しシステムレポート ===~%~
                総階段出し回数: ~A~%~
                最小階段長さ: ~A枚~%~
                エース処理モード: ~A~%~
                強度計算モード: ~A~%~
                システム状態: ~A~%"
            (getf stats :total-kaidan-plays)
            (getf stats :min-length)
            (getf stats :ace-mode)
            (getf stats :strength-mode)
            (if (kaidan-system-enabled-p kaidan-system) "有効" "無効"))))

(defun analyze-kaidan-hand (kaidan-system hand)
  "手札の階段可能性を分析
   
   引数:
     kaidan-system - 階段システムオブジェクト
     hand - 手札
   
   戻り値:
     分析結果（plist）"
  (let ((possible-kaidans (find-possible-kaidans kaidan-system hand)))
    (list :has-kaidan (> (length possible-kaidans) 0)
          :kaidan-count (length possible-kaidans)
          :longest-kaidan (if possible-kaidans
                             (apply #'max (mapcar #'length possible-kaidans))
                             0)
          :possible-kaidans possible-kaidans)))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun get-sorted-ranks (cards kaidan-system)
  "カードのランクをソートして取得（エース処理考慮）
   
   引数:
     cards - カードのリスト
     kaidan-system - 階段システムオブジェクト
   
   戻り値:
     ソートされたランクのリスト"
  (let ((ranks (get-card-ranks cards)))
    (when ranks
      ;; エース処理
      (when (allows-ace-low-p kaidan-system)
        (setf ranks (mapcar (lambda (rank)
                             (if (= rank 14) 1 rank))  ; Aを1として扱う
                           ranks)))
      (sort (copy-list ranks) #'<))))

(defun get-card-ranks (cards)
  "カードからランクを抽出
   
   引数:
     cards - カードのリスト
   
   戻り値:
     ランクのリスト"
  (mapcar (lambda (card)
           (if (daifugo-card-system:joker-p card)
               (daifugo-card-system:get-joker-value card)
               (daifugo-card-system:card-rank card)))
          cards))

(defun is-consecutive-sequence-p (ranks)
  "ランクが連続しているかを判定
   
   引数:
     ranks - ソートされたランクのリスト
   
   戻り値:
     連続判定（真偽値）"
  (when (and ranks (>= (length ranks) 3))
    (every (lambda (i)
             (= (nth (1+ i) ranks) (1+ (nth i ranks))))
           (loop for i from 0 below (1- (length ranks)) collect i))))

(defun find-possible-kaidans (kaidan-system hand)
  "手札から可能な階段を探索
   
   引数:
     kaidan-system - 階段システムオブジェクト
     hand - 手札
   
   戻り値:
     可能な階段のリスト"
  (let ((possible-kaidans nil)
        (min-length (kaidan-system-min-length kaidan-system)))
    ;; 3枚以上の組み合わせを全てチェック
    (loop for length from min-length to (length hand) do
      (loop for start from 0 to (- (length hand) length) do
        (let ((candidate (subseq hand start (+ start length))))
          (when (is-valid-kaidan-p kaidan-system candidate)
            (push candidate possible-kaidans)))))
    possible-kaidans))

;;; ============================================================================
;;; 旧互換性関数
;;; ============================================================================

(defun sequence-p (cards)
  "旧形式互換：階段判定"
  (detect-kaidan-pattern cards))

(defun valid-sequence-p (cards min-length)
  "旧形式互換：有効階段判定"
  (and (>= (length cards) min-length)
       (detect-kaidan-pattern cards)))

(defun compare-sequences (seq1 seq2)
  "旧形式互換：階段比較"
  (let ((kaidan-system (create-kaidan-system)))
    (compare-kaidan kaidan-system seq1 seq2)))