;;; game-logic.lisp - 大富豪ゲームロジック
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 手札の有効性検証（単体、ペア、同数字複数、階段）
;;; - 手札タイプの判定
;;; - 手札強度の比較・計算
;;; - 手札互換性の判定

(in-package :daifugo-game-logic)

;;; ============================================================================
;;; 内部ヘルパー関数
;;; ============================================================================

(defun is-same-rank (cards)
  "全てのカードが同じランクかチェック"
  (when cards
    (let ((first-rank (daifugo-card-system:card-rank (first cards))))
      (every (lambda (card)
               (eql (daifugo-card-system:card-rank card) first-rank))
             cards))))

(defun rank-to-number (rank)
  "カードランクを数値に変換"
  (cond
    ((numberp rank) rank)
    ((eql rank 'J) 11)
    ((eql rank 'Q) 12)
    ((eql rank 'K) 13)
    ((eql rank 'A) 14)
    (t 0)))

(defun is-consecutive-p (numbers)
  "数値リストが連続しているかチェック"
  (every (lambda (i)
           (= (nth (1+ i) numbers) (1+ (nth i numbers))))
         (loop for i from 0 below (1- (length numbers)) collect i)))

(defun is-valid-sequence (cards)
  "階段になっているかチェック（3枚以上の連続カード）"
  (when (>= (length cards) 3)
    (let ((ranks (sort (mapcar (lambda (card)
                                (rank-to-number (daifugo-card-system:card-rank card)))
                              cards) #'<)))
      (is-consecutive-p ranks))))

(defun get-hand-strength (cards &optional (revolution-p nil))
  "手札の強度を計算"
  (declare (ignore revolution-p)) ; 現在は革命機能未実装
  (case (get-hand-type cards)
    (:single (daifugo-card-system:card-strength (first cards)))
    (:pair (daifugo-card-system:card-strength (first cards)))
    (:multiple (daifugo-card-system:card-strength (first cards)))
    (:sequence (apply #'min (mapcar #'daifugo-card-system:card-strength cards)))
    (otherwise 0)))

;;; ============================================================================
;;; 基本的な手札検証関数
;;; ============================================================================

(defun is-valid-hand (cards)
  "手札が有効かどうかを判定"
  (when (and cards (listp cards) (> (length cards) 0))
    (cond
      ((= (length cards) 1) t)                    ; 単体カード
      ((= (length cards) 2) (is-same-rank cards)) ; ペア
      ((>= (length cards) 3) 
       (or (is-same-rank cards)                   ; 3枚以上の同じランク
           (is-valid-sequence cards)))            ; 階段
      (t nil))))

(defun get-hand-type (cards)
  "手札のタイプを判定"
  (cond
    ((= (length cards) 1) :single)
    ((= (length cards) 2) 
     (if (is-same-rank cards) :pair :invalid))
    ((>= (length cards) 3)
     (cond
       ((is-same-rank cards) :multiple)
       ((is-valid-sequence cards) :sequence)
       (t :invalid)))
    (t :invalid)))

(defun is-stronger-hand (hand1 hand2 &optional (revolution-p nil))
  "hand1がhand2より強いかどうかを判定"
  (when (and (is-valid-hand hand1) (is-valid-hand hand2))
    (let ((type1 (get-hand-type hand1))
          (type2 (get-hand-type hand2)))
      ;; 同じタイプかつ同じ枚数の場合のみ比較可能
      (when (and (eq type1 type2) (= (length hand1) (length hand2)))
        (let ((strength1 (get-hand-strength hand1 revolution-p))
              (strength2 (get-hand-strength hand2 revolution-p)))
          (> strength1 strength2))))))

(defun hands-compatible-p (hand1 hand2)
  "2つの手札が比較可能かどうかを判定"
  (and (is-valid-hand hand1)
       (is-valid-hand hand2)
       (eq (get-hand-type hand1) (get-hand-type hand2))
       (= (length hand1) (length hand2))))