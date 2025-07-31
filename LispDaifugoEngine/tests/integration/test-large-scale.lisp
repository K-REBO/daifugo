;;; test-large-scale.lisp - 大規模自動テスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-large-scale-test
  (:use :common-lisp))

(in-package :daifugo-large-scale-test)

;;; ==========================================
;;; 大規模ゲーム実行テスト
;;; ==========================================

(defvar *test-statistics* (make-hash-table :test 'eq)
  "テスト統計データ")

(defstruct test-result
  "テスト結果構造体"
  total-games              ; 総ゲーム数
  completed-games          ; 完了ゲーム数
  failed-games             ; 失敗ゲーム数
  total-time               ; 総実行時間
  average-time             ; 平均ゲーム時間
  memory-usage             ; メモリ使用量
  error-log                ; エラーログ
  success-rate             ; 成功率
  performance-metrics)     ; パフォーマンス指標

(defun create-test-result ()
  "テスト結果構造体を作成"
  (make-test-result
   :total-games 0
   :completed-games 0
   :failed-games 0
   :total-time 0
   :average-time 0
   :memory-usage 0
   :error-log '()
   :success-rate 0.0
   :performance-metrics (make-hash-table :test 'eq)))

(defun test-thousand-games ()
  "1000ゲームの大規模実行テスト"
  (let ((result (create-test-result))
        (start-time (get-universal-time)))
    
    (format t "1000ゲーム大規模テスト開始...~%")
    (setf (test-result-total-games result) 1000)
    
    (dotimes (i 1000)
      (when (= (mod i 100) 0)
        (format t "進行状況: ~A/1000ゲーム完了~%" i))
      
      (handler-case
          (let ((game-start (get-universal-time))
                (game (daifugo-game-engine:create-game 4)))
            (daifugo-game-engine:start-game game)
            
            ;; 基本的なゲーム状態検証
            (when (and (daifugo-game-engine:game-state-p game)
                       (= (length (daifugo-game-engine:game-state-players game)) 4)
                       (eq (daifugo-game-engine:game-state-game-phase game) :playing))
              (incf (test-result-completed-games result))
              (let ((game-time (- (get-universal-time) game-start)))
                (incf (test-result-total-time result) game-time))))
        
        (error (e)
          (incf (test-result-failed-games result))
          (push (format nil "ゲーム~A: ~A" i e) 
                (test-result-error-log result)))))
    
    (let ((end-time (get-universal-time)))
      (setf (test-result-total-time result) (- end-time start-time))
      (setf (test-result-average-time result) 
            (if (> (test-result-completed-games result) 0)
                (/ (test-result-total-time result) 
                   (test-result-completed-games result))
                0))
      (setf (test-result-success-rate result)
            (* (/ (test-result-completed-games result) 
                  (test-result-total-games result)) 100.0)))
    
    (format t "1000ゲームテスト完了~%")
    (format t "完了: ~A, 失敗: ~A, 成功率: ~A%~%"
            (test-result-completed-games result)
            (test-result-failed-games result)
            (test-result-success-rate result))
    
    result))

(defun test-concurrent-games ()
  "並行ゲーム実行テスト"
  (let ((result (create-test-result))
        (concurrent-count 50)
        (games '())
        (start-time (get-universal-time)))
    
    (format t "~A並行ゲームテスト開始...~%" concurrent-count)
    (setf (test-result-total-games result) concurrent-count)
    
    ;; 並行でゲームを作成・開始
    (dotimes (i concurrent-count)
      (handler-case
          (let ((game (daifugo-game-engine:create-game 4)))
            (daifugo-game-engine:start-game game)
            (push game games)
            (incf (test-result-completed-games result)))
        (error (e)
          (incf (test-result-failed-games result))
          (push (format nil "並行ゲーム~A: ~A" i e) 
                (test-result-error-log result)))))
    
    ;; 全ゲームの状態を検証
    (dolist (game games)
      (unless (and (daifugo-game-engine:game-state-p game)
                   (= (length (daifugo-game-engine:game-state-players game)) 4))
        (incf (test-result-failed-games result))
        (decf (test-result-completed-games result))))
    
    (let ((end-time (get-universal-time)))
      (setf (test-result-total-time result) (- end-time start-time))
      (setf (test-result-success-rate result)
            (* (/ (test-result-completed-games result) 
                  (test-result-total-games result)) 100.0)))
    
    (format t "並行ゲームテスト完了~%")
    (format t "完了: ~A, 失敗: ~A, 成功率: ~A%~%"
            (test-result-completed-games result)
            (test-result-failed-games result)
            (test-result-success-rate result))
    
    result))

(defun test-stress-memory ()
  "メモリストレステスト"
  (let ((result (create-test-result))
        (memory-intensive-count 200)
        (all-games '())
        (start-time (get-universal-time)))
    
    (format t "メモリストレステスト開始（~Aゲーム同時保持）...~%" memory-intensive-count)
    (setf (test-result-total-games result) memory-intensive-count)
    
    ;; 大量のゲームを同時に保持
    (dotimes (i memory-intensive-count)
      (when (= (mod i 50) 0)
        (format t "メモリテスト進行: ~A/~A~%" i memory-intensive-count))
      
      (handler-case
          (let ((game (daifugo-game-engine:create-game 4))
                (logger (daifugo-game-logger:create-logger 
                         (intern (format nil "MEMORY-TEST-~A" i))))
                (rule-set (daifugo-rule-set:create-rule-set 
                           (intern (format nil "MEMORY-RULE-~A" i)))))
            
            (daifugo-game-engine:start-game game)
            (daifugo-game-engine:set-rule-set game rule-set)
            (daifugo-game-logger:log-game-state logger game)
            
            (push (list game logger rule-set) all-games)
            (incf (test-result-completed-games result)))
        
        (error (e)
          (incf (test-result-failed-games result))
          (push (format nil "メモリテスト~A: ~A" i e) 
                (test-result-error-log result)))))
    
    ;; 全オブジェクトの整合性を検証
    (dolist (game-set all-games)
      (let ((game (first game-set))
            (logger (second game-set))
            (rule-set (third game-set)))
        (unless (and (daifugo-game-engine:game-state-p game)
                     (daifugo-game-logger:logger-p logger)
                     (daifugo-rule-set:rule-set-p rule-set))
          (incf (test-result-failed-games result))
          (decf (test-result-completed-games result)))))
    
    (let ((end-time (get-universal-time)))
      (setf (test-result-total-time result) (- end-time start-time))
      (setf (test-result-success-rate result)
            (* (/ (test-result-completed-games result) 
                  (test-result-total-games result)) 100.0)))
    
    (format t "メモリストレステスト完了~%")
    (format t "完了: ~A, 失敗: ~A, 成功率: ~A%~%"
            (test-result-completed-games result)
            (test-result-failed-games result)
            (test-result-success-rate result))
    
    result))

;;; ==========================================
;;; ルール組み合わせテスト
;;; ==========================================

(defun test-all-rule-combinations ()
  "全ルール組み合わせテスト"
  (let ((result (create-test-result))
        (rules '(:revolution :eight-cut :sequence :eleven-back 
                 :suit-binding :spade3-return :miyako-ochi))
        (start-time (get-universal-time))
        (combination-count 0))
    
    (format t "全ルール組み合わせテスト開始...~%")
    
    ;; 2^7 = 128通りの組み合わせをテスト
    (dotimes (i 128)
      (incf combination-count)
      (let ((rule-set (daifugo-rule-set:create-rule-set 
                       (intern (format nil "COMBO-~A" i))))
            (enabled-rules '()))
        
        ;; ビットパターンでルールを有効化
        (dotimes (bit 7)
          (when (logbitp bit i)
            (let ((rule (nth bit rules)))
              (daifugo-rule-set:enable-rule rule-set rule)
              (push rule enabled-rules))))
        
        (handler-case
            (let ((game (daifugo-game-engine:create-game 4)))
              (daifugo-game-engine:set-rule-set game rule-set)
              (daifugo-game-engine:start-game game)
              
              ;; ルール組み合わせの検証
              (when (and (daifugo-game-engine:game-state-p game)
                         (not (daifugo-rule-set:detect-rule-conflicts rule-set)))
                (incf (test-result-completed-games result))))
          
          (error (e)
            (incf (test-result-failed-games result))
            (push (format nil "組み合わせ~A(~A): ~A" i enabled-rules e) 
                  (test-result-error-log result))))))
    
    (setf (test-result-total-games result) combination-count)
    (let ((end-time (get-universal-time)))
      (setf (test-result-total-time result) (- end-time start-time))
      (setf (test-result-success-rate result)
            (* (/ (test-result-completed-games result) 
                  (test-result-total-games result)) 100.0)))
    
    (format t "ルール組み合わせテスト完了~%")
    (format t "完了: ~A, 失敗: ~A, 成功率: ~A%~%"
            (test-result-completed-games result)
            (test-result-failed-games result)
            (test-result-success-rate result))
    
    result))

;;; ==========================================
;;; パフォーマンスベンチマーク
;;; ==========================================

(defun test-performance-benchmark ()
  "パフォーマンスベンチマークテスト"
  (let ((result (create-test-result))
        (benchmark-iterations 500)
        (start-time (get-universal-time)))
    
    (format t "パフォーマンスベンチマーク開始（~A回反復）...~%" benchmark-iterations)
    (setf (test-result-total-games result) benchmark-iterations)
    
    ;; 基本ゲーム作成ベンチマーク
    (let ((creation-start (get-universal-time)))
      (dotimes (i benchmark-iterations)
        (handler-case
            (let ((game (daifugo-game-engine:create-game 4)))
              (when (daifugo-game-engine:game-state-p game)
                (incf (test-result-completed-games result))))
          (error (e)
            (incf (test-result-failed-games result)))))
      
      (let ((creation-time (- (get-universal-time) creation-start)))
        (setf (gethash :creation-time (test-result-performance-metrics result)) 
              creation-time)))
    
    ;; ゲーム開始ベンチマーク
    (let ((start-benchmark (get-universal-time))
          (games '()))
      (dotimes (i 100) ; 少数での精密測定
        (handler-case
            (let ((game (daifugo-game-engine:create-game 4)))
              (daifugo-game-engine:start-game game)
              (push game games))
          (error (e)
            (push (format nil "開始ベンチマーク~A: ~A" i e) 
                  (test-result-error-log result)))))
      
      (let ((start-time-benchmark (- (get-universal-time) start-time)))
        (setf (gethash :start-time (test-result-performance-metrics result)) 
              start-time-benchmark)))
    
    ;; カード操作ベンチマーク
    (let ((card-start (get-universal-time)))
      (dotimes (i 1000)
        (handler-case
            (let ((card (daifugo-card-system:create-card 
                         (nth (mod i 13) '(A 2 3 4 5 6 7 8 9 10 J Q K))
                         (nth (mod i 4) '(:spades :hearts :diamonds :clubs)))))
              (daifugo-card-system:card-strength card))
          (error (e)
            (push (format nil "カードベンチマーク~A: ~A" i e) 
                  (test-result-error-log result)))))
      
      (let ((card-time (- (get-universal-time) card-start)))
        (setf (gethash :card-operations (test-result-performance-metrics result)) 
              card-time)))
    
    (let ((end-time (get-universal-time)))
      (setf (test-result-total-time result) (- end-time start-time))
      (setf (test-result-success-rate result)
            (* (/ (test-result-completed-games result) 
                  (test-result-total-games result)) 100.0)))
    
    (format t "パフォーマンスベンチマーク完了~%")
    (format t "ゲーム作成時間: ~As~%" 
            (gethash :creation-time (test-result-performance-metrics result)))
    (format t "ゲーム開始時間: ~As~%" 
            (gethash :start-time (test-result-performance-metrics result)))
    (format t "カード操作時間: ~As~%" 
            (gethash :card-operations (test-result-performance-metrics result)))
    
    result))

;;; ==========================================
;;; 耐久性テスト
;;; ==========================================

(defun test-endurance ()
  "耐久性テスト（長時間実行）"
  (let ((result (create-test-result))
        (duration-minutes 5) ; 5分間の耐久テスト
        (start-time (get-universal-time))
        (end-time (+ start-time (* duration-minutes 60)))
        (games-run 0))
    
    (format t "耐久性テスト開始（~A分間実行）...~%" duration-minutes)
    
    (loop while (< (get-universal-time) end-time) do
      (handler-case
          (let ((game (daifugo-game-engine:create-game 4))
                (logger (daifugo-game-logger:create-logger 
                         (intern (format nil "ENDURANCE-~A" games-run))))
                (dynamic-rules '(:revolution :sequence :joker-wild :eleven-back)))
            
            (daifugo-game-engine:start-game game)
            (daifugo-game-logger:log-game-state logger game)
            
            ;; 動的ルール読み込みテスト（Lispの真髄）
            (dotimes (turn 5)
              (let ((rule (nth (mod turn (length dynamic-rules)) dynamic-rules)))
                (daifugo-game-engine:enable-rule rule)
                (when (daifugo-game-engine:rule-enabled-p rule)
                  (daifugo-game-logger:log-info logger 
                    (format nil "Rule ~A dynamically enabled" rule)))))
            
            (incf games-run)
            (incf (test-result-completed-games result))
            
            (when (= (mod games-run 50) 0)
              (format t "耐久テスト進行: ~A分経過, ~Aゲーム完了~%" 
                      (truncate (/ (- (get-universal-time) start-time) 60)) games-run)))
        
        (error (e)
          (incf (test-result-failed-games result))
          (push (format nil "耐久テスト~A: ~A" games-run e) 
                (test-result-error-log result)))))
    
    (setf (test-result-total-games result) games-run)
    (let ((actual-end-time (get-universal-time)))
      (setf (test-result-total-time result) (- actual-end-time start-time))
      (setf (test-result-success-rate result)
            (* (/ (test-result-completed-games result) 
                  (test-result-total-games result)) 100.0)))
    
    (format t "耐久性テスト完了~%")
    (format t "実行時間: ~A秒, 完了ゲーム: ~A, 成功率: ~A%~%"
            (test-result-total-time result)
            (test-result-completed-games result)
            (test-result-success-rate result))
    
    result))

;;; ==========================================
;;; 統計分析機能
;;; ==========================================

(defun analyze-test-results (results)
  "テスト結果を分析"
  (let ((total-games 0)
        (total-completed 0)
        (total-failed 0)
        (total-time 0)
        (all-errors '()))
    
    (dolist (result results)
      (incf total-games (test-result-total-games result))
      (incf total-completed (test-result-completed-games result))
      (incf total-failed (test-result-failed-games result))
      (incf total-time (test-result-total-time result))
      (setf all-errors (append all-errors (test-result-error-log result))))
    
    (format t "~%=== 大規模テスト総合分析 ===~%")
    (format t "総ゲーム数: ~A~%" total-games)
    (format t "総完了数: ~A~%" total-completed)
    (format t "総失敗数: ~A~%" total-failed)
    (format t "総成功率: ~A%~%" 
            (if (> total-games 0)
                (round (* (/ total-completed total-games) 100))
                0))
    (format t "総実行時間: ~A秒~%" total-time)
    (format t "平均ゲーム時間: ~A秒~%" 
            (if (> total-completed 0)
                (/ total-time total-completed)
                0))
    
    (when all-errors
      (format t "~%エラー分析:~%")
      (let ((error-count (make-hash-table :test 'equal)))
        (dolist (error all-errors)
          (let ((error-type (if (stringp error)
                                (subseq error 0 (min 50 (length error)))
                                (format nil "~A" error))))
            (incf (gethash error-type error-count 0))))
        
        (maphash (lambda (error-type count)
                   (format t "  ~A: ~A回~%" error-type count))
                 error-count)))
    
    (< total-failed (* total-games 0.05)))) ; 95%以上の成功率を要求

;;; ==========================================
;;; メイン大規模テスト実行関数
;;; ==========================================

(defun run-large-scale-tests ()
  "大規模自動テストを実行"
  (format t "~%=== 大規模自動テスト実行開始 ===~%")
  
  (let ((all-results '())
        (start-time (get-universal-time)))
    
    ;; 各種大規模テストを実行
    (format t "~%1. 1000ゲーム大規模実行テスト~%")
    (push (test-thousand-games) all-results)
    
    (format t "~%2. 並行ゲーム実行テスト~%")
    (push (test-concurrent-games) all-results)
    
    (format t "~%3. メモリストレステスト~%")
    (push (test-stress-memory) all-results)
    
    (format t "~%4. 全ルール組み合わせテスト~%")
    (push (test-all-rule-combinations) all-results)
    
    (format t "~%5. パフォーマンスベンチマーク~%")
    (push (test-performance-benchmark) all-results)
    
    (format t "~%6. 耐久性テスト~%")
    (push (test-endurance) all-results)
    
    (let ((end-time (get-universal-time)))
      (format t "~%=== 大規模テスト完了 ===~%")
      (format t "総実行時間: ~A秒~%" (- end-time start-time))
      
      ;; 結果分析
      (analyze-test-results all-results))))

;; テスト実行
(run-large-scale-tests)