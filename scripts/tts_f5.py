#!/usr/bin/env python3
"""Thai (and English) voiceover with F5-TTS-THAI, cloning a reference voice: one WAV per line.

Setup (Python 3.10-3.12; the package pins numpy<=1.26.4, which has no 3.13 build):
    python3.12 -m venv ~/.venvs/f5th && ~/.venvs/f5th/bin/pip install f5-tts-th torchcodec
    # torchcodec: recent torchaudio needs it to read audio, and f5-tts-th doesn't declare it.
    # NVIDIA GPU: install the CUDA torch build (see the model card). CPU works: ~40 s per
    # line plus ~60 s model load, measured on a cloud CPU. Apple Silicon: untested.
    # First run downloads the model (~1.3 GB) from huggingface.co/VIZINTZOR/F5-TTS-THAI (CC-BY-4.0).

Usage:
    ~/.venvs/f5th/bin/python scripts/tts_f5.py videos/<id>/script.txt public/videos/<id>/vo \
        --ref-audio voices/me.wav --ref-text "ข้อความที่พูดในไฟล์เสียงตัวอย่างแบบตรงทุกคำ"

    # Add --verify to have Whisper transcribe each take and flag misread words.
    # A line came out wrong? Regenerate only it with another seed (or slower speed):
    ... --lines 3 --seed 7 --verify
    # Seeds matter: in testing, ดอกเบี้ย ("interest") came out as ดอกเบียร์ ("beer")
    # with seeds 1234 and 42, and correctly with seed 7.

Keep reference voices in voices/ (git-ignored: a voice sample is personal data).

Same contract as tts_kokoro.py: 01.wav, 02.wav, ... in line order.

Tips from the model card:
- Reference clip: 2-8 s of clean speech by one speaker, ideally Thai.
- --ref-text must match the clip word for word. Omit it to auto-transcribe with Whisper
  (slower and less exact). English words in the clip: write them in Thai script
  (Good morning -> กูดมอร์นิ่ง).
- If the reference speaker talks fast, use --speed 0.7-0.8.
- Long lines get misread more often: keep one sentence per line. Digits are converted
  to Thai words automatically (100 -> หนึ่งร้อย).
- Only clone a voice you own or have permission to use.
"""
import argparse
from pathlib import Path

RATE = 24000


def parse_lines(spec: str | None, total: int) -> list[int]:
    if not spec:
        return list(range(1, total + 1))
    picked = sorted({int(x) for x in spec.split(",") if x.strip()})
    bad = [n for n in picked if not 1 <= n <= total]
    if bad:
        raise SystemExit(f"--lines out of range 1-{total}: {bad}")
    return picked


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--ref-audio", required=True, help="2-8 s WAV/MP3 of the voice to clone")
    ap.add_argument("--ref-text", default="", help="Exact transcript of --ref-audio (empty = auto-transcribe)")
    ap.add_argument("--model", choices=["v1", "v2"], default="v1",
                    help="v1: 1M-step model (default). v2: newer IPA-based model; try it if v1 misreads words")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--step", type=int, default=32, help="Diffusion steps; more = slower, slightly cleaner")
    ap.add_argument("--cfg", type=float, default=2.0)
    ap.add_argument("--seed", type=int, default=1234, help="Same seed = same take; change it to re-roll a line")
    ap.add_argument("--lines", help="Only these 1-based line numbers, e.g. 3 or 2,5")
    ap.add_argument("--verify", action="store_true",
                    help="Transcribe each take with Whisper and flag lines that differ from the script "
                         "(downloads whisper-large-v3-turbo, ~1.6 GB, once). Flags mean 'listen to this', "
                         "not proof of an error: Whisper also makes mistakes")
    args = ap.parse_args()

    if not Path(args.ref_audio).is_file():
        raise SystemExit(f"--ref-audio not found: {args.ref_audio}")
    lines = [l.strip() for l in Path(args.script).read_text(encoding="utf-8").splitlines() if l.strip()]
    todo = parse_lines(args.lines, len(lines))

    import soundfile as sf
    import torch
    from f5_tts_th.tts import TTS

    tts = TTS(model=args.model)
    asr = None
    if args.verify:
        from transformers import pipeline

        asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    flagged = []
    for n in todo:
        torch.manual_seed(args.seed)  # per line, so regenerating one line reproduces that take
        wav = tts.infer(
            ref_audio=args.ref_audio,
            ref_text=args.ref_text,
            gen_text=lines[n - 1],
            step=args.step,
            cfg=args.cfg,
            speed=args.speed,
        )
        path = out / f"{n:02d}.wav"
        sf.write(path, wav, RATE)
        print(f"{path}  {len(wav) / RATE:.2f}s  {lines[n - 1]}")
        if asr:
            heard = asr({"raw": wav.astype("float32"), "sampling_rate": RATE},
                        generate_kwargs={"language": "th", "task": "transcribe"})["text"].strip()
            score, diffs = similarity(lines[n - 1], heard)
            mark = "ok" if score >= THRESHOLD else "LISTEN"
            print(f"    heard [{mark} {score:.2f}]: {heard}")
            if diffs:
                print(f"    differs: {'; '.join(diffs)}")
            if score < THRESHOLD:
                flagged.append(n)
    if flagged:
        print(f"Listen to lines {','.join(map(str, flagged))}; re-roll with --lines "
              f"{','.join(map(str, flagged))} --seed <new> (or --speed 0.85)")


# Strict on purpose: one wrong tone mark in a key word (ดอกเบี้ย "interest" heard as
# ดอกเบียร์ "beer") only drops a short line to ~0.96. Expect some false alarms from Whisper.
THRESHOLD = 0.98


def similarity(expected: str, heard: str) -> tuple[float, list[str]]:
    """Character similarity ignoring spaces and punctuation (Thai has no word spaces),
    plus the differing spans as 'expected -> heard'."""
    import difflib
    import re

    def norm(s: str) -> str:
        return re.sub(r"[\s.,!?\"'()\-]", "", s)

    try:  # The script's digits are spoken as Thai words; compare like with like.
        from f5_tts_th.normalize import normalize_text

        expected, heard = normalize_text(expected), normalize_text(heard)
    except Exception:
        pass
    a, b = norm(expected), norm(heard)
    sm = difflib.SequenceMatcher(None, a, b)
    diffs = [f"{a[max(0, i1 - 3):i2 + 3]} -> {b[max(0, j1 - 3):j2 + 3]}"
             for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"]
    return sm.ratio(), diffs


if __name__ == "__main__":
    main()
