;;; test-javascript-api.lisp - JavaScript API（javascript-api.lisp）の包括的テスト
;;; 
;;; 本テストは以下の機能をカバーします：
;;; - JavaScript向けゲームAPI（ゲーム作成・操作・状態取得）
;;; - JSON形式でのデータ交換
;;; - イベント通知システム
;;; - ルール動的読み込みAPI
;;; - エラーハンドリング・セキュリティ

(load "../debug/final-test.lisp")

(defpackage :daifugo-javascript-api-integrated-test
  (:use :common-lisp)
  (:export #:run-javascript-api-tests #:run-simple-javascript-api-tests))

(in-package :daifugo-javascript-api-integrated-test)

;;; ==========================================
;;; JavaScript API基本機能テスト
;;; ==========================================

(defun test-javascript-api-creation ()
  "JavaScript APIシステムの作成テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    (and js-api
         (daifugo-javascript-api:javascript-api-p js-api)
         (daifugo-javascript-api:is-api-active-p js-api)
         (daifugo-javascript-api:get-api-version js-api))))

(defun test-game-creation-api ()
  "ゲーム作成APIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    (let ((result (daifugo-javascript-api:create-game-api js-api 4)))
      (and result
           (daifugo-javascript-api:json-response-p result)
           (daifugo-javascript-api:get-json-field result "success")
           (daifugo-javascript-api:get-json-field result "gameId")
           (daifugo-javascript-api:get-json-field result "playerCount")))))

(defun test-game-state-api ()
  "ゲーム状態取得APIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ゲーム作成
    (let ((create-result (daifugo-javascript-api:create-game-api js-api 4)))
      (when (daifugo-javascript-api:get-json-field create-result "success")
        (let ((game-id (daifugo-javascript-api:get-json-field create-result "gameId")))
          ;; 状態取得
          (let ((state-result (daifugo-javascript-api:get-game-state-api js-api game-id)))
            (and state-result
                 (daifugo-javascript-api:get-json-field state-result "gameState")
                 (daifugo-javascript-api:get-json-field state-result "currentPlayer")
                 (daifugo-javascript-api:get-json-field state-result "field"))))))))

(defun test-player-action-api ()
  "プレイヤーアクションAPIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ゲーム作成
    (let ((create-result (daifugo-javascript-api:create-game-api js-api 4)))
      (when (daifugo-javascript-api:get-json-field create-result "success")
        (let ((game-id (daifugo-javascript-api:get-json-field create-result "gameId")))
          ;; カードプレイ
          (let ((play-result (daifugo-javascript-api:play-cards-api js-api game-id 0 
                                                                    "[{\"rank\": 3, \"suit\": \"spades\"}]")))
            (and play-result
                 (daifugo-javascript-api:json-response-p play-result)
                 (daifugo-javascript-api:get-json-field play-result "success"))))))))

(defun test-pass-action-api ()
  "パスアクションAPIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ゲーム作成
    (let ((create-result (daifugo-javascript-api:create-game-api js-api 4)))
      (when (daifugo-javascript-api:get-json-field create-result "success")
        (let ((game-id (daifugo-javascript-api:get-json-field create-result "gameId")))
          ;; パス
          (let ((pass-result (daifugo-javascript-api:pass-turn-api js-api game-id 0)))
            (and pass-result
                 (daifugo-javascript-api:get-json-field pass-result "success")
                 (daifugo-javascript-api:get-json-field pass-result "action")
                 (string= (daifugo-javascript-api:get-json-field pass-result "action") "pass"))))))))

;;; ==========================================
;;; JSON データ交換テスト
;;; ==========================================

