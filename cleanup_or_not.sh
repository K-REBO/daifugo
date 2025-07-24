#!/bin/bash

# 語尾に「にゃん」をつける関数にゃん
say_nya() {
    echo "$1にゃん"
}

# DockerまたはPodmanのどちらが利用可能か検出するにゃん
CONTAINER_CLI=""
if command -v podman &> /dev/null; then
    CONTAINER_CLI="podman"
    say_nya "Podman を使用します"
elif command -v docker &> /dev/null; then
    CONTAINER_CLI="docker"
    say_nya "Docker を使用します"
else
    say_nya "Docker も Podman も見つかりませんでした。インストールしてください"
    exit 1
fi

say_nya "コンテナの不要なファイルをクリーンアップするお手伝いをします！"
say_nya "このスクリプトは、ディスク容量を解放するために、使用されていないコンテナ、イメージ、ボリュームなどを特定し、削除するオプションを提供します"
say_nya "各操作にはリスクが伴う場合がありますので、説明をよく読んでから実行してください"

while true; do
    echo ""
    say_nya "どの操作を行いますか？"
    say_nya "1) 全体のディスク使用量を確認する ($CONTAINER_CLI system df)"
    say_nya "2) 不要なイメージを調べる ($CONTAINER_CLI images -f \"dangling=true\")"
    say_nya "3) 停止中のコンテナを調べる ($CONTAINER_CLI ps -a -f \"status=exited\")"
    say_nya "4) 使用されていないボリュームを調べる ($CONTAINER_CLI volume ls -f \"dangling=true\")"
    say_nya "5) 全ての不要なリソースを一括クリーンアップする ($CONTAINER_CLI system prune)"
    say_nya "q) 終了する"
    read -p "選択してください (1-5, q)にゃん: " choice

    case $choice in
        1)
            say_nya "現在のディスク使用量を確認します"
            say_nya "これは、イメージ、コンテナ、ボリュームなどが消費しているディスク容量の概要です"
            $CONTAINER_CLI system df -v
            ;;
        2)
            say_nya "不要なイメージを調べます"
            say_nya "これは、どのコンテナからも参照されていない、タグ付けされていないイメージ（dangling images）です"
            say_nya "これらのイメージは通常、安全に削除できますが、後で必要になる可能性のある古いバージョンが含まれている場合もあります"
            $CONTAINER_CLI images -f "dangling=true"
            read -p "これらのイメージを削除しますか？ (y/N)にゃん: " confirm_delete
            if [[ "$confirm_delete" =~ ^[yY]$ ]]; then
                say_nya "イメージを削除します"
                $CONTAINER_CLI rmi $($CONTAINER_CLI images -f "dangling=true" -q)
                say_nya "イメージを削除しました"
            else
                say_nya "削除をスキップしました"
            fi
            ;;
        3)
            say_nya "停止中のコンテナを調べます"
            say_nya "これは、現在実行されていないコンテナです。これらのコンテナは、ログや一時データが残っている場合があります"
            say_nya "削除しても通常は問題ありませんが、後で再開する予定のコンテナがないか確認してください"
            $CONTAINER_CLI ps -a -f "status=exited"
            read -p "これらのコンテナを削除しますか？ (y/N)にゃん: " confirm_delete
            if [[ "$confirm_delete" =~ ^[yY]$ ]]; then
                say_nya "コンテナを削除します"
                $CONTAINER_CLI rm $($CONTAINER_CLI ps -a -f "status=exited" -q)
                say_nya "コンテナを削除しました"
            else
                say_nya "削除をスキップしました"
            fi
            ;;
        4)
            say_nya "使用されていないボリュームを調べます"
            say_nya "これは、どのコンテナからも参照されていないボリューム（dangling volumes）です"
            say_nya "ボリュームには永続的なデータが保存されている場合があります。削除するとデータが失われるため、本当に不要か慎重に確認してください"
            $CONTAINER_CLI volume ls -f "dangling=true"
            read -p "これらのボリュームを削除しますか？ (y/N)にゃん: " confirm_delete
            if [[ "$confirm_delete" =~ ^[yY]$ ]]; then
                say_nya "ボリュームを削除します"
                $CONTAINER_CLI volume rm $($CONTAINER_CLI volume ls -f "dangling=true" -q)
                say_nya "ボリュームを削除しました"
            else
                say_nya "削除をスキップしました"
            fi
            ;;
        5)
            say_nya "全ての不要なリソースを一括クリーンアップします"
            say_nya "この操作は、停止中のコンテナ、使用されていないネットワーク、dangling images、そしてビルドキャッシュを削除します"
            say_nya "非常に強力なコマンドであり、実行すると元に戻せません。慎重に検討してください"
            read -p "ボリュームも削除しますか？ (y/N)にゃん: " confirm_volumes
            if [[ "$confirm_volumes" =~ ^[yY]$ ]]; then
                say_nya "ボリュームも含めてクリーンアップします"
                $CONTAINER_CLI system prune --volumes
            else
                say_nya "ボリュームを含まずにクリーンアップします"
                $CONTAINER_CLI system prune
            fi
            say_nya "クリーンアップが完了しました"
            ;;
        q)
            say_nya "クリーンアップを終了します。またね"
            break
            ;;
        *)
            say_nya "無効な選択です。もう一度試してください"
            ;;
    esac
done
