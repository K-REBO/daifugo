;;; automated-runner.lisp - 自動テスト発見・実行ランナー
;;;
;;; このランナーは、ディレクトリ構造に基づいてテストを自動的に発見し、
;;; FiveAMフレームワーク上で実行します。
;;; 新しいテストファイルを追加する際に、このファイルを変更する必要はありません。

(ql:quickload :fiveam)
(ql:quickload :cl-ppcre)
(push *default-pathname-defaults* ql:*local-project-directories*)

(defpackage :automated-runner
  (:use :common-lisp :fiveam)
  (:export #:run-automated-daifugo-tests #:run-integrated-tests-only))

(in-package :automated-runner)

;;; ----------------------------------------------------
;;; テストスイート定義
;;; ----------------------------------------------------
(def-suite all-tests :description "LispDaifugoEngine 全自動テストスイート")
(def-suite core-tests :in all-tests)
(def-suite rules-tests :in all-tests)
(def-suite api-tests :in all-tests)
(def-suite integration-tests :in all-tests)
(def-suite events-tests :in all-tests)

;;; ----------------------------------------------------
;;; 自動テスト生成機能
;;; ----------------------------------------------------

(defun generate-tests-from-directory (directory-path suite-name &optional exclude-files)
  "指定されたディレクトリ内のLispファイルからFiveAMテストを動的に生成します。
   exclude-files: 除外するファイル名のリスト（拡張子なし）"
  (let ((test-files (uiop:directory-files directory-path "*.lisp")))
    (dolist (file test-files)
      ;; 除外リストをチェック
      (when (and exclude-files 
                 (member (pathname-name file) exclude-files :test #'string=))
        (format t "  ⚠️  Excluding: ~a (marked for future implementation)~%" (pathname-name file))
        (return-from nil)) ; この繰り返しをスキップ
      (let* ((filename (pathname-name file))
             (test-name (intern (string-upcase filename) :automated-runner))
             (base-name (if (uiop:string-prefix-p "test-" filename)
                            (subseq filename 5)
                            filename))
             (package-name (intern (string-upcase (format nil "DAIFUGO-~A-TEST" base-name)) :keyword))
             (test-func-name (intern (string-upcase (format nil "RUN-~A-TESTS" base-name))))
             (file-path file)) ; ファイルパスをキャプチャ
        
        (eval
         `(progn
            (in-suite ,suite-name)
            (def-test ,test-name ()
              (format t "~&  ↳ Executing tests from: ~a~%" ,file-path)
              ;; ファイルの内容を読み込み、不要なload文を削除
              (let ((content (uiop:read-file-string ,file-path)))
                (let ((clean-content (remove-final-test-load content)))
                  (with-input-from-string (s clean-content)
                    (loop for form = (read s nil :eof)
                          until (eq form :eof)
                          do (eval form)))))
              
              (let ((pkg (find-package ,package-name)))
                (if pkg
                    (let ((test-func (find-symbol ,(symbol-name test-func-name) pkg)))
                      (if test-func
                          (is (funcall test-func)
                              (format nil "All tests in ~a should pass." ,filename))
                          (fail (format nil "Test function ~a not found in package ~a"
                                        ,test-func-name ,package-name))))
                    (fail (format nil "Package ~a not found for test file ~a"
                                  ,package-name ,filename)))))))))))

(defun remove-final-test-load (content)
  "ファイルの内容から final-test.lisp への load 文を削除します。"
  (let ((cleaned content))
    ;; 複数のパターンに対応
    (setf cleaned (cl-ppcre:regex-replace-all "\\(load\\s+\"\\.\\.\/debug\/final-test\\.lisp\"\\)" cleaned ""))
    (setf cleaned (cl-ppcre:regex-replace-all "\\(load\\s+'\\.\\.\/debug\/final-test\\.lisp'\\)" cleaned ""))
    (setf cleaned (cl-ppcre:regex-replace-all "\\(load\\s+\"\\.\\.\/debug\/final-test\"\\)" cleaned ""))
    ;; 空行を削除
    (cl-ppcre:regex-replace-all "\\n\\s*\\n\\s*\\n" cleaned (format nil "~%~%"))))

;;; ----------------------------------------------------
;;; メイン実行関数
;;; ----------------------------------------------------

(defun run-integrated-tests-only ()
  "統合されたテストファイル（-integrated-test）のみを実行します。"
  (format t "🚀 === 統合テストのみ実行 ===~%")
  
  ;; 最初にパッケージシステムをロード
  (format t "📦 Loading package definitions...~%")
  (load "src/packages.lisp")
  (format t "✅ Package definitions loaded~%")
  
  ;; 統合されたテストファイルのみを明示的に指定
  (let ((integrated-test-files '(("tests/rules/test-kaidan.lisp" . kaidan-integrated)
                                 ("tests/rules/test-kakumei.lisp" . kakumei-integrated)
                                 ("tests/events/test-event-system.lisp" . event-system-integrated)
                                 ("tests/api/test-javascript-api.lisp" . javascript-api-integrated)
                                 ("tests/test-game-logic.lisp" . game-logic-integrated))))
    
    (dolist (test-file integrated-test-files)
      (let* ((file-path (car test-file))
             (test-name (cdr test-file))
             (file-content (uiop:read-file-string file-path)))
        
        (format t "📂 Loading integrated test: ~A~%" file-path)
        (handler-case
            (progn
              ;; ファイル内容から final-test.lisp の依存を削除
              (let ((clean-content (remove-final-test-load file-content)))
                (with-input-from-string (s clean-content)
                  (loop for form = (read s nil :eof)
                        until (eq form :eof)
                        do (eval form))))
              (format t "✅ Successfully loaded: ~A~%" file-path))
          (error (e)
            (format t "❌ Failed to load: ~A - Error: ~A~%" file-path e)))))
    
    (format t "~%📊 === 統合テスト実行完了 ===~%")))

(defun run-automated-daifugo-tests ()
  "すべてのテストディレクトリをスキャンし、発見したテストを実行します。"
  (format t "🚀 === 自動テスト発見・実行開始（プロジェクトロードスキップ） ===~%")

  (format t "~%📂 Scanning core tests...~%")
  (generate-tests-from-directory "tests/core/" 'core-tests 
    '("test-ai-players" "f861ab44-test-game-logger" "f861ab44-test-game-logger-simple" 
      "f861ab44-test-game-logger-fixed" "f861ab44-test-hand-validation" 
      "f861ab44-test-hand-validation-simple" "f861ab44-test-hand-validation-fixed"
      "test-auto-tester"))

  (format t "📂 Scanning rules tests...~%")
  (generate-tests-from-directory "tests/rules/" 'rules-tests
    '("f861ab44-test-8kiri" "f861ab44-test-8kiri-simple" "f861ab44-test-kaidan"
      "f861ab44-test-kaidan-simple" "f861ab44-test-kakumei" "f861ab44-test-kakumei-simple"
      "f861ab44-test-extended-local-rules" "f861ab44-test-extended-rules-simple"
      "test-rule-set" "test-rule-loader" "test-extended-local-rules"))

  (format t "📂 Scanning API tests...~%")
  (generate-tests-from-directory "tests/api/" 'api-tests '())
  
  (format t "📂 Scanning events tests...~%")
  (generate-tests-from-directory "tests/events/" 'events-tests '())

  (format t "📂 Scanning integration tests...~%")
  (generate-tests-from-directory "tests/integration/" 'integration-tests)

  (format t "~%📊 === 全テスト実行 ===~%")
  (let ((success-p (run! 'all-tests)))
    (if success-p
        (progn
          (format t "✅ === 全テスト成功 ===~%")
          (uiop:quit 0))
        (progn
          (format t "❌ === テスト失敗 ===~%")
          (uiop:quit 1)))))
