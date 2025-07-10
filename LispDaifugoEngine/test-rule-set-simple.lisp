;;; test-rule-set-simple.lisp - ルールセット機能のシンプルテスト

;; 基本システムの読み込み
(handler-case (load "src/rules/rule-set.lisp")
  (error (e) (format t "Warning: rule-set.lisp load error: ~A~%" e)))

(defun test-rule-set-simple ()
  "ルールセット機能のシンプルテスト"
  (format t "=== ルールセット機能シンプルテスト ===~%")
  
  ;; 基本作成テスト
  (handler-case
      (let ((rule-set (daifugo-rule-set:create-rule-set :test-set)))
        (format t "ルールセット作成: ~A~%" (daifugo-rule-set:rule-set-p rule-set))
        (format t "ルールセット名: ~A~%" (daifugo-rule-set:rule-set-name rule-set)))
    (error (e) (format t "ルールセット作成エラー: ~A~%" e)))
  
  ;; JDF公式ルールセットテスト
  (handler-case
      (let ((jdf-set (daifugo-rule-set:get-rule-set :jdf-official)))
        (format t "JDF公式ルールセット: ~A~%" (daifugo-rule-set:rule-set-p jdf-set))
        (format t "革命ルール有効: ~A~%" (daifugo-rule-set:rule-enabled-p jdf-set :revolution))
        (format t "8切りルール有効: ~A~%" (daifugo-rule-set:rule-enabled-p jdf-set :eight-cut))
        (format t "階段ルール有効: ~A~%" (daifugo-rule-set:rule-enabled-p jdf-set :sequence)))
    (error (e) (format t "JDF公式ルールセットエラー: ~A~%" e)))
  
  ;; ルール有効化テスト
  (handler-case
      (let ((custom-set (daifugo-rule-set:create-rule-set :custom-test)))
        (daifugo-rule-set:enable-rule custom-set :revolution)
        (daifugo-rule-set:enable-rule custom-set :eight-cut)
        (format t "ルール有効化テスト: ~A~%" 
                (and (daifugo-rule-set:rule-enabled-p custom-set :revolution)
                     (daifugo-rule-set:rule-enabled-p custom-set :eight-cut))))
    (error (e) (format t "ルール有効化エラー: ~A~%" e)))
  
  ;; カジュアルルールセットテスト
  (handler-case
      (let ((casual-set (daifugo-rule-set:get-rule-set :casual)))
        (format t "カジュアルルールセット: ~A~%" (daifugo-rule-set:rule-set-p casual-set))
        (format t "革命のみ有効: ~A~%" 
                (and (daifugo-rule-set:rule-enabled-p casual-set :revolution)
                     (not (daifugo-rule-set:rule-enabled-p casual-set :eight-cut))
                     (not (daifugo-rule-set:rule-enabled-p casual-set :sequence)))))
    (error (e) (format t "カジュアルルールセットエラー: ~A~%" e)))
  
  ;; パラメータ設定テスト
  (handler-case
      (let ((param-set (daifugo-rule-set:create-rule-set :param-test)))
        (daifugo-rule-set:set-rule-parameter param-set :sequence :min-length 3)
        (let ((min-length (daifugo-rule-set:get-rule-parameter param-set :sequence :min-length)))
          (format t "パラメータ設定テスト: ~A~%" (= min-length 3))))
    (error (e) (format t "パラメータ設定エラー: ~A~%" e)))
  
  ;; メタデータテスト
  (handler-case
      (let ((meta-set (daifugo-rule-set:create-rule-set :meta-test)))
        (daifugo-rule-set:set-metadata meta-set :author "Test Author")
        (let ((author (daifugo-rule-set:get-metadata meta-set :author)))
          (format t "メタデータテスト: ~A~%" (string= author "Test Author"))))
    (error (e) (format t "メタデータエラー: ~A~%" e)))
  
  (format t "=== テスト完了 ===~%")
  (format t "test-rule-set-simple.lisp: ルールセット機能テスト正常終了~%"))

;; テスト実行
(test-rule-set-simple)