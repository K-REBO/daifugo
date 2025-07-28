#!/bin/bash
# CLIの基本動作テスト
echo -e "game start\nexit" | timeout 15 deno run --allow-read /home/bido/projects/daifugo/cli/daifugo-repl.ts