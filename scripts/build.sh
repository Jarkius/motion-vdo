#!/usr/bin/env bash
# Render a composition, normalise loudness, and run the rhythm QA checks.
#
#   bash scripts/build.sh Reflex             -> out/reflex.mp4 (+ out/reflex.breakdown/)
#   bash scripts/build.sh Compound out/x.mp4
#
# Loudness: -14 LUFS integrated, -1.5 dBTP peak (what YouTube and most platforms
# play back at). The video stream is copied, not re-encoded.
set -euo pipefail
cd "$(dirname "$0")/.."
comp="$1"
out="${2:-out/$(echo "$comp" | tr '[:upper:]' '[:lower:]').mp4}"
raw="${out%.mp4}.raw.mp4"
mkdir -p "$(dirname "$out")"

npx remotion render "$comp" "$raw" --log=error
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$raw" | grep -q .; then
  ffmpeg -v error -y -i "$raw" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k "$out"
  rm "$raw"
else
  mv "$raw" "$out"
fi
echo "Rendered $out"
python3 scripts/rhythm.py "$out"
