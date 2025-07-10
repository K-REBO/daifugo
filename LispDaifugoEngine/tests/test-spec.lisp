;;; test-spec.lisp - 仕様書のテストケース

(defpackage :daifugo-spec-test
  (:use :common-lisp)
  (:export #:run-spec-tests))

(in-package :daifugo-spec-test)

;;; 仕様書の内容が正しく定義されているかをテストする

(defun test-spec-file-exists ()
  "SPEC.mdファイルが存在することをテスト"
  (probe-file "SPEC.md"))

(defun test-spec-contains-basic-rules ()
  "SPEC.mdに基本ルールが含まれているかをテスト"
  (let ((spec-content (with-open-file (stream "SPEC.md" :direction :input)
                        (loop for line = (read-line stream nil)
                              while line
                              collect line))))
    (and (some (lambda (line) (search "カード強度" line)) spec-content)
         (some (lambda (line) (search "階級システム" line)) spec-content)
         (some (lambda (line) (search "ゲームフロー" line)) spec-content))))

(defun test-spec-contains-local-rules ()
  "SPEC.mdにローカルルールが含まれているかをテスト"
  (let ((spec-content (with-open-file (stream "SPEC.md" :direction :input)
                        (loop for line = (read-line stream nil)
                              while line
                              collect line))))
    (and (some (lambda (line) (search "kakumei.lisp" line)) spec-content)
         (some (lambda (line) (search "8kiri.lisp" line)) spec-content)
         (some (lambda (line) (search "kaidan.lisp" line)) spec-content))))

(defun test-spec-contains-logger-system ()
  "SPEC.mdにロガーシステムが含まれているかをテスト"
  (let ((spec-content (with-open-file (stream "SPEC.md" :direction :input)
                        (loop for line = (read-line stream nil)
                              while line
                              collect line))))
    (and (some (lambda (line) (search "ゲームロガー" line)) spec-content)
         (some (lambda (line) (search "自動テスタ" line)) spec-content)
         (some (lambda (line) (search "AIプレイヤー" line)) spec-content))))

(defun test-spec-contains-javascript-ui ()
  "SPEC.mdにJavaScript UIが含まれているかをテスト"
  (let ((spec-content (with-open-file (stream "SPEC.md" :direction :input)
                        (loop for line = (read-line stream nil)
                              while line
                              collect line))))
    (and (some (lambda (line) (search "JavaScript UI" line)) spec-content)
         (some (lambda (line) (search "UIのみ" line)) spec-content))))

(defun test-spec-contains-implementation-phases ()
  "SPEC.mdに実装フェーズが含まれているかをテスト"
  (let ((spec-content (with-open-file (stream "SPEC.md" :direction :input)
                        (loop for line = (read-line stream nil)
                              while line
                              collect line))))
    (and (some (lambda (line) (search "Phase 1" line)) spec-content)
         (some (lambda (line) (search "Phase 2" line)) spec-content)
         (some (lambda (line) (search "Phase 3" line)) spec-content))))

(defun run-spec-tests ()
  "全ての仕様書テストを実行"
  (format t "~%=== 仕様書テスト実行 ===~%")
  
  (let ((tests '(("SPEC.mdファイル存在" . test-spec-file-exists)
                 ("基本ルール含有" . test-spec-contains-basic-rules)
                 ("ローカルルール含有" . test-spec-contains-local-rules)
                 ("ロガーシステム含有" . test-spec-contains-logger-system)
                 ("JavaScript UI含有" . test-spec-contains-javascript-ui)
                 ("実装フェーズ含有" . test-spec-contains-implementation-phases)))
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
(run-spec-tests)