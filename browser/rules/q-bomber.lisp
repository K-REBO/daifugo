;; Qボンバールール - 完全実装版
;; Qを2枚以上出すと、任意の数字を宣言して全プレイヤーの手札から削除

(defrule q-bomber-detection
  "Qボンバーの検出と発動条件"
  (played-cards ?cards)
  (test (>= (count-queens ?cards) 2))
  =>
  (assert (rule-triggered q-bomber))
  (assert (special-effect (create$ q-bomber (count-queens ?cards))))
  (assert (requires-declaration TRUE))
  (assert (message "💣 Qボンバー発動！数字を宣言してください"))
  (printout t "💣 Q-BOMBER ACTIVATED! " (count-queens ?cards) " Queens played." crlf))

(defrule q-bomber-priority
  "Qボンバーと他ルールの優先度"
  (played-cards ?cards)
  (test (and (>= (count-queens ?cards) 2)
             (has-eight ?cards)))
  =>
  (assert (rule-conflict 8cut-wins))
  (printout t "8切りがQボンバーより優先されます" crlf))

(defrule q-bomber-single-queen
  "Q1枚では発動しない"
  (played-cards ?cards)
  (test (= (count-queens ?cards) 1))
  =>
  (assert (q-bomber-inactive single-queen))
  (printout t "Q1枚ではQボンバーは発動しません" crlf))

(defrule q-bomber-process-declaration
  "数字宣言の処理"
  (rule-triggered q-bomber)
  (declared-numbers ?numbers)
  (special-effect ?effect&:(eq (nth$ 1 ?effect) q-bomber))
  (test (<= (length$ ?numbers) (nth$ 2 ?effect)))
  =>
  (assert (valid-declaration ?numbers))
  (assert (affected-ranks ?numbers))
  (printout t "有効な宣言: " ?numbers crlf))

(defrule q-bomber-invalid-declaration
  "宣言数上限違反"
  (rule-triggered q-bomber)
  (declared-numbers ?numbers)
  (special-effect ?effect&:(eq (nth$ 1 ?effect) q-bomber))
  (test (> (length$ ?numbers) (nth$ 2 ?effect)))
  =>
  (assert (invalid-declaration too-many))
  (assert (error-message "宣言できる数字の上限を超えています"))
  (printout t "ERROR: Too many declarations" crlf))

(defrule q-bomber-apply-effect
  "Qボンバー効果の適用"
  (valid-declaration ?numbers)
  (affected-ranks ?numbers)
  =>
  (assert (discard-from-all-players ?numbers))
  (assert (field-action none)) ; 場はクリアしない
  (assert (turn-action continue)) ; プレイヤー継続またはターン終了
  (printout t "全プレイヤーから " ?numbers " を削除します" crlf))

(defrule q-bomber-no-declaration
  "数字を宣言しない場合"
  (rule-triggered q-bomber)
  (declared-numbers nil)
  =>
  (assert (valid-declaration nil))
  (assert (message "Qボンバー発動（数字宣言なし）"))
  (printout t "Qボンバー発動: 数字宣言なし" crlf))

(defrule q-bomber-winning-condition
  "Qボンバーでの上がり"
  (rule-triggered q-bomber)
  (current-player ?player)
  (player-hand-count ?player 0)
  =>
  (assert (player-finished ?player))
  (assert (finish-method q-bomber))
  (assert (message "💣 Qボンバーで上がり！"))
  (printout t "Player " ?player " wins with Q-bomber!" crlf))

;; ヘルパー関数
(deffunction count-queens (?cards)
  "Qの枚数をカウント"
  (bind ?count 0)
  (foreach ?card ?cards
    (if (eq (get-rank ?card) "Q")
      then (bind ?count (+ ?count 1))))
  ?count)

(deffunction has-eight (?cards)
  "8があるかチェック"
  (foreach ?card ?cards
    (if (eq (get-rank ?card) "8")
      then (return TRUE)))
  FALSE)

(deffunction get-rank (?card)
  "カードのランクを取得"
  (nth$ 2 ?card))

(deffunction valid-rank (?rank)
  "有効なランクかチェック（3-2, JOKER除く）"
  (member$ ?rank (create$ "3" "4" "5" "6" "7" "8" "9" "10" "J" "Q" "K" "A" "2")))

;; ルール設定テンプレート
(deftemplate q-bomber-rule
  (slot enabled (default TRUE))
  (slot priority (default 2))  ; 8切り(1)より低い、革命(3)より高い
  (slot max-declarations (default 999)) ; 理論上の上限
  (slot allow-no-declaration (default TRUE))
  (slot description (default "💣 Qボンバー: Q2枚以上で任意数字を宣言し全プレイヤーから削除")))

(deftemplate q-bomber-state
  (slot active (default FALSE))
  (slot queen-count (default 0))
  (slot max-declarations (default 0))
  (multislot declared-numbers)
  (slot awaiting-declaration (default FALSE)))

;; 初期設定
(deffacts q-bomber-config
  (q-bomber-rule 
    (enabled TRUE)
    (priority 2)
    (max-declarations 999)
    (allow-no-declaration TRUE)
    (description "💣 Qボンバー: Q2枚以上で任意数字を宣言し全プレイヤーから削除")))

;; ルール説明
(deffacts q-bomber-help
  (help-text "Qボンバールール:")
  (help-text "- Qを2枚以上出すとQボンバーが発動")
  (help-text "- Q枚数まで任意の数字を宣言可能")
  (help-text "- 宣言された数字は全プレイヤーの手札から削除")
  (help-text "- 数字を宣言しなくても可")
  (help-text "- Qボンバーで手札が0枚になると上がり")
  (help-text "- 8切りより優先度が低い"))

;; 統計・履歴
(deftemplate q-bomber-stats
  (slot games-used (default 0))
  (slot total-declarations (default 0))
  (slot successful-wins (default 0))
  (multislot most-declared-numbers))

(deffacts q-bomber-initial-stats
  (q-bomber-stats))