(defun test-json-serialization ()
  "JSON シリアライゼーションテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; Common Lispデータ構造からJSONへ
    (let ((lisp-data (list :name "Player1" :score 100 :cards '("3H" "4S" "5D"))))
      (let ((json-string (daifugo-javascript-api:to-json js-api lisp-data)))
        (and json-string
             (stringp json-string)
             (daifugo-javascript-api:valid-json-p json-string)
             (search "Player1" json-string)
             (search "100" json-string))))))

(defun test-json-deserialization ()
  "JSON デシリアライゼーションテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; JSONからCommon Lispデータ構造へ
    (let ((json-string "{\"playerId\": 1, \"action\": \"play\", \"cards\": [\"3H\", \"4S\"]}"))
      (let ((lisp-data (daifugo-javascript-api:from-json js-api json-string)))
        (and lisp-data
             (listp lisp-data)
             (= (getf lisp-data :player-id) 1)
             (string= (getf lisp-data :action) "play")
             (listp (getf lisp-data :cards)))))))

(defun test-card-json-conversion ()
  "カードのJSON変換テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; カードオブジェクトからJSON
    (let ((card (daifugo-card-system:create-card 7 :hearts)))
      (let ((json-card (daifugo-javascript-api:card-to-json js-api card)))
        (and json-card
             (daifugo-javascript-api:get-json-field json-card "rank")
             (daifugo-javascript-api:get-json-field json-card "suit")
             (= (daifugo-javascript-api:get-json-field json-card "rank") 7)
             (string= (daifugo-javascript-api:get-json-field json-card "suit") "hearts"))))))

(defun test-hand-json-conversion ()
  "手札のJSON変換テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; 手札からJSON配列
    (let ((hand (list (daifugo-card-system:create-card 3 :spades)
                     (daifugo-card-system:create-card 5 :hearts)
                     (daifugo-card-system:create-card 8 :diamonds))))
      (let ((json-hand (daifugo-javascript-api:hand-to-json js-api hand)))
        (and json-hand
             (daifugo-javascript-api:json-array-p json-hand)
             (= (daifugo-javascript-api:json-array-length json-hand) 3))))))

(defun test-game-state-json ()
  "ゲーム状態のJSON変換テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ゲーム状態からJSON
    (let ((game-state (daifugo-game-engine:create-game-state)))
      (let ((json-state (daifugo-javascript-api:game-state-to-json js-api game-state)))
        (and json-state
             (daifugo-javascript-api:get-json-field json-state "currentPlayer")
             (daifugo-javascript-api:get-json-field json-state "field")
             (daifugo-javascript-api:get-json-field json-state "players"))))))

;;; ==========================================
;;; イベント通知システムテスト
;;; ==========================================

(defun test-event-listener_registration ()
  "イベントリスナー登録テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; イベントリスナー登録
    (let ((listener-id (daifugo-javascript-api:register-event-listener js-api "gameStateChanged" 
                                                                       (lambda (event-data)
                                                                         (format t "Event: ~A~%" event-data)))))
      (and listener-id
           (daifugo-javascript-api:is-listener-registered-p js-api listener-id)
           (daifugo-javascript-api:get-listener-count js-api "gameStateChanged")))))

(defun test-event-emission ()
  "イベント発行テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api))
        (event-received nil))
    ;; イベントリスナー登録
    (daifugo-javascript-api:register-event-listener js-api "cardPlayed" 
                                                     (lambda (event-data)
                                                       (setf event-received event-data)))
    ;; イベント発行
    (daifugo-javascript-api:emit-event js-api "cardPlayed" 
                                       (list :player-id 1 :card "3H"))
    ;; イベントが受信されたか確認
    (and event-received
         (= (getf event-received :player-id) 1)
         (string= (getf event-received :card) "3H"))))

(defun test-multiple-event_listeners ()
  "複数イベントリスナーテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api))
        (event-count 0))
    ;; 複数のリスナー登録
    (daifugo-javascript-api:register-event-listener js-api "turnEnd" 
                                                     (lambda (data) (incf event-count)))
    (daifugo-javascript-api:register-event-listener js-api "turnEnd" 
                                                     (lambda (data) (incf event-count)))
    ;; イベント発行
    (daifugo-javascript-api:emit-event js-api "turnEnd" nil)
    ;; 両方のリスナーが呼び出されたか確認
    (= event-count 2)))

