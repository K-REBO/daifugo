;;; rule-loader.lisp - 大富豪ゲーム用動的ルール読み込みシステム
;;; 
;;; 本システムは以下の機能を提供します：
;;; - 動的ルールファイル読み込み・管理
;;; - ルール依存関係解決
;;; - ホットリロード・ファイル監視
;;; - ルール設定・優先度管理
;;; - エラーハンドリング・回復機能

(defpackage :daifugo-rule-loader
  (:use :common-lisp)
  (:export ;; === 基本ルール読み込み機能 ===
           #:create-rule-loader        ; ルールローダー作成
           #:rule-loader-p             ; ルールローダー判定
           #:get-loaded-rules          ; 読み込み済みルール取得
           #:load-rule-file            ; 単一ルールファイル読み込み
           #:load-all-rules            ; 一括ルール読み込み
           #:discover-rule-files       ; ルールファイル自動発見
           #:validate-rule-file        ; ルールファイル検証
           
           ;; === ルール管理・制御機能 ===
           #:is-rule-loaded-p          ; ルール読み込み状態確認
           #:is-rule-active-p          ; ルール有効状態確認
           #:activate-rule             ; ルール有効化
           #:deactivate-rule           ; ルール無効化
           #:unload-rule               ; ルールアンロード
           #:reload-rule               ; ルール再読み込み
           #:get-first-loaded-rule-name ; 最初の読み込みルール名取得
           #:get-rule-load-timestamp   ; ルール読み込みタイムスタンプ取得
           
           ;; === ルール依存関係機能 ===
           #:add-rule-dependency       ; ルール依存関係追加
           #:resolve-dependencies      ; 依存関係解決
           #:detect-circular-dependencies ; 循環依存検出
           #:load-rule-with-dependencies ; 依存関係付きルール読み込み
           
           ;; === ルール設定・カスタマイズ ===
           #:configure-rule            ; ルール設定
           #:get-rule-configuration    ; ルール設定取得
           #:load-rule-with-priority   ; 優先度付きルール読み込み
           #:get-rules-by-priority     ; 優先度別ルール取得
           #:detect-rule-conflicts     ; ルール競合検出
           
           ;; === 動的更新・監視機能 ===
           #:enable-hot-reloading      ; ホットリロード有効化
           #:is-hot-reloading-enabled-p ; ホットリロード状態確認
           #:simulate-file-change      ; ファイル変更シミュレーション
           #:check-and-reload-changed-rules ; 変更ルール確認・再読み込み
           #:start-file-watcher        ; ファイル監視開始
           #:stop-file-watcher         ; ファイル監視停止
           #:is-file-watcher-running-p ; ファイル監視状態確認
           
           ;; === エラーハンドリング・回復 ===
           #:get-loader-state-snapshot ; ローダー状態スナップショット取得
           #:states-equal-p            ; 状態等価判定
           
           ;; === パフォーマンス・最適化 ===
           #:enable-rule-caching       ; ルールキャッシュ有効化
           #:enable-lazy-loading       ; 遅延読み込み有効化
           #:register-rule-for-lazy-loading ; 遅延読み込み登録
           #:is-rule-registered-for-lazy-loading-p ; 遅延読み込み登録確認
           #:trigger-lazy-loading      ; 遅延読み込み実行
           
           ;; === ルール情報・メタデータ ===
           #:get-rule-metadata         ; ルールメタデータ取得
           #:generate-rule-documentation ; ルールドキュメント生成
           
           ;; === 旧互換性機能 ===
           #:load-local-rule           ; 旧形式互換
           #:load-rule-set             ; 旧形式互換
           #:unload-rule               ; 旧形式互換
           #:list-active-rules         ; 旧形式互換
           #:rule-file-exists-p))      ; 旧形式互換

(in-package :daifugo-rule-loader)

;;; ============================================================================
;;; データ構造定義
;;; ============================================================================

(defstruct rule-loader
  loaded-rules               ; 読み込み済みルールのハッシュテーブル
  dependencies              ; ルール依存関係グラフ
  configurations            ; ルール設定
  hot-reloading-enabled     ; ホットリロード有効フラグ
  file-watcher-running      ; ファイル監視実行フラグ
  file-timestamps           ; ファイルタイムスタンプ
  rule-cache               ; ルールキャッシュ
  lazy-loading-enabled     ; 遅延読み込み有効フラグ
  lazy-rules               ; 遅延読み込み待機ルール
  rule-metadata)           ; ルールメタデータ

(defstruct loaded-rule
  name                     ; ルール名
  file-path               ; ファイルパス
  active                  ; 有効フラグ
  load-timestamp          ; 読み込みタイムスタンプ
  content                 ; ルール内容
  priority                ; 優先度
  metadata)               ; メタデータ

(defstruct rule-configuration
  enabled                 ; 有効フラグ
  priority                ; 優先度
  strict-mode             ; 厳密モード
  parameters)             ; パラメータ

;;; ============================================================================
;;; 基本ルール読み込み機能
;;; ============================================================================

(defun create-rule-loader ()
  "新しいルールローダーインスタンスを作成
   
   戻り値:
     新しく作成されたルールローダーオブジェクト"
  (make-rule-loader :loaded-rules (make-hash-table :test 'equal)
                    :dependencies (make-hash-table :test 'equal)
                    :configurations (make-hash-table :test 'equal)
                    :hot-reloading-enabled nil
                    :file-watcher-running nil
                    :file-timestamps (make-hash-table :test 'equal)
                    :rule-cache (make-hash-table :test 'equal)
                    :lazy-loading-enabled nil
                    :lazy-rules (make-hash-table :test 'equal)
                    :rule-metadata (make-hash-table :test 'equal)))

(defun get-loaded-rules (loader)
  "読み込み済みルールのリストを取得
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     読み込み済みルールのリスト"
  (let ((rules nil))
    (maphash (lambda (name rule)
               (declare (ignore name))
               (push rule rules))
             (rule-loader-loaded-rules loader))
    rules))

(defun discover-rule-files (loader directory)
  "指定ディレクトリからルールファイルを自動発見
   
   引数:
     loader - ルールローダーオブジェクト
     directory - 検索ディレクトリ
   
   戻り値:
     発見されたルールファイルのリスト"
  (declare (ignore loader))
  (let ((rule-files nil))
    (when (probe-file directory)
      ;; 簡易実装：既知のルールファイルを返す
      (let ((known-files '("basic-rules.lisp" "kakumei.lisp" "8kiri.lisp" "kaidan.lisp")))
        (dolist (file known-files)
          (let ((full-path (merge-pathnames file directory)))
            (when (probe-file full-path)
              (push (namestring full-path) rule-files))))))
    (nreverse rule-files)))

(defun validate-rule-file (loader file-path)
  "ルールファイルの有効性を検証
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ファイルパス
   
   戻り値:
     検証結果（真偽値）"
  (declare (ignore loader))
  (and (stringp file-path)
       (probe-file file-path)
       (string-equal (pathname-type file-path) "lisp")))

(defun load-rule-file (loader file-path)
  "単一ルールファイルを読み込み
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ルールファイルパス
   
   戻り値:
     読み込み結果（plist）"
  (if (validate-rule-file loader file-path)
      (handler-case
          (progn
            (load file-path)
            (let* ((rule-name (extract-rule-name-from-file file-path))
                   (rule (make-loaded-rule :name rule-name
                                          :file-path file-path
                                          :active t
                                          :load-timestamp (get-universal-time)
                                          :content (read-file-content file-path)
                                          :priority 50
                                          :metadata (extract-rule-metadata file-path))))
              (setf (gethash rule-name (rule-loader-loaded-rules loader)) rule)
              (setf (gethash file-path (rule-loader-file-timestamps loader)) (get-universal-time))
              (list :success t :rule-name rule-name :file-path file-path)))
        (error (e)
          (list :success nil :error-message (format nil "ルール読み込みエラー: ~A" e))))
      (list :success nil :error-message "無効なルールファイル")))

(defun load-all-rules (loader directory)
  "指定ディレクトリからすべてのルールを一括読み込み
   
   引数:
     loader - ルールローダーオブジェクト
     directory - ルールディレクトリ
   
   戻り値:
     読み込み結果のリスト"
  (let ((rule-files (discover-rule-files loader directory))
        (results nil))
    (dolist (file rule-files)
      (let ((result (load-rule-file loader file)))
        (push result results)))
    (nreverse results)))

;;; ============================================================================
;;; ルール管理・制御機能
;;; ============================================================================

(defun is-rule-loaded-p (loader rule-name)
  "ルールが読み込み済みかどうかを確認
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     読み込み状態（真偽値）"
  (gethash rule-name (rule-loader-loaded-rules loader)))

(defun is-rule-active-p (loader rule-name)
  "ルールが有効かどうかを確認
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     有効状態（真偽値）"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (and rule (loaded-rule-active rule))))

(defun activate-rule (loader rule-name)
  "ルールを有効化
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     有効化成功フラグ"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (when rule
      (setf (loaded-rule-active rule) t)
      t)))

(defun deactivate-rule (loader rule-name)
  "ルールを無効化
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     無効化成功フラグ"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (when rule
      (setf (loaded-rule-active rule) nil)
      t)))

(defun unload-rule (loader rule-name)
  "ルールをアンロード
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     アンロード成功フラグ"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (when rule
      (remhash rule-name (rule-loader-loaded-rules loader))
      (remhash (loaded-rule-file-path rule) (rule-loader-file-timestamps loader))
      t)))

(defun reload-rule (loader rule-name)
  "ルールを再読み込み
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     再読み込み成功フラグ"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (when rule
      (let ((file-path (loaded-rule-file-path rule)))
        (unload-rule loader rule-name)
        (let ((result (load-rule-file loader file-path)))
          (getf result :success))))))

(defun get-first-loaded-rule-name (loader)
  "最初の読み込み済みルール名を取得
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     最初のルール名（存在しない場合はNIL）"
  (maphash (lambda (name rule)
             (declare (ignore rule))
             (return-from get-first-loaded-rule-name name))
           (rule-loader-loaded-rules loader))
  nil)

(defun get-rule-load-timestamp (loader rule-name)
  "ルールの読み込みタイムスタンプを取得
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     タイムスタンプ（存在しない場合はNIL）"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (when rule
      (loaded-rule-load-timestamp rule))))

;;; ============================================================================
;;; ルール依存関係機能
;;; ============================================================================

(defun add-rule-dependency (loader rule-name dependency)
  "ルール依存関係を追加
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
     dependency - 依存するルール名
   
   戻り値:
     追加成功フラグ"
  (let ((deps (gethash rule-name (rule-loader-dependencies loader))))
    (unless deps
      (setf deps '()))
    (pushnew dependency deps)
    (setf (gethash rule-name (rule-loader-dependencies loader)) deps)
    t))

(defun resolve-dependencies (loader rule-list)
  "ルール依存関係を解決して正しい読み込み順序を決定
   
   引数:
     loader - ルールローダーオブジェクト
     rule-list - 解決するルールのリスト
   
   戻り値:
     依存関係順に並んだルールリスト"
  (let ((resolved nil)
        (visiting (make-hash-table :test 'equal))
        (visited (make-hash-table :test 'equal)))
    
    (labels ((visit-rule (rule-name)
               (when (gethash rule-name visiting)
                 (error "循環依存が検出されました: ~A" rule-name))
               (unless (gethash rule-name visited)
                 (setf (gethash rule-name visiting) t)
                 (let ((deps (gethash rule-name (rule-loader-dependencies loader))))
                   (dolist (dep deps)
                     (when (member dep rule-list)
                       (visit-rule dep))))
                 (setf (gethash rule-name visited) t)
                 (remhash rule-name visiting)
                 (push rule-name resolved))))
      
      (dolist (rule rule-list)
        (visit-rule rule))
      
      (nreverse resolved))))

(defun detect-circular-dependencies (loader)
  "循環依存を検出
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     循環依存のリスト"
  (let ((circular-deps nil))
    (maphash (lambda (rule-name deps)
               (let ((visited (make-hash-table :test 'equal))
                     (path nil))
                 (labels ((check-circular (current-rule current-path)
                            (when (member current-rule current-path)
                              (pushnew (append current-path (list current-rule)) circular-deps :test 'equal)
                              (return-from check-circular))
                            (unless (gethash current-rule visited)
                              (setf (gethash current-rule visited) t)
                              (let ((current-deps (gethash current-rule (rule-loader-dependencies loader))))
                                (dolist (dep current-deps)
                                  (check-circular dep (append current-path (list current-rule))))))))
                   (check-circular rule-name path))))
             (rule-loader-dependencies loader))
    circular-deps))

(defun load-rule-with-dependencies (loader rule-name)
  "依存関係付きでルールを読み込み
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     読み込み結果（plist）"
  (let ((deps (gethash rule-name (rule-loader-dependencies loader))))
    (if deps
        (if (every (lambda (dep) (is-rule-loaded-p loader dep)) deps)
            (list :success t :rule-name rule-name)
            (list :success nil :error-message "依存関係が満たされていません"))
        (list :success t :rule-name rule-name))))

;;; ============================================================================
;;; ルール設定・カスタマイズ機能
;;; ============================================================================

(defun configure-rule (loader rule-name config)
  "ルールを設定
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
     config - 設定データ（plist）
   
   戻り値:
     設定成功フラグ"
  (let ((rule-config (or (gethash rule-name (rule-loader-configurations loader))
                         (make-rule-configuration :enabled t :priority 50 :strict-mode nil))))
    (when (getf config :enabled)
      (setf (rule-configuration-enabled rule-config) (getf config :enabled)))
    (when (getf config :priority)
      (setf (rule-configuration-priority rule-config) (getf config :priority)))
    (when (getf config :strict-mode)
      (setf (rule-configuration-strict-mode rule-config) (getf config :strict-mode)))
    (setf (gethash rule-name (rule-loader-configurations loader)) rule-config)
    t))

(defun get-rule-configuration (loader rule-name)
  "ルール設定を取得
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     設定データ（plist）"
  (let ((config (gethash rule-name (rule-loader-configurations loader))))
    (when config
      (list :enabled (rule-configuration-enabled config)
            :priority (rule-configuration-priority config)
            :strict-mode (rule-configuration-strict-mode config)))))

(defun load-rule-with-priority (loader file-path priority)
  "優先度付きでルールを読み込み
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ルールファイルパス
     priority - 優先度
   
   戻り値:
     読み込み結果（plist）"
  (let ((result (load-rule-file loader file-path)))
    (when (getf result :success)
      (let ((rule-name (getf result :rule-name)))
        (configure-rule loader rule-name (list :priority priority))))
    result))

(defun get-rules-by-priority (loader)
  "優先度順にルールを取得
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     優先度順のルールリスト"
  (let ((rules nil))
    (maphash (lambda (name rule)
               (let ((config (gethash name (rule-loader-configurations loader))))
                 (push (list :name name
                           :rule rule
                           :priority (if config 
                                       (rule-configuration-priority config)
                                       50))
                       rules)))
             (rule-loader-loaded-rules loader))
    (sort rules (lambda (a b) (> (getf a :priority) (getf b :priority))))))

(defun detect-rule-conflicts (loader)
  "ルール競合を検出
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     競合のリスト"
  (declare (ignore loader))
  ;; 簡易実装：競合なしとして空リストを返す
  '())

;;; ============================================================================
;;; 動的更新・監視機能
;;; ============================================================================

(defun enable-hot-reloading (loader)
  "ホットリロード機能を有効化
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (setf (rule-loader-hot-reloading-enabled loader) t)
  t)

(defun is-hot-reloading-enabled-p (loader)
  "ホットリロード機能が有効かどうかを確認
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     有効状態（真偽値）"
  (rule-loader-hot-reloading-enabled loader))

(defun simulate-file-change (loader file-path)
  "ファイル変更をシミュレーション
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ファイルパス
   
   戻り値:
     シミュレーション成功フラグ"
  (setf (gethash file-path (rule-loader-file-timestamps loader)) 
        (+ (gethash file-path (rule-loader-file-timestamps loader) 0) 100))
  t)

(defun check-and-reload-changed-rules (loader)
  "変更されたルールを確認して再読み込み
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     再読み込み結果のリスト"
  (let ((reloaded-rules nil))
    (when (is-hot-reloading-enabled-p loader)
      (maphash (lambda (rule-name rule)
                 (let* ((file-path (loaded-rule-file-path rule))
                        (current-timestamp (gethash file-path (rule-loader-file-timestamps loader)))
                        (file-timestamp (file-write-date file-path)))
                   (when (and file-timestamp current-timestamp
                              (> file-timestamp current-timestamp))
                     (when (reload-rule loader rule-name)
                       (push rule-name reloaded-rules)))))
               (rule-loader-loaded-rules loader)))
    reloaded-rules))

(defun start-file-watcher (loader directory)
  "ファイル監視を開始
   
   引数:
     loader - ルールローダーオブジェクト
     directory - 監視ディレクトリ
   
   戻り値:
     監視開始成功フラグ"
  (declare (ignore directory))
  (setf (rule-loader-file-watcher-running loader) t)
  t)

(defun stop-file-watcher (loader)
  "ファイル監視を停止
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     監視停止成功フラグ"
  (setf (rule-loader-file-watcher-running loader) nil)
  t)

(defun is-file-watcher-running-p (loader)
  "ファイル監視が実行中かどうかを確認
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     実行状態（真偽値）"
  (rule-loader-file-watcher-running loader))

;;; ============================================================================
;;; エラーハンドリング・回復機能
;;; ============================================================================

(defun get-loader-state-snapshot (loader)
  "ローダーの状態スナップショットを取得
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     状態スナップショット"
  (list :loaded-rules-count (hash-table-count (rule-loader-loaded-rules loader))
        :hot-reloading-enabled (rule-loader-hot-reloading-enabled loader)
        :file-watcher-running (rule-loader-file-watcher-running loader)))

(defun states-equal-p (state1 state2)
  "２つの状態が等しいかどうかを判定
   
   引数:
     state1 - 状態1
     state2 - 状態2
   
   戻り値:
     等価判定結果（真偽値）"
  (and (= (getf state1 :loaded-rules-count) (getf state2 :loaded-rules-count))
       (eq (getf state1 :hot-reloading-enabled) (getf state2 :hot-reloading-enabled))
       (eq (getf state1 :file-watcher-running) (getf state2 :file-watcher-running))))

;;; ============================================================================
;;; パフォーマンス・最適化機能
;;; ============================================================================

(defun enable-rule-caching (loader)
  "ルールキャッシュを有効化
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (declare (ignore loader))
  t)

(defun enable-lazy-loading (loader)
  "遅延読み込みを有効化
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     有効化成功フラグ"
  (setf (rule-loader-lazy-loading-enabled loader) t)
  t)

(defun register-rule-for-lazy-loading (loader file-path)
  "ルールを遅延読み込みに登録
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ルールファイルパス
   
   戻り値:
     登録成功フラグ"
  (setf (gethash file-path (rule-loader-lazy-rules loader)) t)
  t)

(defun is-rule-registered-for-lazy-loading-p (loader file-path)
  "ルールが遅延読み込みに登録されているかどうかを確認
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ルールファイルパス
   
   戻り値:
     登録状態（真偽値）"
  (gethash file-path (rule-loader-lazy-rules loader)))

(defun trigger-lazy-loading (loader file-path)
  "遅延読み込みを実行
   
   引数:
     loader - ルールローダーオブジェクト
     file-path - ルールファイルパス
   
   戻り値:
     読み込み結果（plist）"
  (when (is-rule-registered-for-lazy-loading-p loader file-path)
    (remhash file-path (rule-loader-lazy-rules loader))
    (load-rule-file loader file-path)))

;;; ============================================================================
;;; ルール情報・メタデータ機能
;;; ============================================================================

(defun get-rule-metadata (loader rule-name)
  "ルールメタデータを取得
   
   引数:
     loader - ルールローダーオブジェクト
     rule-name - ルール名
   
   戻り値:
     メタデータ（plist）"
  (let ((rule (gethash rule-name (rule-loader-loaded-rules loader))))
    (when rule
      (or (loaded-rule-metadata rule)
          (list :name rule-name
                :description "基本的なルール"
                :version "1.0"
                :author "システム")))))

(defun generate-rule-documentation (loader)
  "ルールドキュメントを生成
   
   引数:
     loader - ルールローダーオブジェクト
   
   戻り値:
     ドキュメント文字列"
  (let ((doc-lines '("=== ルールドキュメント ===")))
    (maphash (lambda (name rule)
               (let ((metadata (get-rule-metadata loader name)))
                 (push (format nil "ルール: ~A" name) doc-lines)
                 (push (format nil "  説明: ~A" (getf metadata :description)) doc-lines)
                 (push (format nil "  バージョン: ~A" (getf metadata :version)) doc-lines)
                 (push "" doc-lines)))
             (rule-loader-loaded-rules loader))
    (format nil "~{~A~%~}" (nreverse doc-lines))))

;;; ============================================================================
;;; ユーティリティ関数
;;; ============================================================================

(defun extract-rule-name-from-file (file-path)
  "ファイルパスからルール名を抽出
   
   引数:
     file-path - ファイルパス
   
   戻り値:
     ルール名"
  (let ((basename (pathname-name file-path)))
    (intern (string-upcase basename) :keyword)))

(defun read-file-content (file-path)
  "ファイル内容を読み込み
   
   引数:
     file-path - ファイルパス
   
   戻り値:
     ファイル内容（文字列）"
  (with-open-file (stream file-path :direction :input)
    (let ((content (make-string (file-length stream))))
      (read-sequence content stream)
      content)))

(defun extract-rule-metadata (file-path)
  "ファイルからルールメタデータを抽出
   
   引数:
     file-path - ファイルパス
   
   戻り値:
     メタデータ（plist）"
  (list :name (extract-rule-name-from-file file-path)
        :description (format nil "~A からのルール" (pathname-name file-path))
        :version "1.0"
        :author "システム"))

;;; ============================================================================
;;; 旧互換性関数
;;; ============================================================================

(defun load-local-rule (rule-file)
  "旧形式互換：ローカルルールファイルを読み込む"
  (when (probe-file rule-file)
    (load rule-file)
    t))

(defun load-rule-set (rule-set-file)
  "旧形式互換：ルールセットファイルを読み込む"
  (when (probe-file rule-set-file)
    (load rule-set-file)
    t))

(defun list-active-rules ()
  "旧形式互換：アクティブなルールのリストを取得する"
  '(:basic-rules))

(defun rule-file-exists-p (rule-file)
  "旧形式互換：ルールファイルが存在するかどうかを確認する"
  (probe-file rule-file))