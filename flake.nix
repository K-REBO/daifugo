{
  description = "daifugo: Steel 製の大富豪エンジン (Web = Steel on wasm / standalone)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };

        rust = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" "clippy" "rustfmt" ];
          targets = [ "wasm32-unknown-unknown" ];
        };
        rustPlatform = pkgs.makeRustPlatform { cargo = rust; rustc = rust; };

        src = pkgs.lib.cleanSourceWith {
          src = ./.;
          filter = path: type:
            let base = baseNameOf path; in
            !(builtins.elem base [ "target" "result" ".direnv" ]);
        };

        # スタンドアロン版（nix run で遊べる）
        daifugo = rustPlatform.buildRustPackage {
          pname = "daifugo";
          version = "0.1.0";
          inherit src;
          cargoLock.lockFile = ./Cargo.lock;
          cargoBuildFlags = [ "-p" "daifugo-cli" ];
          cargoTestFlags = [ "-p" "daifugo-host" ];
          meta.mainProgram = "daifugo";
        };
      in {
        packages.default = daifugo;
        packages.daifugo = daifugo;

        apps.default = { type = "app"; program = "${daifugo}/bin/daifugo"; };

        devShells.default = pkgs.mkShell {
          packages = [
            rust
            pkgs.steel # steel CLI / REPL（crate の steel-core と同じ 0.8.3）
            pkgs.wasm-bindgen-cli # Cargo.toml の wasm-bindgen と同じ版に揃えること
            pkgs.wasm-pack
            pkgs.binaryen # wasm-opt
            pkgs.miniserve # Web 版のローカル配信
            pkgs.just
          ];

          shellHook = ''
            echo "daifugo dev shell: $(rustc --version), steel $(steel --version 2>/dev/null || echo '?'), wasm-bindgen $(wasm-bindgen --version | cut -d' ' -f2)"
          '';
        };
      });
}