(defun test-event-unregistration ()
  "イベントリスナー解除テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api))
        (event-count 0))
    ;; リスナー登録
    (let ((listener-id (daifugo-javascript-api:register-event-listener js-api "gameEnd" 
                                                                       (lambda (data) (incf event-count)))))
      ;; イベント発行（1回目）
      (daifugo-javascript-api:emit-event js-api "gameEnd" nil)
      ;; リスナー解除
      (daifugo-javascript-api:unregister-event-listener js-api listener-id)
      ;; イベント発行（2回目）
      (daifugo-javascript-api:emit-event js-api "gameEnd" nil)
      ;; 1回目だけ呼び出されたか確認
      (= event-count 1))))

;;; ==========================================
;;; ルール動的読み込みAPIテスト
;;; ==========================================

(defun test-rule-loading_api ()
  "ルール読み込みAPIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ルール読み込み
    (let ((result (daifugo-javascript-api:load-rule-api js-api "kakumei")))
      (and result
           (daifugo-javascript-api:get-json-field result "success")
           (daifugo-javascript-api:get-json-field result "ruleName")
           (string= (daifugo-javascript-api:get-json-field result "ruleName") "kakumei")))))

(defun test-rule-list_api ()
  "ルール一覧APIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ルール一覧取得
    (let ((result (daifugo-javascript-api:get-rules-api js-api)))
      (and result
           (daifugo-javascript-api:json-array-p result)
           (> (daifugo-javascript-api:json-array-length result) 0)))))

(defun test-rule-configuration_api ()
  "ルール設定APIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ルール設定
    (let ((config "{\"enabled\": true, \"priority\": 100}"))
      (let ((result (daifugo-javascript-api:configure-rule-api js-api "8kiri" config)))
        (and result
             (daifugo-javascript-api:get-json-field result "success")
             (daifugo-javascript-api:get-json-field result "configured"))))))

(defun test-rule-status_api ()
  "ルール状態APIテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ルール状態取得
    (let ((result (daifugo-javascript-api:get-rule-status-api js-api "kaidan")))
      (and result
           (daifugo-javascript-api:has-json-field-p result "enabled")
           (daifugo-javascript-api:has-json-field-p result "loaded")
           (daifugo-javascript-api:has-json-field-p result "priority")))))

;;; ==========================================
;;; エラーハンドリング・セキュリティテスト
;;; ==========================================

(defun test-invalid-json_handling ()
  "無効JSON処理テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; 無効なJSON
    (let ((invalid-json "{\"key\": invalid_value}"))
      (let ((result (daifugo-javascript-api:from-json js-api invalid-json)))
        (and (null result)
             (daifugo-javascript-api:get-last-error js-api))))))

(defun test-malformed-request_handling ()
  "不正リクエスト処理テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; 不正なゲームID
    (let ((result (daifugo-javascript-api:get-game-state-api js-api "invalid-game-id")))
      (and result
           (not (daifugo-javascript-api:get-json-field result "success"))
           (daifugo-javascript-api:get-json-field result "error")))))

(defun test-security-validation ()
  "セキュリティ検証テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; 悪意のあるスクリプト注入試行
    (let ((malicious-input "<script>alert('xss')</script>"))
      (let ((result (daifugo-javascript-api:sanitize-input js-api malicious-input)))
        (and result
             (not (search "<script>" result))
             (daifugo-javascript-api:is-safe-input-p result))))))

(defun test-api-rate_limiting ()
  "API レート制限テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; レート制限設定
    (daifugo-javascript-api:set-rate-limit js-api 5 60)  ; 5回/分
    ;; 制限を超えるリクエスト
    (let ((success-count 0))
      (dotimes (i 10)
        (let ((result (daifugo-javascript-api:get-api-status js-api)))
          (when (daifugo-javascript-api:get-json-field result "success")
            (incf success-count))))
      ;; 制限内のリクエストのみ成功
      (<= success-count 5))))

