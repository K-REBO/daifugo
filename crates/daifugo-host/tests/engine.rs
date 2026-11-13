//! engine/tests/*.scm を読み込んで実行する。

use daifugo_host::{Arg, Daifugo};
use std::path::PathBuf;

fn engine_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../engine")
}

pub fn run_scheme_tests(files: &[&str]) -> serde_json::Value {
    let mut d = Daifugo::new().expect("engine loads");
    for f in ["framework.scm"].iter().chain(files) {
        let path = engine_dir().join("tests").join(f);
        let src = std::fs::read_to_string(&path).unwrap();
        d.load_source(f, src).unwrap_or_else(|e| panic!("{e}"));
    }
    d.call_value("test-run", vec![]).unwrap()
}

fn assert_all_pass(files: &[&str]) {
    let r = run_scheme_tests(files);
    let failures = r["failures"].as_array().unwrap();
    for f in failures {
        let msg = f["message"].as_str().unwrap_or_default();
        let msg: String = msg.chars().take(400).collect();
        eprintln!("FAIL {}\n     {}", f["name"], msg);
    }
    eprintln!("{} / {} passed", r["passed"], r["total"]);
    assert!(failures.is_empty(), "{} scheme test(s) failed", failures.len());
    assert!(r["total"].as_i64().unwrap() > 0);
}

#[test]
fn core() {
    assert_all_pass(&["test-core.scm"]);
}

#[test]
fn game() {
    assert_all_pass(&["test-game.scm"]);
}

#[test]
fn rules() {
    assert_all_pass(&["test-rules.scm"]);
}

#[test]
fn ai_and_api() {
    assert_all_pass(&["test-ai.scm"]);
}

#[test]
fn engine_dir_matches_embedded() {
    // from_dir でも同じように動く
    let mut d = Daifugo::from_dir(engine_dir()).unwrap();
    let v = d.call_value("api-rules", vec![]).unwrap();
    assert_eq!(v["rules"].as_array().unwrap().len(), 7);
}

#[test]
fn host_api_roundtrip() {
    let mut d = Daifugo::new().unwrap();
    let view = d
        .call_value(
            "api-new-game",
            vec![
                Arg::Int(4),
                Arg::Int(1),
                vec!["all"].into(),
                Arg::List(vec![Arg::List(vec!["kaidan-revolution".into(), true.into()])]),
                Arg::List(vec![]),
                vec!["human", "smart", "random", "strong"].into(),
                Arg::Int(0),
            ],
        )
        .unwrap();
    assert_eq!(view["players"].as_array().unwrap().len(), 4);
    assert!(view["players"][0]["hand"].is_array());
    assert!(view["players"][1]["hand"].is_null(), "他人の手札は見えない");

    // 不正な操作は Err になる
    let id = view["id"].as_i64().unwrap();
    let err = d
        .call("api-play", vec![Arg::Int(id), Arg::Int(3), vec!["S3"].into()])
        .unwrap_err();
    assert!(err.0.starts_with("not your turn"), "前置きと空白が除かれる: {:?}", err.0);

    // JSON 引数版
    let v = d.call_json("api-view", &format!("[{id}]")).unwrap();
    assert!(v.contains("\"round\":1"));
    assert!(d.call_json("new-game", "[]").is_err(), "api- 以外は呼べない");
}
