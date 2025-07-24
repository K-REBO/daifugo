# justfile for running Playwright tests in a Podman container

# The Playwright image to use
playwright_image := "mcr.microsoft.com/playwright:v1.54.1-jammy"

# Run the Deno Playwright test.
test:
    @echo "Running Deno/Playwright test..."
    @podman run --rm -it \
        --network=host \
        -v /tmp/.X11-unix:/tmp/.X11-unix:Z \
        -e DISPLAY=$DISPLAY \
        -e DEBUG=pw:api \
        --ipc=host \
        -v '{{justfile_directory()}}':/work:Z \
        -w /work \
        {{playwright_image}} \
        bash -c "set -e; apt-get update && apt-get install -y unzip; npm install; curl -fsSL https://deno.land/x/install/install.sh -o install_deno.sh; sh install_deno.sh; export PATH='/root/.deno/bin:$PATH'; deno run --allow-read --allow-net --allow-env --allow-run --allow-write --unstable browser-test.ts"

# Open an interactive shell in the container for debugging
shell:
    @echo "Opening a shell in the container..."
    @podman run --rm -it \
        -v /tmp/.X11-unix:/tmp/.X11-unix:Z \
        -e DISPLAY=$DISPLAY \
        --ipc=host \
        -v '{{justfile_directory()}}':/work:Z \
        -w /work \
        {{playwright_image}} \
        bash