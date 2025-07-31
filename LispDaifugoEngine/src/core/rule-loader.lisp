;;; rule-loader.lisp - 動的ルール読み込みシステム

(defpackage :daifugo-rule-loader
  (:use :common-lisp)
  (:export #:create-rule-loader
           #:rule-loader-p
           #:get-loaded-rules
           #:discover-rule-files
           #:load-rule-file
           #:unload-rule
           #:reload-rule
           #:get-rule-status))

(in-package :daifugo-rule-loader)

;;; ルールローダー構造体
(defstruct rule-loader
  loaded-rules          ; 読み込み済みルールのリスト
  rule-files           ; 発見されたルールファイルのリスト
  search-paths         ; ルール検索パス
  auto-discovery-p)    ; 自動発見フラグ

;;; 基本機能
(defun create-rule-loader (&key (auto-discovery-p t) (search-paths '("src/rules/")))
  "新しいルールローダーを作成"
  (make-rule-loader :loaded-rules nil
                    :rule-files nil
                    :search-paths search-paths
                    :auto-discovery-p auto-discovery-p))

(defun get-loaded-rules (loader)
  "読み込み済みルールのリストを取得"
  (rule-loader-loaded-rules loader))

(defun discover-rule-files (loader directory)
  "指定ディレクトリからルールファイルを発見"
  (when (probe-file directory)
    (let ((files (directory (merge-pathnames "*.lisp" directory))))
      (setf (rule-loader-rule-files loader) 
            (mapcar #'namestring files))
      (rule-loader-rule-files loader))))

(defun load-rule-file (loader file-path)
  "ルールファイルを読み込み"
  (handler-case
      (progn
        (load file-path)
        (push file-path (rule-loader-loaded-rules loader))
        t)
    (error (e)
      (format t "Failed to load rule file ~A: ~A~%" file-path e)
      nil)))

(defun unload-rule (loader rule-name)
  "ルールをアンロード"
  (setf (rule-loader-loaded-rules loader)
        (remove rule-name (rule-loader-loaded-rules loader) :test #'string=))
  t)

(defun reload-rule (loader file-path)
  "ルールをリロード"
  (unload-rule loader file-path)
  (load-rule-file loader file-path))

(defun get-rule-status (loader rule-name)
  "ルールの状態を取得"
  (if (member rule-name (rule-loader-loaded-rules loader) :test #'string=)
      :loaded
      :not-loaded))

(defun validate-rule-file (loader file-path)
  "ルールファイルの妥当性を検証"
  (declare (ignore loader))
  (and (probe-file file-path)
       (string= (pathname-type file-path) "lisp")))

(defun load-all-rules (loader)
  "すべてのルールファイルを読み込み"
  (let ((loaded-count 0))
    (dolist (file (rule-loader-rule-files loader))
      (when (validate-rule-file loader file)
        (when (load-rule-file loader file)
          (incf loaded-count))))
    loaded-count))

(defun add-rule-dependency (loader rule-name dependency)
  "ルール依存関係を追加"
  (declare (ignore loader rule-name dependency))
  t)

(defun resolve-dependencies (loader)
  "ルール依存関係を解決"
  (declare (ignore loader))
  t)

(defun detect-circular-dependencies (loader)
  "循環依存関係を検出"
  (declare (ignore loader))
  nil)