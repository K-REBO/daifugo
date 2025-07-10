;;; rule-set.lisp - ルールセット機能

(defpackage :daifugo-rule-set
  (:use :common-lisp)
  (:export
   ;; 基本ルールセット機能
   #:create-rule-set #:rule-set-p #:rule-set-name
   #:get-default-rule-set #:register-rule-set #:get-rule-set
   #:copy-rule-set
   
   ;; 定義済みルールセット
   #:get-jdf-official #:get-jdf-extended #:get-casual
   
   ;; ルール有効化・無効化
   #:enable-rule #:disable-rule #:rule-enabled-p
   #:enable-rules #:disable-rules
   
   ;; ルール設定・パラメータ
   #:set-rule-parameter #:get-rule-parameter
   #:set-rule-priority #:get-rule-priorities #:get-priority
   #:add-rule-condition #:has-rule-condition-p
   
   ;; ルールセット検証
   #:validate-rule-set #:detect-rule-conflicts #:resolve-dependencies
   
   ;; 保存・読み込み
   #:serialize-rule-set #:deserialize-rule-set
   #:save-rule-set #:load-rule-set
   #:export-rule-set #:import-rule-set
   
   ;; ゲーム統合
   #:rule-sets-equal-p #:compatible-p #:can-upgrade-p
   
   ;; メタデータ・パフォーマンス
   #:set-metadata #:get-metadata #:set-version))

(in-package :daifugo-rule-set)

;;; ==========================================
;;; データ構造定義
;;; ==========================================

(defstruct rule-set
  "ルールセット構造体"
  name                    ; ルールセット名
  enabled-rules          ; 有効化されたルールのハッシュテーブル
  rule-parameters         ; ルールパラメータのハッシュテーブル
  rule-priorities         ; ルール優先度のハッシュテーブル
  rule-conditions         ; ルール条件のハッシュテーブル
  metadata                ; メタデータのハッシュテーブル
  creation-time           ; 作成時刻
  version                 ; バージョン情報
  conflicts               ; 検出された競合リスト
  dependencies-resolved   ; 依存関係解決済みフラグ
)

(defstruct rule-priority-table
  "ルール優先度テーブル"
  priorities)             ; 優先度ハッシュテーブル

(defstruct rule-condition
  "ルール条件"
  rule-name               ; ルール名
  condition-type          ; 条件タイプ (:requires, :excludes, :if, :unless)
  target-rules            ; 対象ルールリスト
  condition-function)     ; 条件関数

;;; ==========================================
;;; グローバル変数
;;; ==========================================

(defvar *registered-rule-sets* (make-hash-table :test 'eq)
  "登録済みルールセットのハッシュテーブル")

(defvar *default-rule-set* nil
  "デフォルトルールセット")

;;; ==========================================
;;; 基本ルールセット機能
;;; ==========================================

(defun create-rule-set (name)
  "新しいルールセットを作成"
  (make-rule-set
   :name name
   :enabled-rules (make-hash-table :test 'eq)
   :rule-parameters (make-hash-table :test 'eq)
   :rule-priorities (make-hash-table :test 'eq)
   :rule-conditions (make-hash-table :test 'eq)
   :metadata (make-hash-table :test 'eq)
   :creation-time (get-universal-time)
   :version "1.0.0"
   :conflicts nil
   :dependencies-resolved nil))

(defun get-default-rule-set ()
  "デフォルトルールセットを取得"
  (or *default-rule-set*
      (setf *default-rule-set* (get-jdf-official))))

(defun register-rule-set (rule-set)
  "ルールセットを登録"
  (when (rule-set-p rule-set)
    (setf (gethash (rule-set-name rule-set) *registered-rule-sets*) rule-set)
    rule-set))

(defun get-rule-set (name)
  "登録済みルールセットを取得"
  (or (gethash name *registered-rule-sets*)
      (case name
        (:jdf-official (get-jdf-official))
        (:jdf-extended (get-jdf-extended))
        (:casual (get-casual))
        (t nil))))

(defun copy-rule-set (rule-set)
  "ルールセットをコピー"
  (when (rule-set-p rule-set)
    (let ((new-set (create-rule-set (rule-set-name rule-set))))
      ;; 有効化ルールをコピー
      (maphash (lambda (rule enabled)
                 (setf (gethash rule (rule-set-enabled-rules new-set)) enabled))
               (rule-set-enabled-rules rule-set))
      ;; パラメータをコピー
      (maphash (lambda (rule params)
                 (setf (gethash rule (rule-set-rule-parameters new-set)) 
                       (copy-hash-table params)))
               (rule-set-rule-parameters rule-set))
      ;; 優先度をコピー
      (maphash (lambda (rule priority)
                 (setf (gethash rule (rule-set-rule-priorities new-set)) priority))
               (rule-set-rule-priorities rule-set))
      ;; その他の属性をコピー
      (setf (rule-set-version new-set) (rule-set-version rule-set))
      (setf (rule-set-metadata new-set) (copy-hash-table (rule-set-metadata rule-set)))
      new-set)))

(defun copy-hash-table (hash-table)
  "ハッシュテーブルをコピー"
  (let ((new-table (make-hash-table :test (hash-table-test hash-table))))
    (maphash (lambda (key value)
               (setf (gethash key new-table) value))
             hash-table)
    new-table))

;;; ==========================================
;;; 定義済みルールセット
;;; ==========================================

(defun get-jdf-official ()
  "日本大富豪連盟公式ルールセットを取得"
  (let ((jdf-set (create-rule-set :jdf-official)))
    (enable-rule jdf-set :revolution)
    (enable-rule jdf-set :eight-cut)
    (enable-rule jdf-set :sequence)
    
    ;; ルールパラメータ設定
    (set-rule-parameter jdf-set :sequence :min-length 3)
    (set-rule-parameter jdf-set :sequence :max-length 13)
    (set-rule-parameter jdf-set :revolution :double-revolution nil)
    
    ;; メタデータ設定
    (set-metadata jdf-set :author "日本大富豪連盟")
    (set-metadata jdf-set :description "日本大富豪連盟公式ルール")
    (set-metadata jdf-set :version "1.0.0")
    
    ;; 登録
    (register-rule-set jdf-set)
    jdf-set))

(defun get-jdf-extended ()
  "日本大富豪連盟拡張ルールセットを取得"
  (let ((jdf-ext (create-rule-set :jdf-extended)))
    ;; 基本ルール
    (enable-rule jdf-ext :revolution)
    (enable-rule jdf-ext :eight-cut)
    (enable-rule jdf-ext :sequence)
    
    ;; 拡張ルール
    (enable-rule jdf-ext :eleven-back)
    (enable-rule jdf-ext :suit-binding)
    (enable-rule jdf-ext :spade3-return)
    
    ;; ルール条件設定
    (add-rule-condition jdf-ext :eleven-back :requires '(:revolution))
    (add-rule-condition jdf-ext :suit-binding :excludes '(:sequence))
    
    ;; メタデータ設定
    (set-metadata jdf-ext :author "日本大富豪連盟")
    (set-metadata jdf-ext :description "日本大富豪連盟拡張ルール")
    (set-metadata jdf-ext :version "2.0.0")
    
    ;; 登録
    (register-rule-set jdf-ext)
    jdf-ext))

(defun get-casual ()
  "カジュアルルールセットを取得"
  (let ((casual-set (create-rule-set :casual)))
    ;; 基本的なルールのみ
    (enable-rule casual-set :revolution)
    
    ;; パラメータ設定（緩い設定）
    (set-rule-parameter casual-set :revolution :double-revolution t)
    
    ;; メタデータ設定
    (set-metadata casual-set :author "Community")
    (set-metadata casual-set :description "カジュアル向けシンプルルール")
    (set-metadata casual-set :version "1.0.0")
    
    ;; 登録
    (register-rule-set casual-set)
    casual-set))

;;; ==========================================
;;; ルール有効化・無効化
;;; ==========================================

(defun enable-rule (rule-set rule-name)
  "ルールを有効化"
  (when (rule-set-p rule-set)
    (setf (gethash rule-name (rule-set-enabled-rules rule-set)) t)
    ;; 依存関係解決フラグをリセット
    (setf (rule-set-dependencies-resolved rule-set) nil)
    t))

(defun disable-rule (rule-set rule-name)
  "ルールを無効化"
  (when (rule-set-p rule-set)
    (setf (gethash rule-name (rule-set-enabled-rules rule-set)) nil)
    ;; 依存関係解決フラグをリセット
    (setf (rule-set-dependencies-resolved rule-set) nil)
    t))

(defun rule-enabled-p (rule-set rule-name)
  "ルールが有効かどうかを判定"
  (when (rule-set-p rule-set)
    (gethash rule-name (rule-set-enabled-rules rule-set))))

(defun enable-rules (rule-set rule-names)
  "複数のルールを一括有効化"
  (when (rule-set-p rule-set)
    (dolist (rule-name rule-names)
      (enable-rule rule-set rule-name))
    t))

(defun disable-rules (rule-set rule-names)
  "複数のルールを一括無効化"
  (when (rule-set-p rule-set)
    (dolist (rule-name rule-names)
      (disable-rule rule-set rule-name))
    t))

;;; ==========================================
;;; ルール設定・パラメータ
;;; ==========================================

(defun set-rule-parameter (rule-set rule-name parameter-name value)
  "ルールパラメータを設定"
  (when (rule-set-p rule-set)
    (let ((rule-params (gethash rule-name (rule-set-rule-parameters rule-set))))
      (unless rule-params
        (setf rule-params (make-hash-table :test 'eq))
        (setf (gethash rule-name (rule-set-rule-parameters rule-set)) rule-params))
      (setf (gethash parameter-name rule-params) value)
      value)))

(defun get-rule-parameter (rule-set rule-name parameter-name)
  "ルールパラメータを取得"
  (when (rule-set-p rule-set)
    (let ((rule-params (gethash rule-name (rule-set-rule-parameters rule-set))))
      (when rule-params
        (gethash parameter-name rule-params)))))

(defun set-rule-priority (rule-set rule-name priority)
  "ルール優先度を設定"
  (when (rule-set-p rule-set)
    (setf (gethash rule-name (rule-set-rule-priorities rule-set)) priority)
    priority))

(defun get-rule-priorities (rule-set)
  "ルール優先度テーブルを取得"
  (when (rule-set-p rule-set)
    (make-rule-priority-table :priorities (rule-set-rule-priorities rule-set))))

(defun get-priority (priority-table rule-name)
  "特定ルールの優先度を取得"
  (when (rule-priority-table-p priority-table)
    (gethash rule-name (rule-priority-table-priorities priority-table))))

(defun add-rule-condition (rule-set rule-name condition-type target-rules)
  "ルール条件を追加"
  (when (rule-set-p rule-set)
    (let ((condition (make-rule-condition
                      :rule-name rule-name
                      :condition-type condition-type
                      :target-rules target-rules)))
      (setf (gethash rule-name (rule-set-rule-conditions rule-set)) condition)
      condition)))

(defun has-rule-condition-p (rule-set rule-name condition-type)
  "ルール条件が存在するかを判定"
  (when (rule-set-p rule-set)
    (let ((condition (gethash rule-name (rule-set-rule-conditions rule-set))))
      (and condition
           (eq (rule-condition-condition-type condition) condition-type)))))

;;; ==========================================
;;; ルールセット検証
;;; ==========================================

(defun validate-rule-set (rule-set)
  "ルールセットを検証"
  (when (rule-set-p rule-set)
    (let ((conflicts (detect-rule-conflicts rule-set)))
      (setf (rule-set-conflicts rule-set) conflicts)
      (null conflicts))))

(defun detect-rule-conflicts (rule-set)
  "ルール競合を検出"
  (when (rule-set-p rule-set)
    (let ((conflicts '()))
      ;; スート縛りと階段出しの競合をチェック
      (when (and (rule-enabled-p rule-set :suit-binding)
                 (rule-enabled-p rule-set :sequence))
        (push :suit-binding conflicts)
        (push :sequence conflicts))
      
      ;; その他の競合ルールをチェック
      (maphash (lambda (rule-name condition)
                 (when (and (rule-enabled-p rule-set rule-name)
                            (eq (rule-condition-condition-type condition) :excludes))
                   (dolist (excluded-rule (rule-condition-target-rules condition))
                     (when (rule-enabled-p rule-set excluded-rule)
                       (push rule-name conflicts)
                       (push excluded-rule conflicts)))))
               (rule-set-rule-conditions rule-set))
      
      (remove-duplicates conflicts))))

(defun resolve-dependencies (rule-set)
  "ルール依存関係を解決"
  (when (rule-set-p rule-set)
    (let ((resolved-set (copy-rule-set rule-set)))
      ;; 依存関係を解決
      (maphash (lambda (rule-name condition)
                 (when (and (rule-enabled-p resolved-set rule-name)
                            (eq (rule-condition-condition-type condition) :requires))
                   (dolist (required-rule (rule-condition-target-rules condition))
                     (enable-rule resolved-set required-rule))))
               (rule-set-rule-conditions rule-set))
      
      (setf (rule-set-dependencies-resolved resolved-set) t)
      resolved-set)))

;;; ==========================================
;;; 保存・読み込み
;;; ==========================================

(defun serialize-rule-set (rule-set)
  "ルールセットをシリアライズ"
  (when (rule-set-p rule-set)
    (let ((serialized (make-hash-table :test 'eq)))
      (setf (gethash :name serialized) (rule-set-name rule-set))
      (setf (gethash :version serialized) (rule-set-version rule-set))
      (setf (gethash :creation-time serialized) (rule-set-creation-time rule-set))
      
      ;; 有効化ルールをシリアライズ
      (let ((enabled-rules '()))
        (maphash (lambda (rule enabled)
                   (when enabled
                     (push rule enabled-rules)))
                 (rule-set-enabled-rules rule-set))
        (setf (gethash :enabled-rules serialized) enabled-rules))
      
      ;; メタデータをシリアライズ
      (let ((metadata-list '()))
        (maphash (lambda (key value)
                   (push (cons key value) metadata-list))
                 (rule-set-metadata rule-set))
        (setf (gethash :metadata serialized) metadata-list))
      
      serialized)))

(defun deserialize-rule-set (serialized)
  "シリアライズされたデータからルールセットを復元"
  (when (hash-table-p serialized)
    (let ((rule-set (create-rule-set (gethash :name serialized))))
      (setf (rule-set-version rule-set) (gethash :version serialized))
      (setf (rule-set-creation-time rule-set) (gethash :creation-time serialized))
      
      ;; 有効化ルールを復元
      (dolist (rule (gethash :enabled-rules serialized))
        (enable-rule rule-set rule))
      
      ;; メタデータを復元
      (dolist (metadata-pair (gethash :metadata serialized))
        (set-metadata rule-set (car metadata-pair) (cdr metadata-pair)))
      
      rule-set)))

(defun save-rule-set (rule-set filename)
  "ルールセットをファイルに保存"
  (when (rule-set-p rule-set)
    (with-open-file (stream filename :direction :output :if-exists :supersede)
      (print (serialize-rule-set rule-set) stream))
    t))

(defun load-rule-set (filename)
  "ファイルからルールセットを読み込み"
  (when (probe-file filename)
    (with-open-file (stream filename :direction :input)
      (deserialize-rule-set (read stream)))))

(defun export-rule-set (rule-set filename format)
  "ルールセットを指定フォーマットでエクスポート"
  (when (rule-set-p rule-set)
    (case format
      (:json (export-as-json rule-set filename))
      (:xml (export-as-xml rule-set filename))
      (:yaml (export-as-yaml rule-set filename))
      (t (save-rule-set rule-set filename)))))

(defun import-rule-set (filename format)
  "指定フォーマットからルールセットをインポート"
  (case format
    (:json (import-from-json filename))
    (:xml (import-from-xml filename))
    (:yaml (import-from-yaml filename))
    (t (load-rule-set filename))))

(defun export-as-json (rule-set filename)
  "JSON形式でエクスポート"
  (with-open-file (stream filename :direction :output :if-exists :supersede)
    (format stream "{~%")
    (format stream "  \"name\": \"~A\",~%" (rule-set-name rule-set))
    (format stream "  \"version\": \"~A\",~%" (rule-set-version rule-set))
    (format stream "  \"enabled_rules\": [")
    (let ((first t))
      (maphash (lambda (rule enabled)
                 (when enabled
                   (if first
                       (setf first nil)
                       (format stream ", "))
                   (format stream "\"~A\"" rule)))
               (rule-set-enabled-rules rule-set)))
    (format stream "],~%")
    (format stream "  \"metadata\": {")
    (let ((first t))
      (maphash (lambda (key value)
                 (if first
                     (setf first nil)
                     (format stream ", "))
                 (format stream "\"~A\": \"~A\"" key value))
               (rule-set-metadata rule-set)))
    (format stream "}~%")
    (format stream "}~%"))
  t)

(defun import-from-json (filename)
  "JSON形式からインポート（簡易実装）"
  (when (probe-file filename)
    ;; 簡易JSON解析（実際の実装では専用パーサーを使用）
    (let ((rule-set (create-rule-set :imported-json)))
      (with-open-file (stream filename :direction :input)
        (let ((content (read-line stream nil)))
          ;; 基本的な解析（デモンストレーション用）
          (when (search "revolution" content)
            (enable-rule rule-set :revolution))
          (when (search "eight-cut" content)
            (enable-rule rule-set :eight-cut))))
      rule-set)))

(defun export-as-xml (rule-set filename)
  "XML形式でエクスポート（簡易実装）"
  (with-open-file (stream filename :direction :output :if-exists :supersede)
    (format stream "<?xml version=\"1.0\" encoding=\"UTF-8\"?>~%")
    (format stream "<ruleset name=\"~A\" version=\"~A\">~%" 
            (rule-set-name rule-set) (rule-set-version rule-set))
    (format stream "  <enabled_rules>~%")
    (maphash (lambda (rule enabled)
               (when enabled
                 (format stream "    <rule>~A</rule>~%" rule)))
             (rule-set-enabled-rules rule-set))
    (format stream "  </enabled_rules>~%")
    (format stream "</ruleset>~%"))
  t)

(defun import-from-xml (filename)
  "XML形式からインポート（簡易実装）"
  (import-from-json filename)) ; 簡易実装として同じ処理

(defun export-as-yaml (rule-set filename)
  "YAML形式でエクスポート（簡易実装）"
  (with-open-file (stream filename :direction :output :if-exists :supersede)
    (format stream "name: ~A~%" (rule-set-name rule-set))
    (format stream "version: ~A~%" (rule-set-version rule-set))
    (format stream "enabled_rules:~%")
    (maphash (lambda (rule enabled)
               (when enabled
                 (format stream "  - ~A~%" rule)))
             (rule-set-enabled-rules rule-set)))
  t)

(defun import-from-yaml (filename)
  "YAML形式からインポート（簡易実装）"
  (import-from-json filename)) ; 簡易実装として同じ処理

;;; ==========================================
;;; ゲーム統合
;;; ==========================================

(defun rule-sets-equal-p (rule-set1 rule-set2)
  "2つのルールセットが等価かを判定"
  (when (and (rule-set-p rule-set1) (rule-set-p rule-set2))
    (and (eq (rule-set-name rule-set1) (rule-set-name rule-set2))
         (equal-hash-tables-p (rule-set-enabled-rules rule-set1)
                              (rule-set-enabled-rules rule-set2)))))

(defun equal-hash-tables-p (hash1 hash2)
  "2つのハッシュテーブルが等価かを判定"
  (and (= (hash-table-count hash1) (hash-table-count hash2))
       (maphash (lambda (key value)
                  (unless (equal value (gethash key hash2))
                    (return-from equal-hash-tables-p nil)))
                hash1)
       t))

(defun compatible-p (rule-set1 rule-set2)
  "2つのルールセットが互換性があるかを判定"
  (when (and (rule-set-p rule-set1) (rule-set-p rule-set2))
    ;; バージョン互換性チェック
    (let ((version1 (rule-set-version rule-set1))
          (version2 (rule-set-version rule-set2)))
      ;; 簡易実装：メジャーバージョンが同じなら互換
      (string= (subseq version1 0 1) (subseq version2 0 1)))))

(defun can-upgrade-p (from-rule-set to-rule-set)
  "ルールセットをアップグレード可能かを判定"
  (when (and (rule-set-p from-rule-set) (rule-set-p to-rule-set))
    ;; 名前が同じでバージョンが新しい場合
    (and (eq (rule-set-name from-rule-set) (rule-set-name to-rule-set))
         (string< (rule-set-version from-rule-set) (rule-set-version to-rule-set)))))

;;; ==========================================
;;; メタデータ・パフォーマンス
;;; ==========================================

(defun set-metadata (rule-set key value)
  "メタデータを設定"
  (when (rule-set-p rule-set)
    (setf (gethash key (rule-set-metadata rule-set)) value)
    value))

(defun get-metadata (rule-set key)
  "メタデータを取得"
  (when (rule-set-p rule-set)
    (gethash key (rule-set-metadata rule-set))))

(defun set-version (rule-set version)
  "バージョンを設定"
  (when (rule-set-p rule-set)
    (setf (rule-set-version rule-set) version)
    version))

;;; ==========================================
;;; 初期化処理
;;; ==========================================

;; 定義済みルールセットを初期化
(defun initialize-rule-sets ()
  "定義済みルールセットを初期化"
  (get-jdf-official)
  (get-jdf-extended)
  (get-casual)
  (setf *default-rule-set* (get-rule-set :jdf-official)))

;; 初期化実行
(initialize-rule-sets)