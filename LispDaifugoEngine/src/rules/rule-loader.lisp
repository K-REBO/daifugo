;;; rule-loader.lisp - 動的ルール読み込み

(defpackage :daifugo-rule-loader
  (:use :common-lisp)
  (:export #:load-local-rule
           #:load-rule-set
           #:unload-rule
           #:list-active-rules
           #:rule-file-exists-p))

(in-package :daifugo-rule-loader)

;;; ローカルルールファイルの読み込み
(defun load-local-rule (rule-file)
  "ローカルルールファイルを読み込む"
  (when (probe-file rule-file)
    (load rule-file)
    t))

;;; ルールセットの読み込み
(defun load-rule-set (rule-set-file)
  "ルールセットファイルを読み込む"
  (when (probe-file rule-set-file)
    (load rule-set-file)
    t))

;;; ルールのアンロード
(defun unload-rule (rule-name)
  "指定されたルールをアンロードする"
  (daifugo-rule-engine:unregister-rule rule-name))

;;; アクティブルールのリスト取得
(defun list-active-rules ()
  "アクティブなルールのリストを取得する"
  (mapcar #'daifugo-rule-engine:rule-name 
          (daifugo-rule-engine:get-active-rules)))

;;; ルールファイル存在確認
(defun rule-file-exists-p (rule-file)
  "ルールファイルが存在するかどうかを確認する"
  (probe-file rule-file))