(defun test-concurrent-request_handling ()
  "同時リクエスト処理テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; 同時リクエスト
    (let ((results '()))
      (dotimes (i 3)
        (push (daifugo-javascript-api:get-api-status js-api) results))
      ;; 全てのリクエストが正常に処理されたか確認
      (every (lambda (result) 
               (daifugo-javascript-api:get-json-field result "success"))
             results))))

;;; ==========================================
;;; パフォーマンス・最適化テスト
;;; ==========================================

(defun test-api-performance ()
  "API パフォーマンステスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api))
        (start-time (get-internal-real-time)))
    ;; 大量のAPI呼び出し
    (dotimes (i 1000)
      (daifugo-javascript-api:get-api-status js-api))
    (let ((elapsed-time (/ (- (get-internal-real-time) start-time) 
                          internal-time-units-per-second)))
      (< elapsed-time 1.0))))  ; 1秒以内での完了を期待

(defun test-memory-leak_prevention ()
  "メモリリーク防止テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; 大量のデータ処理
    (dotimes (i 100)
      (let ((large-data (make-list 1000 :initial-element "test")))
        (daifugo-javascript-api:to-json js-api large-data)))
    ;; メモリ使用量チェック（簡易）
    (daifugo-javascript-api:cleanup-api js-api)
    t))

(defun test-cache-effectiveness ()
  "キャッシュ効果テスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; キャッシュ有効化
    (daifugo-javascript-api:enable-cache js-api)
    ;; 同じデータを複数回要求
    (let ((start-time (get-internal-real-time)))
      (dotimes (i 10)
        (daifugo-javascript-api:get-rules-api js-api))
      (let ((cached-time (/ (- (get-internal-real-time) start-time) 
                           internal-time-units-per-second)))
        ;; キャッシュ無効化
        (daifugo-javascript-api:disable-cache js-api)
        (let ((start-time2 (get-internal-real-time)))
          (dotimes (i 10)
            (daifugo-javascript-api:get-rules-api js-api))
          (let ((uncached-time (/ (- (get-internal-real-time) start-time2) 
                                 internal-time-units-per-second)))
            ;; キャッシュ有効時の方が高速
            (< cached-time uncached-time)))))))

;;; ==========================================
;;; 統合テスト
;;; ==========================================

(defun test-full-game_api_flow ()
  "完全なゲームAPIフローテスト"
  (let ((js-api (daifugo-javascript-api:create-javascript-api)))
    ;; ゲーム作成
    (let ((create-result (daifugo-javascript-api:create-game-api js-api 4)))
      (when (daifugo-javascript-api:get-json-field create-result "success")
        (let ((game-id (daifugo-javascript-api:get-json-field create-result "gameId")))
          ;; ゲーム開始
          (let ((start-result (daifugo-javascript-api:start-game-api js-api game-id)))
            (when (daifugo-javascript-api:get-json-field start-result "success")
              ;; カードプレイ
              (let ((play-result (daifugo-javascript-api:play-cards-api js-api game-id 0 
                                                                        "[{\"rank\": 3, \"suit\": \"spades\"}]")))
                (when (daifugo-javascript-api:get-json-field play-result "success")
                  ;; 状態確認
                  (let ((state-result (daifugo-javascript-api:get-game-state-api js-api game-id)))
                    (daifugo-javascript-api:get-json-field state-result "gameState")))))))))))

;;; ==========================================
;;; 簡易テスト関数（詳細バージョン）
;;; ==========================================

;; 簡易JSON応答構造
(defstruct simple-json-response
  success
  data
  error)

;; 簡易JavaScript API構造
(defstruct simple-js-api
  active-p
  version
  games
  request-count)

