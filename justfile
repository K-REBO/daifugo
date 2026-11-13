# 開発用コマンド（nix develop の中で実行）

default:
    @just --list

# エンジンのテスト（Scheme のテストも cargo test から走る）
test:
    cargo test --workspace

# 端末で遊ぶ
play *ARGS:
    cargo run --release -p daifugo-cli -- play {{ARGS}}

# AI 同士の大量対戦
sim *ARGS:
    cargo run --release -p daifugo-cli -- sim {{ARGS}}

# engine/*.scm を再ビルドせずに試す
dev *ARGS:
    cargo run --release -p daifugo-cli -- --engine-dir engine {{ARGS}}

# Web 版をビルド（web/pkg に出力）
web:
    cargo build --profile wasm --target wasm32-unknown-unknown -p daifugo-wasm
    wasm-bindgen --target web --no-typescript --out-dir web/pkg target/wasm32-unknown-unknown/wasm/daifugo_wasm.wasm
    wasm-opt -Oz --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals --enable-reference-types --enable-multivalue -o web/pkg/daifugo_wasm_bg.wasm web/pkg/daifugo_wasm_bg.wasm
    @ls -la web/pkg/*.wasm

# Web 版をローカルで配信
serve: web
    miniserve web --index index.html -p 8080
