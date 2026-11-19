# motion-vdo

2.5D vector explainer videos (SVG host character, kinetic text, counters, charts) built
with Remotion and Claude Code. Original style, local fonts and SFX, no paid APIs required.

## Setup

```bash
bash scripts/setup.sh        # checks node/ffmpeg/python, npm ci, configures /watch
npx remotion studio          # live preview
bash scripts/build.sh Compound   # render + -14 LUFS + rhythm QA -> out/compound.mp4
```

Remotion is free for individuals and teams of up to 3; larger companies need a
[company license](https://www.remotion.dev/docs/license/pricing).

## Making a video

In Claude Code, run `/vector-explainer-studio` and describe the video. The skill
(`.claude/skills/vector-explainer-studio/SKILL.md`) walks through:

1. Script, one beat per line in `videos/<id>/script.txt`
2. **Fact-check gate:** every claim gets a source; every number is computed in `src/videos/<id>/data.ts`
3. Voiceover: one file per beat at `public/videos/<id>/vo/01.wav` ... from your TTS
   (`scripts/tts_kokoro.py` for English, `scripts/tts_f5.py --verify` for Thai, or ElevenLabs), or
   `scripts/tts_placeholder.sh` for an instant robotic draft
4. **Style gate:** `npx remotion still CharacterSheet out/sheet.png --frame=40`
5. Scenes, timed automatically from the voiceover file lengths
6. Render, then visual QA with `/watch`

`src/videos/reflex/` is the cinematic-mode example (7 s, rim-lit silhouettes, parallax,
close-up). `src/videos/compound/` is the flat-mode example: a 19-second video on $100/month at 7%
for 30 years ($36,000 deposited, $121,997 final).

## Layout

| Path | What |
|---|---|
| `src/theme.ts` | Colours, fonts, springs. Change this to build your own look |
| `src/components/` | Flat mode: `Background`, `Character`, `KineticText`, `Counter`, `LineChart`. Cinematic mode: `Silhouette`, `ParallaxStage` (+ `Skyline`, `Ground`, `Foliage`), `Overlays` (`Badge`, `TargetRings`, `Trajectory`, `Ghosts`, `SpeedBurst`). Shared pose rig: `rig.ts` |
| `src/videos/<id>/` | One folder per video: `data.ts` (numbers) + the video component |
| `src/CharacterSheet.tsx` | Contact sheet of every pose and mood |
| `public/fonts/` | Inter, JetBrains Mono (SIL OFL) |
| `public/sfx/` | Procedural SFX from `scripts/synth_sfx.py` |
| `.claude/skills/` | `vector-explainer-studio` (ours), `watch` (vendored), `remotion-*` (official) |

## QA tools

- `scripts/build.sh <Comp>`: render, normalise loudness to -14 LUFS, run the checks below.
- `scripts/rhythm.py <video>`: measured breakdown of any video (ours or a reference):
  hard cuts, shot lengths, a motion curve every 0.5 s, loudness, black frames. Writes a
  short `VIDEO.md` card plus `timeline.md` and `rhythm.md` (format idea from Rea-Video).
  Fails on static stretches over 2.5 s, black frames, or loudness off target.

## Styles

`.claude/skills/vector-explainer-studio/styles/<slug>/STYLE.md`, one per look:
`flat` (numbers, how-it-works) and `cinematic` (stories, "what if"; rim-lit silhouettes,
parallax, hit-stop and screen shake). Add a style by copying `_template/`.

Ideas adapted (no code or text copied) from Rea-Video (layered video breakdowns),
Lemo-Opuscar (one style file per look, directing rules) and PixelFX (hit-stop, shake,
per-key pose easing). Lemo-Opuscar's style docs are CC BY-NC 4.0, so none are included here.

## Skills

- **vector-explainer-studio:** this project's workflow and rules. Written after the
  sample video passed QA, so its rules come from real defects.
- **watch:** vendored from [claude-video](https://github.com/bradautomates/claude-video)
  (MIT); see `.claude/skills/watch/UPSTREAM.md`. Extracts frames from a video so Claude can
  look at it. YouTube URLs need a home connection or a Gemini key; cloud servers get blocked.
- **remotion-*:** official [Remotion agent skills](https://github.com/remotion-dev/skills),
  copied as real folders (not symlinks, so Windows checkouts work). Update with
  `npx remotion skills add`, then move them from `.agents/skills` to `.claude/skills`.