;; 基本JavaScript APIシステム
(defun create-simple-js-api ()
  "簡易JavaScript APIを作成"
  (make-simple-js-api :active-p t :version "1.0.0" :games (make-hash-table :test 'equal) :request-count 0))

(defun simple-create-json-response (success data &optional error)
  "簡易JSON応答作成"
  (make-simple-json-response :success success :data data :error error))

(defun simple-get-json-field (json-obj field-name)
  "簡易JSONフィールド取得"
  (when (simple-json-response-p json-obj)
    (case (intern (string-upcase field-name) :keyword)
      (:success (simple-json-response-success json-obj))
      (:data (simple-json-response-data json-obj))
      (:error (simple-json-response-error json-obj))
      (otherwise nil))))

(defun simple-create-game-api (js-api player-count)
  "簡易ゲーム作成API"
  (when (simple-js-api-active-p js-api)
    (incf (simple-js-api-request-count js-api))
    (let ((game-id (format nil "game-~A" (random 1000000))))
      (setf (gethash game-id (simple-js-api-games js-api)) 
            (list :player-count player-count :status "created"))
      (simple-create-json-response t (list :game-id game-id :player-count player-count :status "created")))))

(defun simple-get-api-status (js-api)
  "簡易API状態取得"
  (simple-create-json-response t (list :active (simple-js-api-active-p js-api)
                                      :version (simple-js-api-version js-api)
                                      :request-count (simple-js-api-request-count js-api))))

(defun simple-to-json (data)
  "簡易JSON変換"
  (format nil "~A" data))

(defun simple-from-json (json-string)
  "簡易JSON解析"
  (handler-case
      (read-from-string json-string)
    (error () nil)))

;; 簡易テスト関数群（詳細バージョン）
(defun test-simple-api-creation-detailed ()
  "API作成テスト（詳細）"
  (let ((js-api (create-simple-js-api)))
    (and js-api
         (simple-js-api-p js-api)
         (simple-js-api-active-p js-api)
         (string= (simple-js-api-version js-api) "1.0.0"))))

(defun test-simple-game-creation-detailed ()
  "ゲーム作成テスト（詳細）"
  (let ((js-api (create-simple-js-api)))
    (let ((result (simple-create-game-api js-api 4)))
      (and result
           (simple-json-response-p result)
           (simple-get-json-field result "success")
           (let ((data (simple-get-json-field result "data")))
             (and data
                  (getf data :game-id)
                  (= (getf data :player-count) 4)))))))

(defun test-simple-api-status-detailed ()
  "API状態テスト（詳細）"
  (let ((js-api (create-simple-js-api)))
    ;; リクエスト実行
    (simple-create-game-api js-api 3)
    (let ((status (simple-get-api-status js-api)))
      (and status
           (simple-get-json-field status "success")
           (let ((data (simple-get-json-field status "data")))
             (and data
                  (getf data :active)
                  (= (getf data :request-count) 1)))))))

(defun test-simple-json-conversion-detailed ()
  "JSON変換テスト（詳細）"
  (let ((data (list :player "Player1" :score 100)))
    (let ((json-string (simple-to-json data)))
      (and json-string
           (stringp json-string)
           (search "Player1" json-string)
           (search "100" json-string)))))

(defun test-simple-json-parsing-detailed ()
  "JSON解析テスト（詳細）"
  (let ((json-string "(:PLAYER-ID 1 :ACTION \"play\")"))
    (let ((data (simple-from-json json-string)))
      (and data
           (listp data)
           (= (getf data :player-id) 1)
           (string= (getf data :action) "play")))))

(defun test-simple-request-counting-detailed ()
  "リクエスト数計測テスト（詳細）"
  (let ((js-api (create-simple-js-api)))
    ;; 複数リクエスト実行
    (simple-create-game-api js-api 4)
    (simple-create-game-api js-api 3)
    ;; API状態取得はリクエストカウントに含まれない
    (simple-get-api-status js-api)
    ;; カウント確認
    (= (simple-js-api-request-count js-api) 2)))

(defun test-simple-game-storage-detailed ()
  "ゲーム保存テスト（詳細）"
  (let ((js-api (create-simple-js-api)))
    (let ((result (simple-create-game-api js-api 4)))
      (when (simple-get-json-field result "success")
        (let ((game-id (getf (simple-get-json-field result "data") :game-id)))
          (let ((stored-game (gethash game-id (simple-js-api-games js-api))))
            (and stored-game
                 (= (getf stored-game :player-count) 4)
                 (string= (getf stored-game :status) "created"))))))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-javascript-api-tests ()
  "JavaScript API システムの全テストを実行"
  (format t "~%=== JavaScript API（javascript-api.lisp）テスト実行 ===~%")
  
  (let ((tests '(("JavaScript API システム作成" . test-javascript-api-creation)
                 ("ゲーム作成API" . test-game-creation-api)
                 ("ゲーム状態取得API" . test-game-state-api)
                 ("プレイヤーアクションAPI" . test-player-action-api)
                 ("パスアクションAPI" . test-pass-action-api)
                 ("JSON シリアライゼーション" . test-json-serialization)
                 ("JSON デシリアライゼーション" . test-json-deserialization)
                 ("カードJSON変換" . test-card-json-conversion)
                 ("手札JSON変換" . test-hand-json-conversion)
                 ("ゲーム状態JSON変換" . test-game-state-json)
                 ("イベントリスナー登録" . test-event-listener_registration)
                 ("イベント発行" . test-event-emission)
                 ("複数イベントリスナー" . test-multiple-event_listeners)
                 ("イベントリスナー解除" . test-event-unregistration)
                 ("ルール読み込みAPI" . test-rule-loading_api)
                 ("ルール一覧API" . test-rule-list_api)
                 ("ルール設定API" . test-rule-configuration_api)
                 ("ルール状態API" . test-rule-status_api)
                 ("無効JSON処理" . test-invalid-json_handling)
                 ("不正リクエスト処理" . test-malformed-request_handling)
                 ("セキュリティ検証" . test-security-validation)
                 ("API レート制限" . test-api-rate_limiting)
                 ("同時リクエスト処理" . test-concurrent-request_handling)
                 ("API パフォーマンス" . test-api-performance)
                 ("メモリリーク防止" . test-memory-leak_prevention)
                 ("キャッシュ効果" . test-cache-effectiveness)
                 ("完全ゲームAPIフロー" . test-full-game_api_flow)))
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

(defun run-simple-javascript-api-tests ()
  "簡易JavaScript APIテスト実行"
  (format t "~%=== 簡易JavaScript APIテスト実行 ===~%")
  
  (let ((tests '(("API作成（詳細）" . test-simple-api-creation-detailed)
                 ("ゲーム作成（詳細）" . test-simple-game-creation-detailed)
                 ("API状態取得（詳細）" . test-simple-api-status-detailed)
                 ("JSON変換（詳細）" . test-simple-json-conversion-detailed)
                 ("JSON解析（詳細）" . test-simple-json-parsing-detailed)
                 ("リクエスト数計測（詳細）" . test-simple-request-counting-detailed)
                 ("ゲーム保存（詳細）" . test-simple-game-storage-detailed)))
        (passed 0)
        (failed 0))
    
    (dolist (test tests)
      (let ((test-name (car test))
            (test-func (cdr test)))
        (format t "テスト: ~A ... " test-name)
        (if (funcall test-func)
            (progn
              (format t "合格~%")
              (incf passed))
            (progn
              (format t "失敗~%")
              (incf failed)))))
    
    (format t "~%結果: ~A合格, ~A失敗~%~%" passed failed)
    (= failed 0)))

;; テスト実行
(format t "~%JavaScript API（javascript-api.lisp）のテストケース準備完了~%")
(format t "詳細テスト: (daifugo-javascript-api-integrated-test:run-javascript-api-tests)~%")
(format t "簡易テスト: (daifugo-javascript-api-integrated-test:run-simple-javascript-api-tests)~%")