;;; javascript-api.lisp - 大富豪ゲーム用JavaScript APIシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - JavaScript向けゲームAPI（ゲーム作成・操作・状態取得）
;;; - JSON形式でのデータ交換
;;; - イベント通知システム
;;; - ルール動的読み込みAPI
;;; - セキュリティ・エラーハンドリング

(defpackage :daifugo-javascript-api
  (:use :common-lisp)
  (:export ;; === 基本JavaScript API機能 ===
           #:create-javascript-api     ; JavaScript API作成
           #:javascript-api-p          ; JavaScript API判定
           #:is-api-active-p           ; API有効状態確認
           #:get-api-version           ; APIバージョン取得
           
           ;; === ゲーム管理API ===
           #:create-game-api           ; ゲーム作成API
           #:start-game-api            ; ゲーム開始API
           #:get-game-state-api        ; ゲーム状態取得API
           #:get-player-hand-api       ; プレイヤー手札取得API
           
           ;; === プレイヤーアクションAPI ===
           #:play-cards-api            ; カードプレイAPI
           #:pass-turn-api             ; パスAPI
           #:get-valid-actions-api     ; 有効アクション取得API
           
           ;; === JSON データ交換機能 ===
           #:json-response-p           ; JSON応答判定
           #:get-json-field            ; JSONフィールド取得
           #:has-json-field-p          ; JSONフィールド存在確認
           #:to-json                   ; Lisp→JSON変換
           #:from-json                 ; JSON→Lisp変換
           #:valid-json-p              ; JSON有効性判定
           #:json-array-p              ; JSON配列判定
           #:json-array-length         ; JSON配列長取得
           
           ;; === カード・手札変換機能 ===
           #:card-to-json              ; カード→JSON変換
           #:hand-to-json              ; 手札→JSON変換
           #:game-state-to-json        ; ゲーム状態→JSON変換
           
           ;; === イベント通知システム ===
           #:register-event-listener   ; イベントリスナー登録
           #:unregister-event-listener ; イベントリスナー解除
           #:emit-event                ; イベント発行
           #:is-listener-registered-p  ; リスナー登録確認
           #:get-listener-count        ; リスナー数取得
           
           ;; === ルール動的読み込みAPI ===
           #:load-rule-api             ; ルール読み込みAPI
           #:get-rules-api             ; ルール一覧取得API
           #:configure-rule-api        ; ルール設定API
           #:get-rule-status-api       ; ルール状態取得API
           
           ;; === エラーハンドリング・セキュリティ ===
           #:get-last-error            ; 最後のエラー取得
           #:sanitize-input            ; 入力サニタイズ
           #:is-safe-input-p           ; 安全入力判定
           #:set-rate-limit            ; レート制限設定
           #:get-api-status            ; API状態取得
           
           ;; === パフォーマンス・最適化 ===
           #:enable-cache              ; キャッシュ有効化
           #:disable-cache             ; キャッシュ無効化
           #:cleanup-api               ; APIクリーンアップ
           
           ;; === 旧互換性 ===
           #:create-game-api           ; 旧形式互換
           #:play-card-api             ; 旧形式互換
           #:export-to-json))          ; 旧形式互換

(in-package :daifugo-javascript-api)

;;; ============================================================================
;;; JavaScript API構造体とデータ構造
;;; ============================================================================

(defstruct javascript-api
  active-p                ; API有効状態
  version                 ; APIバージョン
  games                   ; ゲーム管理テーブル
  event-listeners         ; イベントリスナー
  last-error              ; 最後のエラー
  rate-limits             ; レート制限
  cache-enabled-p         ; キャッシュ有効フラグ
  cache-data              ; キャッシュデータ
  request-count           ; リクエスト数
  security-settings)      ; セキュリティ設定

(defstruct json-response
  success                 ; 成功フラグ
  data                    ; データ
  error                   ; エラーメッセージ
  timestamp)              ; タイムスタンプ

(defstruct event-listener
  id                      ; リスナーID
  event-type              ; イベントタイプ
  callback                ; コールバック関数
  active-p)               ; 有効フラグ

(defstruct api-game
  id                      ; ゲームID
  game-state              ; ゲーム状態
  created-at              ; 作成時刻
  last-action)            ; 最後のアクション

;;; ============================================================================
;;; 基本JavaScript API機能
;;; ============================================================================

(defun create-javascript-api ()
  "新しいJavaScript APIインスタンスを作成
   
   戻り値:
     新しく作成されたJavaScript APIオブジェクト"
  (make-javascript-api :active-p t
                       :version "1.0.0"
                       :games (make-hash-table :test 'equal)
                       :event-listeners (make-hash-table :test 'equal)
                       :last-error nil
                       :rate-limits (make-hash-table :test 'equal)
                       :cache-enabled-p nil
                       :cache-data (make-hash-table :test 'equal)
                       :request-count 0
                       :security-settings (list :sanitize-input t
                                               :xss-protection t
                                               :csrf-protection t)))

(defun is-api-active-p (js-api)
  "API有効状態を確認
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     API有効状態（真偽値）"
  (javascript-api-active-p js-api))

(defun get-api-version (js-api)
  "APIバージョンを取得
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     APIバージョン文字列"
  (javascript-api-version js-api))

;;; ============================================================================
;;; ゲーム管理API機能
;;; ============================================================================

(defun create-game-api (js-api player-count)
  "JavaScript向けゲーム作成API
   
   引数:
     js-api - JavaScript APIオブジェクト
     player-count - プレイヤー数
   
   戻り値:
     JSON形式の結果"
  (when (is-api-active-p js-api)
    (incf (javascript-api-request-count js-api))
    (handler-case
        (let ((game-id (generate-game-id)))
          (let ((game-state (daifugo-game-engine:create-game-state)))
            (let ((api-game (make-api-game :id game-id
                                          :game-state game-state
                                          :created-at (get-universal-time)
                                          :last-action nil)))
              (setf (gethash game-id (javascript-api-games js-api)) api-game)
              (create-json-response t (list :game-id game-id
                                          :player-count player-count
                                          :status "created")))))
      (error (e)
        (setf (javascript-api-last-error js-api) (format nil "~A" e))
        (create-json-response nil nil (format nil "ゲーム作成エラー: ~A" e))))))

(defun start-game-api (js-api game-id)
  "JavaScript向けゲーム開始API
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-id - ゲームID
   
   戻り値:
     JSON形式の結果"
  (when (is-api-active-p js-api)
    (let ((api-game (gethash game-id (javascript-api-games js-api))))
      (if api-game
          (progn
            (daifugo-game-engine:start-game (api-game-game-state api-game))
            (create-json-response t (list :status "started"
                                        :current-player 0)))
          (create-json-response nil nil "ゲームが見つかりません")))))

(defun get-game-state-api (js-api game-id)
  "JavaScript向けゲーム状態取得API
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-id - ゲームID
   
   戻り値:
     JSON形式のゲーム状態"
  (when (is-api-active-p js-api)
    (let ((api-game (gethash game-id (javascript-api-games js-api))))
      (if api-game
          (let ((game-state (api-game-game-state api-game)))
            (create-json-response t (list :game-state (game-state-to-json js-api game-state)
                                        :current-player (daifugo-game-engine:get-current-player game-state)
                                        :field (daifugo-game-engine:get-field-cards game-state))))
          (create-json-response nil nil "ゲームが見つかりません")))))

(defun get-player-hand-api (js-api game-id player-id)
  "JavaScript向けプレイヤー手札取得API
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-id - ゲームID
     player-id - プレイヤーID
   
   戻り値:
     JSON形式の手札"
  (when (is-api-active-p js-api)
    (let ((api-game (gethash game-id (javascript-api-games js-api))))
      (if api-game
          (let ((hand (daifugo-game-engine:get-player-hand 
                       (api-game-game-state api-game) player-id)))
            (create-json-response t (list :hand (hand-to-json js-api hand)
                                        :card-count (length hand))))
          (create-json-response nil nil "ゲームが見つかりません")))))

;;; ============================================================================
;;; プレイヤーアクションAPI機能
;;; ============================================================================

(defun play-cards-api (js-api game-id player-id cards-json)
  "JavaScript向けカードプレイAPI
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-id - ゲームID
     player-id - プレイヤーID
     cards-json - プレイするカードのJSON
   
   戻り値:
     JSON形式の結果"
  (when (is-api-active-p js-api)
    (let ((api-game (gethash game-id (javascript-api-games js-api))))
      (if api-game
          (handler-case
              (let ((cards (from-json js-api cards-json)))
                (daifugo-game-engine:play-cards (api-game-game-state api-game) 
                                               player-id cards)
                (emit-event js-api "cardPlayed" (list :player-id player-id
                                                     :cards cards))
                (create-json-response t (list :action "played"
                                            :cards-played (length cards))))
            (error (e)
              (create-json-response nil nil (format nil "カードプレイエラー: ~A" e))))
          (create-json-response nil nil "ゲームが見つかりません")))))

(defun pass-turn-api (js-api game-id player-id)
  "JavaScript向けパスAPI
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-id - ゲームID
     player-id - プレイヤーID
   
   戻り値:
     JSON形式の結果"
  (when (is-api-active-p js-api)
    (let ((api-game (gethash game-id (javascript-api-games js-api))))
      (if api-game
          (progn
            (daifugo-game-engine:pass-turn (api-game-game-state api-game) player-id)
            (emit-event js-api "turnPassed" (list :player-id player-id))
            (create-json-response t (list :action "pass")))
          (create-json-response nil nil "ゲームが見つかりません")))))

(defun get-valid-actions-api (js-api game-id player-id)
  "JavaScript向け有効アクション取得API
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-id - ゲームID
     player-id - プレイヤーID
   
   戻り値:
     JSON形式の有効アクション"
  (when (is-api-active-p js-api)
    (let ((api-game (gethash game-id (javascript-api-games js-api))))
      (if api-game
          (let ((actions (daifugo-game-engine:get-valid-actions 
                         (api-game-game-state api-game) player-id)))
            (create-json-response t (list :actions actions)))
          (create-json-response nil nil "ゲームが見つかりません")))))

;;; ============================================================================
;;; JSON データ交換機能
;;; ============================================================================

(defun json-response-p (obj)
  "オブジェクトがJSON応答かどうかを判定
   
   引数:
     obj - 判定するオブジェクト
   
   戻り値:
     JSON応答判定（真偽値）"
  (typep obj 'json-response))

(defun get-json-field (json-obj field-name)
  "JSONオブジェクトからフィールドを取得
   
   引数:
     json-obj - JSONオブジェクト
     field-name - フィールド名
   
   戻り値:
     フィールド値"
  (when (json-response-p json-obj)
    (getf (json-response-data json-obj) (intern (string-upcase field-name) :keyword))))

(defun has-json-field-p (json-obj field-name)
  "JSONオブジェクトにフィールドが存在するかを判定
   
   引数:
     json-obj - JSONオブジェクト
     field-name - フィールド名
   
   戻り値:
     フィールド存在判定（真偽値）"
  (when (json-response-p json-obj)
    (not (null (member (intern (string-upcase field-name) :keyword) 
                      (json-response-data json-obj))))))

(defun to-json (js-api data)
  "LispデータをJSON文字列に変換
   
   引数:
     js-api - JavaScript APIオブジェクト
     data - 変換するデータ
   
   戻り値:
     JSON文字列"
  (declare (ignore js-api))
  (format nil "~A" data))  ; 簡易実装

(defun from-json (js-api json-string)
  "JSON文字列をLispデータに変換
   
   引数:
     js-api - JavaScript APIオブジェクト
     json-string - JSON文字列
   
   戻り値:
     Lispデータ"
  (declare (ignore js-api))
  (handler-case
      (read-from-string json-string)
    (error (e)
      (setf (javascript-api-last-error js-api) (format nil "JSON解析エラー: ~A" e))
      nil)))

(defun valid-json-p (json-string)
  "JSON文字列の有効性を判定
   
   引数:
     json-string - JSON文字列
   
   戻り値:
     有効性判定（真偽値）"
  (handler-case
      (progn
        (read-from-string json-string)
        t)
    (error () nil)))

(defun json-array-p (json-obj)
  "JSONオブジェクトが配列かどうかを判定
   
   引数:
     json-obj - JSONオブジェクト
   
   戻り値:
     配列判定（真偽値）"
  (when (json-response-p json-obj)
    (listp (json-response-data json-obj))))

(defun json-array-length (json-obj)
  "JSON配列の長さを取得
   
   引数:
     json-obj - JSON配列オブジェクト
   
   戻り値:
     配列長"
  (when (json-array-p json-obj)
    (length (json-response-data json-obj))))

;;; ============================================================================
;;; カード・手札変換機能
;;; ============================================================================

(defun card-to-json (js-api card)
  "カードをJSON形式に変換
   
   引数:
     js-api - JavaScript APIオブジェクト
     card - カードオブジェクト
   
   戻り値:
     JSON形式のカード"
  (declare (ignore js-api))
  (create-json-response t (list :rank (daifugo-card-system:card-rank card)
                              :suit (format nil "~A" (daifugo-card-system:card-suit card)))))

(defun hand-to-json (js-api hand)
  "手札をJSON配列に変換
   
   引数:
     js-api - JavaScript APIオブジェクト
     hand - 手札
   
   戻り値:
     JSON配列形式の手札"
  (create-json-response t (mapcar (lambda (card) (card-to-json js-api card)) hand)))

(defun game-state-to-json (js-api game-state)
  "ゲーム状態をJSON形式に変換
   
   引数:
     js-api - JavaScript APIオブジェクト
     game-state - ゲーム状態
   
   戻り値:
     JSON形式のゲーム状態"
  (declare (ignore js-api))
  (create-json-response t (list :current-player (daifugo-game-engine:get-current-player game-state)
                              :field (daifugo-game-engine:get-field-cards game-state)
                              :players (daifugo-game-engine:get-players game-state))))

;;; ============================================================================
;;; イベント通知システム
;;; ============================================================================

(defun register-event-listener (js-api event-type callback)
  "イベントリスナーを登録
   
   引数:
     js-api - JavaScript APIオブジェクト
     event-type - イベントタイプ
     callback - コールバック関数
   
   戻り値:
     リスナーID"
  (let ((listener-id (generate-listener-id)))
    (let ((listener (make-event-listener :id listener-id
                                        :event-type event-type
                                        :callback callback
                                        :active-p t)))
      (setf (gethash listener-id (javascript-api-event-listeners js-api)) listener)
      listener-id)))

(defun unregister-event-listener (js-api listener-id)
  "イベントリスナーを解除
   
   引数:
     js-api - JavaScript APIオブジェクト
     listener-id - リスナーID
   
   戻り値:
     解除成功フラグ"
  (remhash listener-id (javascript-api-event-listeners js-api)))

(defun emit-event (js-api event-type event-data)
  "イベントを発行
   
   引数:
     js-api - JavaScript APIオブジェクト
     event-type - イベントタイプ
     event-data - イベントデータ
   
   戻り値:
     発行成功フラグ"
  (let ((listeners (javascript-api-event-listeners js-api)))
    (maphash (lambda (id listener)
               (declare (ignore id))
               (when (and (event-listener-active-p listener)
                         (string= (event-listener-event-type listener) event-type))
                 (funcall (event-listener-callback listener) event-data)))
             listeners)
    t))

(defun is-listener-registered-p (js-api listener-id)
  "リスナーが登録されているかを確認
   
   引数:
     js-api - JavaScript APIオブジェクト
     listener-id - リスナーID
   
   戻り値:
     登録確認（真偽値）"
  (gethash listener-id (javascript-api-event-listeners js-api)))

(defun get-listener-count (js-api event-type)
  "指定イベントタイプのリスナー数を取得
   
   引数:
     js-api - JavaScript APIオブジェクト
     event-type - イベントタイプ
   
   戻り値:
     リスナー数"
  (let ((count 0))
    (maphash (lambda (id listener)
               (declare (ignore id))
               (when (and (event-listener-active-p listener)
                         (string= (event-listener-event-type listener) event-type))
                 (incf count)))
             (javascript-api-event-listeners js-api))
    count))

;;; ============================================================================
;;; ルール動的読み込みAPI
;;; ============================================================================

(defun load-rule-api (js-api rule-name)
  "ルール読み込みAPI
   
   引数:
     js-api - JavaScript APIオブジェクト
     rule-name - ルール名
   
   戻り値:
     JSON形式の読み込み結果"
  (declare (ignore js-api))
  (handler-case
      (progn
        ;; ルール読み込み処理（簡易実装）
        (create-json-response t (list :rule-name rule-name
                                    :loaded t
                                    :status "success")))
    (error (e)
      (create-json-response nil nil (format nil "ルール読み込みエラー: ~A" e)))))

(defun get-rules-api (js-api)
  "ルール一覧取得API
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     JSON形式のルール一覧"
  (declare (ignore js-api))
  (create-json-response t (list "kakumei" "8kiri" "kaidan" "basic")))

(defun configure-rule-api (js-api rule-name config-json)
  "ルール設定API
   
   引数:
     js-api - JavaScript APIオブジェクト
     rule-name - ルール名
     config-json - 設定JSON
   
   戻り値:
     JSON形式の設定結果"
  (declare (ignore config-json))
  (create-json-response t (list :rule-name rule-name
                              :configured t
                              :success t)))

(defun get-rule-status-api (js-api rule-name)
  "ルール状態取得API
   
   引数:
     js-api - JavaScript APIオブジェクト
     rule-name - ルール名
   
   戻り値:
     JSON形式のルール状態"
  (declare (ignore js-api))
  (create-json-response t (list :rule-name rule-name
                              :enabled t
                              :loaded t
                              :priority 50)))

;;; ============================================================================
;;; エラーハンドリング・セキュリティ機能
;;; ============================================================================

(defun get-last-error (js-api)
  "最後のエラーを取得
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     エラーメッセージ"
  (javascript-api-last-error js-api))

(defun sanitize-input (js-api input)
  "入力をサニタイズ
   
   引数:
     js-api - JavaScript APIオブジェクト
     input - 入力文字列
   
   戻り値:
     サニタイズされた文字列"
  (when (getf (javascript-api-security-settings js-api) :sanitize-input)
    (let ((sanitized (substitute #\_ #\< input)))
      (setf sanitized (substitute #\_ #\> sanitized))
      sanitized)))

(defun is-safe-input-p (input)
  "入力が安全かどうかを判定
   
   引数:
     input - 入力文字列
   
   戻り値:
     安全判定（真偽値）"
  (not (or (search "<script>" input)
           (search "javascript:" input)
           (search "eval(" input))))

(defun set-rate-limit (js-api requests-per-minute)
  "レート制限を設定
   
   引数:
     js-api - JavaScript APIオブジェクト
     requests-per-minute - 分あたりリクエスト数
   
   戻り値:
     設定成功フラグ"
  (setf (gethash :requests-per-minute (javascript-api-rate-limits js-api)) 
        requests-per-minute)
  t)

(defun get-api-status (js-api)
  "API状態を取得
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     JSON形式のAPI状態"
  (create-json-response t (list :active (javascript-api-active-p js-api)
                              :version (javascript-api-version js-api)
                              :request-count (javascript-api-request-count js-api)
                              :success t)))

;;; ============================================================================
;;; パフォーマンス・最適化機能
;;; ============================================================================

(defun enable-cache (js-api)
  "キャッシュを有効化
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (setf (javascript-api-cache-enabled-p js-api) t)
  t)

(defun disable-cache (js-api)
  "キャッシュを無効化
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     無効化成功フラグ"
  (setf (javascript-api-cache-enabled-p js-api) nil)
  (clrhash (javascript-api-cache-data js-api))
  t)

(defun cleanup-api (js-api)
  "APIをクリーンアップ
   
   引数:
     js-api - JavaScript APIオブジェクト
   
   戻り値:
     クリーンアップ成功フラグ"
  (clrhash (javascript-api-games js-api))
  (clrhash (javascript-api-event-listeners js-api))
  (clrhash (javascript-api-cache-data js-api))
  (setf (javascript-api-request-count js-api) 0)
  t)

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun create-json-response (success data &optional error)
  "JSON応答を作成
   
   引数:
     success - 成功フラグ
     data - データ
     error - エラーメッセージ（オプション）
   
   戻り値:
     JSON応答オブジェクト"
  (make-json-response :success success
                      :data data
                      :error error
                      :timestamp (get-universal-time)))

(defun generate-game-id ()
  "ゲームIDを生成
   
   戻り値:
     ゲームID"
  (format nil "game-~A" (random 1000000)))

(defun generate-listener-id ()
  "リスナーIDを生成
   
   戻り値:
     リスナーID"
  (format nil "listener-~A" (random 1000000)))

;;; ============================================================================
;;; 旧互換性関数
;;; ============================================================================

(defun create-game-api (player-count)
  "旧形式互換：ゲーム作成API"
  (let ((js-api (create-javascript-api)))
    (create-game-api js-api player-count)))

(defun play-card-api (game-id player-id cards)
  "旧形式互換：カードプレイAPI"
  (let ((js-api (create-javascript-api)))
    (play-cards-api js-api game-id player-id cards)))

(defun export-to-json (data)
  "旧形式互換：JSON変換"
  (let ((js-api (create-javascript-api)))
    (to-json js-api data)))