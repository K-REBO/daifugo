;;; test-rule-set.lisp - ルールセット機能のテスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-rule-set-test
  (:use :common-lisp))

(in-package :daifugo-rule-set-test)

;;; ==========================================
;;; 基本ルールセット機能テスト
;;; ==========================================

(defun test-rule-set-creation ()
  "ルールセットの作成テスト"
  (let ((rule-set (daifugo-rule-set:create-rule-set :jdf-official)))
    (and rule-set
         (daifugo-rule-set:rule-set-p rule-set)
         (eq (daifugo-rule-set:rule-set-name rule-set) :jdf-official))))

(defun test-default-rule-set ()
  "デフォルトルールセットテスト"
  (let ((default-set (daifugo-rule-set:get-default-rule-set)))
    (and default-set
         (daifugo-rule-set:rule-set-p default-set)
         (daifugo-rule-set:rule-set-name default-set))))

(defun test-rule-set-registration ()
  "ルールセット登録テスト"
  (let ((custom-set (daifugo-rule-set:create-rule-set :custom-test)))
    (daifugo-rule-set:register-rule-set custom-set)
    (let ((retrieved (daifugo-rule-set:get-rule-set :custom-test)))
      (and retrieved
           (eq (daifugo-rule-set:rule-set-name retrieved) :custom-test)))))

;;; ==========================================
;;; 日本大富豪連盟公式ルールセットテスト
;;; ==========================================

(defun test-jdf-official-rule-set ()
  "日本大富豪連盟公式ルールセットテスト"
  (let ((jdf-set (daifugo-rule-set:get-rule-set :jdf-official)))
    (and jdf-set
         (daifugo-rule-set:rule-enabled-p jdf-set :revolution)
         (daifugo-rule-set:rule-enabled-p jdf-set :eight-cut)
         (daifugo-rule-set:rule-enabled-p jdf-set :sequence)
         (not (daifugo-rule-set:rule-enabled-p jdf-set :eleven-back)))))

(defun test-jdf-extended-rule-set ()
  "日本大富豪連盟拡張ルールセットテスト"
  (let ((jdf-ext (daifugo-rule-set:get-rule-set :jdf-extended)))
    (and jdf-ext
         (daifugo-rule-set:rule-enabled-p jdf-ext :revolution)
         (daifugo-rule-set:rule-enabled-p jdf-ext :eight-cut)
         (daifugo-rule-set:rule-enabled-p jdf-ext :sequence)
         (daifugo-rule-set:rule-enabled-p jdf-ext :eleven-back)
         (daifugo-rule-set:rule-enabled-p jdf-ext :suit-binding))))

(defun test-casual-rule-set ()
  "カジュアルルールセットテスト"
  (let ((casual-set (daifugo-rule-set:get-rule-set :casual)))
    (and casual-set
         (daifugo-rule-set:rule-enabled-p casual-set :revolution)
         (not (daifugo-rule-set:rule-enabled-p casual-set :eight-cut))
         (not (daifugo-rule-set:rule-enabled-p casual-set :sequence)))))

;;; ==========================================
;;; ルール有効化・無効化機能テスト
;;; ==========================================

(defun test-rule-enablement ()
  "ルール有効化テスト"
  (let ((custom-set (daifugo-rule-set:create-rule-set :enablement-test)))
    (daifugo-rule-set:enable-rule custom-set :revolution)
    (daifugo-rule-set:enable-rule custom-set :eight-cut)
    (and (daifugo-rule-set:rule-enabled-p custom-set :revolution)
         (daifugo-rule-set:rule-enabled-p custom-set :eight-cut)
         (not (daifugo-rule-set:rule-enabled-p custom-set :sequence)))))

(defun test-rule-disablement ()
  "ルール無効化テスト"
  (let ((jdf-copy (daifugo-rule-set:copy-rule-set 
                   (daifugo-rule-set:get-rule-set :jdf-official))))
    (daifugo-rule-set:disable-rule jdf-copy :revolution)
    (daifugo-rule-set:disable-rule jdf-copy :eight-cut)
    (and (not (daifugo-rule-set:rule-enabled-p jdf-copy :revolution))
         (not (daifugo-rule-set:rule-enabled-p jdf-copy :eight-cut))
         (daifugo-rule-set:rule-enabled-p jdf-copy :sequence))))

