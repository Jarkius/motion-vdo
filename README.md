# motion-vdo

2.5D vector explainer videos (SVG host character, kinetic text, counters, charts) built
with Remotion and Claude Code. Original style, local fonts and SFX, no paid APIs required.

## Setup

```bash
bash scripts/setup.sh        # checks node/ffmpeg/python, npm ci, configures /watch
npx remotion studio          # live preview
npx remotion render Compound out/compound.mp4
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

`src/videos/compound/` is the reference example: a 19-second video on $100/month at 7%
for 30 years ($36,000 deposited, $121,997 final).

## Layout

| Path | What |
|---|---|
| `src/theme.ts` | Colours, fonts, springs. Change this to build your own look |
| `src/components/` | `Background`, `Character`, `KineticText`, `Counter`, `LineChart` |
| `src/videos/<id>/` | One folder per video: `data.ts` (numbers) + the video component |
| `src/CharacterSheet.tsx` | Contact sheet of every pose and mood |
| `public/fonts/` | Inter, JetBrains Mono (SIL OFL) |
| `public/sfx/` | Procedural SFX from `scripts/synth_sfx.py` |
| `.claude/skills/` | `vector-explainer-studio` (ours), `watch` (vendored), `remotion-*` (official) |

## Skills

- **vector-explainer-studio:** this project's workflow and rules. Written after the
  sample video passed QA, so its rules come from real defects.
- **watch:** vendored from [claude-video](https://github.com/bradautomates/claude-video)
  (MIT); see `.claude/skills/watch/UPSTREAM.md`. Extracts frames from a video so Claude can
  look at it. YouTube URLs need a home connection or a Gemini key; cloud servers get blocked.
- **remotion-*:** official [Remotion agent skills](https://github.com/remotion-dev/skills),
  copied as real folders (not symlinks, so Windows checkouts work). Update with
  `npx remotion skills add`, then move them from `.agents/skills` to `.claude/skills`.
