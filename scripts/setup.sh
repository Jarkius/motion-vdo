#!/usr/bin/env bash
# One-shot setup for motion-vdo on macOS, Linux, or Windows (Git Bash).
# Safe to re-run. Never overwrites an existing /watch config.
#
#   bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ok() { printf '  \033[32mok\033[0m  %s\n' "$1"; }
warn() { printf '  \033[33m!!\033[0m  %s\n' "$1"; }
fail=0

echo "Checking tools"
if command -v node >/dev/null; then ok "node $(node -v)"; else warn "node missing: install Node 20.19+ or 22.13+"; fail=1; fi
if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then ok "ffmpeg"; else warn "ffmpeg/ffprobe missing (brew install ffmpeg / apt-get install ffmpeg / winget install ffmpeg)"; fail=1; fi
PY=$(command -v python3 || command -v python || true)
if [ -n "$PY" ]; then ok "python $($PY --version 2>&1)"; else warn "python 3.10+ missing"; fail=1; fi
[ "$fail" = 1 ] && { echo "Install the missing tools above, then re-run."; exit 1; }

echo "Installing npm packages"
npm ci --loglevel=error
ok "node_modules"

echo "Video tooling for /watch"
if command -v yt-dlp >/dev/null; then ok "yt-dlp $(yt-dlp --version)"; else
  "$PY" -m pip install -q 'yt-dlp[default]' && ok "yt-dlp installed" || warn "yt-dlp install failed: /watch still works on local files"
fi
if [ -f "$HOME/.config/watch/.env" ]; then ok "/watch already configured ($HOME/.config/watch/.env)"; else
  "$PY" .claude/skills/watch/scripts/setup.py --engine local --detail balanced --backend none >/dev/null && ok "/watch configured: local engine, no transcription fallback"
fi

echo "Optional"
if command -v espeak-ng >/dev/null; then ok "espeak-ng (placeholder voice)"; else warn "espeak-ng missing: only needed for scripts/tts_placeholder.sh"; fi

echo "Done. Try:  npx remotion render Compound out/compound.mp4"
