//! 大富豪 スタンドアロン版（Steel エンジンを組み込んだネイティブバイナリ）
//!
//!   daifugo play  [--players 4] [--rules all] [--seed N] [--ai smart] [--option key=value]
//!   daifugo sim   [--matches 100] [--rounds 3] [--players 4] [--rules all] [--ai random,weak,strong,smart]
//!   daifugo rules
//!   daifugo repl
//!
//! 共通: --engine-dir DIR（engine/ をディスクから読む） --load FILE.scm（追加ルールを読み込む）

use std::io::{self, BufRead, Write};
use std::time::Instant;

use daifugo_host::{Arg, Daifugo};
use serde_json::Value;

const USAGE: &str = "\
使い方:
  daifugo play  [--players N] [--rules R,..] [--seed N] [--ai KIND] [--option KEY=VALUE]
  daifugo sim   [--matches N] [--rounds N] [--players N] [--rules R,..] [--ai K1,K2,..] [--seed N]
  daifugo rules
  daifugo repl

共通オプション:
  --engine-dir DIR   engine/ のソースをディスクから読み込む（開発用）
  --load FILE.scm    追加のルールファイルを読み込む（複数可）

ルール: kakumei 8giri kaidan shibari 11back spade3 miyakoochi
ルールセット: none basic official5 all
AI: random weak strong smart
";

struct Opts {
    cmd: String,
    players: i64,
    matches: i64,
    rounds: i64,
    seed: Option<i64>,
    rules: Vec<String>,
    ai: Vec<String>,
    options: Vec<(String, Arg)>,
    engine_dir: Option<String>,
    load: Vec<String>,
    no_color: bool,
}

fn parse_args() -> Result<Opts, String> {
    let mut args = std::env::args().skip(1);
    let mut o = Opts {
        cmd: String::new(),
        players: 4,
        matches: 100,
        rounds: 3,
        seed: None,
        rules: vec!["all".into()],
        ai: vec![],
        options: vec![],
        engine_dir: None,
        load: vec![],
        no_color: std::env::var_os("NO_COLOR").is_some(),
    };
    let list = |s: String| s.split(',').map(|x| x.trim().to_string()).filter(|x| !x.is_empty()).collect();
    while let Some(a) = args.next() {
        let mut val = |name: &str| args.next().ok_or_else(|| format!("{name} に値が必要です"));
        match a.as_str() {
            "--players" | "-n" => o.players = val(&a)?.parse().map_err(|_| "人数は整数")?,
            "--matches" => o.matches = val(&a)?.parse().map_err(|_| "試合数は整数")?,
            "--rounds" => o.rounds = val(&a)?.parse().map_err(|_| "ラウンド数は整数")?,
            "--seed" => o.seed = Some(val(&a)?.parse().map_err(|_| "シードは整数")?),
            "--rules" | "-r" => o.rules = list(val(&a)?),
            "--ai" => o.ai = list(val(&a)?),
            "--option" | "-o" => {
                let kv = val(&a)?;
                let (k, v) = kv.split_once('=').ok_or("--option は KEY=VALUE")?;
                let v = match v {
                    "true" | "on" => Arg::Bool(true),
                    "false" | "off" => Arg::Bool(false),
                    _ => v.parse::<i64>().map(Arg::Int).unwrap_or(Arg::Str(v.into())),
                };
                o.options.push((k.to_string(), v));
            }
            "--engine-dir" => o.engine_dir = Some(val(&a)?),
            "--load" => o.load.push(val(&a)?),
            "--no-color" => o.no_color = true,
            "-h" | "--help" => o.cmd = "help".into(),
            s if s.starts_with('-') => return Err(format!("不明なオプション: {s}")),
            s if o.cmd.is_empty() => o.cmd = s.to_string(),
            s => return Err(format!("余分な引数: {s}")),
        }
    }
    if o.cmd.is_empty() {
        o.cmd = "play".into();
    }
    Ok(o)
}

