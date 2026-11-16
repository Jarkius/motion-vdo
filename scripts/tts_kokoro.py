#!/usr/bin/env python3
"""Neural voiceover with Kokoro (ONNX, CPU): one WAV per line of a script file.

    pip install kokoro-onnx soundfile
    # model files (once): kokoro-v1.0.int8.onnx + voices-v1.0.bin from
    # https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    python3 scripts/tts_kokoro.py videos/compound/script.txt public/videos/compound/vo \
        --model ~/models/kokoro/kokoro-v1.0.int8.onnx --voices ~/models/kokoro/voices-v1.0.bin

Same contract as tts_placeholder.sh: 01.wav, 02.wav, ... in line order. English
voices: af_heart, af_bella, am_michael, am_fenrir, bf_emma, bm_george, ...
Kokoro has no Thai voice; use F5-TTS or another engine for Thai.
"""
import argparse
from pathlib import Path


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--lang", default="en-us")
    args = ap.parse_args()

    import soundfile as sf
    from kokoro_onnx import Kokoro

    tts = Kokoro(str(Path(args.model).expanduser()), str(Path(args.voices).expanduser()))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    lines = [l.strip() for l in Path(args.script).read_text(encoding="utf-8").splitlines() if l.strip()]
    for i, line in enumerate(lines, 1):
        samples, rate = tts.create(line, voice=args.voice, speed=args.speed, lang=args.lang)
        path = out / f"{i:02d}.wav"
        sf.write(path, samples, rate)
        print(f"{path}  {len(samples) / rate:.2f}s")


if __name__ == "__main__":
    main()
