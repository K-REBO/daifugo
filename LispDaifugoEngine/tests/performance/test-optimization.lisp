;;; test-optimization.lisp - 性能最適化テスト

(load "../debug/final-test.lisp")

(defpackage :daifugo-optimization-test
  (:use :common-lisp))

(in-package :daifugo-optimization-test)

;;; ==========================================
;;; パフォーマンス測定ユーティリティ
;;; ==========================================

(defstruct performance-metric
  "パフォーマンス測定結果"
  operation-name          ; 操作名
  iterations             ; 反復回数
  total-time             ; 総実行時間
  average-time           ; 平均実行時間
  min-time               ; 最小実行時間
  max-time               ; 最大実行時間
  memory-before          ; 実行前メモリ使用量
  memory-after           ; 実行後メモリ使用量
  success-count          ; 成功回数
  failure-count)         ; 失敗回数

(defun measure-performance (operation-name function iterations)
  "パフォーマンスを測定"
  (let ((metric (make-performance-metric
                 :operation-name operation-name
                 :iterations iterations
                 :total-time 0
                 :average-time 0
                 :min-time most-positive-fixnum
                 :max-time 0
                 :memory-before 0
                 :memory-after 0
                 :success-count 0
                 :failure-count 0)))
    
    #+sbcl (sb-ext:gc) ; ガベージコレクション実行
    #-sbcl nil
    (setf (performance-metric-memory-before metric) 
          (handler-case
              #+sbcl (sb-ext:get-bytes-consed)
              #-sbcl 0
            (error () 0)))
    
    (let ((start-time (get-universal-time)))
      (dotimes (i iterations)
        (let ((iteration-start (get-universal-time)))
          (handler-case
              (progn
                (funcall function)
                (let ((iteration-time (- (get-universal-time) iteration-start)))
                  (incf (performance-metric-success-count metric))
                  (incf (performance-metric-total-time metric) iteration-time)
                  (setf (performance-metric-min-time metric)
                        (min (performance-metric-min-time metric) iteration-time))
                  (setf (performance-metric-max-time metric)
                        (max (performance-metric-max-time metric) iteration-time))))
            (error (e)
              (incf (performance-metric-failure-count metric))))))
      
      (setf (performance-metric-average-time metric)
            (if (> (performance-metric-success-count metric) 0)
                (/ (performance-metric-total-time metric) 
                   (performance-metric-success-count metric))
                0)))
    
    (setf (performance-metric-memory-after metric) 
          (handler-case
              #+sbcl (sb-ext:get-bytes-consed)
              #-sbcl 0
            (error () 0)))
    
    metric))

;;; ==========================================
;;; 基本操作性能テスト
;;; ==========================================