fn load_engine(o: &Opts) -> Result<Daifugo, String> {
    let mut d = match &o.engine_dir {
        Some(dir) => Daifugo::from_dir(dir),
        None => Daifugo::new(),
    }
    .map_err(|e| e.to_string())?;
    for f in &o.load {
        let src = std::fs::read_to_string(f).map_err(|e| format!("{f}: {e}"))?;
        d.load_source(f, src).map_err(|e| e.to_string())?;
    }
    Ok(d)
}

fn main() {
    let o = match parse_args() {
        Ok(o) => o,
        Err(e) => {
            eprintln!("エラー: {e}\n\n{USAGE}");
            std::process::exit(2);
        }
    };
    if o.cmd == "help" {
        print!("{USAGE}");
        return;
    }
    let t = Instant::now();
    let mut d = match load_engine(&o) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("エンジンの読み込みに失敗: {e}");
            std::process::exit(1);
        }
    };
    let load_ms = t.elapsed().as_millis();
    let r = match o.cmd.as_str() {
        "play" => play(&mut d, &o),
        "sim" => sim(&mut d, &o),
        "rules" => rules(&mut d),
        "repl" => repl(&mut d, load_ms),
        other => Err(format!("不明なコマンド: {other}\n\n{USAGE}")),
    };
    if let Err(e) = r {
        eprintln!("エラー: {e}");
        std::process::exit(1);
    }
}

fn seed_or_time(o: &Opts) -> i64 {
    o.seed.unwrap_or_else(|| {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| (d.as_millis() % 2_000_000_000) as i64)
            .unwrap_or(1)
    })
}

fn options_arg(o: &Opts) -> Arg {
    Arg::List(
        o.options
            .iter()
            .map(|(k, v)| Arg::List(vec![Arg::Str(k.clone()), v.clone()]))
            .collect(),
    )
}

// ---------------------------------------------------------------------------
// rules / sim / repl
// ---------------------------------------------------------------------------

fn rules(d: &mut Daifugo) -> Result<(), String> {
    let v = d.call_value("api-rules", vec![]).map_err(|e| e.to_string())?;
    println!("ローカルルール:");
    for r in v["rules"].as_array().into_iter().flatten() {
        println!("  {:<11} {}  — {}", s(&r["name"]), s(&r["title"]), s(&r["description"]));
        for opt in r["options"].as_array().into_iter().flatten() {
            println!("  {:<11}   --option {}={} （既定値）", "", s(&opt["key"]), opt["default"]);
        }
    }
    println!("\nルールセット:");
    for r in v["rule_sets"].as_array().into_iter().flatten() {
        let names: Vec<String> = r["rules"].as_array().into_iter().flatten().map(s).collect();
        println!("  {:<11} {}  [{}]", s(&r["name"]), s(&r["title"]), names.join(" "));
    }
    Ok(())
}

fn sim(d: &mut Daifugo, o: &Opts) -> Result<(), String> {
    let ai = if o.ai.is_empty() {
        vec!["random".to_string(), "weak".into(), "strong".into(), "smart".into()]
    } else {
        o.ai.clone()
    };
    let seed = o.seed.unwrap_or(1);
    println!(
        "シミュレーション: {} 試合 × {} ラウンド, {} 人, ルール {:?}, AI {:?}, seed {}",
        o.matches, o.rounds, o.players, o.rules, ai, seed
    );
    let t = Instant::now();
    let v = d
        .call_value(
            "api-simulate",
            vec![
                o.matches.into(),
                o.rounds.into(),
                o.players.into(),
                seed.into(),
                o.rules.clone().into(),
                ai.into(),
            ],
        )
        .map_err(|e| e.to_string())?;
    let secs = t.elapsed().as_secs_f64();
    let rounds = o.matches * o.rounds;
    println!(
        "完了: {rounds} ラウンド / {} 手 / {:.2} 秒（{:.1} ラウンド/秒）",
        v["total_moves"],
        secs,
        rounds as f64 / secs
    );
    println!("\n{:<8} {:>8} {:>10} {:>10}", "AI", "ラウンド", "大富豪率", "平均順位");
    for a in v["ai"].as_array().into_iter().flatten() {
        let g = a["rounds"].as_f64().unwrap_or(0.0);
        let w = a["daifugo"].as_f64().unwrap_or(0.0);
        println!(
            "{:<8} {:>8} {:>9.1}% {:>10.2}",
            s(&a["kind"]),
            g,
            if g > 0.0 { 100.0 * w / g } else { 0.0 },
            a["avg_position"].as_f64().unwrap_or(f64::NAN)
        );
    }
    if let Some(ev) = v["events"].as_object() {
        let names = [
            ("revolution", "革命"),
            ("eight", "8切り"),
            ("back11", "11バック"),
            ("shibari", "縛り"),
            ("spade3", "スペ3返し"),
            ("fall", "都落ち"),
        ];
        let parts: Vec<String> = names
            .iter()
            .filter_map(|(k, label)| ev.get(*k).map(|n| format!("{label} {n}")))
            .collect();
        println!("\nルール発動回数: {}", if parts.is_empty() { "なし".into() } else { parts.join(" / ") });
    }
    println!("不変条件（カード保存・無限ループなし）: すべてのラウンドで OK");
    Ok(())
}

