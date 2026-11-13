//! Steel で書かれた大富豪エンジン（`engine/*.scm`）を読み込み、呼び出すための薄い層。
//!
//! CLI（ネイティブ）と wasm の両方から使う。Scheme 側の API は引数に整数・文字列・
//! リストだけを取り、戻り値は JSON 文字列なので、Steel の内部型に依存しない。

use std::borrow::Cow;
use std::fmt;
use std::path::Path;

use steel::rvals::SteelVal;
use steel::steel_vm::engine::Engine;

/// 読み込み順に並べたエンジンのソース。後のファイルは前のファイルの定義を使う。
pub const ENGINE_FILES: &[(&str, &str)] = &[
    ("prelude.scm", include_str!("../../../engine/prelude.scm")),
    ("cards.scm", include_str!("../../../engine/cards.scm")),
    ("hands.scm", include_str!("../../../engine/hands.scm")),
    ("rules.scm", include_str!("../../../engine/rules.scm")),
    ("game.scm", include_str!("../../../engine/game.scm")),
    ("ai.scm", include_str!("../../../engine/ai.scm")),
    ("api.scm", include_str!("../../../engine/api.scm")),
    ("rules/kakumei.scm", include_str!("../../../engine/rules/kakumei.scm")),
    ("rules/8giri.scm", include_str!("../../../engine/rules/8giri.scm")),
    ("rules/11back.scm", include_str!("../../../engine/rules/11back.scm")),
    ("rules/kaidan.scm", include_str!("../../../engine/rules/kaidan.scm")),
    ("rules/shibari.scm", include_str!("../../../engine/rules/shibari.scm")),
    ("rules/spade3.scm", include_str!("../../../engine/rules/spade3.scm")),
    ("rules/miyakoochi.scm", include_str!("../../../engine/rules/miyakoochi.scm")),
    ("rules/sets.scm", include_str!("../../../engine/rules/sets.scm")),
];

#[derive(Debug, Clone)]
pub struct Error(pub String);

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for Error {}

pub type Result<T> = std::result::Result<T, Error>;

/// Scheme の関数に渡す引数
#[derive(Debug, Clone)]
pub enum Arg {
    Int(i64),
    Bool(bool),
    Str(String),
    List(Vec<Arg>),
}

impl Arg {
    fn into_steel(self) -> SteelVal {
        match self {
            Arg::Int(i) => SteelVal::IntV(i as isize),
            Arg::Bool(b) => SteelVal::BoolV(b),
            Arg::Str(s) => SteelVal::StringV(s.into()),
            Arg::List(xs) => SteelVal::ListV(xs.into_iter().map(Arg::into_steel).collect()),
        }
    }

    /// JSON の値から変換する（オブジェクトと null は扱わない）
    pub fn from_json(v: &serde_json::Value) -> Result<Arg> {
        use serde_json::Value;
        Ok(match v {
            Value::Bool(b) => Arg::Bool(*b),
            Value::Number(n) => Arg::Int(
                n.as_i64()
                    .ok_or_else(|| Error(format!("integer expected: {n}")))?,
            ),
            Value::String(s) => Arg::Str(s.clone()),
            Value::Array(xs) => Arg::List(xs.iter().map(Arg::from_json).collect::<Result<_>>()?),
            other => return Err(Error(format!("unsupported argument: {other}"))),
        })
    }
}

impl From<i64> for Arg {
    fn from(v: i64) -> Self {
        Arg::Int(v)
    }
}
impl From<bool> for Arg {
    fn from(v: bool) -> Self {
        Arg::Bool(v)
    }
}
impl From<&str> for Arg {
    fn from(v: &str) -> Self {
        Arg::Str(v.to_string())
    }
}
impl From<String> for Arg {
    fn from(v: String) -> Self {
        Arg::Str(v)
    }
}
impl<T: Into<Arg>> From<Vec<T>> for Arg {
    fn from(v: Vec<T>) -> Self {
        Arg::List(v.into_iter().map(Into::into).collect())
    }
}

pub struct Daifugo {
    engine: Engine,
}

