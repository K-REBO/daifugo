;;; test-rule-loader.lisp - 動的ルール読み込みシステムの包括的テスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-rule-loader-test
  (:use :common-lisp))

(in-package :daifugo-rule-loader-test)

;;; ==========================================
;;; 基本ルール読み込み機能テスト
;;; ==========================================

(defun test-rule-loader-creation ()
  "ルールローダーの作成テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (and loader
         (daifugo-rule-loader:rule-loader-p loader)
         (listp (daifugo-rule-loader:get-loaded-rules loader))
         (= (length (daifugo-rule-loader:get-loaded-rules loader)) 0))))

(defun test-rule-file-discovery ()
  "ルールファイル自動発見テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (let ((rule-files (daifugo-rule-loader:discover-rule-files loader "src/rules/")))
      (and rule-files
           (listp rule-files)
           (every #'stringp rule-files)
           (every (lambda (file) (search ".lisp" file)) rule-files)))))

(defun test-single-rule-loading ()
  "単一ルールファイル読み込みテスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (let ((result (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")))
      (and result
           (getf result :success)
           (getf result :rule-name)
           (stringp (getf result :rule-name))
           (> (length (daifugo-rule-loader:get-loaded-rules loader)) 0)))))

(defun test-rule-validation ()
  "ルールファイル検証テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (let ((valid-rule "src/rules/basic-rules.lisp")
          (invalid-rule "nonexistent-rule.lisp"))
      (and (daifugo-rule-loader:validate-rule-file loader valid-rule)
           (not (daifugo-rule-loader:validate-rule-file loader invalid-rule))))))

;;; ==========================================
;;; 一括ルール読み込み機能テスト
;;; ==========================================

(defun test-bulk-rule-loading ()
  "一括ルール読み込みテスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (let ((results (daifugo-rule-loader:load-all-rules loader "src/rules/")))
      (and results
           (listp results)
           (> (length results) 0)
           (every (lambda (result) (getf result :success)) results)
           (> (length (daifugo-rule-loader:get-loaded-rules loader)) 0)))))

(defun test-rule-dependency_resolution ()
  "ルール依存関係解決テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    ;; 依存関係のあるルールをテスト
    (daifugo-rule-loader:add-rule-dependency loader :revolution :basic-card-play)
    (daifugo-rule-loader:add-rule-dependency loader :8-kiri :revolution)
    (let ((load-order (daifugo-rule-loader:resolve-dependencies loader 
                                                                '(:8-kiri :revolution :basic-card-play))))
      (and load-order
           (listp load-order)
           (= (length load-order) 3)
           ;; 依存関係順で並んでいることを確認
           (< (position :basic-card-play load-order)
              (position :revolution load-order))
           (< (position :revolution load-order)
              (position :8-kiri load-order))))))

(defun test-circular_dependency_detection ()
  "循環依存検出テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    ;; 循環依存を作成
    (daifugo-rule-loader:add-rule-dependency loader :rule-a :rule-b)
    (daifugo-rule-loader:add-rule-dependency loader :rule-b :rule-c)
    (daifugo-rule-loader:add-rule-dependency loader :rule-c :rule-a)
    (let ((circular-deps (daifugo-rule-loader:detect-circular-dependencies loader)))
      (and circular-deps
           (listp circular-deps)
           (> (length circular-deps) 0)))))

;;; ==========================================
;;; ルール管理・制御機能テスト
;;; ==========================================

(defun test-rule-activation ()
  "ルール有効化/無効化テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((rule-name (daifugo-rule-loader:get-first-loaded-rule-name loader)))
      (and rule-name
           (daifugo-rule-loader:is-rule-active-p loader rule-name)
           (progn
             (daifugo-rule-loader:deactivate-rule loader rule-name)
             (not (daifugo-rule-loader:is-rule-active-p loader rule-name)))
           (progn
             (daifugo-rule-loader:activate-rule loader rule-name)
             (daifugo-rule-loader:is-rule-active-p loader rule-name))))))

(defun test-rule-unloading ()
  "ルールアンロードテスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((initial-count (length (daifugo-rule-loader:get-loaded-rules loader)))
          (rule-name (daifugo-rule-loader:get-first-loaded-rule-name loader)))
      (and (> initial-count 0)
           rule-name
           (daifugo-rule-loader:unload-rule loader rule-name)
           (< (length (daifugo-rule-loader:get-loaded-rules loader)) initial-count)
           (not (daifugo-rule-loader:is-rule-loaded-p loader rule-name))))))

