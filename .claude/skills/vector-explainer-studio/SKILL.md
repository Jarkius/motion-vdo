---
name: vector-explainer-studio
description: Build an explainer or story video in this repo's Remotion project, in one of its styles (flat 2.5D explainer, cinematic rim-lit silhouettes), timed to per-sentence voiceover files, with a fact-check gate before voiceover, a style gate, and a measured QA loop (loudness, motion, frames) after every render. Use when asked to make, script, or revise a video here, or to study a reference video's pacing.
---

# Vector Explainer Studio

Workflow for videos in this repo. Remotion API questions go to `remotion-best-practices`.
Each look lives in `styles/<slug>/STYLE.md` next to this file: read the chosen style's
file before writing scenes. Styles: `flat` (numbers and how-it-works) and `cinematic`
(stories and "what if"). New style: copy `styles/_template/`.

## Pipeline (in order; stop at each gate)

1. **Brief + style.** Pick the style that fits the story (each STYLE.md says what it is for).
2. **Benchmark (optional, recommended).** Pick 1–2 reference videos that set the bar for
   this topic. For each, run `python3 scripts/rhythm.py <ref.mp4> --out refs/<name>` (cut
   rate, shot lengths, motion curve) and `/watch` (what is on screen). Write down two lists:
   **learn** (pacing, structure, hook timing, cut rate) and **don't take** (characters,
   designs, specific shots, music, logos, catchphrases). Never copy another channel's look.
3. **Script.** `videos/<id>/script.txt`, one beat per line, 1–2 sentences per line, 3–7 s of
   speech per beat, hook in the first line.
4. **Fact-check gate.** Before any audio exists, list every claim and number: claim, source
   (name + year), still current? Compute every number in `src/videos/<id>/data.ts` and quote
   it from there; never type a figure into JSX or the script that isn't derived there.
   Show the table to the user and wait for approval.
5. **Voiceover.** One file per line: `public/videos/<id>/vo/01.wav`, `02.wav`, ...
   - English: `scripts/tts_kokoro.py` (neural, free; model files in its header).
   - Thai: `scripts/tts_f5.py --verify` (clones the user's voice from `voices/`). Re-roll
     every flagged line with `--lines N --seed <new>` until it passes or the user has
     listened and accepted it: F5 misreads tone marks (ดอกเบี้ย became ดอกเบียร์).
   - Instant robotic timing draft: `scripts/tts_placeholder.sh`.
   Timing is per sentence from file length. Don't use Whisper word timestamps
   (unreliable for Thai, which has no spaces between words).
6. **Style gate (new channel or new look only).** Edit `src/theme.ts`, render
   `npx remotion still CharacterSheet out/sheet.png --frame=40`, show 2–3 variations,
   wait for approval.
7. **Scenes.** `src/videos/<id>/<Name>Video.tsx` with a `calculateMetadata` that measures the
   vo files (copy from the style's reference video), registered in `src/Root.tsx`. Put
   every beat time in one `timeline(voFrames)` function.
8. **Build + QA** (below). One fix round, then report.

## Directing rules (all styles)

- **Pace varies.** At least one speed-up and one held moment (a pause, a long take) per
  minute. In `rhythm.py`'s `motion_by_third`, three similar numbers mean a flat video.
- **Nothing static for over 2.5 s** (`rhythm.py` checks this).
- **Reading time.** Hold any text at least 1.5 s + 1 s per 15 letters (English). For Thai,
  start at 1.5 s + 1 s per 8 characters and adjust once the user has watched a few videos
  (an estimate, not a measured figure). Title cards: 4 s.
- **Subject size.** At each key moment the subject fills at least ⅓ of the frame height.
  Push in (`closeUp`) or scale up rather than leaving it small in a wide shot.
- **Trigger visuals on the key phrase:** estimate it as a fraction of `voFrames[i]`, not a
  fixed frame.
- **Canvas 1920×1080.** Keep text inside x 100–1820, y 80–1000.
- **Fonts are bundled** in `public/fonts`, loaded in `theme.ts`. Never load Google Fonts
  at render time (headless Chrome can't always reach them; the render times out). For Thai
  text, add a Thai font (e.g. Noto Sans Thai, OFL) first; Inter has no Thai glyphs.

## Build + QA (mandatory before saying a video is done)

```bash
bash scripts/build.sh <CompId>          # render, normalise to -14 LUFS, run rhythm checks
python3 .claude/skills/watch/scripts/watch.py out/<id>.mp4 --engine local --max-frames 16 --resolution 960
```

`build.sh` fails (`checks: FAIL`) on a static stretch over 2.5 s, black frames, or
loudness more than 2 LU off -14 LUFS; the flags say where. Read every frame `/watch`
lists. Then check the **last frame of each scene**, where counters and charts have
finished (`/watch` samples often catch them mid-animation):

```bash
npx remotion still <CompId> out/check.png --frame=<scene end - 1> --scale=0.5
```

Also check: text clipped or overlapping, numbers on screen match `data.ts`, faces match
the line being spoken, and the style's "Pitfalls found in QA" list.

**One fix round:** fix everything the checks found, rebuild, check once more. Report what
you checked, what you fixed, and anything left over in one line each. Never claim a render
is clean without having looked at the frames. Add every new defect type to the style's
Pitfalls list.

## Sound

`<Sfx at={frame} name="whoosh|pop|tick|ding" />` from `public/sfx/` (regenerate with
`python3 scripts/synth_sfx.py`). SFX at 0.25–0.45 volume under voice; `build.sh` sets
the final loudness.
