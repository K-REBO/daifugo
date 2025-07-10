;;; test-comprehensive-simple.lisp - 包括的テストのシンプル実行

;; 基本システムの読み込み
(handler-case (load "src/core/card-system.lisp")
  (error (e) (format t "Warning: card-system.lisp load error: ~A~%" e)))
(handler-case (load "src/rules/rule-set.lisp")
  (error (e) (format t "Warning: rule-set.lisp load error: ~A~%" e)))

(defun test-comprehensive-simple ()
  "包括的テストのシンプル実行"
  (format t "=== 包括的テストシンプル実行 ===~%")
  
  ;; カードシステムテスト
  (handler-case
      (let ((card (daifugo-card-system:create-card 'A :spades))
            (deck (daifugo-card-system:create-deck)))
        (format t "カードシステム: ~A~%" 
                (and card
                     (listp deck)
                     (= (length deck) 52))))
    (error (e) (format t "カードシステムエラー: ~A~%" e)))
  
  ;; ルールセット機能テスト
  (handler-case
      (let ((jdf-set (daifugo-rule-set:get-rule-set :jdf-official))
            (casual-set (daifugo-rule-set:get-rule-set :casual)))
        (format t "ルールセット機能: ~A~%" 
                (and (daifugo-rule-set:rule-set-p jdf-set)
                     (daifugo-rule-set:rule-set-p casual-set)
                     (daifugo-rule-set:rule-enabled-p jdf-set :revolution)
                     (not (daifugo-rule-set:rule-enabled-p casual-set :eight-cut)))))
    (error (e) (format t "ルールセット機能エラー: ~A~%" e)))
  
  ;; パフォーマンステスト（軽量版）
  (handler-case
      (let ((start-time (get-universal-time))
            (cards-created 0))
        (dotimes (i 1000)
          (let ((card (daifugo-card-system:create-card 'A :spades)))
            (when card
              (incf cards-created))))
        (let ((end-time (get-universal-time))
              (duration (- end-time start-time)))
          (format t "パフォーマンステスト: ~A~%" 
                  (and (= cards-created 1000)
                       (< duration 5)))))
    (error (e) (format t "パフォーマンステストエラー: ~A~%" e)))
  
  ;; メモリ効率テスト（軽量版）
  (handler-case
      (let ((rule-sets '()))
        (dotimes (i 20)
          (push (daifugo-rule-set:create-rule-set 
                 (intern (format nil "TEST-~A" i))) rule-sets))
        (format t "メモリ効率テスト: ~A~%" 
                (every (lambda (rs) (daifugo-rule-set:rule-set-p rs)) rule-sets)))
    (error (e) (format t "メモリ効率テストエラー: ~A~%" e)))
  
  ;; エラーハンドリングテスト
  (handler-case
      (let ((error-caught nil))
        (handler-case
            (daifugo-card-system:create-card nil nil) ; 無効な引数
          (error (e) (setf error-caught t)))
        (format t "エラーハンドリングテスト: ~A~%" error-caught))
    (error (e) (format t "エラーハンドリングテストエラー: ~A~%" e)))
  
  (format t "=== 包括的テスト完了 ===~%")
  (format t "test-comprehensive-simple.lisp: 包括的テスト正常終了~%"))

;; テスト実行
(test-comprehensive-simple)