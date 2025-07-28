;;; run-load-all.lisp - load-all.lisp実行用スクリプト

;; LispDaifugoEngineディレクトリに移動してload-all.lispを実行
(let ((old-default *default-pathname-defaults*))
  (unwind-protect
    (progn
      (setf *default-pathname-defaults* 
            (make-pathname :directory (append (pathname-directory *default-pathname-defaults*)
                                              '("LispDaifugoEngine"))))
      (load "load-all.lisp"))
    (setf *default-pathname-defaults* old-default)))