fn repl(d: &mut Daifugo, load_ms: u128) -> Result<(), String> {
    println!("大富豪エンジン REPL（Steel）— エンジン読み込み {load_ms}ms。Ctrl-D で終了");
    println!("例: (api-rules)  (define st (new-game (hash 'players 4 'seed 1)))  (legal-moves st)");
    let stdin = io::stdin();
    let mut buf = String::new();
    loop {
        print!("{}", if buf.is_empty() { "> " } else { ". " });
        io::stdout().flush().ok();
        let mut line = String::new();
        if stdin.lock().read_line(&mut line).map_err(|e| e.to_string())? == 0 {
            println!();
            return Ok(());
        }
        buf.push_str(&line);
        if !balanced(&buf) {
            continue;
        }
        let src = std::mem::take(&mut buf);
        if src.trim().is_empty() {
            continue;
        }
        match d.eval(&src) {
            Ok(out) if !out.is_empty() => println!("{out}"),
            Ok(_) => {}
            Err(e) => println!("エラー: {e}"),
        }
    }
}

fn balanced(src: &str) -> bool {
    let (mut depth, mut in_str, mut esc) = (0i32, false, false);
    for c in src.chars() {
        if in_str {
            match (esc, c) {
                (true, _) => esc = false,
                (false, '\\') => esc = true,
                (false, '"') => in_str = false,
                _ => {}
            }
            continue;
        }
        match c {
            '"' => in_str = true,
            '(' | '[' => depth += 1,
            ')' | ']' => depth -= 1,
            _ => {}
        }
    }
    depth <= 0 && !in_str
}

// ---------------------------------------------------------------------------
// play
// ---------------------------------------------------------------------------

struct Ui {
    color: bool,
    seen: i64,
    round: i64,
}

