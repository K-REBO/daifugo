;;; test-project-structure.lisp - プロジェクト構成のテスト

(defpackage :daifugo-structure-test
  (:use :common-lisp)
  (:export #:run-structure-tests))

(in-package :daifugo-structure-test)

;;; プロジェクト構成が適切に設定されているかをテストする

(defun test-src-directory-exists ()
  "src/ディレクトリが存在することをテスト"
  (probe-file "src/"))

(defun test-core-directory-exists ()
  "src/core/ディレクトリが存在することをテスト"
  (probe-file "src/core/"))

(defun test-rules-directory-exists ()
  "src/rules/ディレクトリが存在することをテスト"
  (probe-file "src/rules/"))

(defun test-testing-directory-exists ()
  "src/testing/ディレクトリが存在することをテスト"
  (probe-file "src/testing/"))

(defun test-api-directory-exists ()
  "src/api/ディレクトリが存在することをテスト"
  (probe-file "src/api/"))

(defun test-utils-directory-exists ()
  "src/utils/ディレクトリが存在することをテスト"
  (probe-file "src/utils/"))

(defun test-rules-local-directory-exists ()
  "rules/ディレクトリが存在することをテスト"
  (probe-file "rules/"))

(defun test-rules-combined-directory-exists ()
  "rules/combined/ディレクトリが存在することをテスト"
  (probe-file "rules/combined/"))

(defun test-logs-directory-exists ()
  "logs/ディレクトリが存在することをテスト"
  (probe-file "logs/"))

(defun test-tests-directory-exists ()
  "tests/ディレクトリが存在することをテスト"
  (probe-file "tests/"))

(defun test-core-files-exist ()
  "コアファイルが存在することをテスト"
  (and (probe-file "src/core/game-engine.lisp")
       (probe-file "src/core/card-system.lisp")
       (probe-file "src/core/player-system.lisp")
       (probe-file "src/core/rule-engine.lisp")))

(defun test-testing-files-exist ()
  "テストファイルが存在することをテスト"
  (and (probe-file "src/testing/game-logger.lisp")
       (probe-file "src/testing/auto-tester.lisp")
       (probe-file "src/testing/ai-players.lisp")))

(defun test-rules-files-exist ()
  "ルールファイルが存在することをテスト"
  (and (probe-file "src/rules/basic-rules.lisp")
       (probe-file "src/rules/rule-loader.lisp")))

(defun test-api-files-exist ()
  "APIファイルが存在することをテスト"
  (probe-file "src/api/javascript-api.lisp"))

(defun test-utils-files-exist ()
  "ユーティリティファイルが存在することをテスト"
  (and (probe-file "src/utils/card-utils.lisp")
       (probe-file "src/utils/game-utils.lisp")))

(defun test-local-rule-files-exist ()
  "ローカルルールファイルが存在することをテスト"
  (and (probe-file "rules/kakumei.lisp")
       (probe-file "rules/8kiri.lisp")
       (probe-file "rules/11back.lisp")
       (probe-file "rules/kaidan.lisp")
       (probe-file "rules/sute-shibari.lisp")
       (probe-file "rules/spe3gaeshi.lisp")
       (probe-file "rules/miyakoochi.lisp")))

(defun test-combined-rule-files-exist ()
  "複合ルールファイルが存在することをテスト"
  (and (probe-file "rules/combined/japan-official.lisp")
       (probe-file "rules/combined/custom-set.lisp")))

(defun run-structure-tests ()
  "全てのプロジェクト構成テストを実行"
  (format t "~%=== プロジェクト構成テスト実行 ===~%")
  
  (let ((tests '(("src/ディレクトリ" . test-src-directory-exists)
                 ("src/core/ディレクトリ" . test-core-directory-exists)
                 ("src/rules/ディレクトリ" . test-rules-directory-exists)
                 ("src/testing/ディレクトリ" . test-testing-directory-exists)
                 ("src/api/ディレクトリ" . test-api-directory-exists)
                 ("src/utils/ディレクトリ" . test-utils-directory-exists)
                 ("rules/ディレクトリ" . test-rules-local-directory-exists)
                 ("rules/combined/ディレクトリ" . test-rules-combined-directory-exists)
                 ("logs/ディレクトリ" . test-logs-directory-exists)
                 ("tests/ディレクトリ" . test-tests-directory-exists)
                 ("コアファイル" . test-core-files-exist)
                 ("テストファイル" . test-testing-files-exist)
                 ("ルールファイル" . test-rules-files-exist)
                 ("APIファイル" . test-api-files-exist)
                 ("ユーティリティファイル" . test-utils-files-exist)
                 ("ローカルルールファイル" . test-local-rule-files-exist)
                 ("複合ルールファイル" . test-combined-rule-files-exist)))
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
    
    (format t "~%結果: ~A合格, ~A失敗~%" passed failed)
    (= failed 0)))

;; テスト実行（失敗することが期待される）
(run-structure-tests)