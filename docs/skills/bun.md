# Bun Skill Baseline

## Baseline

- Use Bun as the runtime and package manager.
- Prefer Bun-native commands and script execution.
- Keep startup and dev scripts deterministic for worktree usage.

## Patterns

- Keep server bootstrapping minimal and explicit.
- Centralize environment loading and validation.
- Separate route handlers from service logic for easier tests.

## Learning Log

- Bun isn't always on PATH — install to `~/.bun/bin` and export `PATH="$HOME/.bun/bin:$PATH"` in dev scripts.
- Bun install requires `unzip` system package; use `python3 -c 'import zipfile; ...'` to extract the zip on systems where unzip is unavailable.
- `bun build src/pages/*.ts --outdir public --target browser` bundles all Lit components transitively into single JS files per page.
- `loadStore()` and `persistStore()` should be async to avoid blocking the event loop on startup.
- Server routes: use `basename()` + `safeResolve()` (checking resolved path starts with base dir) to prevent path traversal on image/static serving.
- EXIF stripping: parse JPEG segment markers manually (skip APP1 marker 0xe1); for PNG strip tEXt/iTXt/zTXt/eXIf chunks; no external deps needed.
- Render deploys for Bun apps are reliable when build/start commands explicitly install Bun and export `PATH` before running scripts.
- For file-backed POCs on Render, make upload location env-driven (`UPLOADS_DIR`) so a persistent disk mount (for example `/var/data/uploads`) can be used without code changes per environment.
