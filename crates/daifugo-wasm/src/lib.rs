//! ブラウザ向け: Steel エンジンを wasm にして JS から呼べるようにする。
//!
//! ```js
//! const engine = new Engine();
//! const view = JSON.parse(engine.call("api-new-game", JSON.stringify([4, 1, ["all"], [], [], [], 0])));
//! ```

use daifugo_host::Daifugo;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Engine {
    inner: Daifugo,
}

fn js_err(e: daifugo_host::Error) -> JsError {
    JsError::new(&e.0)
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Engine, JsError> {
        Ok(Engine { inner: Daifugo::new().map_err(js_err)? })
    }

    /// `api-*` 関数を JSON 配列の引数で呼び、JSON 文字列を返す
    pub fn call(&mut self, func: &str, args_json: &str) -> Result<String, JsError> {
        self.inner.call_json(func, args_json).map_err(js_err)
    }

    /// 追加の Scheme ソース（ローカルルールなど）を読み込む
    #[wasm_bindgen(js_name = loadSource)]
    pub fn load_source(&mut self, name: &str, src: &str) -> Result<(), JsError> {
        self.inner.load_source(name, src.to_string()).map_err(js_err)
    }

    /// Scheme の式を評価する（デバッグ用）
    pub fn eval(&mut self, src: &str) -> Result<String, JsError> {
        self.inner.eval(src).map_err(js_err)
    }
}