(defun test-bulk-rule-operations ()
  "一括ルール操作テスト"
  (let ((bulk-set (daifugo-rule-set:create-rule-set :bulk-test)))
    (daifugo-rule-set:enable-rules bulk-set '(:revolution :eight-cut :sequence))
    (and (daifugo-rule-set:rule-enabled-p bulk-set :revolution)
         (daifugo-rule-set:rule-enabled-p bulk-set :eight-cut)
         (daifugo-rule-set:rule-enabled-p bulk-set :sequence))
    (daifugo-rule-set:disable-rules bulk-set '(:revolution :eight-cut))
    (and (not (daifugo-rule-set:rule-enabled-p bulk-set :revolution))
         (not (daifugo-rule-set:rule-enabled-p bulk-set :eight-cut))
         (daifugo-rule-set:rule-enabled-p bulk-set :sequence))))

;;; ==========================================
;;; ルール設定・パラメータ機能テスト
;;; ==========================================

(defun test-rule-parameters ()
  "ルールパラメータ設定テスト"
  (let ((param-set (daifugo-rule-set:create-rule-set :parameter-test)))
    (daifugo-rule-set:set-rule-parameter param-set :sequence :min-length 3)
    (daifugo-rule-set:set-rule-parameter param-set :sequence :max-length 13)
    (daifugo-rule-set:set-rule-parameter param-set :revolution :double-revolution t)
    (and (= (daifugo-rule-set:get-rule-parameter param-set :sequence :min-length) 3)
         (= (daifugo-rule-set:get-rule-parameter param-set :sequence :max-length) 13)
         (daifugo-rule-set:get-rule-parameter param-set :revolution :double-revolution))))

(defun test-rule-priority-settings ()
  "ルール優先度設定テスト"
  (let ((priority-set (daifugo-rule-set:create-rule-set :priority-test)))
    (daifugo-rule-set:set-rule-priority priority-set :revolution 100)
    (daifugo-rule-set:set-rule-priority priority-set :eight-cut 90)
    (daifugo-rule-set:set-rule-priority priority-set :sequence 80)
    (let ((priorities (daifugo-rule-set:get-rule-priorities priority-set)))
      (and (= (daifugo-rule-set:get-priority priorities :revolution) 100)
           (= (daifugo-rule-set:get-priority priorities :eight-cut) 90)
           (= (daifugo-rule-set:get-priority priorities :sequence) 80)))))

(defun test-conditional-rules ()
  "条件付きルールテスト"
  (let ((conditional-set (daifugo-rule-set:create-rule-set :conditional-test)))
    (daifugo-rule-set:add-rule-condition conditional-set :eleven-back 
                                         :requires '(:revolution))
    (daifugo-rule-set:add-rule-condition conditional-set :suit-binding 
                                         :excludes '(:sequence))
    (and (daifugo-rule-set:has-rule-condition-p conditional-set :eleven-back :requires)
         (daifugo-rule-set:has-rule-condition-p conditional-set :suit-binding :excludes))))

;;; ==========================================
;;; ルールセット検証機能テスト
;;; ==========================================

(defun test-rule-set-validation ()
  "ルールセット検証テスト"
  (let ((valid-set (daifugo-rule-set:get-rule-set :jdf-official))
        (invalid-set (daifugo-rule-set:create-rule-set :invalid-test)))
    (daifugo-rule-set:enable-rule invalid-set :suit-binding)
    (daifugo-rule-set:enable-rule invalid-set :sequence)
    (and (daifugo-rule-set:validate-rule-set valid-set)
         (not (daifugo-rule-set:validate-rule-set invalid-set)))))

(defun test-rule-conflict-detection ()
  "ルール競合検出テスト"
  (let ((conflict-set (daifugo-rule-set:create-rule-set :conflict-test)))
    (daifugo-rule-set:enable-rule conflict-set :suit-binding)
    (daifugo-rule-set:enable-rule conflict-set :sequence)
    (let ((conflicts (daifugo-rule-set:detect-rule-conflicts conflict-set)))
      (and conflicts
           (member :suit-binding conflicts)
           (member :sequence conflicts)))))

(defun test-rule-dependency-resolution ()
  "ルール依存関係解決テスト"
  (let ((dep-set (daifugo-rule-set:create-rule-set :dependency-test)))
    (daifugo-rule-set:enable-rule dep-set :eleven-back)
    (let ((resolved (daifugo-rule-set:resolve-dependencies dep-set)))
      (and resolved
           (daifugo-rule-set:rule-enabled-p resolved :revolution)
           (daifugo-rule-set:rule-enabled-p resolved :eleven-back)))))

;;; ==========================================
;;; ルールセット保存・読み込み機能テスト
;;; ==========================================

(defun test-rule-set-serialization ()
  "ルールセットシリアライゼーションテスト"
  (let ((original-set (daifugo-rule-set:get-rule-set :jdf-official)))
    (let ((serialized (daifugo-rule-set:serialize-rule-set original-set))
          (deserialized (daifugo-rule-set:deserialize-rule-set serialized)))
      (and deserialized
           (eq (daifugo-rule-set:rule-set-name deserialized) 
               (daifugo-rule-set:rule-set-name original-set))
           (daifugo-rule-set:rule-sets-equal-p original-set deserialized)))))

(defun test-rule-set-persistence ()
  "ルールセット永続化テスト"
  (let ((persist-set (daifugo-rule-set:create-rule-set :persistence-test)))
    (daifugo-rule-set:enable-rule persist-set :revolution)
    (daifugo-rule-set:enable-rule persist-set :eight-cut)
    (daifugo-rule-set:save-rule-set persist-set "test-ruleset.dat")
    (let ((loaded-set (daifugo-rule-set:load-rule-set "test-ruleset.dat")))
      (and loaded-set
           (eq (daifugo-rule-set:rule-set-name loaded-set) :persistence-test)
           (daifugo-rule-set:rule-enabled-p loaded-set :revolution)
           (daifugo-rule-set:rule-enabled-p loaded-set :eight-cut)))))

(defun test-rule-set-export-import ()
  "ルールセットエクスポート・インポートテスト"
  (let ((export-set (daifugo-rule-set:get-rule-set :jdf-extended)))
    (daifugo-rule-set:export-rule-set export-set "exported-ruleset.json" :json)
    (let ((imported-set (daifugo-rule-set:import-rule-set "exported-ruleset.json" :json)))
      (and imported-set
           (daifugo-rule-set:rule-sets-equal-p export-set imported-set)))))

;;; ==========================================
;;; ゲーム統合機能テスト
;;; ==========================================

(defun test-game-rule-set-integration ()
  "ゲームルールセット統合テスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (rule-set (daifugo-rule-set:get-rule-set :jdf-official)))
    (daifugo-game-engine:set-rule-set game rule-set)
    (and (eq (daifugo-game-engine:get-rule-set game) rule-set)
         (daifugo-game-engine:rule-enabled-p game :revolution)
         (daifugo-game-engine:rule-enabled-p game :eight-cut))))

(defun test-dynamic-rule-switching ()
  "動的ルール切り替えテスト"
  (let ((game (daifugo-game-engine:create-game 4))
        (casual-set (daifugo-rule-set:get-rule-set :casual))
        (jdf-set (daifugo-rule-set:get-rule-set :jdf-official)))
    (daifugo-game-engine:set-rule-set game casual-set)
    (and (not (daifugo-game-engine:rule-enabled-p game :eight-cut))
         (progn
           (daifugo-game-engine:set-rule-set game jdf-set)
           (daifugo-game-engine:rule-enabled-p game :eight-cut)))))

(defun test-rule-set-compatibility ()
  "ルールセット互換性テスト"
  (let ((v1-set (daifugo-rule-set:create-rule-set :version-1))
        (v2-set (daifugo-rule-set:create-rule-set :version-2)))
    (daifugo-rule-set:set-version v1-set "1.0")
    (daifugo-rule-set:set-version v2-set "2.0")
    (and (daifugo-rule-set:compatible-p v1-set v2-set)
         (daifugo-rule-set:can-upgrade-p v1-set v2-set))))

;;; ==========================================
;;; パフォーマンス・メタデータテスト
;;; ==========================================

(defun test-rule-set-metadata ()
  "ルールセットメタデータテスト"
  (let ((meta-set (daifugo-rule-set:create-rule-set :metadata-test)))
    (daifugo-rule-set:set-metadata meta-set :author "Test Author")
    (daifugo-rule-set:set-metadata meta-set :description "Test Description")
    (daifugo-rule-set:set-metadata meta-set :version "1.0.0")
    (and (string= (daifugo-rule-set:get-metadata meta-set :author) "Test Author")
         (string= (daifugo-rule-set:get-metadata meta-set :description) "Test Description")
         (string= (daifugo-rule-set:get-metadata meta-set :version) "1.0.0"))))

(defun test-rule-set-performance ()
  "ルールセットパフォーマンステスト"
  (let ((perf-set (daifugo-rule-set:get-rule-set :jdf-official))
        (start-time (get-universal-time)))
    (dotimes (i 1000)
      (daifugo-rule-set:rule-enabled-p perf-set :revolution)
      (daifugo-rule-set:rule-enabled-p perf-set :eight-cut)
      (daifugo-rule-set:rule-enabled-p perf-set :sequence))
    (let ((end-time (get-universal-time)))
      (< (- end-time start-time) 1))))

(defun test-rule-set-memory-usage ()
  "ルールセットメモリ使用量テスト"
  (let ((memory-sets '()))
    (dotimes (i 100)
      (push (daifugo-rule-set:create-rule-set 
             (intern (format nil "MEMORY-TEST-~A" i))) memory-sets))
    (dolist (set memory-sets)
      (daifugo-rule-set:enable-rule set :revolution)
      (daifugo-rule-set:enable-rule set :eight-cut))
    (> (length memory-sets) 0)))

;;; ==========================================
;;; テスト実行関数
;;; ==========================================

(defun run-rule-set-tests ()
  "ルールセット機能のテストを実行"
  (format t "~%=== ルールセット機能テスト実行 ===~%")
  
  (let ((tests '(("ルールセット作成" . test-rule-set-creation)
                 ("デフォルトルールセット" . test-default-rule-set)
                 ("ルールセット登録" . test-rule-set-registration)
                 ("JDF公式ルールセット" . test-jdf-official-rule-set)
                 ("JDF拡張ルールセット" . test-jdf-extended-rule-set)
                 ("カジュアルルールセット" . test-casual-rule-set)
                 ("ルール有効化" . test-rule-enablement)
                 ("ルール無効化" . test-rule-disablement)
                 ("一括ルール操作" . test-bulk-rule-operations)
                 ("ルールパラメータ" . test-rule-parameters)
                 ("ルール優先度設定" . test-rule-priority-settings)
                 ("条件付きルール" . test-conditional-rules)
                 ("ルールセット検証" . test-rule-set-validation)
                 ("ルール競合検出" . test-rule-conflict-detection)
                 ("ルール依存関係解決" . test-rule-dependency-resolution)
                 ("ルールセットシリアライゼーション" . test-rule-set-serialization)
                 ("ルールセット永続化" . test-rule-set-persistence)
                 ("ルールセットエクスポート・インポート" . test-rule-set-export-import)
                 ("ゲームルールセット統合" . test-game-rule-set-integration)
                 ("動的ルール切り替え" . test-dynamic-rule-switching)
                 ("ルールセット互換性" . test-rule-set-compatibility)
                 ("ルールセットメタデータ" . test-rule-set-metadata)
                 ("ルールセットパフォーマンス" . test-rule-set-performance)
                 ("ルールセットメモリ使用量" . test-rule-set-memory-usage)))
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

;; テスト実行関数の定義（automated-runner用）
(defun run-rule-set-tests-main ()
  "メインテスト実行関数"
  (run-rule-set-tests))

;; テスト実行
(run-rule-set-tests)