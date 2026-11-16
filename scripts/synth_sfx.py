#!/usr/bin/env python3
"""Generate the procedural SFX kit into public/sfx/ (standard library only, deterministic).

    python3 scripts/synth_sfx.py [--out public/sfx]

Sounds: whoosh (scene transitions), pop (element entrances), tick (counter
steps), ding (a number lands). 48 kHz mono 16-bit WAV.
"""
import argparse
import math
import random
import struct
import wave
from pathlib import Path

RATE = 48000


def write(path: Path, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    gain = 0.89 / peak  # normalise to about -1 dBFS
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * gain)) * 32767)) for s in samples))


def whoosh(seconds=0.55):
    rng = random.Random(7)
    n = int(RATE * seconds)
    out, lp, bp = [], 0.0, 0.0
    for i in range(n):
        t = i / n
        # Cutoff sweeps up then down; noise through two one-pole filters gives an airy band.
        cutoff = 300 + 3500 * math.sin(math.pi * t) ** 2
        a = 1 - math.exp(-2 * math.pi * cutoff / RATE)
        lp += a * (rng.uniform(-1, 1) - lp)
        bp += 0.5 * (lp - bp)
        env = math.sin(math.pi * t) ** 1.5
        out.append((lp - bp) * env)
    return out


def pop(seconds=0.14):
    n = int(RATE * seconds)
    out, phase = [], 0.0
    for i in range(n):
        t = i / RATE
        freq = 300 + 700 * math.exp(-t * 40)
        phase += 2 * math.pi * freq / RATE
        out.append(math.sin(phase) * math.exp(-t * 30))
    return out


def tick(seconds=0.035):
    n = int(RATE * seconds)
    return [math.sin(2 * math.pi * 2200 * i / RATE) * math.exp(-i / RATE * 160) for i in range(n)]


def ding(seconds=0.9):
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        env = math.exp(-t * 5) * min(1, t * 400)
        out.append(env * (math.sin(2 * math.pi * 1320 * t) + 0.4 * math.sin(2 * math.pi * 1980 * t)))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="public/sfx")
    out = Path(ap.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in {"whoosh": whoosh, "pop": pop, "tick": tick, "ding": ding}.items():
        write(out / f"{name}.wav", fn())
        print(out / f"{name}.wav")


if __name__ == "__main__":
    main()
