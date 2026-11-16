#!/usr/bin/env bash
# Placeholder voiceover with espeak-ng: one WAV per line of a script file.
#
#   scripts/tts_placeholder.sh videos/compound/script.txt public/videos/compound/vo
#
# Writes 01.wav, 02.wav, ... in line order (blank lines skipped). Your real TTS
# (Kokoro, F5-TTS, ElevenLabs) only has to follow the same contract: one audio
# file per beat, numbered in order. The video measures their lengths itself.
set -euo pipefail
script="$1"; out="$2"
command -v espeak-ng >/dev/null || { echo "espeak-ng not installed (apt-get install espeak-ng / brew install espeak-ng)" >&2; exit 2; }
mkdir -p "$out"
i=0
while IFS= read -r line || [ -n "$line" ]; do
  [ -z "${line// }" ] && continue
  i=$((i + 1))
  f=$(printf '%s/%02d.wav' "$out" "$i")
  espeak-ng -v en-us -s 155 -w "$f" "$line"
  echo "$f"
done < "$script"