(defun test-card-creation-performance ()
  "カード作成パフォーマンステスト"
  (measure-performance 
   "カード作成"
   (lambda ()
     (daifugo-card-system:create-card 
      (nth (random 13) '(A 2 3 4 5 6 7 8 9 10 J Q K))
      (nth (random 4) '(:spades :hearts :diamonds :clubs))))
   10000))

(defun test-deck-creation-performance ()
  "デッキ作成パフォーマンステスト"
  (measure-performance 
   "デッキ作成"
   (lambda ()
     (daifugo-card-system:create-deck))
   1000))

(defun test-game-creation-performance ()
  "ゲーム作成パフォーマンステスト"
  (measure-performance 
   "ゲーム作成"
   (lambda ()
     (daifugo-game-engine:create-game 4))
   1000))

(defun test-game-start-performance ()
  "ゲーム開始パフォーマンステスト"
  (measure-performance 
   "ゲーム開始"
   (lambda ()
     (let ((game (daifugo-game-engine:create-game 4)))
       (daifugo-game-engine:start-game game)))
   500))

;;; ==========================================
;;; ルールシステム性能テスト
;;; ==========================================

(defun test-rule-set-creation-performance ()
  "ルールセット作成パフォーマンステスト"
  (measure-performance 
   "ルールセット作成"
   (lambda ()
     (daifugo-rule-set:create-rule-set 
      (intern (format nil "PERF-TEST-~A" (random 10000)))))
   1000))

(defun test-rule-enablement-performance ()
  "ルール有効化パフォーマンステスト"
  (let ((rule-set (daifugo-rule-set:create-rule-set :perf-test)))
    (measure-performance 
     "ルール有効化"
     (lambda ()
       (daifugo-rule-set:enable-rule rule-set 
         (nth (random 7) '(:revolution :eight-cut :sequence :eleven-back 
                          :suit-binding :spade3-return :miyako-ochi))))
     5000)))

(defun test-revolution-detection-performance ()
  "革命検出パフォーマンステスト"
  (let ((kakumei-system (daifugo-kakumei:create-kakumei-system)))
    (measure-performance 
     "革命検出"
     (lambda ()
       (let ((cards (list (daifugo-card-system:create-card 7 :spades)
                          (daifugo-card-system:create-card 7 :hearts)
                          (daifugo-card-system:create-card 7 :diamonds)
                          (daifugo-card-system:create-card 7 :clubs))))
         (daifugo-kakumei:detect-kakumei-trigger kakumei-system cards)))
     2000)))

(defun test-sequence-detection-performance ()
  "階段検出パフォーマンステスト"
  (let ((kaidan-system (daifugo-kaidan:create-kaidan-system)))
    (measure-performance 
     "階段検出"
     (lambda ()
       (let ((sequence (list (daifugo-card-system:create-card 3 :spades)
                             (daifugo-card-system:create-card 4 :hearts)
                             (daifugo-card-system:create-card 5 :diamonds))))
         (daifugo-kaidan:is-valid-kaidan-p kaidan-system sequence)))
     2000)))

;;; ==========================================
;;; AIシステム性能テスト
;;; ==========================================

(defun test-dynamic-script-loading-performance ()
  "動的スクリプト読み込みパフォーマンステスト（Lispの真髄）"
  (measure-performance 
   "動的ルールスクリプト読み込み"
   (lambda ()
     ;; Lispの動的性を活かしたテスト
     (daifugo-game-engine:enable-rule :test-rule)
     (daifugo-game-engine:disable-rule :test-rule))
   500))

(defun test-rule-evaluation-performance ()
  "ルール評価パフォーマンステスト（動的ルールシステム）"
  (let ((test-rules '(:revolution :sequence :eleven-back :joker-wild)))
    (measure-performance 
     "動的ルール評価"
     (lambda ()
       (dolist (rule test-rules)
         (daifugo-game-engine:enable-rule rule)
         (daifugo-game-engine:rule-enabled-p rule)))
     1000)))

;;; ==========================================
;;; ログシステム性能テスト
;;; ==========================================

(defun test-logging-performance ()
  "ログ記録パフォーマンステスト"
  (let ((logger (daifugo-game-logger:create-logger :perf-test)))
    (measure-performance 
     "ログ記録"
     (lambda ()
       (daifugo-game-logger:log-info logger 
         (format nil "パフォーマンステストログ ~A" (random 10000))))
     5000)))

(defun test-log-filtering-performance ()
  "ログフィルタリングパフォーマンステスト"
  (let ((logger (daifugo-game-logger:create-logger :filter-perf-test)))
    ;; 大量のログを事前作成
    (dotimes (i 1000)
      (daifugo-game-logger:log-info logger (format nil "情報ログ~A" i))
      (daifugo-game-logger:log-warn logger (format nil "警告ログ~A" i))
      (daifugo-game-logger:log-error logger (format nil "エラーログ~A" i)))
    
    (measure-performance 
     "ログフィルタリング"
     (lambda ()
       (daifugo-game-logger:filter-logs logger :level :error))
     500)))

;;; ==========================================
;;; JavaScript API性能テスト
;;; ==========================================

(defun test-dynamic-rule-application-performance ()
  "動的ルール適用パフォーマンステスト（Lispの真髄）"
  (let ((rules '(:revolution :sequence :joker-wild :eleven-back :eight-cut)))
    (measure-performance 
     "動的ルール適用"
     (lambda ()
       (dolist (rule rules)
         (daifugo-game-engine:enable-rule rule)
         (daifugo-game-engine:rule-enabled-p rule)
         (daifugo-game-engine:disable-rule rule)))
     200)))

(defun test-dynamic-script-loading-integration-performance ()
  "動的スクリプト読み込み統合パフォーマンステスト（Lispの真髄）"
  (measure-performance 
   "動的ルール状態管理"
   (lambda ()
     ;; Lispの動的性を活かしたハッシュテーブル操作
     (let ((test-rules '(:test-rule-1 :test-rule-2 :test-rule-3)))
       (dolist (rule test-rules)
         (daifugo-game-engine:enable-rule rule))
       (every #'daifugo-game-engine:rule-enabled-p test-rules)))
   2000))

;;; ==========================================
;;; メモリ使用量最適化テスト
;;; ==========================================

(defun test-memory-efficiency ()
  "メモリ効率テスト"
  (let ((initial-memory #+sbcl (sb-ext:get-bytes-consed) #-sbcl 0)
        (objects '()))
    
    ;; 大量オブジェクト作成
    (dotimes (i 1000)
      (push (daifugo-game-engine:create-game 4) objects)
      (push (daifugo-game-logger:create-logger 
             (intern (format nil "MEM-TEST-~A" i))) objects)
      (push (daifugo-rule-set:create-rule-set 
             (intern (format nil "MEM-RULE-~A" i))) objects))
    
    (let ((after-creation #+sbcl (sb-ext:get-bytes-consed) #-sbcl 0))
      (gc) ; ガベージコレクション
      (setf objects nil) ; 参照を削除
      (gc) ; 再度ガベージコレクション
      (let ((after-gc #+sbcl (sb-ext:get-bytes-consed) #-sbcl 0))
        
        (format t "メモリ使用量テスト:~%")
        (format t "  初期: ~A bytes~%" initial-memory)
        (format t "  作成後: ~A bytes~%" after-creation)
        (format t "  GC後: ~A bytes~%" after-gc)
        (format t "  増加量: ~A bytes~%" (- after-creation initial-memory))
        (format t "  回収量: ~A bytes~%" (- after-creation after-gc))
        
        ;; メモリリークがないことを確認
        (< (- after-gc initial-memory) (* 1024 1024)))))) ; 1MB以下の増加

;;; ==========================================
;;; 最適化提案生成
;;; ==========================================

(defun analyze-performance-bottlenecks (metrics)
  "パフォーマンスボトルネックを分析"
  (let ((bottlenecks '())
        (recommendations '()))
    
    (dolist (metric metrics)
      (let ((avg-time (performance-metric-average-time metric))
            (operation (performance-metric-operation-name metric)))
        
        ;; 閾値チェック
        (cond
          ((> avg-time 0.1) ; 100ms以上
           (push operation bottlenecks)
           (push (format nil "~A: 処理時間が長い（~As）" operation avg-time) 
                 recommendations))
          
          ((< (/ (performance-metric-success-count metric) 
                 (performance-metric-iterations metric)) 0.95) ; 95%未満の成功率
           (push operation bottlenecks)
           (push (format nil "~A: 信頼性が低い（成功率~A%）" 
                         operation 
                         (round (* (/ (performance-metric-success-count metric) 
                                      (performance-metric-iterations metric)) 100)))
                 recommendations)))))
    
    (format t "~%=== パフォーマンス分析 ===~%")
    (if bottlenecks
        (progn
          (format t "ボトルネック検出: ~A~%" bottlenecks)
          (format t "~%改善提案:~%")
          (dolist (rec recommendations)
            (format t "  - ~A~%" rec)))
        (format t "パフォーマンス問題は検出されませんでした~%"))
    
    (null bottlenecks)))

;;; ==========================================
;;; 最適化実装テスト
;;; ==========================================

(defun test-optimization-implementations ()
  "最適化実装テスト"
  (let ((optimization-results '()))
    
    ;; カード比較最適化テスト
    (let ((before-metric (measure-performance 
                          "カード比較（最適化前）"
                          (lambda ()
                            (let ((card1 (daifugo-card-system:create-card 'A :spades))
                                  (card2 (daifugo-card-system:create-card 'K :hearts)))
                              (daifugo-card-system:compare-cards card1 card2)))
                          1000)))
      (push before-metric optimization-results))
    
    ;; ハッシュテーブル最適化テスト
    (let ((hash-metric (measure-performance 
                        "ハッシュテーブル操作"
                        (lambda ()
                          (let ((table (make-hash-table :test 'eq)))
                            (dotimes (i 100)
                              (setf (gethash i table) (* i i)))
                            (gethash 50 table)))
                        1000)))
      (push hash-metric optimization-results))
    
    ;; リスト操作最適化テスト
    (let ((list-metric (measure-performance 
                        "リスト操作最適化"
                        (lambda ()
                          (let ((list (loop for i from 1 to 100 collect i)))
                            (remove-if #'evenp list)))
                        1000)))
      (push list-metric optimization-results))
    
    optimization-results))

;;; ==========================================
;;; 総合性能テスト実行関数
;;; ==========================================

(defun run-optimization-tests ()
  "性能最適化テストを実行"
  (format t "~%=== 性能最適化テスト実行開始 ===~%")
  
  (let ((all-metrics '())
        (start-time (get-universal-time)))
    
    ;; 基本操作性能テスト
    (format t "~%1. 基本操作性能テスト~%")
    (push (test-card-creation-performance) all-metrics)
    (push (test-deck-creation-performance) all-metrics)
    (push (test-game-creation-performance) all-metrics)
    (push (test-game-start-performance) all-metrics)
    
    ;; ルールシステム性能テスト
    (format t "~%2. ルールシステム性能テスト~%")
    (push (test-rule-set-creation-performance) all-metrics)
    (push (test-rule-enablement-performance) all-metrics)
    (push (test-revolution-detection-performance) all-metrics)
    (push (test-sequence-detection-performance) all-metrics)
    
    ;; AIシステム性能テスト
    (format t "~%3. AIシステム性能テスト~%")
    (push (test-ai-decision-performance) all-metrics)
    (push (test-ai-strategy-performance) all-metrics)
    
    ;; ログシステム性能テスト
    (format t "~%4. ログシステム性能テスト~%")
    (push (test-logging-performance) all-metrics)
    (push (test-log-filtering-performance) all-metrics)
    
    ;; JavaScript API性能テスト
    (format t "~%5. JavaScript API性能テスト~%")
    (push (test-json-conversion-performance) all-metrics)
    (push (test-api-response-performance) all-metrics)
    
    ;; メモリ効率テスト
    (format t "~%6. メモリ効率テスト~%")
    (test-memory-efficiency)
    
    ;; 最適化実装テスト
    (format t "~%7. 最適化実装テスト~%")
    (let ((opt-metrics (test-optimization-implementations)))
      (setf all-metrics (append all-metrics opt-metrics)))
    
    (let ((end-time (get-universal-time)))
      (format t "~%=== 性能最適化テスト完了 ===~%")
      (format t "総実行時間: ~A秒~%" (- end-time start-time))
      
      ;; 詳細結果表示
      (format t "~%=== 詳細パフォーマンス結果 ===~%")
      (dolist (metric all-metrics)
        (format t "~A:~%" (performance-metric-operation-name metric))
        (format t "  平均時間: ~As~%" (performance-metric-average-time metric))
        (format t "  成功率: ~A%~%" 
                (round (* (/ (performance-metric-success-count metric) 
                             (performance-metric-iterations metric)) 100)))
        (format t "  メモリ使用: ~A bytes~%" 
                (- (performance-metric-memory-after metric)
                   (performance-metric-memory-before metric))))
      
      ;; ボトルネック分析
      (analyze-performance-bottlenecks all-metrics))))

;; テスト実行
(run-optimization-tests)