(defun test-rule-reloading ()
  "ルール再読み込みテスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((rule-name (daifugo-rule-loader:get-first-loaded-rule-name loader))
          (initial-timestamp (daifugo-rule-loader:get-rule-load-timestamp loader rule-name)))
      (and rule-name
           initial-timestamp
           (sleep 0.01)  ; 時間差を作る
           (daifugo-rule-loader:reload-rule loader rule-name)
           (let ((new-timestamp (daifugo-rule-loader:get-rule-load-timestamp loader rule-name)))
             (> new-timestamp initial-timestamp))))))

;;; ==========================================
;;; ルール設定・カスタマイズ機能テスト
;;; ==========================================

(defun test-rule-configuration ()
  "ルール設定機能テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((rule-name (daifugo-rule-loader:get-first-loaded-rule-name loader)))
      (when rule-name
        (let ((config '(:enabled t :priority 100 :strict-mode nil)))
          (daifugo-rule-loader:configure-rule loader rule-name config)
          (let ((current-config (daifugo-rule-loader:get-rule-configuration loader rule-name)))
            (and current-config
                 (getf current-config :enabled)
                 (= (getf current-config :priority) 100)
                 (not (getf current-config :strict-mode)))))))))

(defun test-rule-priority_ordering ()
  "ルール優先度順序テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    ;; 複数ルールを優先度付きで読み込み
    (daifugo-rule-loader:load-rule-with-priority loader "src/rules/basic-rules.lisp" 50)
    (when (> (length (daifugo-rule-loader:get-loaded-rules loader)) 0)
      (let ((ordered-rules (daifugo-rule-loader:get-rules-by-priority loader)))
        (and ordered-rules
             (listp ordered-rules)
             (> (length ordered-rules) 0))))))

(defun test-rule-conflict_detection ()
  "ルール競合検出テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    ;; 競合する可能性のあるルールを読み込み
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((conflicts (daifugo-rule-loader:detect-rule-conflicts loader)))
      (and (listp conflicts)
           ;; 競合がない場合は空リスト、ある場合は詳細が含まれる
           (every (lambda (conflict)
                    (and (getf conflict :rule-a)
                         (getf conflict :rule-b)
                         (getf conflict :conflict-type)))
                  conflicts)))))

;;; ==========================================
;;; 動的ルール更新機能テスト
;;; ==========================================

(defun test-hot-rule-reloading ()
  "ホットリロード機能テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:enable-hot-reloading loader)
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (and (daifugo-rule-loader:is-hot-reloading-enabled-p loader)
         (let ((initial-count (length (daifugo-rule-loader:get-loaded-rules loader))))
           ;; ファイル変更のシミュレーション
           (daifugo-rule-loader:simulate-file-change loader "src/rules/basic-rules.lisp")
           (daifugo-rule-loader:check-and-reload-changed-rules loader)
           ;; ルールが再読み込みされたことを確認
           (= (length (daifugo-rule-loader:get-loaded-rules loader)) initial-count)))))

(defun test-rule-watch_service ()
  "ルールファイル監視サービステスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:start-file-watcher loader "src/rules/")
    (and (daifugo-rule-loader:is-file-watcher-running-p loader)
         (progn
           (daifugo-rule-loader:stop-file-watcher loader)
           (not (daifugo-rule-loader:is-file-watcher-running-p loader))))))

;;; ==========================================
;;; エラーハンドリング・回復機能テスト
;;; ==========================================

(defun test-malformed-rule-handling ()
  "不正ルールファイル処理テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader))
        (malformed-rule-content "(defun invalid-syntax incomplete"))
    ;; 一時的な不正ルールファイルを作成してテスト
    (let ((temp-file "/tmp/malformed-rule.lisp"))
      (with-open-file (stream temp-file :direction :output :if-exists :supersede)
        (write-string malformed-rule-content stream))
      (let ((result (daifugo-rule-loader:load-rule-file loader temp-file)))
        (and result
             (not (getf result :success))
             (stringp (getf result :error-message))
             (= (length (daifugo-rule-loader:get-loaded-rules loader)) 0))))))

(defun test-missing-dependency_handling ()
  "依存関係不足処理テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    ;; 存在しない依存関係を設定
    (daifugo-rule-loader:add-rule-dependency loader :test-rule :nonexistent-dependency)
    (let ((result (daifugo-rule-loader:load-rule-with-dependencies loader :test-rule)))
      (and result
           (not (getf result :success))
           (search "dependency" (getf result :error-message))))))

