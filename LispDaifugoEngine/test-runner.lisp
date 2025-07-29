#!/usr/bin/env sbcl --script

(load "tests/test-hand-validation-fixed.lisp")

(in-package :daifugo-hand-validation-test)

(run-hand-validation-tests)