---
name: vector-explainer-studio
description: Build a 2.5D vector explainer video (SVG host character, kinetic text, animated counters and charts) in this repo's Remotion project, timed to per-sentence voiceover files, with a fact-check gate before voiceover and a /watch visual QA loop after every render. Use when asked to make, script, or revise an explainer video here.
---

# Vector Explainer Studio

Workflow for videos in this repo. Remotion API questions go to `remotion-best-practices`;
this skill covers this project's conventions. `src/videos/compound/` is the reference
implementation: copy its structure.

## Pipeline (do the steps in order; stop at each gate)

1. **Script.** Write `videos/<id>/script.txt`, one beat per line, 1–2 sentences per line.
   Keep a beat at 3–7 seconds of speech. Hook in the first line.
2. **Fact-check gate.** Before any audio exists, list every factual claim and number in a
   table: claim, source (name + year), and whether it's still current. Compute every number
   in `src/videos/<id>/data.ts` and quote it from there; never type a figure into JSX or
   the script that isn't derived in `data.ts`. Show the table to the user and wait for approval.
3. **Voiceover.** One audio file per line: `public/videos/<id>/vo/01.wav`, `02.wav`, ...
   Generate with `scripts/tts_kokoro.py` (English, neural, free; see its header for model
   files), the user's F5-TTS (Thai), or ElevenLabs. For an instant robotic timing draft, run
   `scripts/tts_placeholder.sh videos/<id>/script.txt public/videos/<id>/vo`.
   Timing is per sentence from file length. Don't rely on Whisper word timestamps
   (unreliable for Thai, which has no spaces between words).
4. **Style gate (new channel or new look only).** Edit `src/theme.ts`, render
   `npx remotion still CharacterSheet out/sheet.png --frame=40`, show the user, wait for
   approval. Offer 2–3 variations by changing colours and shirt, not by copying another
   channel's look: copied styles risk YouTube's inauthentic-content policy.
5. **Scenes.** Create `src/videos/<id>/<Name>Video.tsx` with a `calculateMetadata` that
   measures the vo files (copy from `CompoundVideo.tsx`) and register it in `src/Root.tsx`.
   One `TransitionSeries.Sequence` per beat; its length is `LEAD + voFrames[i] + TAIL`.
6. **Render + QA loop** (below). Fix, re-render, re-check until clean.

## Components (`src/components/`)

| Component | Use | Key props |
|---|---|---|
| `Background` | Every video, once, behind the `TransitionSeries` | `drift` |
| `Character` | Host. Feet at (`x`,`y`); ~430px tall at scale 1 | `poses`, `moods` (keyframes `{at, value}`), `talking` ranges, `shirt`, `flip`, `seed` |
| `KineticText` | Headlines; words spring in, highlighted words get colour + underline | `text`, `highlight`, `accent`, `start`, `stagger`, `size` |
| `Counter` | A number that rolls up then pops | `label`, `to`, `start`, `duration`, `color` |
| `LineChart` | Lines draw left to right; first series gets an area fill | `series`, `xLabels`, `drawStart`, `drawDuration` |

Poses: `idle point shrug cheer think`. Moods: `neutral happy worried surprised`.
All timing props are frames relative to the scene. Use `useVideoConfig().fps` for seconds.
Sound: `<Sfx at={frame} name="whoosh|pop|tick|ding" />` from `public/sfx/`
(regenerate with `python3 scripts/synth_sfx.py`). Keep SFX at 0.25–0.35 volume under voice.

## Layout rules (each one came from a defect found in QA)

- Canvas 1920×1080. Keep text inside x 100–1820, y 80–1000.
- Something must move at least every 2.5 s: a pose change, counter, chart draw, or new text.
- Trigger the visual on the beat's key phrase: estimate it as a fraction of `voFrames[i]`
  (e.g. `LEAD + Math.round(voFrames[1] * 0.45)`) rather than a fixed frame.
- Keep the host at the same `x`, `y`, and `scale` across a fade. Different positions show
  two characters overlapping mid-transition. To move the host, cut instead of fading.
  Define the placement once (`const HOST = {...}`) and spread it into every `Character`.
- The host faces the content: on the right with content to its left, set `flip: true`
  so `point` aims at the content, not off-screen.
- Chart edge labels must anchor inward (already handled in `LineChart`). Check new charts for clipping.
- Fonts are bundled in `public/fonts` and loaded in `theme.ts`. Never use Google Fonts at
  render time: headless Chrome can't always reach them, and the render then times out.
- For Thai text, add a Thai font file (e.g. Noto Sans Thai, OFL) to `public/fonts` and
  `theme.ts` first; Inter has no Thai glyphs.

## Render + QA loop (mandatory before saying a video is done)

```bash
npx remotion render <CompId> out/<id>.mp4
python3 .claude/skills/watch/scripts/watch.py out/<id>.mp4 --engine local --max-frames 16 --resolution 960
```

Read every frame the report lists. Then render the **last frame of each scene**, where
counters and charts have finished, because `/watch`'s samples often catch them mid-animation:

```bash
npx remotion still <CompId> out/check.png --frame=<scene end - 1> --scale=0.5
```

Check: text clipped or overlapping, numbers on screen match `data.ts`, faces match the line
being spoken, the host isn't duplicated during transitions, nothing static for over 2.5 s.
Report what you checked and what you fixed. Never claim a render is clean without
having looked at the frames.