(defun test-rule-rollback ()
  "ルール読み込み失敗時のロールバックテスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((initial-state (daifugo-rule-loader:get-loader-state-snapshot loader)))
      ;; 失敗する読み込みを試行
      (daifugo-rule-loader:load-rule-file loader "nonexistent-rule.lisp")
      ;; 状態が変化していないことを確認
      (let ((current-state (daifugo-rule-loader:get-loader-state-snapshot loader)))
        (daifugo-rule-loader:states-equal-p initial-state current-state)))))

;;; ==========================================
;;; パフォーマンス・最適化機能テスト
;;; ==========================================

(defun test-rule-caching ()
  "ルールキャッシュ機能テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:enable-rule-caching loader)
    (let ((start-time (get-internal-real-time)))
      (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
      (let ((first-load-time (- (get-internal-real-time) start-time)))
        ;; キャッシュからの読み込み
        (daifugo-rule-loader:unload-rule loader (daifugo-rule-loader:get-first-loaded-rule-name loader))
        (let ((cache-start-time (get-internal-real-time)))
          (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
          (let ((cached-load-time (- (get-internal-real-time) cache-start-time)))
            ;; キャッシュ読み込みの方が高速であることを確認
            (<= cached-load-time first-load-time)))))))

(defun test-lazy-rule-loading ()
  "遅延ルール読み込みテスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:enable-lazy-loading loader)
    (daifugo-rule-loader:register-rule-for-lazy-loading loader "src/rules/basic-rules.lisp")
    (and (daifugo-rule-loader:is-rule-registered-for-lazy-loading-p loader "src/rules/basic-rules.lisp")
         (= (length (daifugo-rule-loader:get-loaded-rules loader)) 0)  ; まだ読み込まれていない
         (progn
           ;; 実際に使用される時点で読み込み
           (daifugo-rule-loader:trigger-lazy-loading loader "src/rules/basic-rules.lisp")
           (> (length (daifugo-rule-loader:get-loaded-rules loader)) 0)))))

;;; ==========================================
;;; ルール情報・メタデータ機能テスト
;;; ==========================================

(defun test-rule-metadata_extraction ()
  "ルールメタデータ抽出テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((rule-name (daifugo-rule-loader:get-first-loaded-rule-name loader)))
      (when rule-name
        (let ((metadata (daifugo-rule-loader:get-rule-metadata loader rule-name)))
          (and metadata
               (getf metadata :name)
               (getf metadata :description)
               (getf metadata :version)
               (getf metadata :author)))))))

(defun test-rule-documentation ()
  "ルールドキュメント生成テスト"
  (let ((loader (daifugo-rule-loader:create-rule-loader)))
    (daifugo-rule-loader:load-rule-file loader "src/rules/basic-rules.lisp")
    (let ((documentation (daifugo-rule-loader:generate-rule-documentation loader)))
      (and documentation
           (stringp documentation)
           (> (length documentation) 0)
           (search "ルール" documentation)))))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-rule-loader-tests ()
  "ルール読み込みシステムの全テストを実行"
  (format t "~%=== ルール読み込みシステムテスト実行 ===~%")
  
  (let ((tests '(("ルールローダー作成" . test-rule-loader-creation)
                 ("ルールファイル自動発見" . test-rule-file-discovery)
                 ("単一ルール読み込み" . test-single-rule-loading)
                 ("ルール検証" . test-rule-validation)
                 ("一括ルール読み込み" . test-bulk-rule-loading)
                 ("ルール依存関係解決" . test-rule-dependency_resolution)
                 ("循環依存検出" . test-circular_dependency_detection)
                 ("ルール有効化/無効化" . test-rule-activation)
                 ("ルールアンロード" . test-rule-unloading)
                 ("ルール再読み込み" . test-rule-reloading)
                 ("ルール設定" . test-rule-configuration)
                 ("ルール優先度順序" . test-rule-priority_ordering)
                 ("ルール競合検出" . test-rule-conflict_detection)
                 ("ホットリロード" . test-hot-rule-reloading)
                 ("ファイル監視サービス" . test-rule-watch_service)
                 ("不正ルール処理" . test-malformed-rule-handling)
                 ("依存関係不足処理" . test-missing-dependency_handling)
                 ("ルールロールバック" . test-rule-rollback)
                 ("ルールキャッシュ" . test-rule-caching)
                 ("遅延ルール読み込み" . test-lazy-rule-loading)
                 ("ルールメタデータ抽出" . test-rule-metadata_extraction)
                 ("ルールドキュメント生成" . test-rule-documentation)))
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
(format t "~%動的ルール読み込みシステムのテストケース準備完了~%")
(format t "実装完了後に (run-rule-loader-tests) を実行してください~%")