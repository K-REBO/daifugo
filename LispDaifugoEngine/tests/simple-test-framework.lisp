;;; simple-test-framework.lisp - シンプルなテストフレームワーク
;;; 最小限のテストマクロのみを提供（パッケージ依存なし）

(defpackage :simple-test-framework
  (:use :common-lisp)
  (:export #:test-assert
           #:test
           #:test-function-exists
           #:test-section
           #:run-test-suite
           #:*tests-passed*
           #:*tests-total*
           #:test-with-error-handling))

(in-package :simple-test-framework)

;;; グローバル変数
(defvar *tests-passed* 0)
(defvar *tests-total* 0)

;;; 基本テストマクロ
(defmacro test (test-name description &body body)
  "テスト定義マクロ"
  `(defun ,test-name ()
     ,description
     ,@body))

(defmacro test-assert (condition description)
  "基本的なアサーションマクロ"
  `(progn
     (incf *tests-total*)
     (if ,condition
         (progn
           (incf *tests-passed*)
           (format t "✅ ~A~%" ,description))
         (format t "❌ ~A~%" ,description))))

(defun test-function-exists (function-symbol description)
  "関数の存在をテストする"
  (incf *tests-total*)
  (if (and (fboundp function-symbol) (functionp (symbol-function function-symbol)))
      (progn
        (incf *tests-passed*)
        (format t "✅ ~A~%" description))
      (format t "❌ ~A~%" description)))

(defun test-section (section-name)
  "テストセクションのヘッダーを表示"
  (format t "~%--- ~A ---~%" section-name))

(defmacro test-with-error-handling (test-form success-msg error-msg)
  "エラーハンドリング付きテストマクロ"
  `(handler-case
       (progn
         ,test-form
         (format t "✅ ~A~%" ,success-msg))
     (error (e)
       (format t "⚠️  ~A: ~A~%" ,error-msg e))))

;;; テストスイート実行関数
(defun run-test-suite (suite-name test-functions)
  "テストスイートを実行"
  (setf *tests-passed* 0)
  (setf *tests-total* 0)
  
  (format t "=== ~A テスト実行 ===~%" suite-name)
  
  (dolist (test-fn test-functions)
    (when (fboundp test-fn)
      (funcall test-fn)))
  
  (format t "~%結果: ~A合格, ~A失敗~%" *tests-passed* (- *tests-total* *tests-passed*))
  (= *tests-passed* *tests-total*))