impl Daifugo {
    /// バイナリに埋め込んだエンジンで起動する
    pub fn new() -> Result<Self> {
        Self::from_sources(ENGINE_FILES.iter().map(|(n, s)| (n.to_string(), Cow::Borrowed(*s))))
    }

    /// `engine/` ディレクトリから読み込んで起動する（開発中の再ビルド不要な実行用）
    pub fn from_dir(dir: impl AsRef<Path>) -> Result<Self> {
        let dir = dir.as_ref();
        let mut sources = Vec::new();
        for (name, _) in ENGINE_FILES {
            let path = dir.join(name);
            let src = std::fs::read_to_string(&path)
                .map_err(|e| Error(format!("{}: {e}", path.display())))?;
            sources.push((name.to_string(), Cow::Owned(src)));
        }
        Self::from_sources(sources.into_iter())
    }

    fn from_sources(sources: impl Iterator<Item = (String, Cow<'static, str>)>) -> Result<Self> {
        let mut this = Daifugo { engine: Engine::new() };
        for (name, src) in sources {
            this.load_source(&name, src)?;
        }
        Ok(this)
    }

    /// 追加の Scheme ソース（ローカルルールなど）を読み込む
    pub fn load_source(&mut self, name: &str, src: impl Into<Cow<'static, str>>) -> Result<()> {
        let src: Cow<'static, str> = src.into();
        self.engine
            .compile_and_run_raw_program(src.clone())
            .map(|_| ())
            .map_err(|e| Error(format!("{name}: {}", render_error(&e, name, &src))))
    }

    /// Scheme の関数を呼び、戻り値（JSON 文字列）を返す
    pub fn call(&mut self, func: &str, args: Vec<Arg>) -> Result<String> {
        let args = args.into_iter().map(Arg::into_steel).collect();
        match self.engine.call_function_by_name_with_args(func, args) {
            Ok(SteelVal::StringV(s)) => Ok(s.to_string()),
            Ok(other) => Err(Error(format!("{func}: expected a JSON string, got {other}"))),
            Err(e) => Err(Error(clean_message(&e.to_string()))),
        }
    }

    /// `call` の結果を serde_json の値として返す
    pub fn call_value(&mut self, func: &str, args: Vec<Arg>) -> Result<serde_json::Value> {
        let s = self.call(func, args)?;
        serde_json::from_str(&s).map_err(|e| Error(format!("{func}: invalid JSON from engine: {e}: {s}")))
    }

    /// 引数を JSON 配列で受け取る版（wasm からの呼び出し用）
    pub fn call_json(&mut self, func: &str, args_json: &str) -> Result<String> {
        if !func.starts_with("api-") && !func.starts_with("test-") {
            return Err(Error(format!("not an API function: {func}")));
        }
        let v: serde_json::Value =
            serde_json::from_str(args_json).map_err(|e| Error(format!("bad args JSON: {e}")))?;
        let args = match &v {
            serde_json::Value::Array(xs) => xs.iter().map(Arg::from_json).collect::<Result<_>>()?,
            _ => return Err(Error("args must be a JSON array".into())),
        };
        self.call(func, args)
    }

    /// Scheme の式を評価して表示文字列を返す（REPL・デバッグ用）
    pub fn eval(&mut self, src: &str) -> Result<String> {
        self.engine
            .compile_and_run_raw_program(src.to_string())
            .map(|vals| {
                vals.iter()
                    .filter(|v| !matches!(v, SteelVal::Void))
                    .map(|v| v.to_string())
                    .collect::<Vec<_>>()
                    .join("\n")
            })
            .map_err(|e| Error(render_error(&e, "<eval>", src)))
    }
}

fn render_error(e: &steel::SteelErr, _name: &str, _src: &str) -> String {
    clean_message(&e.to_string())
}

/// Steel のエラー文字列から "Error: Generic: " などの前置きを取り除く
fn clean_message(s: &str) -> String {
    let s = s.trim();
    let s = s.strip_prefix("Error: ").unwrap_or(s).trim_start();
    let s = s.strip_prefix("Generic: ").unwrap_or(s).trim_start();
    s.to_string()
}