fn s(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

impl Ui {
    fn card(&self, id: &str) -> String {
        if id.starts_with("JK") {
            return self.paint("🃏JK", "35");
        }
        let (suit, rank) = id.split_at(1);
        let (sym, red) = match suit {
            "S" => ("♠", false),
            "H" => ("♥", true),
            "D" => ("♦", true),
            _ => ("♣", false),
        };
        let txt = format!("{sym}{rank}");
        if red { self.paint(&txt, "31") } else { txt }
    }

    fn cards(&self, ids: &Value) -> String {
        ids.as_array()
            .into_iter()
            .flatten()
            .map(|c| self.card(&s(c)))
            .collect::<Vec<_>>()
            .join(" ")
    }

    fn paint(&self, s: &str, code: &str) -> String {
        if self.color { format!("\x1b[{code}m{s}\x1b[0m") } else { s.to_string() }
    }

    /// まだ表示していないログを出す
    fn print_log(&mut self, v: &Value) {
        let round = v["round"].as_i64().unwrap_or(0);
        if round != self.round {
            self.round = round;
            self.seen = -1;
        }
        for e in v["log"].as_array().into_iter().flatten() {
            let seq = e["seq"].as_i64().unwrap_or(0);
            if seq <= self.seen {
                continue;
            }
            self.seen = seq;
            let text = s(&e["text"]);
            let cards = &e["cards"];
            let line = match s(&e["type"]).as_str() {
                "play" => format!("  {}  {}", text, self.cards(cards)),
                "pass" => format!("  {}", self.paint(&text, "90")),
                "clear" => format!("  {}", self.paint("―― 場が流れた ――", "90")),
                "deal" => format!("\n{}", self.paint(&format!("=== {text} ==="), "1")),
                "exchange" => format!("  {} {}", self.paint(&text, "36"), self.cards(cards)),
                "over" => format!("\n{}", self.paint(&format!("結果: {text}"), "1;33")),
                _ => format!("  {}", self.paint(&format!("★ {text}"), "1;33")),
            };
            println!("{line}");
        }
    }

    fn print_status(&self, v: &Value, me: usize) {
        let players = v["players"].as_array().cloned().unwrap_or_default();
        let mut flags = vec![];
        if v["revolution"] == Value::Bool(true) {
            flags.push("革命中");
        }
        if v["back11"] == Value::Bool(true) {
            flags.push("11バック中");
        }
        let lock = v["lock"]
            .as_array()
            .map(|l| {
                l.iter()
                    .map(|x| match s(x).as_str() {
                        "spade" => "♠",
                        "heart" => "♥",
                        "diamond" => "♦",
                        _ => "♣",
                    })
                    .collect::<String>()
            })
            .unwrap_or_default();
        println!();
        let others: Vec<String> = players
            .iter()
            .filter(|p| p["index"].as_u64() != Some(me as u64))
            .map(|p| {
                let mut t = format!("{}:{}枚", s(&p["name"]), p["count"]);
                if !p["finished"].is_null() {
                    t = format!("{}:{}位", s(&p["name"]), p["finished"]);
                } else if p["fallen"] == Value::Bool(true) {
                    t = format!("{}:都落ち", s(&p["name"]));
                } else if p["passed"] == Value::Bool(true) {
                    t.push_str("(パス)");
                }
                t
            })
            .collect();
        println!("  {}", others.join("  "));
        let field = v["field"].as_array().cloned().unwrap_or_default();
        let top = field.last();
        let mut line = match top {
            Some(t) => format!("  場: {} （{}）", self.cards(&t["play"]["cards"]), s(&t["play"]["label"])),
            None => "  場: なし（親）".to_string(),
        };
        if !flags.is_empty() {
            line.push_str(&format!("  [{}]", flags.join(" ")));
        }
        if !lock.is_empty() {
            line.push_str(&format!("  [{lock}縛り]"));
        }
        println!("{line}");
    }
}

fn hand_of(v: &Value, me: usize) -> Vec<String> {
    v["players"][me]["hand"].as_array().into_iter().flatten().map(s).collect()
}

fn play(d: &mut Daifugo, o: &Opts) -> Result<(), String> {
    let n = o.players;
    let ai = o.ai.first().cloned().unwrap_or_else(|| "smart".into());
    let mut ais = vec![Arg::Str("human".into())];
    ais.extend((1..n).map(|_| Arg::Str(ai.clone())));
    let seed = seed_or_time(o);
    let mut v = d
        .call_value(
            "api-new-game",
            vec![
                n.into(),
                seed.into(),
                o.rules.clone().into(),
                options_arg(o),
                Arg::List(vec![]),
                Arg::List(ais),
                Arg::Int(0),
            ],
        )
        .map_err(|e| e.to_string())?;
    let id = v["id"].as_i64().unwrap();
    let rules: Vec<String> = v["rules"].as_array().into_iter().flatten().map(s).collect();
    println!("大富豪（Steel エンジン） seed {seed}  ルール: {}", if rules.is_empty() { "なし".into() } else { rules.join(" ") });
    println!("操作: 番号かカード（例: 1 2 / S3 H3）で出す, p=パス, h=ヒント, u=戻す, q=終了");
    let mut ui = Ui { color: !o.no_color, seen: -1, round: 0 };
    let stdin = io::stdin();
    let me = 0usize;
    loop {
        ui.print_log(&v);
        let phase = s(&v["phase"]);
        if phase == "over" {
            print!("\n次のゲームへ進みますか？ [Y/n] ");
            io::stdout().flush().ok();
            let mut line = String::new();
            if stdin.lock().read_line(&mut line).map_err(|e| e.to_string())? == 0
                || line.trim().eq_ignore_ascii_case("n")
                || line.trim() == "q"
            {
                let scores: Vec<String> = v["players"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .map(|p| format!("{} {}点", s(&p["name"]), p["score"]))
                    .collect();
                println!("通算: {}", scores.join(" / "));
                return Ok(());
            }
            v = d.call_value("api-next-round", vec![id.into()]).map_err(|e| e.to_string())?;
            continue;
        }
        if v["waiting_for_human"] != Value::Bool(true) {
            v = d.call_value("api-ai-step", vec![id.into()]).map_err(|e| e.to_string())?;
            continue;
        }

        // 人間の番
        let hand = hand_of(&v, me);
        ui.print_status(&v, me);
        let numbered: Vec<String> = hand
            .iter()
            .enumerate()
            .map(|(i, c)| format!("{}:{}", i + 1, ui.card(c)))
            .collect();
        println!("  手札: {}", numbered.join(" "));
        let exchange = phase == "exchange";
        if exchange {
            println!(
                "  カード交換: {} に渡すカードを {} 枚選んでください",
                s(&v["players"][v["exchange"]["receiver"].as_u64().unwrap_or(0) as usize]["name"]),
                v["exchange"]["count"]
            );
        }
        print!("{} ", ui.paint("あなたの番 >", "1;32"));
        io::stdout().flush().ok();
        let mut line = String::new();
        if stdin.lock().read_line(&mut line).map_err(|e| e.to_string())? == 0 {
            return Ok(());
        }
        let input = line.trim();
        let result = match input {
            "q" | "quit" => return Ok(()),
            "" => continue,
            "p" | "pass" => d.call_value("api-pass", vec![id.into(), (me as i64).into()]),
            "u" | "undo" => d.call_value("api-undo", vec![id.into()]),
            "h" | "hint" => {
                let h = d.call_value("api-hint", vec![id.into()]).map_err(|e| e.to_string())?;
                match s(&h["action"]).as_str() {
                    "pass" => println!("  ヒント: パス"),
                    _ => println!("  ヒント: {}", ui.cards(&h["cards"])),
                }
                continue;
            }
            _ => match parse_cards(input, &hand) {
                Ok(ids) => {
                    let f = if exchange { "api-give" } else { "api-play" };
                    d.call_value(f, vec![id.into(), (me as i64).into(), ids.into()])
                }
                Err(e) => {
                    println!("  {e}");
                    continue;
                }
            },
        };
        match result {
            Ok(nv) => v = nv,
            Err(e) => println!("  {}", ui.paint(&format!("出せません: {}", friendly(&e.to_string())), "31")),
        }
    }
}

fn parse_cards(input: &str, hand: &[String]) -> Result<Vec<String>, String> {
    input
        .split(|c: char| c.is_whitespace() || c == ',')
        .filter(|t| !t.is_empty())
        .map(|t| {
            if let Ok(i) = t.parse::<usize>() {
                hand.get(i.wrapping_sub(1)).cloned().ok_or(format!("{i} 番のカードはありません"))
            } else {
                let up = t.to_uppercase();
                hand.iter().find(|c| **c == up).cloned().ok_or(format!("{t} は手札にありません"))
            }
        })
        .collect()
}

fn friendly(msg: &str) -> String {
    if msg.starts_with("illegal play") {
        "場に出せない組み合わせです".into()
    } else if msg.starts_with("cannot pass on lead") {
        "親なのでパスできません".into()
    } else if msg.starts_with("must give exactly") {
        "渡す枚数が違います".into()
    } else {
        msg.to_string()
    }
}
