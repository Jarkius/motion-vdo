#!/usr/bin/env python3
"""Measure a video's rhythm and write a layered breakdown an agent can read cheaply.

    python3 scripts/rhythm.py out/reflex.mp4                  # QA one of our renders
    python3 scripts/rhythm.py refs/clip.mp4 --out refs/clip   # study a reference's pacing

Writes <out>/VIDEO.md (a short card with the numbers and flags, ~300 tokens; read
this first), <out>/timeline.md (one line per shot) and <out>/rhythm.md (a motion
curve every 0.5 s). Everything here is measured by ffmpeg; nothing is inferred.
For what is on screen, run /watch on the same file.

Checks (exit code 1 if any fail, so it can gate a render):
  static   no stretch over --max-static seconds with almost no motion
  black    no black frames (except a fade at the very start or end)
  loudness integrated loudness within 2 LU of --lufs (skipped if there is no audio)

Needs only ffmpeg/ffprobe and the Python standard library.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

W, H, RATE = 64, 36, 2  # motion is sampled on a 64x36 greyscale copy, 2 frames per second


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type",
             "-of", "json", str(path)])
    info = json.loads(r.stdout)
    kinds = {s["codec_type"] for s in info.get("streams", [])}
    return float(info["format"]["duration"]), "audio" in kinds


def cuts(path, threshold):
    r = run(["ffmpeg", "-hide_banner", "-i", str(path), "-vf",
             f"select='gt(scene,{threshold})',showinfo", "-an", "-f", "null", "-"])
    return [float(m) for m in re.findall(r"pts_time:([0-9.]+)", r.stderr)]


def motion_curve(path):
    """Mean absolute pixel change between consecutive 0.5 s samples, 0-100."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf",
                        f"fps={RATE},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                       capture_output=True)
    data, n = r.stdout, W * H
    frames = [data[i:i + n] for i in range(0, len(data) - n + 1, n)]
    curve = [0.0]
    for a, b in zip(frames, frames[1:]):
        curve.append(sum(abs(x - y) for x, y in zip(a, b)) / n / 2.55)
    return curve


def blacks(path):
    r = run(["ffmpeg", "-hide_banner", "-i", str(path), "-vf", "blackdetect=d=0.05:pix_th=0.06",
             "-an", "-f", "null", "-"])
    return [(float(a), float(b)) for a, b in re.findall(r"black_start:([0-9.]+) black_end:([0-9.]+)", r.stderr)]


def loudness(path):
    r = run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=framelog=quiet",
             "-vn", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?[0-9.]+) LUFS", r.stderr)
    return float(m[-1]) if m else None


def static_runs(curve, still, min_len):
    """Stretches (start, end) in seconds where motion stays below `still` for at least min_len."""
    runs, start = [], None
    for i, v in enumerate(curve + [still + 1]):
        if v < still and i > 0:
            start = i - 1 if start is None else start
        elif start is not None:
            if (i - 1 - start) / RATE > min_len:
                runs.append((start / RATE, (i - 1) / RATE))
            start = None
    return runs


def spark(values, hi):
    bars = " ▁▂▃▄▅▆▇█"
    return "".join(bars[min(8, int(v / hi * 8 + 0.5))] for v in values) if hi > 0 else ""


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("video")
    ap.add_argument("--out", help="Output folder (default: <video>.breakdown next to the file)")
    ap.add_argument("--cut", type=float, default=0.3, help="Scene-change threshold 0-1 for a cut")
    ap.add_argument("--max-static", type=float, default=2.5)
    ap.add_argument("--still", type=float, default=0.4, help="Motion below this (0-100) counts as static")
    ap.add_argument("--lufs", type=float, default=-14.0)
    args = ap.parse_args()

    video = Path(args.video)
    out = Path(args.out) if args.out else video.with_suffix(".breakdown")
    out.mkdir(parents=True, exist_ok=True)

    duration, has_audio = probe(video)
    cut_times = cuts(video, args.cut)
    edges = [0.0] + cut_times + [duration]
    shots = [(a, b) for a, b in zip(edges, edges[1:]) if b - a > 0.04]
    curve = motion_curve(video)
    still = static_runs(curve, args.still, args.max_static)
    black = [(a, b) for a, b in blacks(video) if a > 0.1 and b < duration - 0.1]
    lufs = loudness(video) if has_audio else None
    lengths = [b - a for a, b in shots]

    flags = []
    for a, b in still:
        flags.append(f"static {a:.1f}-{b:.1f}s ({b - a:.1f}s > {args.max_static}s): add a move, pose change or cut")
    for a, b in black:
        flags.append(f"black frames {a:.2f}-{b:.2f}s")
    if lufs is not None and abs(lufs - args.lufs) > 2:
        flags.append(f"loudness {lufs:.1f} LUFS (target {args.lufs}): adjust voice/music volume")

    # Third-wise motion: shows whether the pace varies (a flat profile is a warning sign).
    thirds = [curve[i * len(curve) // 3:(i + 1) * len(curve) // 3] for i in range(3)]
    pace = [sum(t) / max(1, len(t)) for t in thirds]

    card = f"""---
source: {video.name}
duration_s: {duration:.2f}
hard_cuts: {len(cut_times)}  # crossfades and continuous camera moves are not counted
cuts_per_min: {len(cut_times) / duration * 60:.1f}
shot_length_s: {{min: {min(lengths):.2f}, mean: {sum(lengths) / len(lengths):.2f}, max: {max(lengths):.2f}}}
motion_by_third: [{', '.join(f'{p:.1f}' for p in pace)}]
loudness_lufs: {f'{lufs:.1f}' if lufs is not None else 'no audio'}
checks: {'PASS' if not flags else 'FAIL'}
---

# {video.name}

{"No problems found." if not flags else "Flags:" + "".join(f"{chr(10)}- {f}" for f in flags)}

Motion (0.5 s per bar): `{spark(curve, max(curve) or 1)}`

| File | Read when |
|---|---|
| timeline.md | you need shot boundaries and lengths |
| rhythm.md | you need the motion value at a given time |

All values are measured. For what is on screen, run /watch on the video.
"""
    (out / "VIDEO.md").write_text(card, encoding="utf-8")

    rows = ["| # | start | end | length |", "|---|---|---|---|"]
    rows += [f"| {i} | {a:.2f} | {b:.2f} | {b - a:.2f} |" for i, (a, b) in enumerate(shots, 1)]
    (out / "timeline.md").write_text("# Shots (cut threshold %.2f)\n\n%s\n" % (args.cut, "\n".join(rows)), encoding="utf-8")

    lines = ["| t (s) | motion |", "|---|---|"] + [f"| {i / RATE:.1f} | {v:.1f} |" for i, v in enumerate(curve)]
    (out / "rhythm.md").write_text("# Motion curve (mean pixel change, 0-100)\n\n" + "\n".join(lines) + "\n", encoding="utf-8")

    print(card)
    print(f"Wrote {out}/VIDEO.md, timeline.md, rhythm.md")
    sys.exit(1 if flags else 0)


if __name__ == "__main__":
    main()
